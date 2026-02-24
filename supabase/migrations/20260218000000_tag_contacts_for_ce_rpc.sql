-- RPC: tag_contacts_for_ce
-- Called by the Colleague Expansion Trigger n8n workflow
-- Tags all valid HR contacts at a company for the SL-CE SmartLead campaign
-- Returns the list of tagged contacts for count reporting

CREATE OR REPLACE FUNCTION public.tag_contacts_for_ce(
  p_company_pattern text,
  p_exclude_email text DEFAULT ''
)
RETURNS TABLE(id uuid, email text, first_name text, last_name text, company text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  UPDATE public.contacts c
  SET
    smartlead_status = 'queued_ce',
    updated_at = NOW()
  WHERE
    c.company ILIKE p_company_pattern
    AND c.email IS NOT NULL
    AND c.email != ''
    AND COALESCE(c.email_validation_result, 'unknown') != 'invalid'
    AND COALESCE(c.smartlead_status, '') NOT IN ('unsubscribed', 'bounced', 'queued_ce', 'national_drip')
    AND c.email != p_exclude_email
  RETURNING c.id, c.email, c.first_name, c.last_name, c.company;
END;
$$;

-- Grant access to service role (used by n8n via REST API)
GRANT EXECUTE ON FUNCTION public.tag_contacts_for_ce(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.tag_contacts_for_ce(text, text) TO authenticated;
