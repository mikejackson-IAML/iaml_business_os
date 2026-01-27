-- ============================================================================
-- FORCE FIX: Guarantee instructor data exists for testing
-- ============================================================================
-- This script will DEFINITELY create working test data by being very explicit
-- ============================================================================

-- Step 1: Find what catalog program the scheduled program references
SELECT 'STEP 1: Scheduled program catalog link' as step;
SELECT id, name, program_id, state, status
FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Step 2: Check if program_id is NULL (this would be the problem!)
SELECT 'STEP 2: Is program_id NULL?' as step;
SELECT
  CASE
    WHEN program_id IS NULL THEN 'YES - THIS IS THE PROBLEM! program_id is NULL'
    ELSE 'NO - program_id exists: ' || program_id::TEXT
  END as diagnosis
FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Step 3: Get a real catalog program ID
SELECT 'STEP 3: Available catalog programs' as step;
SELECT id, name FROM programs LIMIT 5;

-- Step 4: FORCE UPDATE the scheduled program to have a valid program_id
UPDATE faculty_scheduler.scheduled_programs
SET program_id = (SELECT id FROM programs LIMIT 1)
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND program_id IS NULL;

SELECT 'STEP 4: After fix - scheduled program' as step;
SELECT id, name, program_id, state, status
FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Step 5: Find an active faculty with email
SELECT 'STEP 5: Active faculty with email' as step;
SELECT id, full_name, email, firm_state, tier_designation, faculty_status
FROM faculty
WHERE faculty_status = 'active' AND email IS NOT NULL
LIMIT 5;

-- Step 6: FORCE create qualification linking faculty to catalog program
SELECT 'STEP 6: Creating instructor qualifications' as step;
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id, notes)
SELECT
  f.id,
  sp.program_id,
  'FORCED TEST QUALIFICATION'
FROM faculty f
CROSS JOIN faculty_scheduler.scheduled_programs sp
WHERE sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND f.faculty_status = 'active'
  AND f.email IS NOT NULL
LIMIT 3
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Step 7: FORCE one faculty to be from Colorado
SELECT 'STEP 7: Forcing one instructor to Colorado' as step;
UPDATE faculty
SET firm_state = 'Colorado'
WHERE id = (
  SELECT f.id
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  JOIN faculty_scheduler.scheduled_programs sp ON sp.program_id = iq.program_id
  WHERE sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
    AND f.faculty_status = 'active'
    AND f.email IS NOT NULL
  LIMIT 1
);

-- Step 8: Clear ALL notifications for this program
SELECT 'STEP 8: Clearing notifications' as step;
DELETE FROM faculty_scheduler.notifications
WHERE scheduled_program_id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Step 9: Verify the complete data chain
SELECT 'STEP 9: VERIFICATION - Complete data chain' as step;
SELECT
  sp.id as scheduled_program_id,
  sp.name as scheduled_program_name,
  sp.program_id as catalog_program_id,
  sp.state as program_state,
  p.name as catalog_program_name,
  f.id as faculty_id,
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  CASE
    WHEN f.tier_designation = 0 THEN 'TIER 1 ELIGIBLE (VIP)'
    WHEN f.firm_state = sp.state THEN 'TIER 1 ELIGIBLE (Local)'
    ELSE 'NOT TIER 1 ELIGIBLE'
  END as eligibility
FROM faculty_scheduler.scheduled_programs sp
JOIN programs p ON p.id = sp.program_id
JOIN faculty_scheduler.instructor_qualifications iq ON iq.program_id = sp.program_id
JOIN faculty f ON f.id = iq.faculty_id
WHERE sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND f.faculty_status = 'active'
  AND f.email IS NOT NULL;

-- Step 10: Direct test of the function
SELECT 'STEP 10: DIRECT FUNCTION TEST' as step;
SELECT * FROM faculty_scheduler.get_instructors_to_notify(
  'a0000001-0000-0000-0000-000000000001'::UUID,
  1  -- tier 1
);

-- Step 11: Reset program for workflow test
UPDATE faculty_scheduler.scheduled_programs
SET
  status = 'tier_0',
  tier_0_ends_at = NOW() - INTERVAL '1 minute',
  updated_at = NOW() - INTERVAL '10 minutes'
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

SELECT 'DONE: Check STEP 9 and STEP 10 output above' as final_status;
SELECT 'If STEP 10 shows instructor data, run the workflow now' as instructions;
