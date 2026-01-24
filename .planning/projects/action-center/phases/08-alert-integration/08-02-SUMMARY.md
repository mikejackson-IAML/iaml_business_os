# Plan 08-02 Summary: Alert Accumulation Tracking

## Status: COMPLETE

## What Was Built

Created the alert accumulation tracking schema to support the "3x in 24 hours" info alert rule, enabling detection when low-priority alerts accumulate enough to warrant task creation.

## Files Created

| File | Description |
|------|-------------|
| `supabase/migrations/20260124_alert_accumulation.sql` | Alert occurrences table and accumulation functions |

## Database Objects Created

### Table: `action_center.alert_occurrences`

Tracks individual alert occurrences for accumulation detection:

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| alert_type | TEXT | Alert type identifier |
| affected_resource | TEXT | Resource being alerted on (e.g., 'www.iaml.com') |
| severity | TEXT | critical/warning/info |
| original_title | TEXT | Original alert title |
| source_alert_id | TEXT | ID from originating system |
| source_system | TEXT | e.g., 'faculty_scheduler', 'ssl_monitor' |
| occurred_at | TIMESTAMPTZ | When the alert occurred |
| task_created | BOOLEAN | Whether this occurrence resulted in a task |
| task_id | UUID | References the created task if any |

### Function: `action_center.check_alert_accumulation`

Returns whether accumulation threshold has been reached:
- **Parameters:** alert_type, affected_resource, window_hours (default 24), threshold (default 3)
- **Returns:** should_create_task, occurrence_count, oldest_in_window

### Function: `action_center.record_alert_occurrence`

Logs an alert occurrence and returns accumulation status:
- **Parameters:** alert_type, affected_resource, severity, original_title, source_alert_id, source_system
- **Returns:** occurrence_id, should_create_task, occurrence_count
- Automatically checks accumulation for info alerts using config from `alert_config` table

### Function: `action_center.mark_occurrences_task_created`

Called after creating a task from accumulated alerts:
- **Parameters:** alert_type, affected_resource, task_id, window_hours
- **Returns:** Number of occurrences marked

### Function: `action_center.purge_old_alert_occurrences`

Cleanup function for maintenance (keeps 30 days of history):
- **Returns:** Number of deleted records

## Indexes Created

- `idx_alert_occurrences_lookup` - Composite index on (alert_type, affected_resource, occurred_at DESC)
- `idx_alert_occurrences_recent` - Index on occurred_at DESC for recent queries

## Must Haves Verification

| Requirement | Status |
|-------------|--------|
| alert_occurrences table with required columns | DONE |
| check_alert_accumulation returns should_create_task, occurrence_count, oldest_in_window | DONE |
| record_alert_occurrence logs and returns accumulation status | DONE |

## Commit

```
feat(08-02): add alert accumulation tracking schema
```

## Next Steps

This schema enables the alert-to-task routing logic in subsequent plans. The n8n workflow can:
1. Call `record_alert_occurrence` for each incoming alert
2. Check the returned `should_create_task` boolean
3. If true, create a task and call `mark_occurrences_task_created` to link the occurrences
