-- Action Center Phase 10: Notification Preferences and Task Count RPC
-- Migration: Add notification columns to profiles, create task count RPC
-- Date: 2026-01-25

-- ============================================
-- NOTIFICATION PREFERENCE COLUMNS ON PROFILES
-- ============================================

-- Add notification preference columns to existing profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_daily_digest BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notification_digest_time TIME DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS notification_critical_alerts BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago';

-- ============================================
-- INDEX FOR DUE DATE QUERIES (if not exists)
-- ============================================

-- Composite index for efficient task count queries
-- Includes status and due_date for filtering active tasks by date
CREATE INDEX IF NOT EXISTS idx_tasks_status_due_date
  ON action_center.tasks(status, due_date);

-- Composite index for priority and status (for critical count)
CREATE INDEX IF NOT EXISTS idx_tasks_priority_status
  ON action_center.tasks(priority, status);

-- ============================================
-- RPC FUNCTION: get_task_counts
-- Returns task counts for dashboard widget and nav badge
-- ============================================

CREATE OR REPLACE FUNCTION action_center.get_task_counts()
RETURNS JSON AS $$
DECLARE
  result JSON;
  v_critical_count INTEGER;
  v_due_today_count INTEGER;
  v_overdue_count INTEGER;
  v_total_active_count INTEGER;
BEGIN
  -- Critical count: tasks with priority = 'critical' and not done/dismissed
  SELECT COUNT(*) INTO v_critical_count
  FROM action_center.tasks
  WHERE priority = 'critical'
    AND status NOT IN ('done', 'dismissed');

  -- Due today count: tasks due today that are not done/dismissed
  SELECT COUNT(*) INTO v_due_today_count
  FROM action_center.tasks
  WHERE due_date = CURRENT_DATE
    AND status NOT IN ('done', 'dismissed');

  -- Overdue count: tasks past due_date that are not done/dismissed
  SELECT COUNT(*) INTO v_overdue_count
  FROM action_center.tasks
  WHERE due_date < CURRENT_DATE
    AND status NOT IN ('done', 'dismissed');

  -- Total active count: all tasks not done/dismissed
  SELECT COUNT(*) INTO v_total_active_count
  FROM action_center.tasks
  WHERE status NOT IN ('done', 'dismissed');

  -- Build result JSON
  result := json_build_object(
    'critical_count', v_critical_count,
    'due_today_count', v_due_today_count,
    'overdue_count', v_overdue_count,
    'total_active_count', v_total_active_count,
    'badge_count', v_critical_count + v_overdue_count,
    'generated_at', NOW()
  );

  RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

-- Profiles table notification columns
COMMENT ON COLUMN public.profiles.notification_daily_digest IS 'Whether to send daily digest email with task summary';
COMMENT ON COLUMN public.profiles.notification_digest_time IS 'Time of day to send daily digest (in user timezone)';
COMMENT ON COLUMN public.profiles.notification_critical_alerts IS 'Whether to send immediate alerts for critical tasks';
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone for scheduling notifications (IANA format)';

-- RPC function
COMMENT ON FUNCTION action_center.get_task_counts() IS 'Returns JSON with task counts: critical_count, due_today_count, overdue_count, total_active_count, badge_count (critical + overdue)';
