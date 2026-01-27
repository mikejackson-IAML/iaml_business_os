-- Diagnose past_participant_verified export gap
-- Run these ONE AT A TIME in Supabase SQL editor

-- Query 1: Total past_participant_verified contacts
SELECT
  'Total verified customers' as metric,
  COUNT(*) as count
FROM contacts c
WHERE c.lifecycle_stage = 'customer'
  AND c.email_validation_result = 'valid'
  AND c.linkedin_url IS NOT NULL
  AND c.linkedin_url != '';

-- Query 2: Breakdown by LinkedIn URL type
SELECT
  CASE
    WHEN linkedin_url LIKE '%/in/%' THEN 'Regular /in/ URL'
    WHEN linkedin_url LIKE '%/sales/lead/%' THEN 'Sales Navigator URL'
    ELSE 'Other format'
  END as url_type,
  COUNT(*) as count
FROM contacts c
WHERE c.lifecycle_stage = 'customer'
  AND c.email_validation_result = 'valid'
  AND c.linkedin_url IS NOT NULL
  AND c.linkedin_url != ''
GROUP BY 1
ORDER BY count DESC;

-- Query 3: Exportable contacts (matches workflow criteria)
SELECT
  'Exportable to HeyReach' as metric,
  COUNT(*) as count
FROM contacts c
WHERE c.lifecycle_stage = 'customer'
  AND c.email_validation_result = 'valid'
  AND c.linkedin_url IS NOT NULL
  AND c.linkedin_url != ''
  AND c.linkedin_url LIKE '%/in/%';

-- Query 4: How many were logged as exported?
SELECT
  'Logged in export table' as metric,
  COUNT(*) as count
FROM contact_heyreach_exports
WHERE segment_code = 'past_participant_verified';

-- Query 5: Check for duplicate LinkedIn URLs
SELECT
  'Duplicate LinkedIn URLs' as metric,
  COUNT(*) as count
FROM (
  SELECT linkedin_url
  FROM contacts c
  WHERE c.lifecycle_stage = 'customer'
    AND c.email_validation_result = 'valid'
    AND c.linkedin_url IS NOT NULL
    AND c.linkedin_url != ''
    AND c.linkedin_url LIKE '%/in/%'
  GROUP BY linkedin_url
  HAVING COUNT(*) > 1
) dups;

-- Query 6: Check unique LinkedIn URLs (what HeyReach actually gets)
SELECT
  'Unique LinkedIn URLs' as metric,
  COUNT(DISTINCT linkedin_url) as count
FROM contacts c
WHERE c.lifecycle_stage = 'customer'
  AND c.email_validation_result = 'valid'
  AND c.linkedin_url IS NOT NULL
  AND c.linkedin_url != ''
  AND c.linkedin_url LIKE '%/in/%';
