# Faculty Scheduler - Dashboard Alerts

> **CEO Summary:** Automatically checks for programs at risk and unresponsive VIP instructors, keeping dashboard alerts up-to-date so nothing falls through the cracks.

## What It Does

The alert system detects two critical situations:

1. **Tier Ending Alerts (Critical)** - Programs with open blocks where the current tier ends within 24 hours. These need immediate attention to fill remaining spots.

2. **VIP Non-Response Alerts (Warning)** - VIP instructors who were notified 3+ days ago but haven't viewed their notification. Personal outreach may be needed.

### Two-Pronged Refresh Strategy

The system uses a dual approach to keep alerts fresh:

1. **On-Demand Refresh** - The dashboard calls `refresh_alerts()` every time alerts are loaded. This ensures alerts are always current when viewing the dashboard.

2. **Periodic Refresh (Optional)** - An n8n workflow runs every 15 minutes to catch time-based conditions that become true between dashboard visits. This is belt-and-suspenders coverage.

## Trigger

- **Type:** Schedule
- **Frequency:** Every 15 minutes
- **Note:** This workflow is **optional** since the dashboard queries handle on-demand refresh. The periodic workflow catches edge cases where time-based alerts become true (e.g., tier ending) without any user interaction.

## Data Flow

1. n8n schedule triggers workflow every 15 minutes
2. Execute Supabase RPC call: `SELECT * FROM faculty_scheduler.refresh_alerts()`
3. The function:
   - Creates new `tier_ending` alerts for programs with open blocks and tier ending within 24 hours
   - Creates new `vip_non_response` alerts for VIP instructors with unviewed notifications after 3 days
   - Auto-resolves alerts when conditions change (blocks filled, notification viewed, etc.)
4. Log results (created_count, resolved_count, active_count)
5. On error: Send Slack alert to #workflow-alerts

## Why Periodic Refresh

The periodic workflow exists because some alert conditions are purely time-based:

| Condition | Example |
|-----------|---------|
| Tier deadline approaches | Program was fine yesterday, but tier ends in 23 hours now |
| VIP silence threshold hit | Notification was only 2 days old, now it's 3 days old |

Without periodic refresh, these alerts would only appear when someone loads the dashboard. The 15-minute cadence ensures alerts are detected promptly regardless of dashboard activity.

## When to Skip the n8n Workflow

You may not need this workflow if:
- The dashboard is checked frequently (multiple times per day)
- Alert timeliness within 15 minutes isn't critical
- You want to minimize n8n workflow count

The dashboard will still generate all alerts on load - they just won't be created until someone visits.

## Integrations

| Service | Purpose |
|---------|---------|
| Supabase | Execute `refresh_alerts()` function, stores alert data |
| Slack | Error alerts via Canary pattern |

## n8n Workflow Design

### Nodes

| Node | Type | Purpose |
|------|------|---------|
| Schedule Trigger | Schedule | Fires every 15 minutes |
| Refresh Alerts | Postgres (RPC) | Calls `faculty_scheduler.refresh_alerts()` |
| Log Results | Set | Formats results for logging |
| Check Results | IF | Checks if any alerts created |
| Success Log | Postgres | Logs to dashboard if enabled |
| Error Handler | Canary | Standard error handling pattern |
| Slack Alert | Slack | Notifies on errors |

### Workflow JSON Structure

```json
{
  "name": "Faculty Scheduler - Alert Refresh",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": {
          "interval": [{ "field": "minutes", "minutesInterval": 15 }]
        }
      }
    },
    {
      "name": "Refresh Alerts",
      "type": "n8n-nodes-base.postgres",
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT * FROM faculty_scheduler.refresh_alerts();"
      }
    }
  ]
}
```

## Supabase Functions Used

- `faculty_scheduler.refresh_alerts()` - Main function that creates/resolves alerts
- `faculty_scheduler.get_alert_threshold(key)` - Reads configurable thresholds

## Configuration

Thresholds are stored in `n8n_brain.preferences`:

| Key | Default | Description |
|-----|---------|-------------|
| `tier_ending_alert_hours` | 24 | Hours before tier end to trigger alert |
| `vip_non_response_days` | 3 | Days without view before alerting |

To change a threshold:
```sql
UPDATE n8n_brain.preferences
SET value = '48'
WHERE category = 'faculty_scheduler'
  AND key = 'tier_ending_alert_hours';
```

## Alerts

- **Error handling:** Canary pattern logs errors to `n8n_brain.workflow_errors` and sends Slack alert
- **Slack channel:** #workflow-alerts

## Related

- [Faculty Scheduler - Cancellation Re-release](./README-faculty-scheduler-rerelease.md)
- [Faculty Scheduler Dashboard](../../dashboard/src/app/dashboard/faculty-scheduler/page.tsx)
- Phase 8 Migration: `supabase/migrations/20260122_faculty_scheduler_phase8_alerts.sql`
- Phase 8 Plans: `.planning-faculty-scheduler/phases/08-dashboard-alerts/`
