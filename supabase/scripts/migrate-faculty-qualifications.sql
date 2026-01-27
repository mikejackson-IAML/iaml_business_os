-- ============================================================================
-- MIGRATION: Faculty Qualifications from Airtable
-- ============================================================================
-- Run this AFTER the schema migration (20260120_create_faculty_scheduler_schema.sql)
-- Maps faculty to the programs they are qualified to teach
-- ============================================================================

-- First, let's see what programs exist in the database
-- SELECT id, name FROM programs ORDER BY name;

-- ============================================================================
-- FACULTY QUALIFICATIONS
-- Generated from Airtable export: FACULTY-Grid view (5).csv
-- Field: "Program Name (from PROGRAMS (Faculty))"
-- ============================================================================

-- John Wymer (rech00qD2rjunIoGX)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rech00qD2rjunIoGX'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Advanced Certificate in Strategic Employment Law',
    'Certificate in Strategic HR Leadership',
    'Comprehensive Labor Relations',
    'HR Law Fundamentals',
    'Discrimination Prevention & Defense',
    'Employment Law Update',
    'Special Issues in Employment Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Ray Deeny (recrHAK0n4YDIMthb)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recrHAK0n4YDIMthb'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Advanced Certificate in Strategic Employment Law',
    'Certificate in Strategic HR Leadership',
    'Comprehensive Labor Relations',
    'Discrimination Prevention & Defense',
    'HR Law Fundamentals',
    'Employment Law Update',
    'Special Issues in Employment Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Wayne Williams (rec9Q9DHcy6dN2SnD)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rec9Q9DHcy6dN2SnD'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Certificate in Strategic HR Leadership',
    'Advanced Certificate in Strategic Employment Law',
    'Certificate in Workplace Investigations',
    'Comprehensive Labor Relations',
    'Discrimination Prevention & Defense',
    'HR Law Fundamentals',
    'Employment Law Update',
    'Special Issues in Employment Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Dawn Kubik (recCysOqbmx33qZGA)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recCysOqbmx33qZGA'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Certificate in Strategic HR Leadership',
    'Certificate in Workplace Investigations',
    'Comprehensive Labor Relations',
    'HR Law Fundamentals',
    'Discrimination Prevention & Defense',
    'Employment Law Update',
    'Special Issues in Employment Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- George Cicotte (rec7eX5uXoWOg6wHc)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rec7eX5uXoWOg6wHc'
  AND p.name IN (
    'Certificate in Employee Benefits Law',
    'Advanced Certificate in Employee Benefits Law',
    'Benefit Plan Claims, Appeals & Litigation',
    'Welfare Benefits Plan Issues',
    'Retirement Plans'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Patrick Scully (recDOeTl32nzCbWxH)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recDOeTl32nzCbWxH'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Comprehensive Labor Relations'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Brenda Heinicke (rec4rKtRbnn56VCMj)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rec4rKtRbnn56VCMj'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Certificate in Strategic HR Leadership',
    'Certificate in Workplace Investigations',
    'Advanced Certificate in Strategic Employment Law',
    'Comprehensive Labor Relations',
    'Discrimination Prevention & Defense',
    'HR Law Fundamentals',
    'Employment Law Update',
    'Special Issues in Employment Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- John Hickman (recMbHQtDKRCqBkvZ)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recMbHQtDKRCqBkvZ'
  AND p.name IN (
    'Advanced Certificate in Employee Benefits Law',
    'Certificate in Employee Benefits Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Ashley Gillihan (recu2bleWSmRJTwoa)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recu2bleWSmRJTwoa'
  AND p.name IN (
    'Certificate in Employee Benefits Law',
    'Advanced Certificate in Employee Benefits Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Doug Hinson (recBSj5kd0Z6KWGgU)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recBSj5kd0Z6KWGgU'
  AND p.name IN (
    'Advanced Certificate in Employee Benefits Law',
    'Certificate in Employee Benefits Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Amy Zdravecky (recSGAvUdF4678gA9)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recSGAvUdF4678gA9'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Comprehensive Labor Relations'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Di Ann Sanchez (rec0meucobcVjMYXW)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rec0meucobcVjMYXW'
  AND p.name IN (
    'Certificate in Strategic HR Leadership',
    'Strategic HR Management'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Cyndi Ramirez Ryan (rectoEby18SQxEqmO)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rectoEby18SQxEqmO'
  AND p.name IN (
    'Certificate in Strategic HR Leadership',
    'Strategic HR Management'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Dominic DeMatties (rec7kuWXpBRWV8qvL)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rec7kuWXpBRWV8qvL'
  AND p.name IN (
    'Certificate in Employee Benefits Law',
    'Advanced Certificate in Employee Benefits Law',
    'Retirement Plans',
    'Benefit Plan Claims, Appeals & Litigation'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Rudi Turner (recNZZAA7eSH4kub4)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recNZZAA7eSH4kub4'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Certificate in Strategic HR Leadership',
    'Comprehensive Labor Relations',
    'Discrimination Prevention & Defense',
    'HR Law Fundamentals',
    'Employment Law Update',
    'Special Issues in Employment Law'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Jacqueline Kalk (recE209WG3XRLBwqB)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recE209WG3XRLBwqB'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Certificate in Strategic HR Leadership',
    'Comprehensive Labor Relations',
    'Discrimination Prevention & Defense',
    'HR Law Fundamentals',
    'Special Issues in Employment Law',
    'Employment Law Update'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Ethan Ware (recjQKD6kupvQez7x) - No qualifications listed in export

-- Grant Gibeau (recdn3uoqPDiICi9a)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recdn3uoqPDiICi9a'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Comprehensive Labor Relations',
    'Certificate in Strategic HR Leadership',
    'Discrimination Prevention & Defense',
    'HR Law Fundamentals',
    'Special Issues in Employment Law',
    'Employment Law Update'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Sara Hamilton (rec151X9izCWMb6J0)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'rec151X9izCWMb6J0'
  AND p.name IN (
    'Certificate in Employee Relations Law',
    'Comprehensive Labor Relations',
    'Special Issues in Employment Law',
    'Employment Law Update',
    'HR Law Fundamentals',
    'Certificate in Strategic HR Leadership',
    'Certificate in Workplace Investigations',
    'Discrimination Prevention & Defense'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Carolyn Trenda (recCLLeqJoitUFFqe)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recCLLeqJoitUFFqe'
  AND p.name IN (
    'Certificate in Employee Benefits Law',
    'Welfare Benefits Plan Issues'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- Leah Morgan Singleton (recbL3cYq9RfH8nkS)
INSERT INTO faculty_scheduler.instructor_qualifications (faculty_id, program_id)
SELECT f.id, p.id
FROM faculty f
CROSS JOIN programs p
WHERE f.airtable_record_id = 'recbL3cYq9RfH8nkS'
  AND p.name IN (
    'Certificate in Employee Benefits Law',
    'Retirement Plans'
  )
ON CONFLICT (faculty_id, program_id) DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Check qualification counts per instructor
SELECT
  f.full_name,
  f.airtable_record_id,
  COUNT(iq.id) as qualification_count
FROM faculty f
LEFT JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
WHERE f.faculty_status = 'active'
GROUP BY f.id, f.full_name, f.airtable_record_id
ORDER BY qualification_count DESC;

-- Check qualification counts per program
SELECT
  p.name,
  COUNT(iq.id) as instructor_count
FROM programs p
LEFT JOIN faculty_scheduler.instructor_qualifications iq ON iq.program_id = p.id
GROUP BY p.id, p.name
ORDER BY instructor_count DESC;
