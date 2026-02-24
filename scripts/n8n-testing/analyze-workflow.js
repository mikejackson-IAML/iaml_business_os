#!/usr/bin/env node
/**
 * analyze-workflow.js — Pre-compute workflow analysis for test-workflow-auto
 *
 * Fetches an n8n workflow, extracts node inventory, branch points,
 * generates seed data suggestions, and checks structural compliance.
 * Outputs compact JSON that Claude reads instead of parsing raw workflow JSON.
 *
 * Usage:
 *   node scripts/n8n-testing/analyze-workflow.js <workflow_id>
 *
 * Env vars (from shell or .env.local):
 *   N8N_API_URL  — e.g., https://n8n.realtyamp.ai
 *   N8N_API_KEY  — n8n API key
 *
 * Output: JSON to stdout
 */

const https = require('https');
const http = require('http');
const path = require('path');
const fs = require('fs');

// Load env from .env.local if not already set
function loadEnv() {
  if (process.env.N8N_API_URL && process.env.N8N_API_KEY) return;

  const envPaths = [
    path.resolve(__dirname, '../../.env.local'),
    path.resolve(__dirname, '../../.env'),
  ];

  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const match = line.match(/^([A-Z_]+)=(.+)$/);
        if (match && !process.env[match[1]]) {
          process.env[match[1]] = match[2].replace(/^["']|["']$/g, '');
        }
      }
    }
  }
}

loadEnv();

// Strip trailing /api/v1 if present so paths aren't doubled
const N8N_API_URL = (process.env.N8N_API_URL || '').replace(/\/api\/v1\/?$/, '');
const N8N_API_KEY = process.env.N8N_API_KEY;

if (!N8N_API_URL || !N8N_API_KEY) {
  console.error(JSON.stringify({
    error: 'Missing N8N_API_URL or N8N_API_KEY environment variables',
    hint: 'Set them in your shell profile or .env.local'
  }));
  process.exit(1);
}

const workflowId = process.argv[2];
if (!workflowId) {
  console.error(JSON.stringify({ error: 'Usage: analyze-workflow.js <workflow_id>' }));
  process.exit(1);
}

// HTTP request helper
function apiGet(urlPath) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, N8N_API_URL);
    const mod = url.protocol === 'https:' ? https : http;

    const req = mod.get(url, {
      headers: { 'X-N8N-API-KEY': N8N_API_KEY, 'Accept': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 400) {
          reject(new Error(`API ${res.statusCode}: ${data.slice(0, 200)}`));
        } else {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(new Error(`Invalid JSON: ${data.slice(0, 100)}`)); }
        }
      });
    });
    req.on('error', reject);
    req.setTimeout(15000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Node type classifications
const BRANCH_TYPES = new Set([
  'n8n-nodes-base.if', 'n8n-nodes-base.switch', 'n8n-nodes-base.filter',
  'n8n-nodes-base.router', '@n8n/n8n-nodes-langchain.outputParserAutofixing'
]);

const ERROR_HANDLING_TYPES = new Set([
  'n8n-nodes-base.errorTrigger', 'n8n-nodes-base.stopAndError'
]);

const POSTGRES_TYPES = new Set([
  'n8n-nodes-base.postgres', 'n8n-nodes-base.supabase'
]);

// Extract condition info from IF node parameters
function parseIfCondition(params) {
  // IF v2 (newer)
  if (params.conditions?.options?.rules) {
    const rules = params.conditions.options.rules;
    return rules.map(rule => ({
      left: rule.leftValue || '',
      operator: rule.operator?.operation || rule.operator?.type || 'equals',
      right: rule.rightValue || ''
    }));
  }

  // IF v1
  if (params.conditions?.boolean) {
    return params.conditions.boolean.map(cond => ({
      left: cond.value1 || '',
      operator: cond.operation || 'equals',
      right: cond.value2 || ''
    }));
  }

  // IF with simple value check
  if (params.value1 !== undefined) {
    return [{ left: params.value1, operator: params.operation || 'equals', right: params.value2 || '' }];
  }

  return [{ left: 'unknown', operator: 'unknown', right: 'unknown' }];
}

// Extract condition info from Switch node
function parseSwitchCondition(params) {
  const cases = [];

  // Switch v2
  if (params.rules?.values) {
    for (const rule of params.rules.values) {
      const key = rule.outputKey || `case_${cases.length}`;
      const conditions = rule.conditions?.options?.rules || [];
      cases.push({
        output: key,
        conditions: conditions.map(r => ({
          left: r.leftValue || '',
          operator: r.operator?.operation || 'equals',
          right: r.rightValue || ''
        }))
      });
    }
  }

  // Switch v1
  if (params.rules?.rules) {
    for (const rule of params.rules.rules) {
      cases.push({
        output: rule.output || `case_${cases.length}`,
        conditions: [{ left: params.value1 || '', operator: rule.operation || 'equals', right: rule.value || '' }]
      });
    }
  }

  return cases;
}

// Extract JSON field references from n8n expressions
function extractFieldRefs(expr) {
  if (typeof expr !== 'string') return [];
  const refs = [];
  // Match $json.xxx, $json["xxx"], $json['xxx']
  const patterns = [
    /\$json\.(\w+(?:\.\w+)*)/g,
    /\$json\["([^"]+)"\]/g,
    /\$json\['([^']+)'\]/g,
    /\$\(.*?\)\.item\.json\.(\w+(?:\.\w+)*)/g,
  ];
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(expr)) !== null) {
      refs.push(match[1]);
    }
  }
  return refs;
}

