# Plan 08-05 Summary: Duplicate Detection and Priority Escalation

**Completed:** 2026-01-24
**Status:** COMPLETE

## What Was Built

### Database Functions (Task 1)

Created migration `supabase/migrations/20260124_alert_dedupe_functions.sql` with three functions:

1. **`action_center.check_alert_dedupe(alert_type, affected_resource, severity)`**
   - Returns structured result: `is_duplicate`, `existing_task_id`, `existing_priority`, `should_escalate`, `new_priority`, `reason`
   - Checks for open/in_progress/waiting tasks with same dedupe key
   - Respects cooldown period for completed tasks (configurable per alert type)
   - Respects dismissal window for dismissed tasks (default 7 days)
   - Calculates whether to escalate based on severity comparison

2. **`action_center.escalate_task_priority(task_id, new_priority, reason)`**
   - Updates task priority
   - Logs activity to `task_activity` with `source: 'alert_escalation'`
   - Records old and new priority values for audit trail

3. **`action_center.build_alert_dedupe_key(alert_type, affected_resource)`**
   - Immutable function that standardizes dedupe key format: `{alert_type}:{affected_resource}`

### Workflow Updates (Task 2)

Updated `business-os/workflows/alert-to-task.json`:

1. **`check-dedupe` node**: Now calls `check_alert_dedupe()` function instead of inline SQL query
2. **`dedupe-handler` node**: Simplified to use the function's structured output
3. **`escalate-priority` node**: Now calls `escalate_task_priority()` which also logs activity

## Dedupe Key Format

```
{alert_type}:{affected_resource}
```

Examples:
- `ssl_expiry:example.com`
- `uptime_down:api.example.com/health`
- `payment_failed:inv-12345`

## Priority Escalation Logic

| New Severity | Existing Priority | Action |
|--------------|-------------------|--------|
| critical | any | Escalate to `critical` |
| warning | low, normal | Escalate to `high` |
| warning | high, critical | No escalation |
| info | any | No escalation |

## Cooldown Behavior

| Task Status | Behavior |
|-------------|----------|
| `open`, `in_progress`, `waiting` | Duplicate detected, escalate if higher severity |
| `done` (within cooldown) | Duplicate detected, skip (cooldown from `alert_config.cooldown_after_completion_hours`) |
| `dismissed` (within window) | Duplicate detected, skip (window from `alert_config.dismissed_cooldown_days`) |
| No matching task | Not a duplicate, create new task |

## Must-Have Requirements Met

- [x] `check_alert_dedupe` checks open/in_progress/waiting tasks, completed tasks in cooldown, dismissed tasks in window
- [x] `should_escalate` returns true when new alert severity is higher than existing task priority
- [x] `escalate_task_priority` updates priority and logs activity with `alert_escalation` source
- [x] Dedupe key format: `alert_type:affected_resource`

## Files Modified

| File | Changes |
|------|---------|
| `supabase/migrations/20260124_alert_dedupe_functions.sql` | Created - 3 functions |
| `business-os/workflows/alert-to-task.json` | Updated dedupe nodes |

## Commits

1. `feat(08-05): add deduplication functions for alert-to-task`
2. `fix(08-05): update workflow to use dedupe database functions`

## Next Steps

Plan 08-06 will implement business hours due date calculation for alert-generated tasks.
