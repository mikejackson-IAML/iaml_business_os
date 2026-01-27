-- Check contacts table counts
-- Run this in Supabase SQL editor

-- Total count
SELECT COUNT(*) as total_contacts FROM contacts;

-- Breakdown by lifecycle stage
SELECT
  lifecycle_stage,
  COUNT(*) as count
FROM contacts
GROUP BY lifecycle_stage
ORDER BY count DESC;

-- Breakdown by email validation status
SELECT
  email_validation_result,
  COUNT(*) as count
FROM contacts
GROUP BY email_validation_result
ORDER BY count DESC;

-- Contacts with LinkedIn URLs
SELECT
  COUNT(*) as has_linkedin,
  COUNT(*) FILTER (WHERE linkedin_url IS NULL OR linkedin_url = '') as no_linkedin
FROM contacts;

-- Past participants (customers) breakdown
SELECT
  CASE
    WHEN email IS NULL OR email = '' THEN 'no_email'
    WHEN email_validation_result = 'valid' THEN 'verified_email'
    ELSE 'unverified_email'
  END as email_status,
  COUNT(*) as count
FROM contacts
WHERE lifecycle_stage = 'customer'
GROUP BY 1
ORDER BY count DESC;

-- Contacts ready for each HeyReach segment
SELECT
  'past_participant_verified' as segment,
  COUNT(*) as count
FROM contacts
WHERE lifecycle_stage = 'customer'
  AND email_validation_result = 'valid'
  AND linkedin_url IS NOT NULL AND linkedin_url != ''

UNION ALL

SELECT
  'past_participant_unverified' as segment,
  COUNT(*) as count
FROM contacts
WHERE lifecycle_stage = 'customer'
  AND (email_validation_result IS NULL OR email_validation_result != 'valid')
  AND linkedin_url IS NOT NULL AND linkedin_url != ''

UNION ALL

SELECT
  'cold_outreach' as segment,
  COUNT(*) as count
FROM contacts
WHERE lifecycle_stage = 'lead'
  AND linkedin_url IS NOT NULL AND linkedin_url != ''

UNION ALL

SELECT
  'company_insider' as segment,
  COUNT(*) as count
FROM contacts
WHERE lifecycle_stage = 'lead'
  AND linkedin_url IS NOT NULL AND linkedin_url != ''
  -- Would need company matching logic here
;
