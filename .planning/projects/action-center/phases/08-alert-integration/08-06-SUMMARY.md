# 08-06 Summary: Business Hours Due Date Calculation

## What Was Built

Added business-hours aware due date calculation for alert-generated tasks, ensuring critical alerts received after business hours are due the next business day at 9am rather than immediately.

## Files Changed

| File | Change |
|------|--------|
| `supabase/migrations/20260124_due_date_calculation.sql` | Created - Due date calculation functions |
| `business-os/workflows/alert-to-task.json` | Modified - Added due date calculation nodes |

## Implementation Details

### Database Functions

1. **`calculate_alert_due_date(severity, metadata, timezone)`**
   - Returns `(due_date, due_time, reasoning)` tuple
   - Critical alerts:
     - Before 6pm on weekday: due today (no specific time)
     - After 6pm or weekend: due next business day 9am
   - Warning alerts:
     - Uses `metadata.due_offset_days` if provided
     - Defaults to end of week (Friday 5pm)
   - Info alerts: no due date

2. **`map_severity_to_priority(severity)`**
   - critical -> critical
   - warning -> high
   - info -> low
   - default -> normal

### Workflow Changes

Added two new nodes to the alert-to-task workflow:

1. **Calculate Due Date** - Postgres node calling the database function
2. **Merge Due Date Result** - Code node merging results with payload

Updated **Map Department** node to use priority mapping based on severity.

## Must-Have Verification

| Requirement | Status |
|-------------|--------|
| Critical alerts after 6pm due next business day 9am | Implemented |
| Weekend critical alerts skip to Monday | Implemented |
| Warning alerts default to Friday if no metadata | Implemented |
| Severity to priority mapping correct | Implemented |

## Test Scenarios

The following scenarios should be tested after deployment:

1. Critical alert at 2pm weekday -> due today, no time
2. Critical alert at 7pm weekday -> due tomorrow 9am
3. Critical alert on Saturday -> due Monday 9am
4. Critical alert on Friday 7pm -> due Monday 9am
5. Warning alert on Monday -> due Friday 5pm
6. Warning alert with `metadata.due_offset_days = 1` -> due tomorrow 5pm
7. Info alert -> no due date

## Commits

1. `feat(08-06): add business hours due date calculation functions`
2. `feat(08-06): add due date calculation nodes to alert-to-task workflow`
