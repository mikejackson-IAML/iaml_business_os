-- Delete cold_outreach and company_insider contacts from Supabase
-- Run this in Supabase SQL editor
-- Created: 2026-01-19

-- Preview what will be deleted (all leads)
SELECT
  id,
  first_name,
  last_name,
  email,
  company,
  lifecycle_stage
FROM contacts
WHERE lifecycle_stage = 'lead';

-- Count before delete
SELECT
  'Before delete' as status,
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE lifecycle_stage = 'lead') as leads_to_delete
FROM contacts;

-- DELETE all leads (cold_outreach and company_insider)
DELETE FROM contacts
WHERE lifecycle_stage = 'lead';

-- Count after delete
SELECT
  'After delete' as status,
  COUNT(*) as total_contacts
FROM contacts;
