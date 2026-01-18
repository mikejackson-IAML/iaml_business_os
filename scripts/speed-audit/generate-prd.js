#!/usr/bin/env node

/**
 * Speed Audit PRD Generator
 *
 * Converts approved speed audit items from Supabase into Ralph-compatible prd.json
 *
 * Usage:
 *   node generate-prd.js [audit-id]
 *   node generate-prd.js --latest
 *
 * Environment:
 *   SUPABASE_URL - Supabase project URL
 *   SUPABASE_SERVICE_KEY - Service role key
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;
const OUTPUT_DIR = path.join(__dirname, '../../.planning');

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Acceptance criteria templates by issue type
const ACCEPTANCE_CRITERIA = {
  blocking_script: [
    'All blocking scripts have defer or async attribute',
    'LCP improves by >100ms',
    'No functionality regression verified via smoke test'
  ],
  large_image: [
    'Images are properly sized for viewport',
    'Total page weight reduces by target amount',
    'Image quality remains acceptable (no visible degradation)'
  ],
  no_lazy_load: [
    'Below-fold images have loading="lazy" attribute',
    'Above-fold images remain eager-loaded',
    'Initial page load time improves'
  ],
  unoptimized_image: [
    'Images converted to WebP format with fallbacks',
    'File size reduces by >30%',
    'Images display correctly across browsers'
  ],
  no_preconnect: [
    'Preconnect hints added for external domains (fonts, CDN, analytics)',
    'DNS-prefetch added for secondary domains',
    'TTFB for external resources improves'
  ],
  unused_js: [
    'Unused JavaScript removed or code-split',
    'Bundle size reduces',
    'No functionality regression'
  ],
  unused_css: [
    'Unused CSS removed or loaded asynchronously',
    'Critical CSS identified and inlined if needed',
    'Styles render correctly on all pages'
  ],
  render_blocking_css: [
    'Critical CSS inlined in <head>',
    'Non-critical CSS loaded asynchronously',
    'FCP improves'
  ],
  main_thread_work: [
    'Long tasks broken up using scheduling',
    'Main thread blocking time reduces',
    'INP improves'
  ],
  long_task: [
    'JavaScript execution time reduces',
    'Tasks split using requestIdleCallback or similar',
    'Total Blocking Time (TBT) improves'
  ],
  large_dom: [
    'DOM element count reduced',
    'Virtual scrolling implemented if applicable',
    'Rendering performance improves'
  ],
  no_compression: [
    'Gzip or Brotli compression enabled',
    'Transfer size reduces significantly',
    'No functionality impact'
  ]
};

// Default acceptance criteria
const DEFAULT_ACCEPTANCE = [
  'Fix verified by re-running PageSpeed audit',
  'No visual regression',
  'Page functionality intact'
];

/**
 * Get acceptance criteria for an issue type
 */
function getAcceptanceCriteria(issueType, customCriteria = []) {
  const typeCriteria = ACCEPTANCE_CRITERIA[issueType] || DEFAULT_ACCEPTANCE;
  return [...new Set([...customCriteria, ...typeCriteria])];
}

/**
 * Get the latest pending audit or specific audit by ID
 */
