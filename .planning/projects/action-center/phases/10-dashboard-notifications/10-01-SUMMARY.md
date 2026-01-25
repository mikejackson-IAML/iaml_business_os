# Plan 10-01 Summary: Database Migration for Notification Preferences and Task Count RPC

## Status: COMPLETE

## What Was Built

### 1. Notification Preference Columns on `public.profiles`

Added four new columns to the existing profiles table:
- `notification_daily_digest` (BOOLEAN, default TRUE) - Controls daily digest email
- `notification_digest_time` (TIME, default '07:00') - Preferred send time
- `notification_critical_alerts` (BOOLEAN, default TRUE) - Controls immediate alerts
- `timezone` (TEXT, default 'America/Chicago') - User's IANA timezone

### 2. RPC Function `action_center.get_task_counts()`

Created an efficient RPC function that returns JSON with:
- `critical_count` - Tasks with priority='critical' not done/dismissed
- `due_today_count` - Tasks due today not done/dismissed
- `overdue_count` - Tasks past due_date not done/dismissed
- `total_active_count` - All tasks not done/dismissed
- `badge_count` - Sum of critical_count + overdue_count (for nav badge)
- `generated_at` - Timestamp for caching purposes

### 3. Performance Indexes

Added two composite indexes for efficient task count queries:
- `idx_tasks_status_due_date` - For due_today and overdue queries
- `idx_tasks_priority_status` - For critical count queries

## Files Created/Modified

| File | Action |
|------|--------|
| `supabase/migrations/20260125_notification_prefs_task_counts.sql` | Created |

## Verification Checklist

- [x] Migration file created at correct path
- [x] Profiles table has all 4 notification columns with correct defaults
- [x] `action_center.get_task_counts()` returns expected JSON structure
- [x] Existing profiles will receive default notification preferences
- [x] Indexes exist for efficient due_date and priority queries
- [x] Documentation comments added for all new objects

## Usage Examples

### Query task counts
```sql
SELECT action_center.get_task_counts();
-- Returns: {"critical_count": 2, "due_today_count": 5, "overdue_count": 1, "total_active_count": 15, "badge_count": 3, "generated_at": "2026-01-25T..."}
```

### Update notification preferences
```sql
UPDATE public.profiles
SET notification_daily_digest = false,
    notification_digest_time = '09:00',
    timezone = 'America/New_York'
WHERE id = 'user-uuid';
```

## Notes

- Function uses `SECURITY DEFINER` to allow access regardless of RLS policies
- Function is marked `STABLE` for query optimizer hints
- All counts exclude tasks with status 'done' or 'dismissed'
- Badge count (critical + overdue) is pre-calculated for efficiency
