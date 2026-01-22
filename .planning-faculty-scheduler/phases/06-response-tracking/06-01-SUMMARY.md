# 06-01 Summary: Database Migration - Add viewed_at Column and Update Views

## Completed: 2026-01-22

## What Was Built

Added response tracking infrastructure to the Faculty Scheduler database schema:

1. **viewed_at Column** - Added to `faculty_scheduler.notifications` table to track when instructors first click their magic links
2. **Index** - Created `idx_notifications_viewed_at` for efficient filtering of viewed vs not-viewed notifications
3. **record_notification_view() Function** - Helper function that records first view timestamp; only updates on first click (WHERE viewed_at IS NULL)
4. **not_responded_instructors View** - Updated to include `viewed_at` column and re-ordered to show Not Viewed instructors first
5. **dashboard_summary_stats View** - Updated to include `total_viewed` count for analytics

## Files Modified

| File | Change |
|------|--------|
| `supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql` | New migration file |

## Verification Checklist

- [x] Migration file exists at `supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql`
- [x] `viewed_at` column added to `faculty_scheduler.notifications` table
- [x] Index created on `viewed_at` column
- [x] `record_notification_view()` function only updates first view (viewed_at IS NULL)
- [x] `not_responded_instructors` view includes `viewed_at` column
- [x] View sorts Not Viewed instructors first (viewed_at IS NULL first)
- [x] `dashboard_summary_stats` includes `total_viewed` count

## Requirements Addressed

| Requirement | Status |
|-------------|--------|
| RT-02: Notification record has viewed_at column that gets updated on first magic link click | Done |
| RT-03: not_responded_instructors view includes viewed_at for dashboard display | Done |
| Dashboard stats include viewed count for analytics | Done |

## Commits

1. `feat(06-01): create migration file with header`
2. `feat(06-01): add viewed_at column to notifications table`
3. `feat(06-01): create record_notification_view() helper function`
4. `feat(06-01): update not_responded_instructors view with viewed_at`
5. `feat(06-01): update dashboard_summary_stats with total_viewed count`

## Next Steps

Plan 06-02 will integrate the view recording into the Faculty Portal:
- Update `validate_magic_token()` or token validation endpoint to call `record_notification_view()`
- Ensure views are recorded before instructors see available programs

## Technical Notes

- The `record_notification_view()` function uses an UPDATE with subquery pattern to ensure only the first click is recorded
- The function accepts optional `p_scheduled_program_id` to record views for specific programs
- The `not_responded_instructors` view now sorts with `n.viewed_at IS NOT NULL` (false first = NULL first)
- The `total_viewed` metric in dashboard_summary_stats counts distinct instructors, not total notifications
