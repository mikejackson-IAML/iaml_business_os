# Smartlead Inbox Ramp-Up

> **CEO Summary:** This workflow runs every Monday morning to gradually increase the daily sending limits on our new email inboxes. New inboxes start at 15 emails/day and increase weekly (15 → 25 → 35 → 50) over 4 weeks. This "warming" process builds domain reputation and prevents deliverability issues.

## Overview

```
Triggers:
├── Weekly Monday 8am (scheduled)
└── Manual Trigger (on-demand)
       │
       ▼
 Get Ramp Config (current week, target limit)
       │
       ▼
 Smartlead API ──► Fetch All Email Accounts
       │
       ▼
 Filter: Current limit < target?
       │
       ├── Yes ──► Update daily limit in Smartlead
       │            │
       │            ▼
       │          Log update to activity table
       │
       └── No ──► No updates needed
       │
       ▼
 Aggregate results
       │
       ▼
 Slack Notification (summary)
```

## Schedule

- **Weekly:** Monday at 8:00 AM
- **Manual:** Available for on-demand execution

## What It Does

1. **Reads ramp configuration** from database (start date, current week)
2. **Calculates target daily limit** based on week number:
   - Week 1: 15 emails/day
   - Week 2: 25 emails/day
   - Week 3: 35 emails/day
   - Week 4+: 50 emails/day
3. **Fetches all email accounts** from Smartlead
4. **Filters accounts** that need limit increase (current < target)
5. **Updates each account** in Smartlead via API
6. **Logs each update** to `lead_intelligence_activity` table
7. **Sends Slack summary** with count of updated inboxes

## Ramp Schedule

| Week | Daily Limit | Rationale |
|------|-------------|-----------|
| 1 | 15 | Initial warmup, establish sender reputation |
| 2 | 25 | Gradual increase, monitor deliverability |
| 3 | 35 | Approaching normal volume |
| 4+ | 50 | Full sending capacity |

## Configuration

The ramp start date is stored in `n8n_brain.preferences`:

```sql
-- Check current ramp config
SELECT * FROM n8n_brain.preferences
WHERE category = 'ramp' AND key = 'inbox_ramp';

-- Set/update ramp start date
INSERT INTO n8n_brain.preferences (category, key, value)
VALUES ('ramp', 'inbox_ramp', '{"start_date": "2026-01-20"}'::jsonb)
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;
```

## Slack Notification

After each run, the workflow sends a summary:

```
:chart_with_upwards_trend: Inbox Ramp-Up Complete

Week: 2
Target Limit: 25 emails/day
Inboxes Updated: 12

All eligible inboxes have been updated to the new daily limit.
```

## Setup

### Prerequisites

1. **Smartlead API credential** with ID `a8mXHIaPChJTGO6S`
2. **Supabase Postgres credential** with ID `EgmvZHbvINHsh6PR`
3. **Ramp configuration** set in `n8n_brain.preferences` table

### Set Ramp Start Date

Before the first run, set the ramp start date:

```sql
INSERT INTO n8n_brain.preferences (category, key, value)
VALUES ('ramp', 'inbox_ramp', '{"start_date": "2026-01-20"}'::jsonb)
ON CONFLICT (category, key) DO UPDATE SET value = EXCLUDED.value;
```

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `smartlead-inbox-rampup.json`
3. Verify credentials are connected
4. Activate the workflow

## Monitoring

### Check ramp progress

```sql
SELECT
  activity_type,
  description,
  metadata->>'email' as email,
  metadata->>'old_limit' as old_limit,
  metadata->>'new_limit' as new_limit,
  metadata->>'ramp_week' as week,
  activity_at
FROM lead_intelligence_activity
WHERE source_name = 'smartlead_rampup'
ORDER BY activity_at DESC
LIMIT 20;
```

### Check current limits

```sql
SELECT
  inbox_email,
  daily_limit,
  warmup_day,
  warmup_enabled,
  status
FROM email_inboxes
WHERE warmup_enabled = true
ORDER BY warmup_day ASC;
```

## Troubleshooting

### Limits not updating
1. Check Smartlead API key is valid
2. Verify inbox isn't already at or above target limit
3. Check n8n execution history for API errors

### Wrong week calculation
1. Verify `ramp_start_date` is set correctly in preferences
2. Week is calculated as: `CEIL((today - start_date) / 7)`

### Want to restart ramp
1. Update the `start_date` in preferences to today's date
2. This will reset the week counter to 1

## Related

- [Smartlead Inbox Sync](README-smartlead-inbox-sync.md) - Syncs inbox health data
- [Domain Health Sync](README-domain-health-sync.md) - Monitors domain reputation
- [Lead Intelligence Department](../departments/lead-intelligence/DEPARTMENT.md) - Owns inbox warming strategy
