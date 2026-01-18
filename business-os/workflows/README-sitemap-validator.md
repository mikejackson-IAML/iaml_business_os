# Sitemap Validator

> **CEO Summary:** This workflow runs daily to check that our sitemap.xml is valid and properly formatted. It catches issues like missing URLs, duplicate entries, or non-HTTPS links that could hurt our Google rankings. Alerts via Slack if any problems are found.

## Overview

```
Schedule (Daily)
       │
       ▼
 Fetch Sitemap (iaml.com/sitemap.xml)
       │
       ▼
 Validate Sitemap
       │
       ▼
 Has Issues?
       │
       ├── No ──► Sitemap OK (silent)
       │
       └── Yes ──► Slack Alert
```

## Schedule

- **Runs:** Daily (every 24 hours)
- **Trigger:** Schedule

## What It Does

1. **Fetches sitemap.xml** from www.iaml.com
2. **Validates format:**
   - Valid XML structure
   - Proper `<urlset>` declaration
3. **Checks for issues:**
   - No URLs found (empty sitemap)
   - Duplicate URLs
   - Non-HTTPS URLs (should all be HTTPS)
4. **Alerts** if any issues found

## Checks Performed

| Check | Issue |
|-------|-------|
| Valid XML | Sitemap must be valid XML |
| Has URLs | Sitemap must contain at least one URL |
| No duplicates | Each URL should appear only once |
| All HTTPS | All URLs should use HTTPS, not HTTP |

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Any issue found | Slack alert |
| Sitemap valid | No alert (silent success) |

**Slack Alert Format:**
```
Sitemap Validator Alert

Issues Found: 2

• Found 3 duplicate URLs
• Found 1 non-HTTPS URLs

Total URLs: 127
```

## Setup

### Prerequisites

1. **Slack webhook** configured
2. **Valid sitemap.xml** at www.iaml.com/sitemap.xml

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `sitemap-validator.json`
3. Workflow is self-contained
4. Activate the workflow

**n8n Workflow ID:** `szLUgbSu4sY3VTkF`

## Why Sitemap Validation Matters

- **Google uses sitemaps** to discover and index pages
- **Duplicate URLs** waste crawl budget
- **HTTP URLs** may cause security warnings
- **Invalid XML** prevents Google from reading the sitemap

## Related

- [Indexability Checker](README-indexability-checker.md) - Checks robots.txt and meta tags
- [Link Checker](README-link-checker.md) - Tests all URLs work
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns SEO
