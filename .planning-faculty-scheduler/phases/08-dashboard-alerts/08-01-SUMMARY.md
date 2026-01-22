# Summary: Plan 08-01 - Database Migration for Alerts

## What Was Built

### Migration File
`supabase/migrations/20260122_faculty_scheduler_phase8_alerts.sql`

### Components Created

1. **`faculty_scheduler.alerts` table**
   - Tracks `tier_ending` and `vip_non_response` alert types
   - Columns: id, alert_type, severity, scheduled_program_id, instructor_id, notification_id, title, description, status, triggered_at, dismissed_at, dismissed_by, resolved_at
   - Unique constraint prevents duplicate active alerts per program/instructor combination

2. **`faculty_scheduler.get_alert_threshold(p_key TEXT)` function**
   - Reads configurable thresholds from `n8n_brain.preferences`
   - Defaults: `tier_ending_alert_hours` = 24, `vip_non_response_days` = 3

3. **`faculty_scheduler.refresh_alerts()` function**
   - Creates `tier_ending` alerts (critical) for programs with open blocks where current tier ends within threshold hours
   - Creates `vip_non_response` alerts (warning) for VIP instructors who haven't viewed notifications after N days
   - Auto-resolves `tier_ending` alerts when all blocks claimed or tier advances
   - Auto-resolves `vip_non_response` alerts when instructor views notification, claims block, or program stops recruiting
   - Returns: `created_count`, `resolved_count`, `active_count`

4. **`faculty_scheduler.active_alerts` view**
   - Returns only active (non-dismissed, non-resolved) alerts
   - Sorted by severity (critical first), then by triggered_at descending

5. **`faculty_scheduler.dismiss_alert(p_alert_id, p_dismissed_by)` function**
   - Marks alert as dismissed, records who dismissed it and when

6. **Configuration entries**
   - `faculty_scheduler.tier_ending_alert_hours` = 24 (in n8n_brain.preferences)
   - `faculty_scheduler.vip_non_response_days` = 3 (in n8n_brain.preferences)

7. **Indexes**
   - `idx_alerts_status` on status column
   - `idx_alerts_program` on scheduled_program_id column
   - `idx_alerts_type_status` composite on (alert_type, status)
   - `idx_alerts_unique_combo` unique partial index for preventing duplicates

## Commits

| Commit | Description |
|--------|-------------|
| `f8ba8b1` | feat(08-01): add alerts table and refresh_alerts function |

## Must-Haves Checklist

- [x] `faculty_scheduler.alerts` table exists with alert_type, severity, status, dismiss tracking
- [x] Unique constraint prevents duplicate alerts per program/instructor
- [x] `refresh_alerts()` function creates tier_ending and vip_non_response alerts
- [x] `refresh_alerts()` auto-resolves alerts when conditions change
- [x] `active_alerts` view returns only active, non-dismissed alerts
- [x] Configuration entries exist in n8n_brain.preferences for threshold values

## Deviations

None. All tasks completed as specified.

## Verification Notes

The migration is ready to be run in the Supabase SQL editor. To verify:

1. Run the migration
2. Check `alerts` table exists with all columns
3. Test `refresh_alerts()` with a program nearing tier end
4. Test `dismiss_alert()` changes status correctly
5. Verify `active_alerts` view filters correctly

## Next Steps

Proceed to Plan 08-02 (TypeScript Query Functions) which will:
- Add alert query functions to `faculty-scheduler-queries.ts`
- Create server actions for refreshing and dismissing alerts
