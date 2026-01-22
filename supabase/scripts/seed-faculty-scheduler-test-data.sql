-- ============================================================================
-- SEED DATA: Faculty Scheduler Test Programs
-- ============================================================================
-- Creates test scheduled programs and blocks for testing the tier system
-- ============================================================================

-- First, clean up any existing test data
DELETE FROM faculty_scheduler.scheduled_programs WHERE id IN (
  'a0000001-0000-0000-0000-000000000001'::UUID,
  'a0000001-0000-0000-0000-000000000002'::UUID,
  'a0000001-0000-0000-0000-000000000003'::UUID
);

-- ============================================================================
-- TEST PROGRAM 1: Denver, Colorado (3 blocks)
-- Links to "Certificate in Employee Relations Law" catalog program
-- ============================================================================

INSERT INTO faculty_scheduler.scheduled_programs (
  id, name, program_id, program_type, city, state, venue, start_date, end_date, status, notes
)
SELECT
  'a0000001-0000-0000-0000-000000000001'::UUID,
  'Certificate in Employee Relations Law - Denver Q1 2026',
  p.id,  -- Link to catalog program
  'Employment Law',
  'Denver',
  'Colorado',
  'Grand Hyatt Denver',
  CURRENT_DATE + INTERVAL '45 days',
  CURRENT_DATE + INTERVAL '47 days',
  'draft',
  'Test program for Faculty Scheduler verification'
FROM programs p
WHERE p.name = 'Certificate in Employee Relations Law';

INSERT INTO faculty_scheduler.program_blocks (scheduled_program_id, block_name, sequence_order, start_date, end_date)
VALUES
  ('a0000001-0000-0000-0000-000000000001', 'Block 1: Fundamentals', 1, CURRENT_DATE + INTERVAL '45 days', CURRENT_DATE + INTERVAL '45 days'),
  ('a0000001-0000-0000-0000-000000000001', 'Block 2: Advanced Topics', 2, CURRENT_DATE + INTERVAL '46 days', CURRENT_DATE + INTERVAL '46 days'),
  ('a0000001-0000-0000-0000-000000000001', 'Block 3: Practical Applications', 3, CURRENT_DATE + INTERVAL '47 days', CURRENT_DATE + INTERVAL '47 days');

-- ============================================================================
-- TEST PROGRAM 2: Atlanta, Georgia (2 blocks)
-- Links to "Certificate in Employee Benefits Law" catalog program
-- ============================================================================

INSERT INTO faculty_scheduler.scheduled_programs (
  id, name, program_id, program_type, city, state, venue, start_date, end_date, status, notes
)
SELECT
  'a0000001-0000-0000-0000-000000000002'::UUID,
  'Certificate in Employee Benefits Law - Atlanta Q1 2026',
  p.id,  -- Link to catalog program
  'Benefits Law',
  'Atlanta',
  'Georgia',
  'The Ritz-Carlton Atlanta',
  CURRENT_DATE + INTERVAL '60 days',
  CURRENT_DATE + INTERVAL '61 days',
  'draft',
  'Test program for Faculty Scheduler verification'
FROM programs p
WHERE p.name = 'Certificate in Employee Benefits Law';

INSERT INTO faculty_scheduler.program_blocks (scheduled_program_id, block_name, sequence_order, start_date, end_date)
VALUES
  ('a0000001-0000-0000-0000-000000000002', 'Block 1: Health & Welfare', 1, CURRENT_DATE + INTERVAL '60 days', CURRENT_DATE + INTERVAL '60 days'),
  ('a0000001-0000-0000-0000-000000000002', 'Block 2: Retirement Plans', 2, CURRENT_DATE + INTERVAL '61 days', CURRENT_DATE + INTERVAL '61 days');

-- ============================================================================
-- TEST PROGRAM 3: Chicago, Illinois (1 block)
-- Links to "HR Law Fundamentals" catalog program
-- ============================================================================

INSERT INTO faculty_scheduler.scheduled_programs (
  id, name, program_id, program_type, city, state, venue, start_date, end_date, status, notes
)
SELECT
  'a0000001-0000-0000-0000-000000000003'::UUID,
  'HR Law Fundamentals - Chicago Q1 2026',
  p.id,  -- Link to catalog program
  'Employment Law',
  'Chicago',
  'Illinois',
  'Palmer House Hilton',
  CURRENT_DATE + INTERVAL '30 days',
  CURRENT_DATE + INTERVAL '30 days',
  'draft',
  'Test program for Faculty Scheduler verification'
FROM programs p
WHERE p.name = 'HR Law Fundamentals';

INSERT INTO faculty_scheduler.program_blocks (scheduled_program_id, block_name, sequence_order, start_date, end_date)
VALUES
  ('a0000001-0000-0000-0000-000000000003', 'Full Day Session', 1, CURRENT_DATE + INTERVAL '30 days', CURRENT_DATE + INTERVAL '30 days');

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT
  sp.name,
  sp.city,
  sp.state,
  sp.start_date,
  sp.status,
  COUNT(pb.id) as block_count
FROM faculty_scheduler.scheduled_programs sp
LEFT JOIN faculty_scheduler.program_blocks pb ON pb.scheduled_program_id = sp.id
GROUP BY sp.id
ORDER BY sp.start_date;
