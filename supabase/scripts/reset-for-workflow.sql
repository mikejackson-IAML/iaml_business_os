-- Run this IMMEDIATELY before testing the workflow
-- Then run the workflow within 1 minute

-- Reset program to tier_0 with expired window
UPDATE faculty_scheduler.scheduled_programs
SET
  status = 'tier_0',
  tier_0_ends_at = NOW() - INTERVAL '1 minute',
  tier_1_ends_at = NOW() + INTERVAL '5 days',
  updated_at = NOW() - INTERVAL '5 minutes'
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Clear notifications
DELETE FROM faculty_scheduler.notifications
WHERE scheduled_program_id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Verify
SELECT 'READY - Run workflow NOW' as status, status as program_status, tier_0_ends_at
FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;
