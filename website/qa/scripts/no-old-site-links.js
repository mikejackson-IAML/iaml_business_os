#!/usr/bin/env node
/*
 * Fail if active website files contain clickable links that can fall through to
 * the old site. New-site internal links should be explicit static targets, e.g.
 * /index.html, /programs/index.html, /program-schedule.html, /programs/foo.html.
 */
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const ignoreDirs = new Set(['node_modules', 'backups', 'test-results', 'playwright-report', '__pycache__', '.git']);
const exts = new Set(['.html', '.js']);
const safePrefixes = [
  '/api/', '/images/', '/css/', '/js/', '/data/', '/assets/', '/favicon', '/robots', '/sitemap'
];
const safeSchemes = /^(mailto:|tel:|javascript:|#|\{\{|\$\{|data:)/i;
const staticExt = /\.(html|pdf|xml|txt|json|js|css|svg|png|jpg|jpeg|webp|gif|ico)(?:[?#].*)?$/i;
const tagRe = /<(a|form)\b[^>]*\b(href|action)=(['"])(.*?)\3[^>]*>/gi;
const anyAttrRe = /\b(href|action)=(['"])(.*?)\2/g;

function walk(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (!ignoreDirs.has(name)) walk(full, out);
    } else if (exts.has(path.extname(name))) {
      out.push(full);
    }
  }
  return out;
}

function lineNumber(text, index) {
  return text.slice(0, index).split('\n').length;
}

function normalizeClickableUrl(url) {
  const absoluteIaml = url.match(/^https?:\/\/(?:www\.)?iaml\.com(\/[^?#]*)?([?#].*)?$/i);
  if (absoluteIaml) {
    return (absoluteIaml[1] || '/') + (absoluteIaml[2] || '');
  }
  return url;
}

function isOldSiteRisk(rawUrl) {
  if (!rawUrl || safeSchemes.test(rawUrl)) return false;
  const url = normalizeClickableUrl(rawUrl);
  if (!url.startsWith('/') || url.startsWith('//')) return false;
  if (safePrefixes.some(prefix => url.startsWith(prefix))) return false;
  const pathOnly = url.split(/[?#]/)[0];
  if (pathOnly === '/') return true;
  if (staticExt.test(url)) return false;
  return true;
}

const failures = [];
for (const file of walk(root)) {
  const text = fs.readFileSync(file, 'utf8');
  let match;

  // Primary scan: clickable anchors/forms only, including absolute iaml.com URLs.
  while ((match = tagRe.exec(text))) {
    const url = match[4];
    if (isOldSiteRisk(url)) {
      failures.push({
        file: path.relative(root, file),
        line: lineNumber(text, match.index),
        attr: match[2].toLowerCase(),
        url
      });
    }
  }

  // Secondary scan catches templated snippets inside JS strings that may not be
  // complete tags after interpolation. It ignores metadata-only rel/canonical tags.
  while ((match = anyAttrRe.exec(text))) {
    const url = match[3];
    if (!url.startsWith('/')) continue;
    if (isOldSiteRisk(url)) {
      const prior = text.slice(Math.max(0, match.index - 40), match.index).toLowerCase();
      if (prior.includes('<link') || prior.includes('<meta')) continue;
      failures.push({
        file: path.relative(root, file),
        line: lineNumber(text, match.index),
        attr: match[1].toLowerCase(),
        url
      });
    }
  }
}

const unique = Array.from(new Map(failures.map(f => [`${f.file}:${f.line}:${f.attr}:${f.url}`, f])).values());

if (unique.length) {
  console.error('Old-site-risk clickable links found. Use explicit .html/index.html static routes:');
  for (const f of unique) {
    console.error(`${f.file}:${f.line} ${f.attr}="${f.url}"`);
  }
  process.exit(1);
}

console.log('No old-site-risk clickable links found.');
