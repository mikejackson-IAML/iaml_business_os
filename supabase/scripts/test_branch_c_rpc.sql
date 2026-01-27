-- TEST FUNCTION - Returns mock data for workflow branch testing
-- Delete after testing is complete

CREATE OR REPLACE FUNCTION public.get_branch_c_contacts_test()
RETURNS TABLE (
  campaign_contact_id UUID,
  contact_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  linkedin_url TEXT,
  company TEXT,
  job_title TEXT,
  current_message_sent_at TIMESTAMPTZ
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    '00000000-0000-0000-0000-000000000001'::UUID as campaign_contact_id,
    '00000000-0000-0000-0000-000000000002'::UUID as contact_id,
    'Test'::TEXT as first_name,
    'Contact'::TEXT as last_name,
    'test.branch.c@example.com'::TEXT as email,
    'https://linkedin.com/in/test-branch-c'::TEXT as linkedin_url,
    'Test Company Inc'::TEXT as company,
    'Senior Manager'::TEXT as job_title,
    '2026-01-15T10:00:00Z'::TIMESTAMPTZ as current_message_sent_at;
$$;
