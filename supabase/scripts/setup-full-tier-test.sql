-- ============================================================================
-- FULL TEST SETUP: Tier Advancement with Instructors
-- ============================================================================
-- This script sets up complete test data including:
-- 1. A test instructor (or uses existing one)
-- 2. A test scheduled program in tier_0 with expired window
-- 3. Instructor qualifications linking them together
-- ============================================================================

-- ============================================================================
-- STEP 1: Check for existing faculty we can use
-- ============================================================================
SELECT 'EXISTING FACULTY (first 5 active)' as section;
SELECT id, full_name, email, firm_state, tier_designation, faculty_status
FROM faculty
WHERE faculty_status = 'active'
LIMIT 5;

-- ============================================================================
-- STEP 2: Check for existing programs in the catalog
-- ============================================================================
SELECT 'EXISTING CATALOG PROGRAMS (first 5)' as section;
SELECT id, name
FROM programs
LIMIT 5;

-- ============================================================================
-- STEP 3: Create/Update a test scheduled program
-- ============================================================================

-- First delete related records (foreign key dependencies)
DELETE FROM faculty_scheduler.notifications
WHERE scheduled_program_id = 'a0000001-0000-0000-0000-000000000001'::UUID;

DELETE FROM faculty_scheduler.program_blocks
WHERE scheduled_program_id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Delete existing test program if it exists
DELETE FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Create a new test scheduled program linked to a real catalog program
INSERT INTO faculty_scheduler.scheduled_programs (
  id,
  name,
  program_id,  -- Link to catalog program (we'll get the first one)
  program_type,
  city,
  state,
  venue,
  start_date,
  end_date,
  status,
  released_at,
  tier_0_ends_at,
  tier_1_ends_at,
  notes
)
SELECT
  'a0000001-0000-0000-0000-000000000001'::UUID,
  'Test Program - Denver (Tier Advancement Test)',
  p.id,  -- Use the first program from catalog
  'Employment Law',
  'Denver',
  'Colorado',
  'Grand Hyatt Denver',
  CURRENT_DATE + INTERVAL '45 days',
  CURRENT_DATE + INTERVAL '47 days',
  'tier_0',  -- Start in tier_0
  NOW() - INTERVAL '8 days',  -- Released 8 days ago
  NOW() - INTERVAL '1 minute',  -- Tier 0 just expired
  NOW() + INTERVAL '5 days',  -- Tier 1 ends in 5 days
  'Test program for tier advancement workflow verification'
FROM programs p
LIMIT 1;

-- ============================================================================
-- STEP 4: Create instructor qualifications
-- Link the first active instructor to this program
-- ============================================================================

-- Clear any existing test qualifications (by notes field since qualifications link to catalog programs)
DELETE FROM faculty_scheduler.instructor_qualifications
WHERE notes = 'Test qualification for tier advancement testing';

-- Add qualification linking first active instructor to the catalog program
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id, notes)
SELECT
  f.id,
  sp.program_id,
  'Test qualification for tier advancement testing'
FROM faculty f
CROSS JOIN faculty_scheduler.scheduled_programs sp
WHERE f.faculty_status = 'active'
  AND f.email IS NOT NULL
  AND sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
LIMIT 3  -- Qualify up to 3 instructors
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- ============================================================================
-- STEP 5: Verify the setup
-- ============================================================================

SELECT 'SCHEDULED PROGRAM CREATED' as section;
SELECT
  sp.id,
  sp.name,
  sp.program_id as catalog_program_id,
  sp.state,
  sp.status,
  sp.tier_0_ends_at,
  CASE WHEN sp.tier_0_ends_at <= NOW() THEN 'EXPIRED - READY TO ADVANCE' ELSE 'NOT YET EXPIRED' END as tier_status
FROM faculty_scheduler.scheduled_programs sp
WHERE sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID;

SELECT 'QUALIFIED INSTRUCTORS FOR THIS PROGRAM' as section;
SELECT
  f.id as instructor_id,
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  iq.program_id as catalog_program_id
FROM faculty_scheduler.instructor_qualifications iq
JOIN faculty f ON f.id = iq.faculty_id
JOIN faculty_scheduler.scheduled_programs sp ON sp.program_id = iq.program_id
WHERE sp.id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND f.faculty_status = 'active';

-- ============================================================================
-- STEP 6: Test the get_instructors_to_notify function directly
-- ============================================================================

SELECT 'TEST: get_instructors_to_notify() for tier 1' as section;
SELECT * FROM faculty_scheduler.get_instructors_to_notify(
  'a0000001-0000-0000-0000-000000000001'::UUID,
  1  -- tier 1
);

-- ============================================================================
-- STEP 7: Now you can run the workflow!
-- The advance_tiers() function will:
-- 1. Find this program (status=tier_0, tier_0_ends_at expired)
-- 2. Advance it to tier_1
-- 3. get_recently_advanced_programs() will find it
-- 4. get_instructors_to_notify() will return the qualified instructors
-- ============================================================================

SELECT 'READY FOR WORKFLOW TEST' as section;
SELECT 'Run the Tier Advancement workflow now. It should:' as instructions
UNION ALL SELECT '1. Advance the test program from tier_0 to tier_1'
UNION ALL SELECT '2. Find qualified instructors'
UNION ALL SELECT '3. Trigger the Notification Sender webhook';
