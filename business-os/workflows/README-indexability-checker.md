# Indexability Checker

> **CEO Summary:** This workflow runs daily to verify that Google can index our pages. It checks robots.txt, noindex tags, and canonical URLs to make sure we haven't accidentally blocked important pages from search engines. Critical for maintaining search visibility.

## Overview

```
Schedule (Daily)
       │
       ├──► Fetch robots.txt
       │
       └──► Fetch Key Pages
              │
              ▼
        Analyze Indexability
              │
              ▼
        Has Issues?
              │
              ├── No ──► All OK (silent)
              │
              └── Yes ──► Slack Alert
```

## Schedule

- **Runs:** Daily (every 24 hours)
- **Trigger:** Schedule

## What It Does

1. **Fetches robots.txt** and checks for overly restrictive rules
2. **Checks key pages** for indexability issues:
   - Homepage
   - Employment Law Update
   - About page
3. **Looks for blocking signals:**
   - `<meta name="robots" content="noindex">` tag
   - `<meta name="robots" content="nofollow">` tag
   - Missing or incorrect canonical tags
   - `X-Robots-Tag: noindex` HTTP header
4. **Alerts** if any pages are accidentally blocked

## Checks Performed

| Check | Issue |
|-------|-------|
| robots.txt exists | "robots.txt not found or empty" |
| Not blocking site | "robots.txt may be blocking entire site" |
| No noindex tag | "Page has noindex tag" |
| No nofollow tag | "Page has nofollow tag" |
| Has canonical | "Missing canonical tag" |
| Canonical correct | "Canonical points to different URL" |
| No X-Robots-Tag | "X-Robots-Tag header contains noindex" |

## Why Indexability Matters

If a page has `noindex`:
- Google won't show it in search results
- All SEO value is lost
- Users can't find the page via search

Common causes of accidental noindex:
- Staging site settings copied to production
- CMS checkbox accidentally checked
- Developer forgot to remove testing tag

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Any indexability issue | Slack alert with details |
| All pages indexable | No alert (silent success) |

**Slack Alert Format:**
```
Indexability Checker Alert

Issues Found: 2

• [noindex] Page has noindex tag
  https://www.iaml.com/programs/new-page
• [canonical] Missing canonical tag
  https://www.iaml.com/about

These issues may prevent Google from indexing your pages.
```

## Setup

### Prerequisites

1. **Slack webhook** configured

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `indexability-checker.json`
3. Workflow is self-contained
4. Activate the workflow

**n8n Workflow ID:** `bGgsBjTfjCV6mv72`

## Response Playbook

When you receive an alert:

1. **noindex tag found:**
   - Check if intentional (private page)
   - If accidental, remove the tag immediately
   - Request re-indexing in Google Search Console

2. **Missing canonical:**
   - Add canonical tag pointing to the page's own URL
   - Prevents duplicate content issues

3. **robots.txt blocking:**
   - Review robots.txt for overly broad rules
   - Test with Google's robots.txt Tester

## Related

- [Sitemap Validator](README-sitemap-validator.md) - Validates sitemap format
- [Meta Tag Auditor](README-meta-tag-auditor.md) - Checks SEO tags
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns SEO
