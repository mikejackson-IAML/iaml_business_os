-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 4 - Release Controls & Reminders
-- ============================================================================
-- Creates admin functions for bulk release, tier skipping, and notification
-- helpers for mid-tier reminders and re-release workflows after cancellations.
-- Date: 2026-01-21
-- ============================================================================

-- ============================================================================
-- TASK 2: Add 'rerelease' to notification_type constraint
-- ============================================================================

-- Drop and recreate the notification_type constraint to include 'rerelease'
ALTER TABLE faculty_scheduler.notifications
  DROP CONSTRAINT IF EXISTS notifications_notification_type_check;

ALTER TABLE faculty_scheduler.notifications
  ADD CONSTRAINT notifications_notification_type_check
  CHECK (notification_type IN (
    'tier_release',       -- New programs available at your tier
    'reminder',           -- Reminder: programs still available
    'claim_confirmation', -- You claimed a block
    'claim_cancelled',    -- Your claim was cancelled
    'program_update',     -- Program details changed
    'rerelease'           -- Block re-opened after cancellation
  ));

-- ============================================================================
-- TASK 3: release_all() - Bulk release all draft programs
-- ============================================================================

CREATE OR REPLACE FUNCTION faculty_scheduler.release_all(
  p_tier_0_days INTEGER DEFAULT 7,
  p_tier_1_days INTEGER DEFAULT 5
)
RETURNS TABLE (
  programs_released INTEGER,
  program_ids UUID[]
) AS $$
DECLARE
  v_released_ids UUID[];
  v_count INTEGER;
