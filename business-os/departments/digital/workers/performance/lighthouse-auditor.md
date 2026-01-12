# Lighthouse Auditor

## Purpose
Runs daily Lighthouse audits on key pages to track Core Web Vitals and identify performance regressions.

## Type
Monitor (Automated)

## Schedule
Daily at 5 AM (`0 5 * * *`)

## Pages Audited

| Page | Priority | Notes |
|------|----------|-------|
| Homepage | High | Main entry point |
| Featured Programs | High | Key conversion page |
| Employee Relations Law | High | Most popular program |
| Program Schedule | Medium | Session listings |
| About Us | Medium | Brand page |

## Audit Categories

- **Performance** — Core Web Vitals, load times
- **Accessibility** — WCAG compliance
- **SEO** — Technical SEO factors
- **Best Practices** — Security, modern APIs

## Thresholds

| Metric | Target | Warning | Critical |
|--------|--------|---------|----------|
| Performance Score | > 80 | 60-80 | < 60 |
| LCP | < 2.5s | 2.5-4s | > 4s |
| FID | < 100ms | 100-300ms | > 300ms |
| CLS | < 0.1 | 0.1-0.25 | > 0.25 |
| Accessibility | > 90 | 80-90 | < 80 |
| SEO | > 90 | 80-90 | < 80 |

## Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Performance < 60 | Critical | Immediate notification |
| 10+ point drop from baseline | Warning | DevOps review |
| Accessibility < 80 | Major | Add to fix queue |
| SEO < 80 | Major | Content Specialist review |

## Implementation

```javascript
// Uses lighthouse-ci or PageSpeed Insights API
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function auditPage(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = { port: chrome.port, output: 'json' };

  const results = await lighthouse(url, options);

  return {
    performance: results.lhr.categories.performance.score * 100,
    accessibility: results.lhr.categories.accessibility.score * 100,
    seo: results.lhr.categories.seo.score * 100,
    lcp: results.lhr.audits['largest-contentful-paint'].numericValue,
    cls: results.lhr.audits['cumulative-layout-shift'].numericValue,
    fid: results.lhr.audits['max-potential-fid'].numericValue
  };
}
```

## Data Storage

Results stored in Supabase `lighthouse_audits` table:
- `audit_date`
- `page_url`
- `performance_score`
- `accessibility_score`
- `seo_score`
- `lcp_ms`
- `cls_score`
- `fid_ms`
- `full_report` (JSON)

## Trend Analysis

Weekly summary includes:
- Score trends over 7 days
- Pages with declining performance
- Recommendations from Lighthouse
- Comparison to baseline
