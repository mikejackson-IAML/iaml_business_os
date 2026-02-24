#!/usr/bin/env node
/**
 * check-coverage.js — Compute node/branch coverage from n8n execution data
 *
 * Fetches execution results, parses which nodes ran, compares against
 * the workflow's total node list, and outputs coverage percentages.
 *
 * Usage:
 *   node scripts/n8n-testing/check-coverage.js <workflow_id> <execution_ids>
 *
 *   execution_ids: comma-separated execution IDs, e.g., "12345,12346,12347"
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
    error: 'Missing N8N_API_URL or N8N_API_KEY environment variables'
  }));
  process.exit(1);
}

const workflowId = process.argv[2];
const executionIdsArg = process.argv[3];

if (!workflowId || !executionIdsArg) {
  console.error(JSON.stringify({
    error: 'Usage: check-coverage.js <workflow_id> <execution_id1,execution_id2,...>'
  }));
  process.exit(1);
}

const executionIds = executionIdsArg.split(',').map(s => s.trim()).filter(Boolean);

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
    req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Branch type detection
const BRANCH_TYPES = new Set([
  'n8n-nodes-base.if', 'n8n-nodes-base.switch', 'n8n-nodes-base.filter',
  'n8n-nodes-base.router'
]);

async function checkCoverage() {
  // 1. Get workflow structure
  const workflow = await apiGet(`/api/v1/workflows/${workflowId}`);
  const nodes = workflow.nodes || [];
  const connections = workflow.connections || {};

  // Build node list and branch list
  const allNodes = new Map();
  const branchOutputs = []; // {nodeName, outputIndex, label}

  for (const node of nodes) {
    allNodes.set(node.name, {
      id: node.id,
      type: node.type,
      covered: false,
      coveredBy: []
    });

    // Track branch outputs
    if (BRANCH_TYPES.has(node.type)) {
      const nodeConns = connections[node.name] || {};
      const shortType = node.type.replace('n8n-nodes-base.', '');

      if (shortType === 'if') {
        branchOutputs.push({ nodeName: node.name, outputIndex: 0, label: 'true', covered: false, coveredBy: [] });
        branchOutputs.push({ nodeName: node.name, outputIndex: 1, label: 'false', covered: false, coveredBy: [] });
      } else if (shortType === 'switch') {
        const outputKeys = Object.keys(nodeConns);
        for (let i = 0; i < outputKeys.length; i++) {
          branchOutputs.push({ nodeName: node.name, outputIndex: i, label: outputKeys[i] || `output_${i}`, covered: false, coveredBy: [] });
        }
      } else if (shortType === 'filter') {
        branchOutputs.push({ nodeName: node.name, outputIndex: 0, label: 'kept', covered: false, coveredBy: [] });
        branchOutputs.push({ nodeName: node.name, outputIndex: 1, label: 'discarded', covered: false, coveredBy: [] });
      }
    }
  }

  // 2. Process each execution
  const executionResults = [];

  for (const execId of executionIds) {
    try {
      const execution = await apiGet(`/api/v1/executions/${execId}?includeData=true`);

      const status = execution.finished ? (execution.data?.resultData?.error ? 'error' : 'success') : 'running';
      const runData = execution.data?.resultData?.runData || {};

      // Track which nodes ran in this execution
      const nodesRun = Object.keys(runData);
      const nodesRunSet = new Set(nodesRun);

      // Mark node coverage
      for (const nodeName of nodesRun) {
        if (allNodes.has(nodeName)) {
          const nodeInfo = allNodes.get(nodeName);
          nodeInfo.covered = true;
          nodeInfo.coveredBy.push(execId);
        }
      }

      // Track branch coverage by examining which downstream nodes executed
      for (const branch of branchOutputs) {
        if (!nodesRunSet.has(branch.nodeName)) continue;

        // Check if downstream nodes for this output executed
        const nodeConns = connections[branch.nodeName] || {};
        const outputKey = Object.keys(nodeConns)[branch.outputIndex];
        const downstreamConns = outputKey ? nodeConns[outputKey] : null;

        if (downstreamConns) {
          // Check if any downstream node from this specific output ran
          for (const conn of downstreamConns) {
            if (conn.length > 0 && nodesRunSet.has(conn[0].node)) {
              branch.covered = true;
              if (!branch.coveredBy.includes(execId)) {
                branch.coveredBy.push(execId);
              }
              break;
            }
          }
        }

        // Alternative: check runData for the branch node to see which output was used
        const branchRunData = runData[branch.nodeName];
        if (branchRunData && Array.isArray(branchRunData)) {
          for (const run of branchRunData) {
            // n8n stores output data per output index
            if (run.data?.main) {
              const outputData = run.data.main[branch.outputIndex];
              if (outputData && outputData.length > 0) {
                branch.covered = true;
                if (!branch.coveredBy.includes(execId)) {
                  branch.coveredBy.push(execId);
                }
              }
            }
          }
        }
      }

      // Extract error info if any
      let errorInfo = null;
      if (execution.data?.resultData?.error) {
        const err = execution.data.resultData.error;
        errorInfo = {
          message: err.message || 'Unknown error',
          node: err.node?.name || null,
          type: err.node?.type || null
        };
      }

      // Check individual node errors
      const nodeErrors = [];
      for (const [nodeName, nodeRuns] of Object.entries(runData)) {
        for (const run of nodeRuns) {
          if (run.error) {
            nodeErrors.push({
              node: nodeName,
              error: run.error.message || 'Unknown error',
              type: allNodes.get(nodeName)?.type || 'unknown'
            });
          }
        }
      }

      executionResults.push({
        execution_id: execId,
        status,
        nodes_run: nodesRun.length,
        nodes_run_names: nodesRun,
        error: errorInfo,
        node_errors: nodeErrors
      });

    } catch (err) {
      executionResults.push({
        execution_id: execId,
        status: 'fetch_error',
        error: { message: err.message },
        nodes_run: 0,
        nodes_run_names: []
      });
    }
  }

  // 3. Calculate coverage
  const totalNodes = allNodes.size;
  const coveredNodes = [...allNodes.values()].filter(n => n.covered).length;
  const uncoveredNodes = [...allNodes.entries()]
    .filter(([_, v]) => !v.covered)
    .map(([name, v]) => ({ name, type: v.type?.replace('n8n-nodes-base.', '') }));

  const totalBranches = branchOutputs.length;
  const coveredBranches = branchOutputs.filter(b => b.covered).length;
  const uncoveredBranches = branchOutputs
    .filter(b => !b.covered)
    .map(b => ({ node: b.nodeName, output: b.label }));

  const nodePercent = totalNodes > 0 ? Math.round((coveredNodes / totalNodes) * 100) : 0;
  const branchPercent = totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 100;

  // Determine status based on thresholds
  let recommendedStatus;
  if (nodePercent === 100 && branchPercent === 100) {
    recommendedStatus = 'verified';
  } else if (nodePercent >= 90 && branchPercent >= 80) {
    recommendedStatus = 'tested';
  } else {
    recommendedStatus = 'needs_review';
  }

  // Check for execution errors
  const hasErrors = executionResults.some(e => e.status === 'error' || e.node_errors?.length > 0);
  if (hasErrors) {
    recommendedStatus = 'needs_review';
  }

  // 4. Output
  const result = {
    workflow_id: workflowId,
    workflow_name: workflow.name,
    executions: executionResults.length,

    node_coverage: {
      covered: coveredNodes,
      total: totalNodes,
      percent: nodePercent,
      display: `${coveredNodes}/${totalNodes} (${nodePercent}%)`
    },

    branch_coverage: {
      covered: coveredBranches,
      total: totalBranches,
      percent: branchPercent,
      display: `${coveredBranches}/${totalBranches} (${branchPercent}%)`
    },

    recommended_status: recommendedStatus,

    uncovered_nodes: uncoveredNodes,
    uncovered_branches: uncoveredBranches,

    node_map: [...allNodes.entries()].map(([name, v]) => ({
      name,
      type: v.type?.replace('n8n-nodes-base.', ''),
      covered: v.covered,
      by: v.coveredBy
    })),

    branch_map: branchOutputs.map(b => ({
      node: b.nodeName,
      output: b.label,
      covered: b.covered,
      by: b.coveredBy
    })),

    executions_detail: executionResults
  };

  console.log(JSON.stringify(result, null, 2));
}

checkCoverage().catch(err => {
  console.error(JSON.stringify({ error: err.message }));
  process.exit(1);
});