BEGIN
  -- Update all draft programs in a single transaction
  WITH released AS (
    UPDATE faculty_scheduler.scheduled_programs
    SET
      status = 'tier_0',
      released_at = NOW(),
      tier_0_ends_at = NOW() + (p_tier_0_days || ' days')::INTERVAL,
      tier_1_ends_at = NOW() + ((p_tier_0_days + p_tier_1_days) || ' days')::INTERVAL,
      updated_at = NOW()
    WHERE status = 'draft'
    RETURNING id
  )
  SELECT ARRAY_AGG(id), COUNT(*)::INTEGER
  INTO v_released_ids, v_count
  FROM released;

  -- Return results
  RETURN QUERY SELECT
    COALESCE(v_count, 0)::INTEGER,
    COALESCE(v_released_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TASK 4: skip_tier() - Advance a program to a specific tier
-- ============================================================================

CREATE OR REPLACE FUNCTION faculty_scheduler.skip_tier(
  p_program_id UUID,
  p_target_tier TEXT
)
RETURNS TABLE (
  success BOOLEAN,
  previous_tier TEXT,
  new_tier TEXT,
  error_message TEXT
) AS $$
DECLARE
  v_program RECORD;
  v_previous_tier TEXT;
BEGIN
  -- Validate target_tier parameter
  IF p_target_tier NOT IN ('tier_1', 'tier_2') THEN
    RETURN QUERY SELECT
      FALSE,
      NULL::TEXT,
      NULL::TEXT,
      'Invalid target tier. Must be ''tier_1'' or ''tier_2''.'::TEXT;
    RETURN;
  END IF;

  -- Get program details
  SELECT * INTO v_program
  FROM faculty_scheduler.scheduled_programs
  WHERE id = p_program_id;

  -- Check if program exists
  IF v_program IS NULL THEN
    RETURN QUERY SELECT
      FALSE,
      NULL::TEXT,
      NULL::TEXT,
      'Program not found.'::TEXT;
    RETURN;
  END IF;

  -- Store previous tier
  v_previous_tier := v_program.status;

  -- Validate current status
  IF v_program.status IN ('draft', 'filled', 'completed') THEN
    RETURN QUERY SELECT
      FALSE,
      v_previous_tier,
      NULL::TEXT,
      ('Cannot skip tier for program in ''' || v_program.status || ''' status. Program must be in tier_0, tier_1, or tier_2.')::TEXT;
    RETURN;
  END IF;

  -- Check if already at or past target tier
  IF p_target_tier = 'tier_1' AND v_program.status IN ('tier_1', 'tier_2') THEN
    RETURN QUERY SELECT
      FALSE,
      v_previous_tier,
      NULL::TEXT,
      ('Program is already at or past tier_1 (current: ' || v_program.status || ').')::TEXT;
    RETURN;
  END IF;

  IF p_target_tier = 'tier_2' AND v_program.status = 'tier_2' THEN
    RETURN QUERY SELECT
      FALSE,
      v_previous_tier,
      NULL::TEXT,
      'Program is already at tier_2.'::TEXT;
    RETURN;
  END IF;

  -- Perform the tier skip
  IF p_target_tier = 'tier_1' THEN
    UPDATE faculty_scheduler.scheduled_programs
    SET
      status = 'tier_1',
      tier_0_ends_at = NOW(),  -- Close tier_0 window immediately
      updated_at = NOW()
    WHERE id = p_program_id;
  ELSIF p_target_tier = 'tier_2' THEN
    UPDATE faculty_scheduler.scheduled_programs
    SET
      status = 'tier_2',
      tier_0_ends_at = LEAST(tier_0_ends_at, NOW()),  -- Close tier_0 if not already
      tier_1_ends_at = NOW(),  -- Close tier_1 window immediately
      updated_at = NOW()
    WHERE id = p_program_id;
  END IF;

  -- Return success
  RETURN QUERY SELECT
    TRUE,
    v_previous_tier,
    p_target_tier,
    NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TASK 5: get_programs_needing_reminder() - Programs at ~50% of tier window
-- ============================================================================

CREATE OR REPLACE FUNCTION faculty_scheduler.get_programs_needing_reminder()
RETURNS TABLE (
  program_id UUID,
  program_name TEXT,
  city TEXT,
  state TEXT,
  current_tier INTEGER,
  tier_start TIMESTAMPTZ,
  tier_ends TIMESTAMPTZ,
  percent_elapsed NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id as program_id,
    sp.name as program_name,
    sp.city,
    sp.state,
    CASE sp.status
      WHEN 'tier_0' THEN 0
      WHEN 'tier_1' THEN 1
    END::INTEGER as current_tier,
    CASE sp.status
      WHEN 'tier_0' THEN sp.released_at
      WHEN 'tier_1' THEN sp.tier_0_ends_at
    END as tier_start,
    CASE sp.status
      WHEN 'tier_0' THEN sp.tier_0_ends_at
      WHEN 'tier_1' THEN sp.tier_1_ends_at
    END as tier_ends,
    (
      EXTRACT(EPOCH FROM (NOW() - CASE sp.status
        WHEN 'tier_0' THEN sp.released_at
        WHEN 'tier_1' THEN sp.tier_0_ends_at
      END)) /
      EXTRACT(EPOCH FROM (CASE sp.status
        WHEN 'tier_0' THEN sp.tier_0_ends_at
        WHEN 'tier_1' THEN sp.tier_1_ends_at
      END - CASE sp.status
        WHEN 'tier_0' THEN sp.released_at
        WHEN 'tier_1' THEN sp.tier_0_ends_at
      END)) * 100
    )::NUMERIC as percent_elapsed
  FROM faculty_scheduler.scheduled_programs sp
  WHERE sp.status IN ('tier_0', 'tier_1')
    -- Only programs with open blocks
    AND EXISTS (
      SELECT 1 FROM faculty_scheduler.program_blocks pb
      WHERE pb.scheduled_program_id = sp.id
        AND pb.status = 'open'
    )
    -- Not already had a reminder sent
    AND NOT EXISTS (
      SELECT 1 FROM faculty_scheduler.notifications n
      WHERE n.scheduled_program_id = sp.id
        AND n.notification_type = 'reminder'
    )
    -- At approximately 50% of tier window (between 45% and 55%)
    AND (
      EXTRACT(EPOCH FROM (NOW() - CASE sp.status
        WHEN 'tier_0' THEN sp.released_at
        WHEN 'tier_1' THEN sp.tier_0_ends_at
      END)) /
      EXTRACT(EPOCH FROM (CASE sp.status
        WHEN 'tier_0' THEN sp.tier_0_ends_at
        WHEN 'tier_1' THEN sp.tier_1_ends_at
      END - CASE sp.status
        WHEN 'tier_0' THEN sp.released_at
        WHEN 'tier_1' THEN sp.tier_0_ends_at
      END)) * 100
    ) BETWEEN 45 AND 55
  ORDER BY sp.start_date;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TASK 6: get_instructors_needing_reminder() - Instructors for a reminder
-- ============================================================================

CREATE OR REPLACE FUNCTION faculty_scheduler.get_instructors_needing_reminder(
  p_scheduled_program_id UUID
)
RETURNS TABLE (
  instructor_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  magic_token TEXT,
  open_block_count INTEGER
) AS $$
DECLARE
  v_program RECORD;
  v_current_tier INTEGER;
BEGIN
  -- Get program details
  SELECT * INTO v_program
  FROM faculty_scheduler.scheduled_programs
  WHERE id = p_scheduled_program_id;

  IF v_program IS NULL THEN
    RETURN;
  END IF;

  -- Determine current tier as integer
  v_current_tier := CASE v_program.status
    WHEN 'tier_0' THEN 0
    WHEN 'tier_1' THEN 1
    WHEN 'tier_2' THEN 2
    ELSE -1
  END;

  IF v_current_tier < 0 THEN
    RETURN;  -- Program not in an active tier
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    f.id as instructor_id,
    f.email,
    f.first_name,
    f.last_name,
    faculty_scheduler.get_or_create_magic_token(f.id) as magic_token,
    (
      SELECT COUNT(*)::INTEGER
      FROM faculty_scheduler.program_blocks pb
      WHERE pb.scheduled_program_id = p_scheduled_program_id
        AND pb.status = 'open'
    ) as open_block_count
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  WHERE iq.program_id = v_program.program_id
    AND f.faculty_status = 'active'
    AND f.email IS NOT NULL
    AND (f.available_for_teaching = true OR f.available_for_teaching IS NULL)
    -- Tier eligibility
    AND (
      (v_current_tier = 0 AND f.tier_designation = 0)
      OR (v_current_tier = 1 AND (f.tier_designation = 0 OR f.firm_state = v_program.state))
      OR (v_current_tier = 2)
    )
    -- Not already received a reminder for this program
    AND NOT EXISTS (
      SELECT 1 FROM faculty_scheduler.notifications n
      WHERE n.instructor_id = f.id
        AND n.scheduled_program_id = p_scheduled_program_id
        AND n.notification_type = 'reminder'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TASK 7: get_instructors_for_rerelease() - Instructors for re-release notification
-- ============================================================================

CREATE OR REPLACE FUNCTION faculty_scheduler.get_instructors_for_rerelease(
  p_scheduled_program_id UUID,
  p_block_id UUID DEFAULT NULL
)
RETURNS TABLE (
  instructor_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  magic_token TEXT,
  program_name TEXT,
  city TEXT,
  state TEXT
) AS $$
DECLARE
  v_program RECORD;
  v_current_tier INTEGER;
BEGIN
  -- Get program details
  SELECT * INTO v_program
  FROM faculty_scheduler.scheduled_programs
  WHERE id = p_scheduled_program_id;

  IF v_program IS NULL THEN
    RETURN;
  END IF;

  -- Determine current tier as integer
  v_current_tier := CASE v_program.status
    WHEN 'tier_0' THEN 0
    WHEN 'tier_1' THEN 1
    WHEN 'tier_2' THEN 2
    ELSE -1
  END;

  IF v_current_tier < 0 THEN
    RETURN;  -- Program not in an active tier
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    f.id as instructor_id,
    f.email,
    f.first_name,
    f.last_name,
    faculty_scheduler.get_or_create_magic_token(f.id) as magic_token,
    v_program.name as program_name,
    v_program.city,
    v_program.state
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  WHERE iq.program_id = v_program.program_id
    AND f.faculty_status = 'active'
    AND f.email IS NOT NULL
    AND (f.available_for_teaching = true OR f.available_for_teaching IS NULL)
    -- Tier eligibility
    AND (
      (v_current_tier = 0 AND f.tier_designation = 0)
      OR (v_current_tier = 1 AND (f.tier_designation = 0 OR f.firm_state = v_program.state))
      OR (v_current_tier = 2)
    )
    -- Exclude instructors with active claims on ANY block in this program
    AND NOT EXISTS (
      SELECT 1 FROM faculty_scheduler.claims c
      JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
      WHERE c.instructor_id = f.id
        AND pb.scheduled_program_id = p_scheduled_program_id
        AND c.status = 'confirmed'
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- TASK 8: Documentation comments
-- ============================================================================

COMMENT ON FUNCTION faculty_scheduler.release_all IS
  'Bulk-releases all draft programs to tier_0 with configurable tier window durations. Returns count and array of released program IDs.';

COMMENT ON FUNCTION faculty_scheduler.skip_tier IS
  'Advances a program to a specific tier (tier_1 or tier_2), adjusting tier end dates. Returns success status with previous/new tier or error message.';

COMMENT ON FUNCTION faculty_scheduler.get_programs_needing_reminder IS
  'Returns programs in tier_0 or tier_1 that are approximately 50% through their tier window (45-55%), have open blocks, and haven''t had a reminder sent yet.';

COMMENT ON FUNCTION faculty_scheduler.get_instructors_needing_reminder IS
  'Returns eligible instructors for a reminder notification for a specific program. Excludes instructors who have already received a reminder for this program.';

COMMENT ON FUNCTION faculty_scheduler.get_instructors_for_rerelease IS
  'Returns eligible instructors for re-release notification after a cancellation. Excludes instructors who already have an active claim on any block in the program.';
