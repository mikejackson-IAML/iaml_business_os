-- Create get_or_create_campaign_context RPC for HeyReach Activity Receiver
-- This RPC was referenced by the workflow but never created

CREATE OR REPLACE FUNCTION public.get_or_create_campaign_context(
  p_campaign_id UUID,
  p_contact_id UUID,
  p_channel_id UUID
) RETURNS JSONB AS $$
DECLARE
  v_campaign_contact_id UUID;
  v_campaign_contact_channel_id UUID;
BEGIN
  -- Look up campaign_contact
  SELECT id INTO v_campaign_contact_id
  FROM public.campaign_contacts
  WHERE campaign_id = p_campaign_id AND contact_id = p_contact_id
  LIMIT 1;

  IF v_campaign_contact_id IS NULL THEN
    RETURN jsonb_build_object('found', false, 'reason', 'no_campaign_contact');
  END IF;

  -- Get or create campaign_contact_channel
  SELECT id INTO v_campaign_contact_channel_id
  FROM public.campaign_contact_channels
  WHERE campaign_contact_id = v_campaign_contact_id AND campaign_channel_id = p_channel_id
  LIMIT 1;

  IF v_campaign_contact_channel_id IS NULL THEN
    INSERT INTO public.campaign_contact_channels (campaign_contact_id, campaign_channel_id, status)
    VALUES (v_campaign_contact_id, p_channel_id, 'active')
    RETURNING id INTO v_campaign_contact_channel_id;
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'campaign_contact_id', v_campaign_contact_id,
    'campaign_contact_channel_id', v_campaign_contact_channel_id,
    'campaign_channel_id', p_channel_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
