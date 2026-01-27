-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 3 - Available Programs API
-- ============================================================================
-- Date: 2026-01-21
-- ============================================================================

-- Get programs available to a specific instructor based on tier eligibility
CREATE OR REPLACE FUNCTION faculty_scheduler.get_available_programs(
  p_instructor_id UUID
)
RETURNS TABLE (
  program_id UUID,
  program_name TEXT,
  program_type TEXT,
  city TEXT,
  state TEXT,
  venue TEXT,
  program_start_date DATE,
  program_end_date DATE,
  tier_status TEXT,
  blocks JSONB
) AS $$
DECLARE
  v_instructor RECORD;
BEGIN
  -- Get instructor details
  SELECT id, firm_state, tier_designation
  INTO v_instructor
  FROM faculty
  WHERE id = p_instructor_id
    AND faculty_status = 'active';

  IF v_instructor IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  WITH eligible_programs AS (
    SELECT DISTINCT sp.id
    FROM faculty_scheduler.scheduled_programs sp
    JOIN faculty_scheduler.instructor_qualifications iq
      ON iq.program_id = sp.program_id
      AND iq.faculty_id = p_instructor_id
    WHERE sp.status IN ('tier_0', 'tier_1', 'tier_2')
      AND (
        -- Tier 0: Only VIPs
        (sp.status = 'tier_0' AND v_instructor.tier_designation = 0)
        -- Tier 1: VIPs + Local
        OR (sp.status = 'tier_1' AND (v_instructor.tier_designation = 0 OR v_instructor.firm_state = sp.state))
        -- Tier 2: All qualified
        OR (sp.status = 'tier_2')
      )
  ),
  program_blocks AS (
    SELECT
      pb.scheduled_program_id,
      jsonb_agg(
        jsonb_build_object(
          'block_id', pb.id,
          'block_name', pb.block_name,
          'sequence_order', pb.sequence_order,
          'start_date', pb.start_date,
          'end_date', pb.end_date,
          'status', pb.status
        ) ORDER BY pb.sequence_order
      ) FILTER (WHERE pb.status = 'open') as blocks
    FROM faculty_scheduler.program_blocks pb
    WHERE pb.scheduled_program_id IN (SELECT id FROM eligible_programs)
    GROUP BY pb.scheduled_program_id
  )
  SELECT
    sp.id as program_id,
    sp.name as program_name,
    sp.program_type,
    sp.city,
    sp.state,
    sp.venue,
    sp.start_date as program_start_date,
    sp.end_date as program_end_date,
    sp.status as tier_status,
    COALESCE(pblocks.blocks, '[]'::jsonb) as blocks
  FROM faculty_scheduler.scheduled_programs sp
  JOIN eligible_programs ep ON ep.id = sp.id
  LEFT JOIN program_blocks pblocks ON pblocks.scheduled_program_id = sp.id
  WHERE pblocks.blocks IS NOT NULL  -- Only programs with open blocks
  ORDER BY sp.start_date, sp.name;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION faculty_scheduler.get_available_programs IS
  'Returns programs available to a specific instructor based on their tier eligibility';