// Generate seed data from parsed conditions
function generateSeedData(branches, triggerType) {
  const scenarios = [];

  if (triggerType === 'webhook' || triggerType === 'manual') {
    // Collect all field references from all branches to build a base payload
    const allFields = new Set();

    for (const branch of branches) {
      for (const cond of (branch.conditions || [])) {
        const refs = extractFieldRefs(cond.left);
        refs.forEach(f => allFields.add(f));
        const rightRefs = extractFieldRefs(cond.right);
        rightRefs.forEach(f => allFields.add(f));
      }
    }

    // Build base payload with placeholder values
    const basePayload = {};
    for (const field of allFields) {
      const parts = field.split('.');
      let obj = basePayload;
      for (let i = 0; i < parts.length - 1; i++) {
        if (!obj[parts[i]]) obj[parts[i]] = {};
        obj = obj[parts[i]];
      }
      obj[parts[parts.length - 1]] = 'test_value';
    }

    // For each branch, generate payloads that trigger each direction
    for (const branch of branches) {
      if (branch.type === 'if') {
        // True branch
        const truePayload = JSON.parse(JSON.stringify(basePayload));
        const falsePayload = JSON.parse(JSON.stringify(basePayload));

        for (const cond of branch.conditions) {
          const fieldPath = extractFieldRefs(cond.left);
          if (fieldPath.length > 0) {
            const field = fieldPath[0];
            setSeedValue(truePayload, field, cond.operator, cond.right, true);
            setSeedValue(falsePayload, field, cond.operator, cond.right, false);
          }
        }

        scenarios.push({
          name: `${branch.nodeName}_true`,
          description: `Triggers TRUE branch of "${branch.nodeName}"`,
          payload: truePayload,
          expected_branches: [`${branch.nodeName}→true`]
        });

        scenarios.push({
          name: `${branch.nodeName}_false`,
          description: `Triggers FALSE branch of "${branch.nodeName}"`,
          payload: falsePayload,
          expected_branches: [`${branch.nodeName}→false`]
        });

      } else if (branch.type === 'switch') {
        for (const switchCase of (branch.cases || [])) {
          const casePayload = JSON.parse(JSON.stringify(basePayload));
          for (const cond of switchCase.conditions) {
            const fieldPath = extractFieldRefs(cond.left);
            if (fieldPath.length > 0) {
              setSeedValue(casePayload, fieldPath[0], 'equals', cond.right, true);
            }
          }
          scenarios.push({
            name: `${branch.nodeName}_${switchCase.output}`,
            description: `Triggers "${switchCase.output}" case of "${branch.nodeName}"`,
            payload: casePayload,
            expected_branches: [`${branch.nodeName}→${switchCase.output}`]
          });
        }

        // Default/fallback case
        const defaultPayload = JSON.parse(JSON.stringify(basePayload));
        scenarios.push({
          name: `${branch.nodeName}_default`,
          description: `Triggers default/fallback of "${branch.nodeName}"`,
          payload: defaultPayload,
          expected_branches: [`${branch.nodeName}→default`]
        });
      }
    }

    // If no branch-specific scenarios, add a simple happy path
    if (scenarios.length === 0) {
      scenarios.push({
        name: 'happy_path',
        description: 'Default execution with sample data',
        payload: Object.keys(basePayload).length > 0 ? basePayload : { test: true },
        expected_branches: []
      });
    }

  } else {
    // Scheduled/manual — can't control input, just run
    scenarios.push({
      name: 'natural_run',
      description: 'Execute with current live data (scheduled/manual trigger)',
      payload: null,
      expected_branches: []
    });
  }

  return scenarios;
}

