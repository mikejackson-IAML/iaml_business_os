-- Programs Data Seed Script
-- Auto-generated from Airtable cache
-- Generated: 2026-01-13T21:38:40.409Z
-- Source: website/data/sessions/all-sessions.json (70 records)
--
-- Run this AFTER the migration: 20260113_create_programs_schema.sql
-- Execute in Supabase SQL Editor

-- ============================================
-- INSERT PROGRAM INSTANCES
-- ============================================
INSERT INTO program_instances (airtable_id, instance_name, program_name, format, start_date, end_date, city, state, venue_name, current_enrolled, min_capacity, max_capacity, status)
VALUES
  ('recsm3SJPND7THiek', 'Certificate in Employee Relations Law - On-Demand', 'Certificate in Employee Relations Law', 'on-demand', NULL, NULL, NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recLn8qemP7myFBGh', 'Certificate in Strategic HR Leadership - On-Demand', 'Certificate in Strategic HR Leadership', 'on-demand', NULL, NULL, NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recHCPRTGwaHtfEP2', 'Certificate in Workplace Investigations - On-Demand', 'Certificate in Workplace Investigations', 'on-demand', NULL, NULL, NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('reccxSwSjAnBVreya', 'Employment Law Update - Jan 2026', 'Employment Law Update', 'virtual', '2026-01-13', '2026-01-13', NULL, NULL, NULL, 0, 10, 35, 'completed'),
  ('reclhhizrq2InOwXK', 'Comprehensive Labor Relations - Feb 2026', 'Comprehensive Labor Relations', 'virtual', '2026-02-24', '2026-02-25', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recBRI5xcqKfu2gcW', 'Discrimination Prevention & Defense - Mar 2026', 'Discrimination Prevention & Defense', 'virtual', '2026-03-03', '2026-03-04', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recrhlhzP0VShYlBJ', 'Certificate in Workplace Investigations - Apr 2026', 'Certificate in Workplace Investigations', 'virtual', '2026-04-01', '2026-04-02', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recD22Xt6zLxse1jV', 'Employment Law Update - Apr 2026', 'Employment Law Update', 'virtual', '2026-04-14', '2026-04-14', NULL, NULL, NULL, 0, 10, 35, 'scheduled'),
  ('rec5lQK6AiXTWi2FM', 'Comprehensive Labor Relations - Apr 2026 - Atlanta', 'Comprehensive Labor Relations', 'in-person', '2026-04-20', '2026-04-21', 'Atlanta', 'Georgia', NULL, 0, 6, 35, 'scheduled'),
  ('rec7JtugriqYG5oTV', 'Certificate in Workplace Investigations - Apr 2026 - Atlanta', 'Certificate in Workplace Investigations', 'in-person', '2026-04-20', '2026-04-21', 'Atlanta', 'Georgia', NULL, 0, 6, 35, 'scheduled'),
  ('recBFzMowFsTIIhRP', 'Certificate in Employee Relations Law - Apr 2026 - Atlanta', 'Certificate in Employee Relations Law', 'in-person', '2026-04-20', '2026-04-24', 'Atlanta', 'Georgia', NULL, 0, 6, 35, 'scheduled'),
  ('recQVoaxrQPnaKMmj', 'Certificate in Employee Benefits Law - Apr 2026 - Atlanta', 'Certificate in Employee Benefits Law', 'in-person', '2026-04-20', '2026-04-24', 'Atlanta', 'Georgia', NULL, 0, 4, 35, 'scheduled'),
  ('recoVdgmjpeIFSYkM', 'Retirement Plans - Apr 2026 - Atlanta', 'Retirement Plans', 'in-person', '2026-04-20', '2026-04-21', 'Atlanta', 'Georgia', NULL, 0, 4, 35, 'scheduled'),
  ('rec5p3nEP7H8e1082', 'Discrimination Prevention & Defense - Apr 2026 - Atlanta', 'Discrimination Prevention & Defense', 'in-person', '2026-04-22', '2026-04-23', 'Atlanta', 'Georgia', NULL, 0, 6, 35, 'scheduled'),
  ('rec8gwGLYMnmU1OuD', '"Benefit Plan Claims, Appeals & Litigation" - Apr 2026 - Atlanta', 'Benefit Plan Claims, Appeals & Litigation', 'in-person', '2026-04-22', '2026-04-22', 'Atlanta', 'Georgia', NULL, 0, 4, 35, 'scheduled'),
  ('rectEjQZZj0EnoxkL', 'Welfare Benefits Plan Issues - Apr 2026 - Atlanta', 'Welfare Benefits Plan Issues', 'in-person', '2026-04-23', '2026-04-24', 'Atlanta', 'Georgia', NULL, 0, 4, 35, 'scheduled'),
  ('recW2tUVG70mRPOH1', 'Special Issues in Employment Law - Apr 2026 - Atlanta', 'Special Issues in Employment Law', 'in-person', '2026-04-24', '2026-04-24', 'Atlanta', 'Georgia', NULL, 0, 6, 35, 'scheduled'),
  ('recTkMXguVGCwZ49Q', 'HR Law Fundamentals - Apr 2026', 'HR Law Fundamentals', 'virtual', '2026-04-28', '2026-04-29', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recMpddFPKb7V9HC0', 'HR Law Fundamentals - May 2026 - Chicago', 'HR Law Fundamentals', 'in-person', '2026-05-04', '2026-05-05', 'Chicago', 'Illinois', NULL, 0, 6, 35, 'scheduled'),
  ('rectrqOHhfKr5IdxO', 'Advanced Certificate in Strategic Employment Law - May 2026 - Chicago', 'Advanced Certificate in Strategic Employment Law', 'in-person', '2026-05-04', '2026-05-05', 'Chicago', 'Illinois', NULL, 0, 6, 35, 'scheduled'),
  ('recu2mfHbANqF5R0k', 'Certificate in Strategic HR Leadership - May 2026 - Chicago', 'Certificate in Strategic HR Leadership', 'in-person', '2026-05-04', '2026-05-08', 'Chicago', 'Illinois', 'Flamingo Las Vegas', 0, 6, 35, 'scheduled'),
  ('recnvtYRj2LPVINnj', 'Strategic HR Management - May 2026 - Chicago', 'Strategic HR Management', 'in-person', '2026-05-06', '2026-05-08', 'Chicago', 'Illinois', NULL, 0, 6, 35, 'scheduled'),
  ('recHs4nhaimFJAla3', 'Strategic HR Management - May 2026', 'Strategic HR Management', 'virtual', '2026-05-19', '2026-05-20', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('rec5mJpQ47RrqnRh3', 'Comprehensive Labor Relations - Jun 2026 - Scottsdale', 'Comprehensive Labor Relations', 'in-person', '2026-06-01', '2026-06-02', 'Scottsdale', 'Arizona', NULL, 0, 6, 35, 'scheduled'),
  ('recWqOEM5M3ctIhZP', 'Certificate in Employee Relations Law - Jun 2026 - Scottsdale', 'Certificate in Employee Relations Law', 'in-person', '2026-06-01', '2026-06-05', 'Scottsdale', 'Arizona', NULL, 0, 6, 35, 'scheduled'),
  ('recgJs6YL6jkpsP0P', 'Advanced Certificate in Strategic Employment Law - Jun 2026 - Scottsdale', 'Advanced Certificate in Strategic Employment Law', 'in-person', '2026-06-01', '2026-06-02', 'Scottsdale', 'Arizona', NULL, 0, 6, 35, 'scheduled'),
  ('recmvIF9Y78c8ejIL', 'Discrimination Prevention & Defense - Jun 2026 - Scottsdale', 'Discrimination Prevention & Defense', 'in-person', '2026-06-03', '2026-06-04', 'Scottsdale', 'Arizona', NULL, 0, 6, 35, 'scheduled'),
  ('recpuUsdMkwED8po3', 'Special Issues in Employment Law - Jun 2026 - Scottsdale', 'Special Issues in Employment Law', 'in-person', '2026-06-05', '2026-06-05', 'Scottsdale', 'Arizona', NULL, 0, 6, 35, 'scheduled'),
  ('recixY4EiubcUpVOL', 'Certificate in Employee Relations Law - Jun 2026 - Austin', 'Certificate in Employee Relations Law', 'in-person', '2026-06-08', '2026-06-12', 'Austin', 'Texas', NULL, 0, 6, 35, 'scheduled'),
  ('recnbMyAEoKEqoo52', 'Comprehensive Labor Relations - Jun 2026 - Austin', 'Comprehensive Labor Relations', 'in-person', '2026-06-08', '2026-06-09', 'Austin', 'Texas', NULL, 0, 6, 35, 'scheduled'),
  ('recXtTRwoIHVgDJvq', 'Special Issues in Employment Law - Jun 2026 - Austin', 'Special Issues in Employment Law', 'in-person', '2026-06-12', '2026-06-12', 'Austin', 'Texas', NULL, 0, 6, 35, 'scheduled'),
  ('recHm3IJ1x8EZNxNJ', 'Certificate in Workplace Investigations - Jun 2026', 'Certificate in Workplace Investigations', 'virtual', '2026-06-16', '2026-06-17', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('receON6wNC3G5jX47', 'Employment Law Update - Jul 2026', 'Employment Law Update', 'virtual', '2026-07-09', '2026-07-09', NULL, NULL, NULL, 0, 10, 35, 'scheduled'),
  ('rec4lgqM8BBmDTGyT', 'HR Law Fundamentals - Jul 2026 - Orlando', 'HR Law Fundamentals', 'in-person', '2026-07-13', '2026-07-14', 'Orlando', 'Florida', NULL, 0, 6, 35, 'scheduled'),
  ('recxQR88EYNCDWGKq', 'Certificate in Workplace Investigations - Jul 2026 - Orlando', 'Certificate in Workplace Investigations', 'in-person', '2026-07-13', '2026-07-14', 'Orlando', 'Florida', NULL, 0, 6, 35, 'scheduled'),
  ('recTp2Njdbk0x1oQL', 'Certificate in Strategic HR Leadership - Jul 2026 - Orlando', 'Certificate in Strategic HR Leadership', 'in-person', '2026-07-13', '2026-07-17', 'Orlando', 'Florida', NULL, 0, 6, 35, 'scheduled'),
  ('recJafcJsUBzQ7HYb', 'Strategic HR Management - Jul 2026 - Orlando', 'Strategic HR Management', 'in-person', '2026-07-15', '2026-07-17', 'Orlando', 'Florida', NULL, 0, 6, 35, 'scheduled'),
  ('rec8aicSb3WW8Oq3A', 'Comprehensive Labor Relations - Jul 2026', 'Comprehensive Labor Relations', 'virtual', '2026-07-21', '2026-07-22', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recqory4hEsh6LtJK', 'Discrimination Prevention & Defense - Jul 2026', 'Discrimination Prevention & Defense', 'virtual', '2026-07-28', '2026-07-29', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('rec5Btd6ZAqW3LZ2q', 'Comprehensive Labor Relations - Aug 2026 - Nashville', 'Comprehensive Labor Relations', 'in-person', '2026-08-10', '2026-08-11', 'Nashville', 'Tennessee', NULL, 0, 6, 35, 'scheduled'),
  ('rech2HTZ3JkcqY2Ve', 'Advanced Certificate in Strategic Employment Law - Aug 2026 - Nashville', 'Advanced Certificate in Strategic Employment Law', 'in-person', '2026-08-10', '2026-08-11', 'Nashville', 'Tennessee', NULL, 0, 6, 35, 'scheduled'),
  ('recy983tSyMrSx1L1', 'Certificate in Employee Relations Law - Aug 2026 - Nashville', 'Certificate in Employee Relations Law', 'in-person', '2026-08-10', '2026-08-14', 'Nashville', 'Tennessee', NULL, 0, 6, 35, 'scheduled'),
  ('recoWMXbMld9SLNq1', 'Discrimination Prevention & Defense - Aug 2026 - Nashville', 'Discrimination Prevention & Defense', 'in-person', '2026-08-12', '2026-08-13', 'Nashville', 'Tennessee', NULL, 0, 6, 35, 'scheduled'),
  ('recztbhz0aTFZgPvQ', 'Special Issues in Employment Law - Aug 2026 - Nashville', 'Special Issues in Employment Law', 'in-person', '2026-08-14', '2026-08-14', 'Nashville', 'Tennessee', NULL, 0, 6, 35, 'scheduled'),
  ('recD0Y01Dqavt6D0I', 'HR Law Fundamentals - Aug 2026', 'HR Law Fundamentals', 'virtual', '2026-08-18', '2026-08-19', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recZXDDCbwYZ0tXNQ', 'Strategic HR Management - Aug 2026', 'Strategic HR Management', 'virtual', '2026-08-25', '2026-08-26', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('rec6bjdYvJsfKEfxn', 'HR Law Fundamentals - Sep 2026 - Austin', 'HR Law Fundamentals', 'in-person', '2026-09-14', '2026-09-15', 'Austin', 'Texas', NULL, 0, 6, 35, 'scheduled'),
  ('recMMovVt5PoFLYI8', 'Retirement Plans - Sep 2026 - Austin', 'Retirement Plans', 'in-person', '2026-09-14', '2026-09-15', 'Austin', 'Texas', NULL, 0, 4, 35, 'scheduled'),
  ('recarKnheF7YXcfsZ', 'Certificate in Employee Benefits Law - Sep 2026 - Austin', 'Certificate in Employee Benefits Law', 'in-person', '2026-09-14', '2026-09-18', 'Austin', 'Texas', NULL, 0, 4, 35, 'scheduled'),
  ('recqgMiWi7apLIh6C', 'Certificate in Strategic HR Leadership - Sep 2026 - Austin', 'Certificate in Strategic HR Leadership', 'in-person', '2026-09-14', '2026-09-18', 'Austin', 'Texas', NULL, 0, 6, 35, 'scheduled'),
  ('recR83CSljj6xQkXx', '"Benefit Plan Claims, Appeals & Litigation" - Sep 2026 - Austin', 'Benefit Plan Claims, Appeals & Litigation', 'in-person', '2026-09-16', '2026-09-16', 'Austin', 'Texas', NULL, 0, 4, 35, 'scheduled'),
  ('recqmQL6iA8dII8fw', 'Strategic HR Management - Sep 2026 - Austin', 'Strategic HR Management', 'in-person', '2026-09-16', '2026-09-18', 'Austin', 'Texas', NULL, 0, 6, 35, 'scheduled'),
  ('receR1mAaflOWiI9G', 'Welfare Benefits Plan Issues - Sep 2026 - Austin', 'Welfare Benefits Plan Issues', 'in-person', '2026-09-17', '2026-09-18', 'Austin', 'Texas', NULL, 0, 4, 35, 'scheduled'),
  ('recJZJmSckeMGg7dQ', 'Certificate in Workplace Investigations - Sep 2026', 'Certificate in Workplace Investigations', 'virtual', '2026-09-22', '2026-09-23', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recn7pTeLe9wkMeqr', 'Advanced Certificate in Employee Benefits Law - Oct 2026 - Las Vegas', 'Advanced Certificate in Employee Benefits Law', 'in-person', '2026-10-05', '2026-10-06', 'Las Vegas', 'Nevada', NULL, 0, 4, 35, 'scheduled'),
  ('rec8EEiNYT3Qdv0Uf', 'Certificate in Workplace Investigations - Oct 2026 - Las Vegas', 'Certificate in Workplace Investigations', 'in-person', '2026-10-05', '2026-10-06', 'Las Vegas', 'Nevada', NULL, 0, 6, 35, 'scheduled'),
  ('recIqNJQs2kIZxzZQ', 'Certificate in Employee Relations Law - Oct 2026 - Las Vegas', 'Certificate in Employee Relations Law', 'in-person', '2026-10-05', '2026-10-09', 'Las Vegas', 'Nevada', NULL, 0, 6, 35, 'scheduled'),
  ('recq9grIWjcEPxJ0j', 'Comprehensive Labor Relations - Oct 2026 - Las Vegas', 'Comprehensive Labor Relations', 'in-person', '2026-10-05', '2026-10-06', 'Las Vegas', 'Nevada', NULL, 0, 6, 35, 'scheduled'),
  ('recd62W96Gbss3VIK', 'Discrimination Prevention & Defense - Oct 2026 - Las Vegas', 'Discrimination Prevention & Defense', 'in-person', '2026-10-07', '2026-10-08', 'Las Vegas', 'Nevada', NULL, 0, 6, 35, 'scheduled'),
  ('rec63CBYs1D1yH6kY', 'Special Issues in Employment Law - Oct 2026 - Las Vegas', 'Special Issues in Employment Law', 'in-person', '2026-10-09', '2026-10-09', 'Las Vegas', 'Nevada', NULL, 0, 6, 35, 'scheduled'),
  ('recyad1ITiPMIYsxA', 'Employment Law Update - Oct 2026', 'Employment Law Update', 'virtual', '2026-10-13', '2026-10-13', NULL, NULL, NULL, 0, 10, 35, 'scheduled'),
  ('recG1uOzJcD8N8yjB', 'Comprehensive Labor Relations - Oct 2026', 'Comprehensive Labor Relations', 'virtual', '2026-10-20', '2026-10-21', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('reczgd60n4j5KkuKH', 'Discrimination Prevention & Defense - Oct 2026', 'Discrimination Prevention & Defense', 'virtual', '2026-10-27', '2026-10-28', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recI2XdKl2a2MtDol', 'Advanced Certificate in Strategic Employment Law - Nov 2026 - Washington', 'Advanced Certificate in Strategic Employment Law', 'in-person', '2026-11-09', '2026-11-10', 'Washington', 'D.C.', NULL, 0, 6, 35, 'scheduled'),
  ('recn8m8EBsOFPmZQp', 'HR Law Fundamentals - Nov 2026 - Washington', 'HR Law Fundamentals', 'in-person', '2026-11-09', '2026-11-10', 'Washington', 'D.C.', NULL, 0, 6, 35, 'scheduled'),
  ('recRgkZNmkVAmSZZe', 'Certificate in Strategic HR Leadership - Nov 2026 - Washington', 'Certificate in Strategic HR Leadership', 'in-person', '2026-11-09', '2026-11-13', 'Washington', 'D.C.', NULL, 0, 6, 35, 'scheduled'),
  ('recaJ2FcqeCzsmWQW', 'Strategic HR Management - Nov 2026 - Washington', 'Strategic HR Management', 'in-person', '2026-11-11', '2026-11-13', 'Washington', 'D.C.', NULL, 0, 6, 35, 'scheduled'),
  ('recSPABJkrv5eIu74', 'HR Law Fundamentals - Nov 2026', 'HR Law Fundamentals', 'virtual', '2026-11-17', '2026-11-18', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recbyRzjvsOp52YQf', 'Strategic HR Management - Dec 2026', 'Strategic HR Management', 'virtual', '2026-12-08', '2026-12-09', NULL, NULL, NULL, 0, 6, 35, 'scheduled'),
  ('recQuyfaE93goYd4e', 'Certificate in Workplace Investigations - Dec 2026', 'Certificate in Workplace Investigations', 'virtual', '2026-12-15', '2026-12-16', NULL, NULL, NULL, 0, 6, 35, 'scheduled')
ON CONFLICT (airtable_id) DO UPDATE SET
  instance_name = EXCLUDED.instance_name,
  program_name = EXCLUDED.program_name,
  format = EXCLUDED.format,
  start_date = EXCLUDED.start_date,
  end_date = EXCLUDED.end_date,
  city = EXCLUDED.city,
  state = EXCLUDED.state,
  venue_name = EXCLUDED.venue_name,
  current_enrolled = EXCLUDED.current_enrolled,
  min_capacity = EXCLUDED.min_capacity,
  max_capacity = EXCLUDED.max_capacity,
  status = EXCLUDED.status,
  updated_at = NOW();

-- ============================================
-- CREATE READINESS RECORDS
-- ============================================
INSERT INTO program_readiness (program_instance_id)
SELECT id FROM program_instances
WHERE id NOT IN (SELECT program_instance_id FROM program_readiness)
ON CONFLICT (program_instance_id) DO NOTHING;

-- ============================================
-- INSERT ROOM BLOCKS
-- ============================================
INSERT INTO room_blocks (program_instance_id, hotel_name, rate_per_night, cutoff_date, booking_link, block_size)
SELECT id, 'Flamingo Las Vegas', 298, '2026-02-03', 'www.espn.com', 20
FROM program_instances WHERE airtable_id = 'recu2mfHbANqF5R0k'
ON CONFLICT DO NOTHING;

-- ============================================
-- INSERT FACULTY ASSIGNMENTS
-- ============================================
INSERT INTO faculty_assignments (program_instance_id, faculty_name, block_number)
SELECT id, 'Ray Deeny, Esq.', 1
FROM program_instances WHERE airtable_id = 'recTkMXguVGCwZ49Q'
ON CONFLICT DO NOTHING;

INSERT INTO faculty_assignments (program_instance_id, faculty_name, block_number)
SELECT id, 'John Wymer, Esq.', 1
FROM program_instances WHERE airtable_id = 'recu2mfHbANqF5R0k'
ON CONFLICT DO NOTHING;

INSERT INTO faculty_assignments (program_instance_id, faculty_name, block_number)
SELECT id, 'Ray Deeny, Esq.', 2
FROM program_instances WHERE airtable_id = 'recu2mfHbANqF5R0k'
ON CONFLICT DO NOTHING;

INSERT INTO faculty_assignments (program_instance_id, faculty_name, block_number)
SELECT id, 'Dawn Kubik, Esq.', 1
FROM program_instances WHERE airtable_id = 'recHs4nhaimFJAla3'
ON CONFLICT DO NOTHING;

-- ============================================
-- VERIFY DATA
-- ============================================
SELECT
  (SELECT COUNT(*) FROM program_instances) as programs_count,
  (SELECT COUNT(*) FROM program_readiness) as readiness_count,
  (SELECT COUNT(*) FROM room_blocks) as room_blocks_count,
  (SELECT COUNT(*) FROM faculty_assignments) as faculty_count;

