-- ============================================================================
-- VALIDATION: Faculty Scheduler Schema and Data
-- ============================================================================
-- Run these queries after migration to verify everything is working
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA VERIFICATION
-- ============================================================================

-- Check that all tables exist
SELECT
  schemaname,
  tablename
FROM pg_tables
WHERE schemaname = 'faculty_scheduler'
ORDER BY tablename;

-- Check that tier_designation column exists on faculty
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'faculty'
  AND column_name = 'tier_designation';

-- ============================================================================
-- 2. QUALIFICATION DATA VERIFICATION
-- ============================================================================

-- Total qualification count
SELECT COUNT(*) as total_qualifications
FROM faculty_scheduler.instructor_qualifications;

-- Instructors with qualifications
SELECT
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  COUNT(iq.id) as qualification_count
FROM faculty f
LEFT JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
WHERE f.faculty_status = 'active'
GROUP BY f.id, f.full_name, f.email, f.firm_state, f.tier_designation
ORDER BY qualification_count DESC;

-- Instructors WITHOUT qualifications (need attention)
SELECT
  f.full_name,
  f.email,
  f.airtable_record_id
FROM faculty f
LEFT JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
WHERE f.faculty_status = 'active'
  AND iq.id IS NULL
ORDER BY f.full_name;

-- Programs with qualified instructors
SELECT
  p.name as program_name,
  p.program_type,
  COUNT(iq.id) as instructor_count
FROM programs p
LEFT JOIN faculty_scheduler.instructor_qualifications iq ON iq.program_id = p.id
GROUP BY p.id, p.name, p.program_type
ORDER BY instructor_count DESC;

-- ============================================================================
-- 3. TIER ELIGIBILITY VERIFICATION
-- ============================================================================

-- VIP instructors (Tier 0)
SELECT
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation
FROM faculty f
WHERE f.tier_designation = 0
  AND f.faculty_status = 'active';

-- Instructors by state (for Tier 1 local matching)
SELECT
  f.firm_state,
  COUNT(*) as instructor_count,
  STRING_AGG(f.full_name, ', ' ORDER BY f.full_name) as instructors
FROM faculty f
WHERE f.faculty_status = 'active'
  AND f.firm_state IS NOT NULL
GROUP BY f.firm_state
ORDER BY instructor_count DESC;

-- ============================================================================
-- 4. FUNCTION VERIFICATION
-- ============================================================================

-- Test get_eligible_instructors (requires a scheduled program to exist)
-- SELECT * FROM faculty_scheduler.get_eligible_instructors('YOUR-PROGRAM-ID-HERE');

-- Test advance_tiers (dry run - shows what would change)
SELECT
  sp.name,
  sp.status,
  sp.tier_0_ends_at,
  sp.tier_1_ends_at,
  CASE
    WHEN sp.status = 'tier_0' AND sp.tier_0_ends_at <= NOW() THEN 'Would advance to tier_1'
    WHEN sp.status = 'tier_1' AND sp.tier_1_ends_at <= NOW() THEN 'Would advance to tier_2'
    ELSE 'No change'
  END as advance_status
FROM faculty_scheduler.scheduled_programs sp
WHERE sp.status IN ('tier_0', 'tier_1');

-- ============================================================================
-- 5. VIEW VERIFICATION
-- ============================================================================

-- Check recruitment_pipeline view
SELECT * FROM faculty_scheduler.recruitment_pipeline LIMIT 10;

-- Check instructor_claims_summary view
SELECT * FROM faculty_scheduler.instructor_claims_summary LIMIT 10;

-- Check available_programs view
SELECT * FROM faculty_scheduler.available_programs LIMIT 10;

-- ============================================================================
-- 6. DATA INTEGRITY CHECKS
-- ============================================================================

-- Orphaned qualifications (instructor or program deleted)
SELECT iq.*
FROM faculty_scheduler.instructor_qualifications iq
LEFT JOIN faculty f ON f.id = iq.faculty_id
LEFT JOIN programs p ON p.id = iq.program_id
WHERE f.id IS NULL OR p.id IS NULL;

-- Blocks with invalid instructor references
SELECT pb.*
FROM faculty_scheduler.program_blocks pb
LEFT JOIN faculty f ON f.id = pb.instructor_id
WHERE pb.instructor_id IS NOT NULL AND f.id IS NULL;

-- Claims with invalid references
SELECT c.*
FROM faculty_scheduler.claims c
LEFT JOIN faculty f ON f.id = c.instructor_id
LEFT JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
WHERE f.id IS NULL OR pb.id IS NULL;

-- ============================================================================
-- SUMMARY REPORT
-- ============================================================================
SELECT
  (SELECT COUNT(*) FROM faculty WHERE faculty_status = 'active') as active_instructors,
  (SELECT COUNT(*) FROM faculty_scheduler.instructor_qualifications) as total_qualifications,
  (SELECT COUNT(DISTINCT faculty_id) FROM faculty_scheduler.instructor_qualifications) as instructors_with_quals,
  (SELECT COUNT(DISTINCT program_id) FROM faculty_scheduler.instructor_qualifications) as programs_with_instructors,
  (SELECT COUNT(*) FROM faculty WHERE tier_designation = 0 AND faculty_status = 'active') as vip_instructors,
  (SELECT COUNT(*) FROM faculty_scheduler.scheduled_programs) as scheduled_programs,
  (SELECT COUNT(*) FROM faculty_scheduler.program_blocks) as program_blocks,
  (SELECT COUNT(*) FROM faculty_scheduler.claims WHERE status = 'confirmed') as active_claims;
