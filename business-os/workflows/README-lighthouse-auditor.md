# Lighthouse Auditor

> **CEO Summary:** This workflow runs daily to test iaml.com's performance, accessibility, SEO, and best practices using Google's PageSpeed Insights API. If any score drops below 50, it alerts via Slack and email. Helps us catch performance problems before they affect visitors.

## Overview

```
Schedule (Daily)
       │
       ├──► PageSpeed Mobile API
       │
       └──► PageSpeed Desktop API
              │
              ▼
        Parse Results
              │
              ▼
        Poor Scores? (< 50)
              │
              ├── No ──► Scores OK (silent)
              │
              └── Yes ──► Slack Alert
                          │
                          └── Email Alert
```

## Schedule

- **Runs:** Daily (every 24 hours)
- **Trigger:** Schedule

## What It Does

1. **Calls PageSpeed Insights API** for both mobile and desktop
2. **Extracts scores** for all four Lighthouse categories:
   - Performance (page load speed)
   - Accessibility (screen reader compatibility, contrast, etc.)
   - Best Practices (security, modern APIs)
   - SEO (meta tags, crawlability)
3. **Extracts Core Web Vitals:**
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)
   - FCP (First Contentful Paint)
   - TTFB (Time to First Byte)
4. **Alerts if any performance score < 50**

## Metrics Tracked

| Metric | What It Measures | Good Score |
|--------|------------------|------------|
| Performance | Page load speed, interactivity | > 90 |
| Accessibility | Usability for all users | > 90 |
| Best Practices | Security, modern standards | > 90 |
| SEO | Search engine optimization | > 90 |
| LCP | Time to largest element visible | < 2.5s |
| CLS | Visual stability during load | < 0.1 |
| FCP | Time to first content visible | < 1.8s |

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Any performance score < 50 | Slack alert + email alert |
| All scores > 50 | No alert (silent success) |

**Slack Alert Format:**
```
Lighthouse Alert: Poor Performance Scores

URL: https://www.iaml.com

Mobile Scores:
• Performance: 42
• Accessibility: 88
• Best Practices: 92
• SEO: 95

Desktop Scores:
• Performance: 65

Core Web Vitals:
• LCP: 4.2 s
• CLS: 0.12
• FCP: 2.1 s

Investigate performance issues.
```

## Setup

### Prerequisites

1. **Google PageSpeed Insights API** - Free, no API key required for basic usage
2. **Slack webhook** configured
3. **SendGrid API** for email alerts

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `lighthouse-auditor.json`
3. Workflow is self-contained (uses public API)
4. Activate the workflow

**n8n Workflow ID:** `RvHwQeupCo1e3N9c`

## Troubleshooting

### API timeout
- PageSpeed API can be slow (up to 120s)
- Workflow has 120s timeout configured
- If still failing, try reducing categories checked

### Scores seem inconsistent
- PageSpeed runs real browser tests, scores vary slightly
- For consistent monitoring, consider averaging over time

## Related

- [Page Speed Monitor](README-page-speed-monitor.md) - Quick load time checks
- [Link Checker](README-link-checker.md) - Checks for broken links
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns performance
