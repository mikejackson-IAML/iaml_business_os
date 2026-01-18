# Capacity Tracker

> **CEO Summary:** This workflow runs every hour to calculate how many emails we can still send today across all our domains. It alerts us via Slack when we hit 90% capacity so we don't accidentally exceed limits and damage domain reputation.

## Overview

```
Schedule (Hourly)
       │
       ▼
 Smartlead API ──► Fetch All Email Accounts
       │
       ▼
 Extract capacity data per account
       │
       ▼
 Update domains table with sent counts
       │
       ▼
 Aggregate totals (capacity, used, remaining)
       │
       ▼
 Upsert to sending_capacity table
       │
       ▼
 Check utilization ──► If >90% ──► Slack Alert
       │
       ▼
 Done
```

## Schedule

- **Runs:** Every hour
- **Trigger:** Schedule

## What It Does

1. **Fetches email accounts** from Smartlead API
2. **Extracts capacity data** per account (daily limit, sent today, warmup status)
3. **Updates domains table** with current sent counts
4. **Calculates totals:**
   - Total daily capacity (sum of all active account limits)
   - Used capacity (sum of all emails sent today)
   - Available capacity (total - used)
   - Active vs warming domain counts
5. **Stores in sending_capacity table** for dashboard and historical tracking
6. **Alerts if >90% utilized** to prevent over-sending

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Utilization > 90% | Slack alert + logged to `lead_intelligence_activity` |

**Slack Alert Format:**
```
:warning: Email Capacity Alert

Utilization: 92%
Used: 920 / 1000
Remaining: 80 emails

Consider pacing outreach or adding domains.
```

## Data Flow

### Smartlead → Supabase

| Smartlead Field | Database Column |
|-----------------|-----------------|
| `sent_count_today` | `domains.sent_today` |
| `sent_count_week` | `domains.sent_this_week` |
| `max_email_per_day` | `domains.daily_limit` |
| `is_active` | Used for capacity calculation |
| `warmup_enabled` | Used for domain categorization |

### sending_capacity Table

| Column | Description |
|--------|-------------|
| `calculation_date` | Date of calculation |
| `total_daily_capacity` | Sum of all domain limits |
| `used_capacity` | Emails sent today |
| `available_capacity` | Remaining capacity |
| `active_domains` | Count of fully active domains |
| `warming_domains` | Count of domains in warmup |
| `utilization_percent` | (used / total) * 100 |

## Setup

### Prerequisites

1. **Smartlead API Key** must be set in n8n environment as `SMARTLEAD_API_KEY`
2. **Supabase Postgres credential** with ID `EgmvZHbvINHsh6PR`
3. **domains table** and **sending_capacity table** must exist

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `capacity-tracker.json`
3. Verify the Postgres credential is connected
4. Activate the workflow

## Monitoring

### Check current capacity

```sql
SELECT
  calculation_date,
  total_daily_capacity,
  used_capacity,
  available_capacity,
  utilization_percent,
  active_domains,
  warming_domains
FROM sending_capacity
WHERE calculation_date = CURRENT_DATE
ORDER BY calculated_at DESC
LIMIT 1;
```

### Check capacity trend

```sql
SELECT
  calculation_date,
  MAX(total_daily_capacity) as max_capacity,
  MAX(used_capacity) as peak_usage,
  MAX(utilization_percent) as peak_utilization
FROM sending_capacity
WHERE calculation_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY calculation_date
ORDER BY calculation_date;
```

## Related

- [Domain Health Sync](README-domain-health-sync.md) - Updates domain health scores
- [Smartlead Inbox Sync](README-smartlead-inbox-sync.md) - Syncs inbox-level data
- [Lead Intelligence Department](../departments/lead-intelligence/DEPARTMENT.md) - Owns capacity planning
