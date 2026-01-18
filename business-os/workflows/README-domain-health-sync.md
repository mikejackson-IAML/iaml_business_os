# Domain Health Sync

> **CEO Summary:** This workflow runs daily at 6am to check the health of all our email domains. It pulls data from Smartlead, checks blacklists, calculates health scores, and alerts us via Slack if any domain drops below 70% health. Critical for maintaining email deliverability.

## Overview

```
Schedule (Daily 6am)
       │
       ├──► Fetch Email Accounts (Smartlead)
       │
       ├──► Fetch Domain Health Data (Smartlead)
       │
       ▼
 Merge Data
       │
       ▼
 Transform Domain + Inbox Data
       │
       ▼
 Check Blacklists (MXToolbox)
       │
       ▼
 Calculate Health Scores
       │
       ├──► Upsert to domains table ──► Log to domain_health_log ──► Alert if <70%
       │
       └──► Upsert to email_inboxes ──► Log to inbox_health_log ──► Alert if issues
```

## Schedule

- **Runs:** Daily at 6:00 AM
- **Trigger:** Schedule

## What It Does

1. **Fetches email accounts** and domain health data from Smartlead
2. **Checks blacklists** via MXToolbox API for each domain
3. **Calculates health scores** based on:
   - Bounce rate (30% weight)
   - Spam rate (30% weight)
   - Blacklist status (20% weight)
   - Open rate (20% weight)
4. **Updates domains table** with current health data
5. **Logs history** to domain_health_log for trend tracking
6. **Updates email_inboxes** with inbox-specific metrics
7. **Alerts** if domain health drops below 70% or inbox has issues

## Health Score Calculation

### Domain Health Score

```
health_score =
  (100 - bounce_rate * 10) * 0.30 +    // Bounce rate impact
  (100 - spam_rate * 20) * 0.30 +      // Spam rate impact
  (blacklist_clear ? 100 : 0) * 0.20 + // Blacklist check
  open_rate * 0.20                      // Engagement signal

Range: 0-100
```

### Inbox Health Score

```
inbox_health =
  (100 - bounce_rate * 10) * 0.30 +
  (100 - spam_rate * 20) * 0.30 +
  (reply_rate * 2) * 0.20 +            // Reply engagement
  (is_connected ? 100 : 0) * 0.20      // Connection status

Range: 0-100
```

## Alerts

| Condition | Alert Type | Channel |
|-----------|------------|---------|
| Domain health < 70 | `domain_health_warning` | Slack + activity log |
| Inbox health < 70 | `inbox_health_warning` | Slack + activity log |
| Inbox disconnected | `inbox_disconnected` | Slack + activity log |
| Bounce rate > 5% | `inbox_health_critical` | Slack + activity log |

**Slack Domain Alert Format:**
```
:warning: Domain Health Alert

Domain: example-iaml.com
Health Score: 65/100
Bounce Rate: 4.2%
Spam Rate: 1.1%

Review in Lead Intelligence Dashboard.
```

## Data Flow

### Smartlead → Supabase

| Smartlead Field | Database Table | Column |
|-----------------|----------------|--------|
| `from_email` domain | `domains` | `domain_name` |
| `warmup_enabled` | `domains` | `status` (warming/active) |
| `max_email_per_day` | `domains` | `daily_limit` |
| `warmup_details.warmup_day` | `domains` | `warmup_day` |
| `bounce_rate` | `domains` | `bounce_rate` |
| `spam_rate` | `domains` | `spam_rate` |
| `open_rate` | `domains` | `open_rate` |
| Health calculation | `domains` | `health_score` |
| All fields | `email_inboxes` | Multiple columns |

## Setup

### Prerequisites

1. **Smartlead API Key** in n8n environment as `SMARTLEAD_API_KEY`
2. **MXToolbox API Key** in n8n environment as `MXTOOLBOX_API_KEY` (optional, for blacklist checks)
3. **Supabase credentials:**
   - Postgres: `EgmvZHbvINHsh6PR`
   - Supabase API: `3CPchaCatw5WmkUQ`
4. **Database tables:** `domains`, `domain_health_log`, `email_inboxes`, `inbox_health_log`

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `domain-health-sync.json`
3. Verify all credentials are connected
4. Activate the workflow

## Monitoring

### Check domain health

```sql
SELECT
  domain_name,
  status,
  health_score,
  bounce_rate,
  spam_rate,
  open_rate,
  updated_at
FROM domains
ORDER BY health_score ASC
LIMIT 10;
```

### Check health trends

```sql
SELECT
  d.domain_name,
  dh.log_date,
  dh.health_score,
  dh.bounce_rate,
  dh.spam_rate
FROM domain_health_log dh
JOIN domains d ON d.id = dh.domain_id
WHERE dh.log_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY d.domain_name, dh.log_date;
```

### Find problem domains

```sql
SELECT
  domain_name,
  status,
  health_score,
  bounce_rate,
  spam_rate
FROM domains
WHERE health_score < 70
   OR bounce_rate > 3
   OR spam_rate > 1
ORDER BY health_score;
```

## Troubleshooting

### No data syncing
1. Check n8n workflow is active
2. Verify Smartlead API key is valid
3. Check workflow execution history for errors

### Health scores seem wrong
1. Blacklist check may fail silently - check MXToolbox API status
2. Warmup inboxes without data will show lower scores initially
3. Check Smartlead dashboard for comparison

### Blacklist check failing
1. MXToolbox API has rate limits
2. Workflow configured to continue on error (won't block sync)
3. Check if API key is valid

## Related

- [Smartlead Inbox Sync](README-smartlead-inbox-sync.md) - More frequent inbox sync
- [Capacity Tracker](README-capacity-tracker.md) - Tracks sending capacity
- [Lead Intelligence Department](../departments/lead-intelligence/DEPARTMENT.md) - Owns domain health
