# Smartlead Inbox Sync Workflow

Syncs email account data from Smartlead into the `email_inboxes` table for the Lead Intelligence dashboard.

## Overview

```
Schedule (Every 4 hours)
         │
         ▼
  Smartlead API ──► Fetch Email Accounts
         │
         ▼
  Smartlead API ──► Fetch Warmup Stats (per account)
         │
         ▼
   Transform & Calculate Health
         │
         ▼
   Supabase ──► Upsert email_inboxes
         │
         ▼
   Supabase ──► Log inbox_health_log
         │
         ▼
   Check for Issues ──► Slack Alert (if problems)
         │
         ▼
   Log sync_completed activity
```

## Workflow File

`business-os/workflows/smartlead-inbox-sync.json`

## Schedule

- **Runs:** Every 4 hours
- **Manual trigger:** Available for on-demand sync

## Setup

### 1. Configure Smartlead Credential

The workflow uses an **HTTP Query Auth** credential to authenticate with Smartlead.

1. Go to n8n → **Credentials** → Find **"Smartlead API Key"** (ID: `a8mXHIaPChJTGO6S`)
2. Click **Edit**
3. Set the **Value** to your Smartlead API key
   - Find your API key in Smartlead → Settings → API
4. Save the credential

This credential can be reused across all Smartlead workflows.

### 2. Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `smartlead-inbox-sync.json`
3. Verify credentials:
   - Postgres credential ID: `EgmvZHbvINHsh6PR` (Supabase Postgres)
   - HTTP Query Auth credential ID: `a8mXHIaPChJTGO6S` (Smartlead API Key)
4. Activate the workflow

**Note:** The workflow is already imported as ID `8IBiLLAIHgSt2xWs`

### 3. Database Prerequisites

Ensure the `email_inboxes` and `inbox_health_log` tables exist:

```sql
-- Run if not already applied:
-- supabase/migrations/20260115_create_email_inboxes_schema.sql
```

## Data Flow

### Smartlead API → email_inboxes

| Smartlead Field | Database Column |
|-----------------|-----------------|
| `id` | `smartlead_account_id` |
| `from_email` | `inbox_email` |
| `from_name` | `display_name` |
| `message_per_day` | `daily_limit` |
| `daily_sent_count` | `sent_today` |
| `is_smtp_success` + `is_imap_success` | `is_connected` |
| `smtp_failure_error` / `imap_failure_error` | `last_error` |
| `warmup_details.status` | `warmup_enabled` |
| `warmup_details.warmup_reputation` | Used for health calculation |
| `warmup_details.total_spam_count` / `total_sent_count` | `spam_rate` |
| `warmup_details.reply_rate` | `reply_rate` |

### Status Calculation

```
status =
  - 'disconnected' if !is_connected
  - 'warming' if warmup_enabled
  - 'active' otherwise
```

### Health Score Calculation

```
health_score =
  (is_connected ? 40 : 0) +
  (warmup_reputation * 0.4) +
  (is_warmup_blocked ? 0 : 20)

Range: 0-100
```

## Alerts

The workflow generates alerts for:

| Condition | Alert Type | Slack Message |
|-----------|------------|---------------|
| `is_connected = false` | `inbox_disconnected` | Disconnection warning |
| `health_score < 50` | `inbox_health_warning` | Low health warning |
| `is_warmup_blocked = true` | `inbox_health_critical` | Warmup blocked alert |

Alerts are:
1. Logged to `lead_intelligence_activity` table
2. Sent to Slack webhook

## Monitoring

### Check recent syncs

```sql
SELECT
  activity_type,
  description,
  metadata,
  activity_at
FROM lead_intelligence_activity
WHERE source_name = 'smartlead_sync'
ORDER BY activity_at DESC
LIMIT 10;
```

### Check inbox health trends

```sql
SELECT
  i.inbox_email,
  h.log_date,
  h.health_score,
  h.spam_rate,
  h.status
FROM inbox_health_log h
JOIN email_inboxes i ON i.id = h.inbox_id
WHERE h.log_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY i.inbox_email, h.log_date DESC;
```

### Check problem inboxes

```sql
SELECT
  inbox_email,
  status,
  health_score,
  is_connected,
  last_error,
  warmup_enabled,
  updated_at
FROM email_inboxes
WHERE status = 'disconnected'
   OR health_score < 70
ORDER BY health_score;
```

## Troubleshooting

### No data syncing

1. Check n8n workflow is active
2. Verify `SMARTLEAD_API_KEY` environment variable is set
3. Check workflow execution history for errors
4. Verify Smartlead API key is valid

### Missing inboxes

1. Check if inbox exists in Smartlead
2. Verify domain exists in `domains` table (required for domain_id FK)
3. Check for API pagination (workflow fetches first 100 accounts)

### Health scores seem wrong

1. Health relies on warmup stats - inboxes without warmup enabled may show 0 reputation
2. Check `warmup_details` in Smartlead for the account
3. Verify warmup is enabled for accurate metrics

## Related Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260115_create_email_inboxes_schema.sql` | Database schema |
| `dashboard/src/app/dashboard/leads/components/inbox-performance-table.tsx` | Dashboard UI |
| `dashboard/src/lib/api/lead-intelligence-queries.ts` | API queries |
| `business-os/workflows/domain-health-sync.json` | Related domain sync workflow |
