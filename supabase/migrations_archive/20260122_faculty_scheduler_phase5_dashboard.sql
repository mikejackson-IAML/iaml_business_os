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

-- ============================================================================
-- VIEW: Not Responded Instructors
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
  n.tier as tier_when_notified
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
ORDER BY n.created_at DESC;

-- ============================================================================
-- VIEW: Dashboard Summary Stats
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
      OR (sp.status = 'tier_2')  -- All tier_2 programs need attention (no deadline)
    )
),
notification_stats AS (
  SELECT
    COUNT(DISTINCT instructor_id) as total_notified
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
  COALESCE(rs.total_responded, 0)::INTEGER as total_responded,
  CASE
    WHEN COALESCE(ns.total_notified, 0) = 0 THEN 0
    ELSE ROUND((COALESCE(rs.total_responded, 0)::NUMERIC / ns.total_notified) * 100, 1)
  END as response_rate
FROM program_stats ps
CROSS JOIN urgent_programs up
CROSS JOIN notification_stats ns
CROSS JOIN response_stats rs;

-- ============================================================================
-- FUNCTION: Assign Instructor (Admin Override)
-- Manually assigns an instructor to a block, bypassing tier eligibility
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.assign_instructor(
  p_block_id UUID,
  p_instructor_id UUID
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  claim_id UUID
) AS $$
DECLARE
  v_block RECORD;
  v_instructor RECORD;
  v_claim_id UUID;
BEGIN
  -- Get block details
  SELECT pb.*, sp.id as program_id
  INTO v_block
  FROM faculty_scheduler.program_blocks pb
  JOIN faculty_scheduler.scheduled_programs sp ON sp.id = pb.scheduled_program_id
  WHERE pb.id = p_block_id
  FOR UPDATE;

  -- Verify block exists
  IF v_block IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Block not found.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Verify block is open
  IF v_block.status != 'open' THEN
    RETURN QUERY SELECT FALSE, ('Block is not open (current status: ' || v_block.status || ').')::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Get instructor details
  SELECT * INTO v_instructor
  FROM faculty
  WHERE id = p_instructor_id;

  -- Verify instructor exists
  IF v_instructor IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Instructor not found.'::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Verify instructor is active
  IF v_instructor.faculty_status != 'active' THEN
    RETURN QUERY SELECT FALSE, ('Instructor is not active (status: ' || v_instructor.faculty_status || ').')::TEXT, NULL::UUID;
    RETURN;
  END IF;

  -- Create claim record (status='confirmed' for admin assignment)
  INSERT INTO faculty_scheduler.claims (
    instructor_id,
    block_id,
    status,
    claimed_at
  ) VALUES (
    p_instructor_id,
    p_block_id,
    'confirmed',
    NOW()
  )
  RETURNING id INTO v_claim_id;

  -- Update block
  UPDATE faculty_scheduler.program_blocks
  SET
    instructor_id = p_instructor_id,
    claimed_at = NOW(),
    status = 'claimed',
    updated_at = NOW()
  WHERE id = p_block_id;

  -- Check if all blocks are filled and update program status
  IF NOT EXISTS (
    SELECT 1 FROM faculty_scheduler.program_blocks
    WHERE scheduled_program_id = v_block.scheduled_program_id
      AND status = 'open'
  ) THEN
    UPDATE faculty_scheduler.scheduled_programs
    SET status = 'filled', updated_at = NOW()
    WHERE id = v_block.scheduled_program_id;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT, v_claim_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCTION: Override Claim (Admin Cancellation)
-- Cancels an existing claim and re-opens the block for re-release
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.override_claim(
  p_claim_id UUID,
  p_reason TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  error_message TEXT,
  block_id UUID,
  program_id UUID
) AS $$
DECLARE
  v_claim RECORD;
  v_program RECORD;
  v_new_status TEXT;
BEGIN
  -- Get claim with block and program info
  SELECT
    c.*,
    pb.id as block_id,
    pb.scheduled_program_id,
    sp.status as program_status,
    sp.tier_0_ends_at,
    sp.tier_1_ends_at
  INTO v_claim
  FROM faculty_scheduler.claims c
  JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
  JOIN faculty_scheduler.scheduled_programs sp ON sp.id = pb.scheduled_program_id
  WHERE c.id = p_claim_id
  FOR UPDATE;

  -- Verify claim exists
  IF v_claim IS NULL THEN
    RETURN QUERY SELECT FALSE, 'Claim not found.'::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Verify claim is active
  IF v_claim.status NOT IN ('confirmed', 'claimed') THEN
    RETURN QUERY SELECT FALSE, ('Claim is not active (current status: ' || v_claim.status || ').')::TEXT, NULL::UUID, NULL::UUID;
    RETURN;
  END IF;

  -- Update claim to cancelled
  UPDATE faculty_scheduler.claims
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = 'admin',
    cancelled_reason = p_reason
  WHERE id = p_claim_id;

  -- Re-open the block
  UPDATE faculty_scheduler.program_blocks
  SET
    instructor_id = NULL,
    claimed_at = NULL,
    status = 'open',
    updated_at = NOW()
  WHERE id = v_claim.block_id;

  -- Determine correct tier status based on current time
  IF v_claim.program_status = 'filled' THEN
    -- Recalculate what tier we should be in
    IF v_claim.tier_0_ends_at > NOW() THEN
      v_new_status := 'tier_0';
    ELSIF v_claim.tier_1_ends_at > NOW() THEN
      v_new_status := 'tier_1';
    ELSE
      v_new_status := 'tier_2';
    END IF;

    UPDATE faculty_scheduler.scheduled_programs
    SET
      status = v_new_status,
      updated_at = NOW()
    WHERE id = v_claim.scheduled_program_id;
  END IF;

  RETURN QUERY SELECT TRUE, NULL::TEXT, v_claim.block_id, v_claim.scheduled_program_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- DOCUMENTATION COMMENTS
-- ============================================================================
COMMENT ON VIEW faculty_scheduler.dashboard_recruitment_pipeline IS
  'Enhanced pipeline view for Business OS dashboard. Includes notification counts, response tracking, assigned instructor details, and last activity timestamps.';

COMMENT ON VIEW faculty_scheduler.not_responded_instructors IS
  'Instructors who received tier_release notifications but have not submitted any claims for active programs. Used for follow-up and nudge functionality.';

COMMENT ON VIEW faculty_scheduler.dashboard_summary_stats IS
  'Single-row view providing real-time counts for dashboard summary cards: program counts by status, notification/response totals, and overall response rate.';

COMMENT ON FUNCTION faculty_scheduler.assign_instructor IS
  'Admin function to manually assign an instructor to a block, bypassing tier eligibility checks. Creates confirmed claim and marks program filled if all blocks claimed.';

COMMENT ON FUNCTION faculty_scheduler.override_claim IS
  'Admin function to cancel an existing claim and re-open the block for re-release. Recalculates program tier status based on current time if previously filled.';
