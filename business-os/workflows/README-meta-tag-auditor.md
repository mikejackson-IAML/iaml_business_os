# Meta Tag Auditor

> **CEO Summary:** This workflow runs weekly to check that all pages have proper SEO meta tags (title tags and meta descriptions). It catches missing tags, tags that are too short/long, and duplicate tags across pages—all things that hurt Google rankings.

## Overview

```
Schedule (Weekly)
       │
       ▼
 Fetch Sitemap
       │
       ▼
 Parse URLs (limit 20)
       │
       ▼
 Fetch Each Page
       │
       ▼
 Analyze Meta Tags
       │
       ▼
 Has Issues?
       │
       ├── No ──► All OK (silent)
       │
       └── Yes ──► Slack Alert
```

## Schedule

- **Runs:** Weekly (every 7 days)
- **Trigger:** Schedule

## What It Does

1. **Fetches sitemap** and extracts URLs (limited to 20 for performance)
2. **Fetches each page** and extracts:
   - `<title>` tag
   - `<meta name="description">` tag
3. **Checks for issues:**
   - Missing title or description
   - Title too short (< 30 chars) or too long (> 60 chars)
   - Description too short (< 70 chars) or too long (> 160 chars)
   - Duplicate titles across pages
4. **Alerts** if any issues found

## Checks Performed

| Check | Ideal | Issue |
|-------|-------|-------|
| Title exists | Yes | "Missing title tag" |
| Title length | 30-60 chars | "Title too short/long" |
| Description exists | Yes | "Missing meta description" |
| Description length | 70-160 chars | "Description too short/long" |
| Unique titles | Yes | "Duplicate title with X pages" |

## Why Length Matters

| Tag | Recommendation | Why |
|-----|----------------|-----|
| Title | 30-60 characters | Google truncates at ~60 chars in search results |
| Description | 70-160 characters | Google truncates at ~160 chars in search results |

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Any issue found | Slack alert with details |
| All tags valid | No alert (silent success) |

**Slack Alert Format:**
```
Meta Tag Auditor Alert

Pages Checked: 20
Issues Found: 5

• Missing meta description
  https://www.iaml.com/programs/new-program
• Title too short (18 chars)
  https://www.iaml.com/about
• Description too long (182 chars)
  https://www.iaml.com/programs/employment-law-update
```

## Setup

### Prerequisites

1. **Slack webhook** configured
2. **Valid sitemap.xml** at www.iaml.com/sitemap.xml

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `meta-tag-auditor.json`
3. Workflow is self-contained
4. Activate the workflow

**n8n Workflow ID:** `7dlwbR7yQGnTOYcn`

## Response Playbook

When you receive an alert:

1. **Missing meta description** - Add description via CMS or code
2. **Title too short** - Expand to include relevant keywords
3. **Title too long** - Shorten to under 60 characters
4. **Duplicate titles** - Make each page title unique

## Related

- [Schema Validator](README-schema-validator.md) - Checks structured data
- [Indexability Checker](README-indexability-checker.md) - Checks robots directives
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns SEO
