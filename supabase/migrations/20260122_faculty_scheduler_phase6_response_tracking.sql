-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 6 - Response Tracking
-- ============================================================================
-- Adds view tracking to notifications:
-- - viewed_at column on notifications table
-- - record_notification_view() helper function
-- - Updated not_responded_instructors view with viewed_at
-- - Updated dashboard_summary_stats with viewed_count
--
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- ADD VIEWED_AT COLUMN TO NOTIFICATIONS
-- ============================================================================
ALTER TABLE faculty_scheduler.notifications
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Index for filtering viewed vs not-viewed notifications
CREATE INDEX IF NOT EXISTS idx_notifications_viewed_at
ON faculty_scheduler.notifications(viewed_at);

COMMENT ON COLUMN faculty_scheduler.notifications.viewed_at IS
  'Timestamp when instructor first clicked the magic link (NULL = not yet viewed)';

-- ============================================================================
-- FUNCTION: Record Notification View
-- Called when instructor clicks magic link to record first view timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.record_notification_view(
  p_instructor_id UUID,
  p_scheduled_program_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Update the most recent tier_release notification for this instructor/program
  -- Only update if not already viewed (first click only)
  UPDATE faculty_scheduler.notifications
  SET viewed_at = NOW()
  WHERE id = (
    SELECT id
    FROM faculty_scheduler.notifications
    WHERE instructor_id = p_instructor_id
      AND (p_scheduled_program_id IS NULL OR scheduled_program_id = p_scheduled_program_id)
      AND notification_type = 'tier_release'
      AND email_status = 'sent'
      AND viewed_at IS NULL
    ORDER BY created_at DESC
    LIMIT 1
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION faculty_scheduler.record_notification_view IS
  'Records first view timestamp when instructor clicks magic link. Returns notification ID or NULL if already viewed.';
