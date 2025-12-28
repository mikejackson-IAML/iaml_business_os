#!/usr/bin/env node
/**
 * CSS Audit Script for IAML
 *
 * Analyzes CSS changes to warn about potentially risky modifications.
 * Run before commits to catch CSS that could affect multiple pages.
 *
 * Usage:
 *   node qa/scripts/css-audit.js                    # Audit staged changes
 *   node qa/scripts/css-audit.js --all              # Audit all CSS files
 *   node qa/scripts/css-audit.js --file 5-pages.css # Audit specific file
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CSS_DIR = path.join(__dirname, '../../css');
const RISK_PATTERNS = [
  // High risk: Modifying base/global styles
  { pattern: /^(html|body|main|header|footer|nav|section|article)\s*\{/gm, risk: 'high', message: 'Modifying base HTML element styles' },
  { pattern: /^\*\s*\{/gm, risk: 'high', message: 'Universal selector (*) - affects all elements' },
  { pattern: /^\.container\s*\{/gm, risk: 'high', message: 'Modifying .container - used globally' },
  { pattern: /^\.btn\s*\{/gm, risk: 'high', message: 'Modifying .btn - used across pages' },

  // Medium risk: Common component classes
  { pattern: /^\.card\s*\{/gm, risk: 'medium', message: 'Modifying .card - check all card usages' },
  { pattern: /^\.modal\s*\{/gm, risk: 'medium', message: 'Modifying .modal - check all modals' },
  { pattern: /^\.header-/gm, risk: 'medium', message: 'Modifying header styles' },
  { pattern: /^\.footer-/gm, risk: 'medium', message: 'Modifying footer styles' },
  { pattern: /^\.glass-btn/gm, risk: 'medium', message: 'Modifying glass button styles' },

  // Low risk but worth noting
  { pattern: /!important/g, risk: 'low', message: 'Using !important - may cause specificity issues' },
  { pattern: /@media.*max-width/g, risk: 'low', message: 'Adding max-width media query - verify mobile styles' }
];

// Page-specific prefixes (these are safe when properly scoped)
const SAFE_PREFIXES = [
  '.ct-',      // Corporate training
  '.about-',   // About us
  '.fp-',      // Featured programs
  '.faculty-', // Faculty
  '.ps-',      // Program schedule
  '.erl-',     // Employee relations law
  '.shr-'      // Strategic HR leadership
];

function getChangedCSSContent() {
  try {
    // Get staged CSS changes
    const diff = execSync('git diff --cached --unified=0 css/*.css', { encoding: 'utf8' });
    return diff;
  } catch (e) {
    return '';
  }
}

function getAllCSSContent() {
  const files = fs.readdirSync(CSS_DIR).filter(f => f.endsWith('.css'));
  let content = '';
  for (const file of files) {
    content += `\n/* FILE: ${file} */\n`;
    content += fs.readFileSync(path.join(CSS_DIR, file), 'utf8');
  }
  return content;
}

function auditCSS(content, mode = 'staged') {
  const issues = [];

  // Check for risky patterns
  for (const { pattern, risk, message } of RISK_PATTERNS) {
    const matches = content.match(pattern);
    if (matches) {
      // Skip if it's a page-scoped class
      const isScoped = SAFE_PREFIXES.some(prefix =>
        matches.some(m => m.includes(prefix))
      );

      if (!isScoped) {
        issues.push({
          risk,
          message,
          count: matches.length,
          examples: matches.slice(0, 3)
        });
      }
    }
  }

  // Check for unscoped class additions in 5-pages.css
  const unprefixedClasses = content.match(/^\.[a-z][a-z0-9-]*\s*\{/gm) || [];
  const unscopedClasses = unprefixedClasses.filter(cls => {
    return !SAFE_PREFIXES.some(prefix => cls.includes(prefix));
  });

  if (unscopedClasses.length > 0) {
    issues.push({
      risk: 'medium',
      message: 'Classes without page prefix in 5-pages.css may affect other pages',
      count: unscopedClasses.length,
      examples: unscopedClasses.slice(0, 5)
    });
  }

  return issues;
}

function printReport(issues, mode) {
  console.log('\n========================================');
  console.log('  CSS AUDIT REPORT');
  console.log(`  Mode: ${mode}`);
  console.log('========================================\n');

  if (issues.length === 0) {
    console.log('\x1b[32m%s\x1b[0m', 'No CSS issues detected.\n');
    return 0;
  }

  const highRisk = issues.filter(i => i.risk === 'high');
  const mediumRisk = issues.filter(i => i.risk === 'medium');
  const lowRisk = issues.filter(i => i.risk === 'low');

  if (highRisk.length > 0) {
    console.log('\x1b[31m%s\x1b[0m', 'HIGH RISK:');
    highRisk.forEach(issue => {
      console.log(`  - ${issue.message} (${issue.count} occurrences)`);
      issue.examples.forEach(ex => console.log(`    ${ex.trim()}`));
    });
    console.log('');
  }

  if (mediumRisk.length > 0) {
    console.log('\x1b[33m%s\x1b[0m', 'MEDIUM RISK:');
    mediumRisk.forEach(issue => {
      console.log(`  - ${issue.message} (${issue.count} occurrences)`);
      issue.examples.forEach(ex => console.log(`    ${ex.trim()}`));
    });
    console.log('');
  }

  if (lowRisk.length > 0) {
    console.log('\x1b[36m%s\x1b[0m', 'LOW RISK (informational):');
    lowRisk.forEach(issue => {
      console.log(`  - ${issue.message} (${issue.count} occurrences)`);
    });
    console.log('');
  }

  console.log('----------------------------------------');
  console.log('RECOMMENDATION: Run visual regression tests before committing:');
  console.log('  npx playwright test visual-regression\n');

  // Return exit code based on risk level
  return highRisk.length > 0 ? 1 : 0;
}

// Main execution
const args = process.argv.slice(2);
let content, mode;

if (args.includes('--all')) {
  content = getAllCSSContent();
  mode = 'all files';
} else if (args.includes('--file')) {
  const fileIndex = args.indexOf('--file') + 1;
  const fileName = args[fileIndex];
  const filePath = path.join(CSS_DIR, fileName);
  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, 'utf8');
    mode = fileName;
  } else {
    console.error(`File not found: ${filePath}`);
    process.exit(1);
  }
} else {
  content = getChangedCSSContent();
  mode = 'staged changes';
  if (!content) {
    console.log('No staged CSS changes to audit.');
    process.exit(0);
  }
}

const issues = auditCSS(content, mode);
const exitCode = printReport(issues, mode);
process.exit(exitCode);
