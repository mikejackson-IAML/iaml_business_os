# Link Checker

> **CEO Summary:** This workflow runs daily to check every page on iaml.com for broken links. It fetches the sitemap, tests each URL, and alerts us via Slack and email if any links return 404 errors. Keeps the site professional and avoids frustrating visitors.

## Overview

```
Schedule (Daily)
       │
       ▼
 Fetch Sitemap (iaml.com/sitemap.xml)
       │
       ▼
 Parse URLs from XML
       │
       ▼
 Check each URL (HTTP request)
       │
       ▼
 Collect Results (identify broken links)
       │
       ▼
 Has Broken Links?
       │
       ├── No ──► All Links OK (silent success)
       │
       └── Yes ──► Slack Alert
                   │
                   └── Email Alert
```

## Schedule

- **Runs:** Daily (every 24 hours)
- **Trigger:** Schedule

## What It Does

1. **Fetches sitemap.xml** from www.iaml.com
2. **Parses all `<loc>` URLs** from the sitemap
3. **Tests each URL** with an HTTP HEAD request (30s timeout)
4. **Categorizes responses:**
   - 2xx, 3xx → OK
   - 4xx, 5xx, timeout → Broken
5. **Alerts if any broken links found** via:
   - Slack notification with list of broken URLs
   - Email to mike.jackson@iaml.com

## Alerts

| Condition | What Happens |
|-----------|--------------|
| All links return 2xx/3xx | No alert (silent success) |
| Any link returns 4xx/5xx or timeout | Slack alert + email alert |

**Slack Alert Format:**
```
Link Checker Alert: Broken Links Found

Total Checked: 127
Broken Links: 3

• https://www.iaml.com/programs/old-page (Status: 404)
• https://www.iaml.com/resources/deleted (Status: 404)
• https://www.iaml.com/team/former-member (Status: 500)

Checked At: 2026-01-17T06:00:00Z
```

## What Gets Checked

The workflow checks all URLs in the sitemap, which typically includes:

- All program pages (`/programs/*`)
- Corporate training pages (`/corporate-training/*`)
- About/team pages
- Resource pages
- Blog posts (if applicable)

**Note:** The sitemap may not include every page. Dynamically generated or excluded pages won't be checked.

## Configuration

| Setting | Value |
|---------|-------|
| Sitemap URL | https://www.iaml.com/sitemap.xml |
| Request timeout | 30 seconds |
| Alert email | mike.jackson@iaml.com |

## Setup

### Prerequisites

1. **Slack webhook** configured at: `https://hooks.slack.com/services/T09D27N8KSP/...`
2. **SendGrid API key** for email alerts
3. **Valid sitemap.xml** at www.iaml.com/sitemap.xml

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `link-checker.json`
3. Workflow is self-contained (no database needed)
4. Activate the workflow

**n8n Workflow ID:** `ly3hl4gPv0Y0Faes`

## Monitoring

### Check workflow history

In n8n:
1. Go to Workflows → Link Checker
2. Click "Executions" tab
3. Review recent runs for success/failure

### Manual link check

```bash
# Check a single URL
curl -I https://www.iaml.com/programs/certification-in-employee-relations-law

# Check sitemap is accessible
curl https://www.iaml.com/sitemap.xml | head -50
```

## Troubleshooting

### High number of broken links suddenly
1. Check if site deployment failed
2. Verify DNS is resolving correctly
3. Check if CDN (Vercel) is having issues

### False positives (links work in browser but fail here)
1. May be bot protection blocking n8n
2. May be rate limiting on rapid requests
3. Try accessing the URL manually to verify

### Sitemap not loading
1. Check sitemap.xml exists and is accessible
2. Verify sitemap format is valid XML
3. Site may be down

## Response Playbook

When you receive a broken link alert:

1. **Verify the broken links** by clicking them manually
2. **Categorize the issue:**
   - **Deleted page:** Create redirect or update links
   - **Moved page:** Update sitemap and add redirect
   - **Server error:** Check server logs, may need code fix
   - **Temporary:** Re-run check in an hour
3. **Fix the issue** (update content, add redirect, fix code)
4. **Re-run workflow manually** to confirm fix
5. **Update sitemap** if pages were removed

## Related

- [SSL Certificate Monitor](README-ssl-certificate-monitor.md) - Checks certificate expiration
- [Uptime Monitor](README.md#uptime-monitor) - Checks if site is accessible
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns website health
