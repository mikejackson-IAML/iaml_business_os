# Daily Accomplishment Email

> **CEO Summary:** This workflow sends a daily email summary at 6 PM (Mon-Fri) with all accomplishments logged that day via the `/done` command. It groups items by impact level, shows goal progress, and helps track what's getting done. Currently inactive (needs credentials setup).

## Overview

```
Triggers:
├── Daily 6pm (Mon-Fri) scheduled
└── Webhook (on-demand)
       │
       ├──► Get Today's Entries
       │
       └──► Get Active Goals
              │
              ▼
        Has Entries?
              │
              ├── No ──► Skip (no email)
              │
              └── Yes ──► Generate Email HTML
                          │
                          ▼
                    Send via SendGrid
                          │
                          ▼
                    Log Email Summary
```

## Schedule

- **Daily:** 6:00 PM EST, Monday-Friday
- **On-demand:** POST to `/webhook/accomplishment-email`

## What It Does

1. **Fetches today's accomplishments** from `accomplishments.entries` table
2. **Fetches active goals** from `accomplishments.goals` table
3. **Groups accomplishments** by impact level (critical/high, medium, low)
4. **Generates HTML email** with:
   - Stats summary (total, high impact, goals progressed)
   - Accomplishments grouped by impact
   - Goal progress bars
5. **Sends via SendGrid** to mike.jackson@iaml.com
6. **Logs the summary** to `accomplishments.email_summaries`

## Email Contents

### Stats Section
- Total accomplishments today
- High impact items count
- Goals that progressed

### Accomplishments Section
Grouped by impact:
- **High Impact** (green) - Critical business outcomes
- **Medium Impact** (yellow) - Notable progress
- **Low Impact** (gray) - Maintenance, minor tasks

### Goals Section
- Each active goal with progress bar
- Days remaining
- Current vs target values

## Status

**Currently: Inactive**

Needs:
- Supabase Postgres credential ID updated
- SendGrid credential ID updated
- Accomplishments schema deployed

## Setup

### Prerequisites

1. **Supabase tables:**
   - `accomplishments.entries`
   - `accomplishments.goals`
   - `accomplishments.email_summaries`
   - `accomplishments.get_active_goals()` function
2. **SendGrid API credential** in n8n
3. **Slack webhook** (optional, for notifications)

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `daily-accomplishment-email.json`
3. Update credential IDs:
   - Replace `SUPABASE_CREDENTIAL_ID` with actual ID
   - Replace `SENDGRID_CREDENTIAL_ID` with actual ID
4. Activate the workflow

### Webhook URL

For on-demand summary:
```
POST https://n8n.realtyamp.ai/webhook/accomplishment-email
```

## Logging Accomplishments

Use the `/done` command in Claude Code to log accomplishments:

```
/done Completed the quarterly report with 15% revenue increase

/done Fixed critical bug in checkout flow that was blocking 5% of orders
```

## Related

- [Knowledge Staleness Alerts](README-knowledge-staleness-alerts.md) - Weekly knowledge review
- `/done` skill - Logs accomplishments
- `/goals` skill - Manages goals
