-- ============================================================================
-- FINAL DIAGNOSTIC: Show ALL data in ONE result set
-- ============================================================================
-- This will reveal exactly what's blocking the function
-- ============================================================================

WITH scheduled_program AS (
  SELECT * FROM faculty_scheduler.scheduled_programs
  WHERE id = 'a0000001-0000-0000-0000-000000000001'::UUID
),
qualified_instructors AS (
  SELECT
    f.id as faculty_id,
    f.full_name,
    f.email,
    f.firm_state,
    f.tier_designation,
    f.faculty_status,
    f.available_for_teaching,
    iq.program_id as qualified_for_program_id
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  WHERE iq.program_id = (SELECT program_id FROM scheduled_program)
)
SELECT
  'A. Scheduled Program' as check_item,
  COALESCE(sp.name, 'NOT FOUND') as value_1,
  COALESCE(sp.program_id::TEXT, 'NULL - THIS IS THE PROBLEM!') as value_2,
  sp.state as value_3,
  sp.status as value_4,
  '' as value_5
FROM scheduled_program sp

UNION ALL

SELECT
  'B. Catalog Program Linked?',
  CASE WHEN p.id IS NOT NULL THEN 'YES: ' || p.name ELSE 'NO - program_id is NULL or invalid!' END,
  COALESCE(p.id::TEXT, 'MISSING'),
  '',
  '',
  ''
FROM scheduled_program sp
LEFT JOIN programs p ON p.id = sp.program_id

UNION ALL

SELECT
  'C. Qualified Instructors Count',
  COUNT(*)::TEXT || ' instructors qualified',
  '',
  '',
  '',
  ''
FROM qualified_instructors

UNION ALL

SELECT
  'D. Instructor: ' || qi.full_name,
  'Email: ' || COALESCE(qi.email, 'NULL'),
  'State: ' || COALESCE(qi.firm_state, 'NULL'),
  'Status: ' || qi.faculty_status,
  'Available: ' || COALESCE(qi.available_for_teaching::TEXT, 'NULL'),
  CASE
    WHEN qi.tier_designation = 0 THEN 'TIER 1 OK (VIP)'
    WHEN qi.firm_state = (SELECT state FROM scheduled_program) THEN 'TIER 1 OK (Local)'
    ELSE 'NOT TIER 1 ELIGIBLE - state mismatch'
  END
FROM qualified_instructors qi

UNION ALL

SELECT
  'E. Notifications blocking re-send',
  COUNT(*)::TEXT || ' existing notifications',
  '',
  '',
  '',
  ''
FROM faculty_scheduler.notifications
WHERE scheduled_program_id = 'a0000001-0000-0000-0000-000000000001'::UUID
  AND notification_type = 'tier_release'
  AND tier = 1
  AND email_status = 'sent'

UNION ALL

SELECT
  'F. Function Result',
  COALESCE(
    (SELECT full_name FROM faculty WHERE id = (
      SELECT instructor_id FROM faculty_scheduler.get_instructors_to_notify(
        'a0000001-0000-0000-0000-000000000001'::UUID, 1
      ) LIMIT 1
    )),
    'EMPTY - NO INSTRUCTORS RETURNED'
  ),
  '',
  '',
  '',
  '';
