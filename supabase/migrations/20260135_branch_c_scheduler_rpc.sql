-- RPC function for Branch C Scheduler workflow
-- Replaces direct Postgres connection with REST API call
-- Created: 2026-01-27

CREATE OR REPLACE FUNCTION public.get_branch_c_contacts()
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
    cc.id as campaign_contact_id,
    cc.contact_id,
    c.first_name,
    c.last_name,
    c.email,
    c.linkedin_url,
    c.company,
    c.job_title,
    ccc.current_message_sent_at
  FROM campaign_contacts cc
  JOIN contacts c ON c.id = cc.contact_id
  JOIN campaign_contact_channels ccc ON ccc.campaign_contact_id = cc.id
  JOIN campaign_channels ch ON ch.id = ccc.campaign_channel_id
  WHERE ch.channel = 'linkedin'
    AND ch.platform = 'heyreach'
    AND ccc.current_message_sent_at < NOW() - INTERVAL '7 days'
    AND ccc.has_replied = FALSE
    AND cc.ghl_branch IS NULL
    AND cc.status = 'active'
  LIMIT 100;
$$;

COMMENT ON FUNCTION public.get_branch_c_contacts IS 'Returns contacts ready for Branch C assignment (no response after 7 days on LinkedIn). Used by Branch C Scheduler workflow via REST API.';

-- Also create RPC for assign_ghl_branch if not already callable via REST
-- The existing assign_ghl_branch function should already be in public schema
