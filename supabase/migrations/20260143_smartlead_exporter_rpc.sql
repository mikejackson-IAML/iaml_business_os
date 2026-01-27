-- RPC functions for Supabase to Smartlead Exporter workflow
-- Migration: 20260143

-- ============================================
-- FUNCTION: get_contacts_for_smartlead
-- Get contacts ready for Smartlead export
-- ============================================
CREATE OR REPLACE FUNCTION public.get_contacts_for_smartlead(
  p_campaign_id UUID DEFAULT 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'::UUID,
  p_channel_id UUID DEFAULT 'cc222222-3333-4444-5555-666677778888'::UUID
)
RETURNS TABLE (
  contact_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  campaign_contact_id UUID
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    c.id as contact_id,
    c.email,
    c.first_name,
    c.last_name,
    c.company,
    c.job_title,
    c.phone,
    c.linkedin_url,
    cc.id as campaign_contact_id
  FROM contacts c
  JOIN campaign_contacts cc ON c.id = cc.contact_id
  LEFT JOIN campaign_contact_channels ccc ON ccc.campaign_contact_id = cc.id
    AND ccc.campaign_channel_id = p_channel_id
  WHERE cc.campaign_id = p_campaign_id
    AND cc.status = 'active'
    AND c.email IS NOT NULL
    AND c.email != ''
    AND c.email_validation_result = 'valid'
    AND c.company_status = 'verified'
    AND ccc.id IS NULL;
$$;

-- ============================================
-- FUNCTION: create_smartlead_channel_records
-- Bulk insert channel records for exported contacts
-- ============================================
CREATE OR REPLACE FUNCTION public.create_smartlead_channel_records(
  p_campaign_contact_ids UUID[],
  p_channel_id UUID DEFAULT 'cc222222-3333-4444-5555-666677778888'::UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  INSERT INTO campaign_contact_channels (campaign_contact_id, campaign_channel_id, status)
  SELECT unnest(p_campaign_contact_ids), p_channel_id, 'active'
  ON CONFLICT (campaign_contact_id, campaign_channel_id) DO UPDATE SET
    status = 'active',
    updated_at = NOW();

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object('success', true, 'records_created', v_inserted);
END;
$$;

-- ============================================
-- FUNCTION: log_smartlead_export
-- Log export activity for all contacts in batch
-- ============================================
CREATE OR REPLACE FUNCTION public.log_smartlead_export(
  p_campaign_contact_ids UUID[],
  p_channel_id UUID DEFAULT 'cc222222-3333-4444-5555-666677778888'::UUID,
  p_batch_timestamp TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_inserted INTEGER;
BEGIN
  INSERT INTO campaign_activity (campaign_contact_id, campaign_channel_id, activity_type, channel, metadata)
  SELECT
    unnest(p_campaign_contact_ids),
    p_channel_id,
    'sent',
    'smartlead',
    jsonb_build_object(
      'export_batch', COALESCE(p_batch_timestamp, NOW()::TEXT),
      'total_in_batch', array_length(p_campaign_contact_ids, 1)
    );

  GET DIAGNOSTICS v_inserted = ROW_COUNT;

  RETURN json_build_object('success', true, 'activities_logged', v_inserted);
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_contacts_for_smartlead(UUID, UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.create_smartlead_channel_records(UUID[], UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_smartlead_export(UUID[], UUID, TEXT) TO anon, authenticated, service_role;
