-- ============================================================================
-- TEST: Tier Advancement Workflow
-- ============================================================================
-- Sets up a program ready to advance tiers for testing the n8n workflow
-- Run this BEFORE testing the workflow, then run the workflow
-- ============================================================================

-- First, check current state
SELECT 'BEFORE: Current scheduled_programs' as section;
SELECT id, name, status, tier_0_ends_at, tier_1_ends_at, updated_at
FROM faculty_scheduler.scheduled_programs
ORDER BY updated_at DESC LIMIT 5;

-- ============================================================================
-- OPTION 1: Update an existing draft program to be ready for tier advancement
-- ============================================================================

-- Release the Denver test program to Tier 0 with EXPIRED tier dates
-- This simulates a program whose Tier 0 window has ended
UPDATE faculty_scheduler.scheduled_programs
SET
  status = 'tier_0',
  released_at = NOW() - INTERVAL '8 days',          -- Released 8 days ago
  tier_0_ends_at = NOW() - INTERVAL '1 day',        -- Tier 0 ended yesterday
  tier_1_ends_at = NOW() + INTERVAL '4 days',       -- Tier 1 will end in 4 days
  updated_at = NOW() - INTERVAL '8 days'            -- Set old updated_at so it appears stale
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Verify the update
SELECT 'AFTER: Program ready to advance' as section;
SELECT
  id,
  name,
  status,
  released_at,
  tier_0_ends_at,
  tier_1_ends_at,
  updated_at,
  CASE
    WHEN status = 'tier_0' AND tier_0_ends_at <= NOW() THEN 'READY TO ADVANCE TO TIER 1'
    WHEN status = 'tier_1' AND tier_1_ends_at <= NOW() THEN 'READY TO ADVANCE TO TIER 2'
    ELSE 'NOT READY'
  END as advancement_status
FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- ============================================================================
-- Manual test of advance_tiers function
-- ============================================================================
SELECT 'TEST: Running advance_tiers()' as section;
SELECT * FROM faculty_scheduler.advance_tiers();

-- Check what was advanced
SELECT 'RESULT: After advance_tiers()' as section;
SELECT
  id,
  name,
  status,
  tier_0_ends_at,
  tier_1_ends_at,
  updated_at
FROM faculty_scheduler.scheduled_programs
WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID;

-- Check recently advanced programs (what the n8n workflow queries)
SELECT 'RESULT: Recently advanced programs (last 10 min)' as section;
SELECT * FROM faculty_scheduler.get_recently_advanced_programs(10);
