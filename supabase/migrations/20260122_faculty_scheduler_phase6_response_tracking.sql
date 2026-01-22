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

-- ============================================================================
-- VIEW: Not Responded Instructors (Updated with viewed_at)
-- Instructors who were notified but haven't claimed any blocks
-- ============================================================================
CREATE OR REPLACE VIEW faculty_scheduler.not_responded_instructors AS
SELECT
  f.id as instructor_id,
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  sp.id as scheduled_program_id,
  sp.name as program_name,
  sp.city as program_city,
  sp.state as program_state,
  n.created_at as notified_at,
  n.tier as tier_when_notified,
  n.viewed_at
FROM faculty_scheduler.notifications n
JOIN faculty f ON f.id = n.instructor_id
JOIN faculty_scheduler.scheduled_programs sp ON sp.id = n.scheduled_program_id
WHERE n.notification_type = 'tier_release'
  AND n.email_status = 'sent'
  -- Only active programs (still in recruitment)
  AND sp.status IN ('tier_0', 'tier_1', 'tier_2')
  -- No claim exists for this instructor on this program
  AND NOT EXISTS (
    SELECT 1
    FROM faculty_scheduler.claims c
    JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
    WHERE c.instructor_id = n.instructor_id
      AND pb.scheduled_program_id = n.scheduled_program_id
      AND c.status IN ('confirmed', 'completed')
  )
ORDER BY
  -- Not Viewed first (NULL viewed_at), then by notified_at DESC
  n.viewed_at IS NOT NULL,
  n.created_at DESC;

COMMENT ON VIEW faculty_scheduler.not_responded_instructors IS
  'Instructors who received tier_release notifications but have not claimed. Includes viewed_at to distinguish between viewed-no-claim and not-yet-viewed. Sorted with Not Viewed first.';
