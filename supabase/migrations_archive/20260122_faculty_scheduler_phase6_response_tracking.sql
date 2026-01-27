-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 6 - Response Tracking
-- ============================================================================
-- Adds view tracking to notifications:
-- - viewed_at column on notifications table
-- - record_notification_view() helper function
-- - Updated not_responded_instructors view with viewed_at
-- - Updated dashboard_summary_stats with viewed_count
-- - Updated validate_magic_token() to record views on magic link click
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

-- ============================================================================
-- VIEW: Dashboard Summary Stats (Updated with viewed_count)
-- Single-row view for dashboard summary cards
-- ============================================================================
CREATE OR REPLACE VIEW faculty_scheduler.dashboard_summary_stats AS
WITH program_stats AS (
  SELECT
    COUNT(*) FILTER (WHERE status != 'draft') as total_programs,
    COUNT(*) FILTER (WHERE status = 'tier_0') as awaiting_tier_0,
    COUNT(*) FILTER (WHERE status = 'tier_1') as awaiting_tier_1,
    COUNT(*) FILTER (WHERE status = 'tier_2') as open_programs,
    COUNT(*) FILTER (WHERE status IN ('filled', 'claimed', 'confirmed')) as filled_programs,
    COUNT(*) FILTER (WHERE status = 'draft') as draft_programs
  FROM faculty_scheduler.scheduled_programs
),
urgent_programs AS (
  SELECT COUNT(*) as programs_needing_attention
  FROM faculty_scheduler.scheduled_programs sp
  WHERE sp.status IN ('tier_0', 'tier_1', 'tier_2')
    AND (
      (sp.status = 'tier_0' AND EXTRACT(EPOCH FROM (sp.tier_0_ends_at - NOW())) / 86400 < 2)
      OR (sp.status = 'tier_1' AND EXTRACT(EPOCH FROM (sp.tier_1_ends_at - NOW())) / 86400 < 2)
      OR (sp.status = 'tier_2')
    )
),
notification_stats AS (
  SELECT
    COUNT(DISTINCT instructor_id) as total_notified,
    COUNT(DISTINCT instructor_id) FILTER (WHERE viewed_at IS NOT NULL) as total_viewed
  FROM faculty_scheduler.notifications
  WHERE notification_type = 'tier_release'
    AND email_status = 'sent'
),
response_stats AS (
  SELECT
    COUNT(DISTINCT c.instructor_id) as total_responded
  FROM faculty_scheduler.claims c
  WHERE c.status IN ('confirmed', 'completed')
)
SELECT
  COALESCE(ps.total_programs, 0)::INTEGER as total_programs,
  COALESCE(ps.awaiting_tier_0, 0)::INTEGER as awaiting_tier_0,
  COALESCE(ps.awaiting_tier_1, 0)::INTEGER as awaiting_tier_1,
  COALESCE(ps.open_programs, 0)::INTEGER as open_programs,
  COALESCE(ps.filled_programs, 0)::INTEGER as filled_programs,
  COALESCE(ps.draft_programs, 0)::INTEGER as draft_programs,
  COALESCE(up.programs_needing_attention, 0)::INTEGER as programs_needing_attention,
  COALESCE(ns.total_notified, 0)::INTEGER as total_notified,
  COALESCE(ns.total_viewed, 0)::INTEGER as total_viewed,
  COALESCE(rs.total_responded, 0)::INTEGER as total_responded,
  CASE
    WHEN COALESCE(ns.total_notified, 0) = 0 THEN 0
    ELSE ROUND((COALESCE(rs.total_responded, 0)::NUMERIC / ns.total_notified) * 100, 1)
  END as response_rate
FROM program_stats ps
CROSS JOIN urgent_programs up
CROSS JOIN notification_stats ns
CROSS JOIN response_stats rs;

COMMENT ON VIEW faculty_scheduler.dashboard_summary_stats IS
  'Single-row view providing real-time counts for dashboard summary cards. Includes total_viewed count for response tracking.';

-- ============================================================================
-- FUNCTION: Validate Magic Token (Updated for Response Tracking)
-- Records notification view on every token validation attempt
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.validate_magic_token(
  p_token TEXT
)
RETURNS TABLE (
  instructor_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  firm_state TEXT,
  tier_designation INTEGER
) AS $$
DECLARE
  v_instructor_id UUID;
BEGIN
  -- Get instructor_id from token first (before any validation)
  SELECT mt.instructor_id INTO v_instructor_id
  FROM faculty_scheduler.magic_tokens mt
  WHERE mt.token = p_token;

  -- Record notification view if we found an instructor
  -- This happens even if token is expired or instructor inactive
  -- (instructor saw the notification, even if they can't act on it)
  IF v_instructor_id IS NOT NULL THEN
    PERFORM faculty_scheduler.record_notification_view(v_instructor_id);
  END IF;

  -- Update usage stats (existing behavior)
  UPDATE faculty_scheduler.magic_tokens
  SET last_used_at = NOW(), use_count = use_count + 1
  WHERE token = p_token;

  -- Return instructor info (existing behavior)
  RETURN QUERY
  SELECT f.id, f.first_name, f.last_name, f.email, f.firm_state, f.tier_designation
  FROM faculty_scheduler.magic_tokens mt
  JOIN faculty f ON f.id = mt.instructor_id
  WHERE mt.token = p_token
    AND f.faculty_status = 'active';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION faculty_scheduler.validate_magic_token IS
  'Validates a magic token and returns instructor info. Records notification view on first access (even if token expired). Updates usage stats.';
