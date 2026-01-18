# Page Speed Monitor

> **CEO Summary:** This workflow runs every 4 hours to check if key pages on iaml.com are loading fast enough. It tests 5 important pages (homepage, top programs, about, faculty) and alerts if any page takes more than 3 seconds to load. Quick check for major slowdowns.

## Overview

```
Schedule (Every 4 hours)
       │
       ▼
 Get Pages (5 key URLs)
       │
       ▼
 Check Each Page (HTTP request)
       │
       ▼
 Analyze Results
       │
       ▼
 Slow Pages? (> 3000ms)
       │
       ├── No ──► All Fast (silent)
       │
       └── Yes ──► Slack Alert
                   │
                   └── Email Alert
```

## Schedule

- **Runs:** Every 4 hours
- **Trigger:** Schedule

## What It Does

1. **Tests 5 key pages:**
   - https://www.iaml.com/
   - https://www.iaml.com/programs/employment-law-update
   - https://www.iaml.com/programs/advanced-employment-law
   - https://www.iaml.com/about
   - https://www.iaml.com/faculty
2. **Measures load time** for each page (HTTP response time)
3. **Identifies slow pages** (> 3 seconds)
4. **Alerts** if any page exceeds threshold

## Pages Monitored

| Page | Why |
|------|-----|
| Homepage | Most visited, first impression |
| Employment Law Update | Top program |
| Advanced Employment Law | Top program |
| About | Key info page |
| Faculty | Key info page |

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Any page > 3000ms | Slack alert + email alert |
| Any page returns error | Slack alert + email alert |
| All pages < 3000ms | No alert (silent success) |

**Slack Alert Format:**
```
Page Speed Alert: Slow Pages Detected

Pages Checked: 5
Slow Pages: 2
Avg Load Time: 2450ms

Slow Pages:
• https://www.iaml.com/programs/employment-law-update (3200ms)
• https://www.iaml.com/faculty (4100ms)

Threshold: 3000ms
```

## Setup

### Prerequisites

1. **Slack webhook** configured
2. **SendGrid API** for email alerts

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `page-speed-monitor.json`
3. Workflow is self-contained
4. Activate the workflow

**n8n Workflow ID:** `H2H172J1WS9poTfl`

## Configuration

To change monitored pages, edit the "Get Pages" code node:

```javascript
const pages = [
  "https://www.iaml.com/",
  "https://www.iaml.com/programs/employment-law-update",
  // Add or remove pages here
];
```

To change threshold, edit the `SLOW_THRESHOLD_MS` constant in the "Analyze Results" node.

## Difference from Lighthouse Auditor

| Aspect | Page Speed Monitor | Lighthouse Auditor |
|--------|-------------------|-------------------|
| Frequency | Every 4 hours | Daily |
| Depth | Simple load time | Full Lighthouse audit |
| Pages | 5 key pages | Homepage only |
| Purpose | Quick health check | Deep analysis |

## Related

- [Lighthouse Auditor](README-lighthouse-auditor.md) - Deep performance analysis
- [Uptime Monitor](README.md#uptime-monitor) - Site availability
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns performance