async function getAudit(auditId) {
  let query = supabase
    .from('speed_audits')
    .select('*');

  if (auditId === '--latest') {
    query = query
      .eq('status', 'approved')
      .order('audit_date', { ascending: false })
      .limit(1);
  } else {
    query = query.eq('id', auditId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching audit:', error.message);
    process.exit(1);
  }

  if (!data || data.length === 0) {
    console.error('No audit found');
    process.exit(1);
  }

  return data[0];
}

/**
 * Get approved items for an audit
 */
async function getApprovedItems(auditId) {
  const { data, error } = await supabase
    .from('speed_audit_items')
    .select('*')
    .eq('audit_id', auditId)
    .eq('approved', true)
    .eq('executed', false)
    .order('priority_score', { ascending: false });

  if (error) {
    console.error('Error fetching items:', error.message);
    process.exit(1);
  }

  return data || [];
}

/**
 * Generate PRD from audit items
 */
function generatePRD(audit, items) {
  const today = new Date().toISOString().split('T')[0];

  const prd = {
    project: `IAML Speed Optimization - Week of ${audit.audit_date}`,
    description: `Automated speed optimization based on weekly audit. Mobile score: ${audit.avg_pagespeed_mobile}/100, Desktop: ${audit.avg_pagespeed_desktop}/100`,
    branchName: `feature/speed-opt-${today.replace(/-/g, '')}`,
    auditId: audit.id,
    auditDate: audit.audit_date,
    baselineMetrics: {
      mobileScore: audit.avg_pagespeed_mobile,
      desktopScore: audit.avg_pagespeed_desktop,
      lcp: audit.avg_lcp_ms,
      cls: audit.avg_cls,
      fcp: audit.avg_fcp_ms
    },
    targetMetrics: {
      mobileScore: Math.min(100, audit.avg_pagespeed_mobile + 5),
      desktopScore: Math.min(100, audit.avg_pagespeed_desktop + 3),
      lcp: Math.max(0, audit.avg_lcp_ms - 200),
      cls: Math.max(0, audit.avg_cls - 0.05)
    },
    stories: items.map((item, index) => ({
      id: item.item_code,
      title: item.title,
      description: buildDescription(item),
      priority: getSeverityPriority(item.severity),
      severity: item.severity,
      estimatedImpact: item.estimated_impact,
      estimatedSavingsMs: item.estimated_savings_ms,
      estimatedSavingsBytes: item.estimated_savings_bytes,
      issueType: item.issue_type,
      pageUrl: item.page_url,
      files: item.affected_files || (item.file_path ? [item.file_path] : []),
      acceptance: getAcceptanceCriteria(item.issue_type, item.acceptance_criteria || []),
      passes: false,
      dependencies: item.dependencies || []
    })),
    validation: {
      runPageSpeedAfter: true,
      runLighthouseAfter: true,
      runSmokeTest: true,
      compareWithBaseline: true
    },
    generatedAt: new Date().toISOString()
  };

  return prd;
}

/**
 * Build description from item
 */
function buildDescription(item) {
  let desc = item.description || '';

  if (item.fix_suggestion) {
    desc += `\n\n**Suggested Fix:** ${item.fix_suggestion}`;
  }

  if (item.page_url) {
    desc += `\n\n**Affected Page:** ${item.page_url}`;
  }

  if (item.estimated_savings_ms > 0) {
    desc += `\n\n**Estimated Savings:** ${item.estimated_savings_ms}ms`;
  }

  if (item.estimated_savings_bytes > 0) {
    const kb = (item.estimated_savings_bytes / 1024).toFixed(1);
    desc += item.estimated_savings_ms > 0 ? `, ${kb}KB` : `\n\n**Estimated Savings:** ${kb}KB`;
  }

  return desc;
}

/**
 * Convert severity to priority number
 */
function getSeverityPriority(severity) {
  const priorities = {
    critical: 1,
    high: 2,
    medium: 3,
    low: 4
  };
  return priorities[severity] || 4;
}

/**
 * Main execution
 */
async function main() {
  const auditId = process.argv[2] || '--latest';

  console.log(`Fetching audit: ${auditId}`);
  const audit = await getAudit(auditId);
  console.log(`Found audit: ${audit.id} (${audit.audit_date})`);

  console.log('Fetching approved items...');
  const items = await getApprovedItems(audit.id);
  console.log(`Found ${items.length} approved items`);

  if (items.length === 0) {
    console.log('No approved items to process. Exiting.');
    process.exit(0);
  }

  console.log('Generating PRD...');
  const prd = generatePRD(audit, items);

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Write PRD file
  const outputFile = path.join(OUTPUT_DIR, `speed-prd-${audit.audit_date}.json`);
  fs.writeFileSync(outputFile, JSON.stringify(prd, null, 2));
  console.log(`PRD written to: ${outputFile}`);

  // Update audit record
  const { error } = await supabase
    .from('speed_audits')
    .update({
      prd_generated_at: new Date().toISOString(),
      prd_file_path: outputFile
    })
    .eq('id', audit.id);

  if (error) {
    console.error('Warning: Could not update audit record:', error.message);
  }

  // Summary
  console.log('\n--- PRD Summary ---');
  console.log(`Project: ${prd.project}`);
  console.log(`Branch: ${prd.branchName}`);
  console.log(`Stories: ${prd.stories.length}`);
  console.log(`  - Critical: ${prd.stories.filter(s => s.severity === 'critical').length}`);
  console.log(`  - High: ${prd.stories.filter(s => s.severity === 'high').length}`);
  console.log(`  - Medium: ${prd.stories.filter(s => s.severity === 'medium').length}`);
  console.log(`  - Low: ${prd.stories.filter(s => s.severity === 'low').length}`);
  console.log('\nRun Ralph to execute:');
  console.log(`  ralph --prd ${outputFile}`);
}

main().catch(console.error);