// Set a value in a nested object to satisfy or violate a condition
function setSeedValue(obj, fieldPath, operator, rightValue, satisfy) {
  const parts = fieldPath.split('.');
  let target = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (!target[parts[i]] || typeof target[parts[i]] !== 'object') target[parts[i]] = {};
    target = target[parts[i]];
  }
  const key = parts[parts.length - 1];

  // Parse right value
  let right = rightValue;
  if (typeof right === 'string') {
    right = right.replace(/^=\{\{|\}\}$/g, '').trim();
    if (right === 'true') right = true;
    else if (right === 'false') right = false;
    else if (!isNaN(Number(right)) && right !== '') right = Number(right);
  }

  switch (operator) {
    case 'equals':
    case 'equal':
      target[key] = satisfy ? right : (typeof right === 'string' ? right + '_NOT' : (typeof right === 'number' ? right + 999 : !right));
      break;
    case 'notEqual':
    case 'not_equals':
      target[key] = satisfy ? (typeof right === 'string' ? right + '_DIFF' : right + 1) : right;
      break;
    case 'contains':
      target[key] = satisfy ? `contains_${right}_here` : 'no_match';
      break;
    case 'notContains':
      target[key] = satisfy ? 'no_match' : `contains_${right}_here`;
      break;
    case 'larger':
    case 'gt':
      target[key] = satisfy ? (typeof right === 'number' ? right + 1 : 100) : (typeof right === 'number' ? right - 1 : 0);
      break;
    case 'smaller':
    case 'lt':
      target[key] = satisfy ? (typeof right === 'number' ? right - 1 : 0) : (typeof right === 'number' ? right + 1 : 100);
      break;
    case 'isEmpty':
      target[key] = satisfy ? '' : 'has_value';
      break;
    case 'isNotEmpty':
      target[key] = satisfy ? 'has_value' : '';
      break;
    case 'exists':
      if (!satisfy) delete target[key];
      else target[key] = 'exists';
      break;
    case 'doesNotExist':
      if (satisfy) delete target[key];
      else target[key] = 'exists';
      break;
    case 'regex':
      target[key] = satisfy ? right : 'no_regex_match_xyz';
      break;
    default:
      // Unknown operator — provide a generic value
      target[key] = satisfy ? right || 'test_true' : 'test_false';
  }
}

