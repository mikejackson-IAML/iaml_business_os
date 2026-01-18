# Knowledge Staleness Alerts

> **CEO Summary:** This workflow sends a weekly email (Monday 9 AM) listing knowledge base entries that need review: decisions past their review date, constraints not verified in 90+ days, and tribal knowledge not verified in 180+ days. Keeps institutional knowledge accurate.

## Overview

```
Triggers:
├── Weekly Monday 9am scheduled
└── Webhook (on-demand)
       │
       ├──► Get Stale Decisions
       ├──► Get Stale Constraints
       ├──► Get Stale Tribal Knowledge
       └──► Get Knowledge Stats
              │
              ▼
        Has Stale Knowledge?
              │
              ├── No ──► Skip (no email)
              │
              └── Yes ──► Generate Email HTML
                          │
                          ▼
                    Send via SendGrid
```

## Schedule

- **Weekly:** Monday at 9:00 AM
- **On-demand:** POST to `/webhook/knowledge-staleness-check`

## What It Does

1. **Finds stale decisions:**
   - Active decisions past their `review_date`
   - Shows days overdue
2. **Finds stale constraints:**
   - Constraints not verified in 90+ days
   - Technical/business constraints may become outdated
3. **Finds stale tribal knowledge:**
   - Tribal knowledge not verified in 180+ days
   - Institutional wisdom needs periodic validation
4. **Generates email** with items needing review
5. **Includes knowledge stats** for overview

## Staleness Thresholds

| Knowledge Type | Threshold | Rationale |
|----------------|-----------|-----------|
| Decisions | Past review_date | Explicit review date set |
| Constraints | 90 days | Technical constraints change frequently |
| Tribal | 180 days | Institutional knowledge changes slowly |

## Email Contents

### Summary Section
- Total items needing review
- Breakdown by type (decisions, constraints, tribal)

### Decisions Section
- Title and domain
- Review date and days overdue

### Constraints Section
- Title, domain, and constraint type
- Last verified date and days since

### Tribal Section
- Title, domain, and knowledge type
- Last verified date and days since

### Knowledge Stats
- Overview of total knowledge items by category

## Status

**Currently: Inactive**

Needs:
- Supabase Postgres credential ID updated
- SendGrid credential ID updated
- Knowledge schema deployed

## Setup

### Prerequisites

1. **Supabase tables:**
   - `knowledge.decisions`
   - `knowledge.constraints`
   - `knowledge.tribal`
   - `knowledge.stats` view
2. **SendGrid API credential** in n8n

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `knowledge-staleness-alerts.json`
3. Update credential IDs:
   - Replace `SUPABASE_CREDENTIAL_ID` with actual ID
   - Replace `SENDGRID_CREDENTIAL_ID` with actual ID
4. Activate the workflow

### Webhook URL

For on-demand check:
```
POST https://n8n.realtyamp.ai/webhook/knowledge-staleness-check
```

## Reviewing Stale Knowledge

When you receive an alert, use the `/knowledge` command:

```
# Review and update a decision
/knowledge review decision "API Rate Limiting Strategy"

# Verify a constraint is still valid
/knowledge verify constraint "GHL Webhook Timeout"

# Update tribal knowledge
/knowledge update tribal "Smartlead warmup schedule"
```

## Related

- [Daily Accomplishment Email](README-daily-accomplishment-email.md) - Daily progress
- `/knowledge` skill - Manages institutional knowledge
