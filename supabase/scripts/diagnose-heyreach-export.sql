-- Run these ONE AT A TIME in Supabase SQL editor

-- Query 1: Total contacts matching past_participant_unverified criteria
SELECT
  COUNT(*) as total_matching_segment
FROM contacts c
WHERE c.linkedin_url IS NOT NULL
  AND c.linkedin_url != ''
  AND c.lifecycle_stage = 'customer'
  AND (c.email IS NULL OR c.email = '' OR c.email_validation_result IS NULL OR c.email_validation_result != 'valid');