// Main analysis
async function analyze() {
  const workflow = await apiGet(`/api/v1/workflows/${workflowId}`);

  const nodes = workflow.nodes || [];
  const connections = workflow.connections || {};
  const tags = (workflow.tags || []).map(t => t.name || t);

  // Build node inventory
  const inventory = nodes.map(node => {
    const type = node.type || '';
    const isBranch = BRANCH_TYPES.has(type);
    const isError = ERROR_HANDLING_TYPES.has(type);
    const isPostgres = POSTGRES_TYPES.has(type);

    return {
      id: node.id,
      name: node.name,
      type: type.replace('n8n-nodes-base.', ''),
      fullType: type,
      isBranch,
      isError,
      isPostgres,
      hasAlwaysOutput: node.parameters?.options?.alwaysOutputData === true ||
                        node.parameters?.alwaysOutputData === true ||
                        node.onError === 'continueRegularOutput'
    };
  });

  // Identify trigger type
  const triggerNode = nodes.find(n =>
    n.type?.includes('webhook') || n.type?.includes('Trigger') || n.type?.includes('trigger')
  );
  let triggerType = 'unknown';
  if (triggerNode) {
    if (triggerNode.type.includes('webhook')) triggerType = 'webhook';
    else if (triggerNode.type.includes('errorTrigger')) triggerType = 'error_trigger';
    else if (triggerNode.type.includes('scheduleTrigger') || triggerNode.type.includes('cron')) triggerType = 'schedule';
    else if (triggerNode.type.includes('manualTrigger')) triggerType = 'manual';
    else triggerType = 'other_trigger';
  }

  // Analyze branch points
  const branches = [];
  for (const node of nodes) {
    if (!BRANCH_TYPES.has(node.type)) continue;

    const shortType = node.type.replace('n8n-nodes-base.', '');

    if (shortType === 'if') {
      const conditions = parseIfCondition(node.parameters || {});
      // Count outputs from connections
      const nodeConnections = connections[node.name] || {};
      const outputCount = Object.keys(nodeConnections).length || 2;

      branches.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'if',
        conditions,
        outputCount,
        outputs: ['true', 'false']
      });

    } else if (shortType === 'switch') {
      const cases = parseSwitchCondition(node.parameters || {});
      const nodeConnections = connections[node.name] || {};
      const outputCount = Object.keys(nodeConnections).length || cases.length + 1;

      branches.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'switch',
        cases,
        outputCount,
        outputs: [...cases.map(c => c.output), 'default']
      });

    } else if (shortType === 'filter') {
      branches.push({
        nodeId: node.id,
        nodeName: node.name,
        type: 'filter',
        conditions: parseIfCondition(node.parameters || {}),
        outputCount: 2,
        outputs: ['kept', 'discarded']
      });
    }
  }

  // Calculate totals
  const totalBranches = branches.reduce((sum, b) => sum + b.outputCount, 0);

  // Generate seed data
  const seedData = generateSeedData(branches, triggerType);

  // Structural compliance checks
  const compliance = {
    hasErrorHandling: inventory.some(n => n.isError),
    hasBusinessOsTag: tags.includes('business-os'),
    postgresWithoutAlwaysOutput: inventory.filter(n => n.isPostgres && !n.hasAlwaysOutput).map(n => n.name),
    missingItems: []
  };

  if (!compliance.hasErrorHandling) compliance.missingItems.push('error_handling');
  if (!compliance.hasBusinessOsTag) compliance.missingItems.push('business_os_tag');
  if (compliance.postgresWithoutAlwaysOutput.length > 0) compliance.missingItems.push('always_output_data');

  // Output compact analysis
  const result = {
    workflow_id: workflowId,
    workflow_name: workflow.name,
    active: workflow.active,
    trigger_type: triggerType,
    trigger_node: triggerNode ? triggerNode.name : null,

    totals: {
      nodes: inventory.length,
      branch_points: branches.length,
      total_branches: totalBranches,
      error_nodes: inventory.filter(n => n.isError).length,
      postgres_nodes: inventory.filter(n => n.isPostgres).length
    },

    nodes: inventory.map(n => ({
      id: n.id,
      name: n.name,
      type: n.type,
      flags: [
        n.isBranch ? 'branch' : null,
        n.isError ? 'error' : null,
        n.isPostgres ? 'db' : null
      ].filter(Boolean)
    })),

    branches: branches.map(b => ({
      node: b.nodeName,
      type: b.type,
      outputs: b.outputs,
      conditions: b.conditions || b.cases
    })),

    seed_data: seedData,
    compliance,
    tags
  };

  console.log(JSON.stringify(result, null, 2));
}

analyze().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
