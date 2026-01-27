-- ============================================================================
-- DIAGNOSE: Why get_instructors_to_notify returns no results
-- ============================================================================

-- Step 1: What's the scheduled program's catalog program_id?
SELECT 'STEP 1: Scheduled Program Details' as section;
SELECT
  id,
  name,
  program_id as catalog_program_id,
  state,
  status
FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Step 2: What qualifications exist for that catalog program?
SELECT 'STEP 2: Instructor Qualifications for this catalog program' as section;
SELECT
  iq.faculty_id,
  iq.program_id as catalog_program_id,
  iq.notes
FROM faculty_scheduler.instructor_qualifications iq
WHERE iq.program_id = (
  SELECT program_id FROM faculty_scheduler.scheduled_programs
  WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID
);

-- Step 3: What are those instructors' details?
SELECT 'STEP 3: Qualified Instructors Details' as section;
SELECT
  f.id,
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  f.faculty_status,
  f.available_for_teaching,
  CASE
    WHEN f.tier_designation = 0 THEN 'YES - VIP'
    WHEN f.firm_state = 'Colorado' THEN 'YES - Local to Colorado'
    ELSE 'NO - Not VIP and not from Colorado'
  END as tier_1_eligible
FROM faculty f
WHERE f.id IN (
  SELECT iq.faculty_id
  FROM faculty_scheduler.instructor_qualifications iq
  WHERE iq.program_id = (
    SELECT program_id FROM faculty_scheduler.scheduled_programs
    WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID
  )
);

-- Step 4: Have they already been notified?
SELECT 'STEP 4: Existing Notifications (blocking re-notification)' as section;
SELECT
  n.instructor_id,
  f.full_name,
  n.notification_type,
  n.tier,
  n.email_status,
  n.created_at
FROM faculty_scheduler.notifications n
JOIN faculty f ON f.id = n.instructor_id
WHERE n.scheduled_program_id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Step 5: Clear notifications to allow re-testing
SELECT 'STEP 5: Clearing old notifications for re-testing' as section;
DELETE FROM faculty_scheduler.notifications
WHERE scheduled_program_id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Step 6: Verify no programs table issue - check if program_id is valid
SELECT 'STEP 6: Catalog Program exists?' as section;
SELECT p.id, p.name
FROM programs p
WHERE p.id = (
  SELECT program_id FROM faculty_scheduler.scheduled_programs
  WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID
);

-- Step 7: Direct test of the function
SELECT 'STEP 7: Direct function test for tier 1' as section;
SELECT * FROM faculty_scheduler.get_instructors_to_notify(
  'a0000001-0000-0000-0000-000000000001'::UUID,
  1
);

-- Step 8: Reset program to tier_0 for another test
UPDATE faculty_scheduler.scheduled_programs
SET
  status = 'tier_0',
  tier_0_ends_at = NOW() - INTERVAL '1 minute',
  updated_at = NOW() - INTERVAL '10 minutes'
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

SELECT 'READY: Program reset to tier_0, notifications cleared' as section;
