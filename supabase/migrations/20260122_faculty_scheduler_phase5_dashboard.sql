-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 5 - Business OS Dashboard Views
-- ============================================================================
-- Creates enhanced Supabase views for the Business OS dashboard integration:
-- - dashboard_recruitment_pipeline: Aggregated program view with notification/response counts
-- - not_responded_instructors: Instructors who were notified but haven't claimed
-- - dashboard_summary_stats: Single-row summary statistics for dashboard cards
-- - assign_instructor(): Manual assignment function (bypasses tier eligibility)
-- - override_claim(): Cancel claim and re-open block for re-release
--
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- VIEW: Dashboard Recruitment Pipeline
-- Enhanced version with notification counts, response tracking, and activity
-- ============================================================================
CREATE OR REPLACE VIEW faculty_scheduler.dashboard_recruitment_pipeline AS
WITH notification_counts AS (
  SELECT
    scheduled_program_id,
    COUNT(DISTINCT instructor_id) as notified_count
  FROM faculty_scheduler.notifications
  WHERE notification_type = 'tier_release'
    AND email_status = 'sent'
  GROUP BY scheduled_program_id
),
response_counts AS (
  SELECT
    pb.scheduled_program_id,
    COUNT(DISTINCT c.instructor_id) as responded_count
  FROM faculty_scheduler.claims c
  JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
  WHERE c.status IN ('confirmed', 'completed')
  GROUP BY pb.scheduled_program_id
),
assigned_instructors AS (
  SELECT DISTINCT ON (pb.scheduled_program_id)
    pb.scheduled_program_id,
    f.id as instructor_id,
    f.full_name as instructor_name
  FROM faculty_scheduler.program_blocks pb
  JOIN faculty f ON f.id = pb.instructor_id
  WHERE pb.status IN ('claimed', 'confirmed')
  ORDER BY pb.scheduled_program_id, pb.claimed_at
),
block_counts AS (
  SELECT
    scheduled_program_id,
    COUNT(*) as total_blocks,
    COUNT(*) FILTER (WHERE status = 'open') as open_blocks,
    COUNT(*) FILTER (WHERE status IN ('claimed', 'confirmed')) as filled_blocks
  FROM faculty_scheduler.program_blocks
  GROUP BY scheduled_program_id
),
last_activity AS (
  SELECT
    sp.id as scheduled_program_id,
    GREATEST(
      sp.updated_at,
      (SELECT MAX(created_at) FROM faculty_scheduler.claims c
       JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
       WHERE pb.scheduled_program_id = sp.id),
      (SELECT MAX(created_at) FROM faculty_scheduler.notifications n
       WHERE n.scheduled_program_id = sp.id)
    ) as last_activity_at
  FROM faculty_scheduler.scheduled_programs sp
)
SELECT
  sp.id,
  sp.name,
  sp.program_type,
  sp.city,
  sp.state,
  sp.start_date,
  sp.status,
  sp.released_at,
  sp.tier_0_ends_at,
  sp.tier_1_ends_at,
  -- Days remaining calculation
  CASE
    WHEN sp.status = 'tier_0' THEN
      GREATEST(0, EXTRACT(EPOCH FROM (sp.tier_0_ends_at - NOW())) / 86400)
    WHEN sp.status = 'tier_1' THEN
      GREATEST(0, EXTRACT(EPOCH FROM (sp.tier_1_ends_at - NOW())) / 86400)
    ELSE NULL
  END::NUMERIC as days_remaining,
  -- Block counts
  COALESCE(bc.total_blocks, 0)::INTEGER as total_blocks,
  COALESCE(bc.open_blocks, 0)::INTEGER as open_blocks,
  COALESCE(bc.filled_blocks, 0)::INTEGER as filled_blocks,
  -- Notification/response tracking
  COALESCE(nc.notified_count, 0)::INTEGER as notified_count,
  COALESCE(rc.responded_count, 0)::INTEGER as responded_count,
  -- Assigned instructor (first one for filled/claimed programs)
  ai.instructor_name as assigned_instructor_name,
  ai.instructor_id as assigned_instructor_id,
  -- Activity tracking
  la.last_activity_at,
  -- Friendly tier display
  CASE sp.status
    WHEN 'tier_0' THEN 'Tier 0 (VIP)'
    WHEN 'tier_1' THEN 'Tier 1 (Local)'
    WHEN 'tier_2' THEN 'Open'
    WHEN 'filled' THEN 'Filled'
    WHEN 'completed' THEN 'Completed'
    WHEN 'draft' THEN 'Draft'
    ELSE sp.status
  END as tier_display
FROM faculty_scheduler.scheduled_programs sp
LEFT JOIN block_counts bc ON bc.scheduled_program_id = sp.id
LEFT JOIN notification_counts nc ON nc.scheduled_program_id = sp.id
LEFT JOIN response_counts rc ON rc.scheduled_program_id = sp.id
LEFT JOIN assigned_instructors ai ON ai.scheduled_program_id = sp.id
LEFT JOIN last_activity la ON la.scheduled_program_id = sp.id
ORDER BY
  CASE sp.status
    WHEN 'tier_0' THEN 1
    WHEN 'tier_1' THEN 2
    WHEN 'tier_2' THEN 3
    WHEN 'filled' THEN 4
    WHEN 'draft' THEN 5
    WHEN 'completed' THEN 6
  END,
  sp.start_date;
