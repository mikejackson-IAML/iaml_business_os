-- Export contacts with Sales Navigator URLs (not exportable to HeyReach)
-- Run in Supabase SQL editor and download as CSV

SELECT
  c.id as contact_id,
  c.first_name,
  c.last_name,
  c.email,
  c.company,
  c.job_title,
  c.linkedin_url,
  c.lifecycle_stage,
  c.email_validation_result,
  'Sales Navigator URL - needs conversion to /in/ format' as reason_not_exported
FROM contacts c
WHERE c.linkedin_url IS NOT NULL
  AND c.linkedin_url != ''
  AND c.linkedin_url LIKE '%/sales/lead/%'
ORDER BY c.last_name, c.first_name;
