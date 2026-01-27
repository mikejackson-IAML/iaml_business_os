-- ============================================================================
-- FIX: Add a Tier 1 eligible instructor (local to Colorado)
-- ============================================================================

-- Check current qualified instructors and their states
SELECT 'CURRENT QUALIFIED INSTRUCTORS' as section;
SELECT
  f.id,
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  CASE
    WHEN f.tier_designation = 0 THEN 'VIP - eligible for all tiers'
    WHEN f.firm_state = 'Colorado' THEN 'Local - eligible for tier 1'
    ELSE 'NOT eligible for tier 1 (state: ' || COALESCE(f.firm_state, 'NULL') || ')'
  END as tier_1_eligibility
FROM faculty_scheduler.instructor_qualifications iq
JOIN faculty f ON f.id = iq.faculty_id
JOIN faculty_scheduler.scheduled_programs sp ON sp.program_id = iq.program_id
WHERE sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND f.faculty_status = 'active';

-- Option 1: Update an existing qualified instructor to be from Colorado
UPDATE faculty f
SET firm_state = 'Colorado'
FROM faculty_scheduler.instructor_qualifications iq
JOIN faculty_scheduler.scheduled_programs sp ON sp.program_id = iq.program_id
WHERE iq.faculty_id = f.id
  AND sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND f.faculty_status = 'active'
  AND f.email IS NOT NULL
  AND f.id = (
    SELECT iq2.faculty_id
    FROM faculty_scheduler.instructor_qualifications iq2
    JOIN faculty_scheduler.scheduled_programs sp2 ON sp2.program_id = iq2.program_id
    JOIN faculty f2 ON f2.id = iq2.faculty_id
    WHERE sp2.id = 'a0000001-0000-0000-0000-000000000001'::UUID
      AND f2.faculty_status = 'active'
    LIMIT 1
  );

-- Verify the fix
SELECT 'AFTER FIX - QUALIFIED INSTRUCTORS' as section;
SELECT
  f.id,
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  CASE
    WHEN f.tier_designation = 0 THEN 'VIP - eligible'
    WHEN f.firm_state = 'Colorado' THEN 'Local - eligible'
    ELSE 'NOT eligible'
  END as tier_1_eligibility
FROM faculty_scheduler.instructor_qualifications iq
JOIN faculty f ON f.id = iq.faculty_id
JOIN faculty_scheduler.scheduled_programs sp ON sp.program_id = iq.program_id
WHERE sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND f.faculty_status = 'active';

-- Test the function directly
SELECT 'TEST: get_instructors_to_notify for tier 1' as section;
SELECT * FROM faculty_scheduler.get_instructors_to_notify(
  'a0000001-0000-0000-0000-000000000001'::UUID,
  1
);

-- Also reset the program to tier_0 so we can test advancement again
UPDATE faculty_scheduler.scheduled_programs
SET
  status = 'tier_0',
  tier_0_ends_at = NOW() - INTERVAL '1 minute',
  updated_at = NOW() - INTERVAL '10 minutes'
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

SELECT 'PROGRAM RESET TO TIER_0 - Ready for workflow test' as section;
SELECT id, name, status, tier_0_ends_at FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;
