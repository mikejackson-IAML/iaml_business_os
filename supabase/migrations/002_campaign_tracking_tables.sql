-- ============================================================================
-- MIGRATION 002: Campaign Tracking Tables
-- ============================================================================
-- Run this AFTER 001_core_foundation_tables.sql
-- Creates: contacts, multichannel_campaigns, campaign_channels, campaign_messages,
--          message_variants, campaign_contacts, campaign_contact_channels,
--          campaign_activity, and helper functions
-- Reference: business-os/docs/architecture/08-CAMPAIGN-TRACKING.md
-- ============================================================================

-- ============================================================================
-- CONTACTS (Central contact repository)
-- ============================================================================
CREATE TABLE IF NOT EXISTS contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,

  -- Company verification (for past participants)
  company_status TEXT,
  company_verified_at TIMESTAMPTZ,
  previous_company TEXT,

  -- Email validation tracking
  email_status TEXT CHECK (email_status IN ('unknown', 'valid', 'invalid', 'catch_all', 'bounced')),
  email_validated_at TIMESTAMPTZ,
  email_validation_source TEXT,
  email_validation_result TEXT,
  email_validation_details JSONB DEFAULT '{}',

  -- Lifecycle
  lifecycle_stage TEXT DEFAULT 'lead',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin ON contacts(linkedin_url);
CREATE INDEX IF NOT EXISTS idx_contacts_company_status ON contacts(company_status);
CREATE INDEX IF NOT EXISTS idx_contacts_email_validation ON contacts(email_validation_result, email_validated_at);

-- Normalized LinkedIn URL index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_normalized
  ON contacts(LOWER(REPLACE(REPLACE(linkedin_url, 'https://', ''), 'http://', '')));

-- ============================================================================
-- MULTICHANNEL_CAMPAIGNS (Master campaign record)
-- ============================================================================
CREATE TABLE IF NOT EXISTS multichannel_campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT,

  -- Offers
  primary_offer TEXT,
  primary_offer_value TEXT,
  secondary_offer TEXT,
  secondary_offer_programs TEXT[],

  -- Status
  status TEXT DEFAULT 'draft',

  -- Timeline
  planned_start_date DATE,
  planned_end_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_status ON multichannel_campaigns(status);

-- ============================================================================
-- CAMPAIGN_CHANNELS (Individual channels within a campaign)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES multichannel_campaigns(id) ON DELETE CASCADE,

  channel TEXT NOT NULL,
  platform TEXT,
  internal_name TEXT,
  platform_campaign_id TEXT,

  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,

  -- Settings
  settings JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'draft',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_channels_campaign ON campaign_channels(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_channels_platform ON campaign_channels(platform, platform_campaign_id);

-- ============================================================================
-- CAMPAIGN_MESSAGES (Message templates for each channel)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES multichannel_campaigns(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES campaign_channels(id) ON DELETE CASCADE,

  message_code TEXT NOT NULL,
  message_name TEXT NOT NULL,
  message_type TEXT,

  -- Sequence position
  sequence_order INTEGER,
  days_after_previous INTEGER,

  -- Content
  subject_line TEXT,
  body_content TEXT,

  -- Conditions
  send_condition TEXT,

  -- GHL branch (for GHL channel)
  ghl_branch TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_campaign_messages_campaign ON campaign_messages(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_messages_channel ON campaign_messages(channel_id);

-- ============================================================================
-- MESSAGE_VARIANTS (A/B test variants)
-- ============================================================================
CREATE TABLE IF NOT EXISTS message_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  message_id UUID REFERENCES campaign_messages(id) ON DELETE CASCADE,

  variant_code TEXT NOT NULL,
  variant_name TEXT,

  -- Content override
  subject_line TEXT,
  body_content TEXT,

  -- Traffic allocation
  traffic_percentage INTEGER DEFAULT 33,

  -- Performance tracking
  sends INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_variants_message ON message_variants(message_id);

-- ============================================================================
-- CAMPAIGN_CONTACTS (Contact's journey through a campaign)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID REFERENCES multichannel_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,

  -- Lifecycle tracking
  lifecycle_tag TEXT DEFAULT 'STANDARD',
  lifecycle_tag_updated_at TIMESTAMPTZ,

  -- GHL branch assignment
  ghl_branch TEXT,
  branch_assigned_at TIMESTAMPTZ,
  branch_trigger_channel TEXT,
  branch_trigger_event TEXT,

  -- Primary offer (Quarterly Updates)
  quarterly_update_registered BOOLEAN DEFAULT FALSE,
  quarterly_update_registered_at TIMESTAMPTZ,
  quarterly_update_first_session_attended BOOLEAN DEFAULT FALSE,

  -- Secondary offer (Virtual Training)
  secondary_offer_interested BOOLEAN DEFAULT FALSE,
  secondary_offer_interested_at TIMESTAMPTZ,
  secondary_offer_accepted BOOLEAN DEFAULT FALSE,
  secondary_offer_accepted_at TIMESTAMPTZ,
  secondary_offer_program TEXT,
  secondary_offer_recipient TEXT,

  -- Colleague referral
  colleague_name TEXT,
  colleague_email TEXT,
  colleague_registered BOOLEAN DEFAULT FALSE,

  -- Status
  status TEXT DEFAULT 'active',
  opted_out_at TIMESTAMPTZ,
  opt_out_reason TEXT,
  opt_out_channel TEXT,

  -- Timeline
  entered_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,

  -- Engagement summary
  total_touches INTEGER DEFAULT 0,
  first_touch_at TIMESTAMPTZ,
  last_touch_at TIMESTAMPTZ,
  first_engagement_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_id, contact_id)
);

CREATE INDEX IF NOT EXISTS idx_campaign_contacts_campaign ON campaign_contacts(campaign_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_contact ON campaign_contacts(contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_branch ON campaign_contacts(ghl_branch);
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_status ON campaign_contacts(status);

-- ============================================================================
-- CAMPAIGN_CONTACT_CHANNELS (Per-channel status for each contact)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_contact_channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  campaign_channel_id UUID REFERENCES campaign_channels(id) ON DELETE CASCADE,

  -- Message progress
  current_message_code TEXT,
  current_message_sent_at TIMESTAMPTZ,
  next_message_code TEXT,
  next_message_scheduled_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'pending',

  -- LinkedIn-specific
  linkedin_connected BOOLEAN DEFAULT FALSE,
  linkedin_connected_at TIMESTAMPTZ,
  linkedin_connection_request_sent BOOLEAN DEFAULT FALSE,
  linkedin_connection_request_sent_at TIMESTAMPTZ,

  -- Email-specific
  last_email_sent_at TIMESTAMPTZ,
  last_email_opened_at TIMESTAMPTZ,
  last_email_clicked_at TIMESTAMPTZ,

  -- Phone-specific
  call_attempts INTEGER DEFAULT 0,
  last_call_at TIMESTAMPTZ,
  last_call_duration_seconds INTEGER,
  last_call_outcome TEXT,
  callback_scheduled_at TIMESTAMPTZ,
  callback_notes TEXT,

  -- Engagement
  engagement_level TEXT DEFAULT 'cold',
  has_replied BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  reply_sentiment TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(campaign_contact_id, campaign_channel_id)
);

CREATE INDEX IF NOT EXISTS idx_ccc_campaign_contact ON campaign_contact_channels(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_ccc_campaign_channel ON campaign_contact_channels(campaign_channel_id);
CREATE INDEX IF NOT EXISTS idx_ccc_status ON campaign_contact_channels(status);
CREATE INDEX IF NOT EXISTS idx_ccc_linkedin_status ON campaign_contact_channels(linkedin_connected, linkedin_connection_request_sent);

-- ============================================================================
-- CAMPAIGN_ACTIVITY (Event log for all campaign activities)
-- ============================================================================
CREATE TABLE IF NOT EXISTS campaign_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  campaign_channel_id UUID REFERENCES campaign_channels(id),
  message_id UUID REFERENCES campaign_messages(id),
  variant_id UUID REFERENCES message_variants(id),

  activity_type TEXT NOT NULL,
  activity_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT,
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint on activity_type
ALTER TABLE campaign_activity DROP CONSTRAINT IF EXISTS campaign_activity_activity_type_check;
ALTER TABLE campaign_activity ADD CONSTRAINT campaign_activity_activity_type_check
CHECK (activity_type IN (
  -- Send/delivery events
  'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'unsubscribed',
  -- LinkedIn events
  'profile_viewed', 'connection_sent', 'connection_accepted', 'connection_rejected',
  'message_sent', 'message_read', 'message_replied',
  -- Phone events
  'call_attempted', 'call_connected', 'call_no_answer', 'voicemail_left',
  'callback_scheduled', 'callback_completed',
  -- Conversion events
  'quarterly_registered', 'quarterly_attended',
  'secondary_interested', 'secondary_accepted', 'colleague_referred',
  -- System events
  'tag_changed', 'branch_assigned', 'status_changed', 'opted_out',
  -- Error events
  'webhook_received', 'contact_created', 'match_failed'
));

CREATE INDEX IF NOT EXISTS idx_campaign_activity_contact ON campaign_activity(campaign_contact_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_channel ON campaign_activity(campaign_channel_id);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_type ON campaign_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_campaign_activity_at ON campaign_activity(activity_at);

-- Index for de-duplication on HeyReach event ID
CREATE INDEX IF NOT EXISTS idx_campaign_activity_heyreach_event
  ON campaign_activity((metadata->>'heyreach_event_id'));

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to update lifecycle tag and log the change
CREATE OR REPLACE FUNCTION update_contact_lifecycle_tag(
  p_campaign_contact_id UUID,
  p_new_tag TEXT,
  p_trigger_channel TEXT DEFAULT NULL,
  p_trigger_event TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE campaign_contacts
  SET
    lifecycle_tag = p_new_tag,
    lifecycle_tag_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = p_campaign_contact_id;

  INSERT INTO campaign_activity (
    campaign_contact_id,
    activity_type,
    channel,
    metadata
  ) VALUES (
    p_campaign_contact_id,
    'tag_changed',
    COALESCE(p_trigger_channel, 'system'),
    jsonb_build_object(
      'new_tag', p_new_tag,
      'trigger_event', p_trigger_event
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Function to assign GHL branch
CREATE OR REPLACE FUNCTION assign_ghl_branch(
  p_campaign_contact_id UUID,
  p_trigger_channel TEXT,
  p_trigger_event TEXT
) RETURNS TEXT AS $$
DECLARE
  v_branch TEXT;
  v_existing_branch TEXT;
BEGIN
  -- Check if already assigned
  SELECT ghl_branch INTO v_existing_branch
  FROM campaign_contacts
  WHERE id = p_campaign_contact_id;

  -- Don't re-assign if already has a branch
  IF v_existing_branch IS NOT NULL THEN
    RETURN v_existing_branch;
  END IF;

  -- Determine branch based on trigger event
  v_branch := CASE
    WHEN p_trigger_event IN ('positive_reply', 'interested', 'call_interested', 'yes_reply') THEN 'A'
    WHEN p_trigger_event IN ('interested_secondary', 'wants_virtual_training') THEN 'A+'
    WHEN p_trigger_event IN ('not_now_polite', 'maybe_later', 'call_not_now') THEN 'B'
    WHEN p_trigger_event IN ('no_contact_exhausted', 'calls_exhausted', 'no_response') THEN 'C'
    WHEN p_trigger_event IN ('not_interested', 'unsubscribe') THEN NULL
    ELSE NULL
  END;

  IF v_branch IS NOT NULL THEN
    UPDATE campaign_contacts
    SET
      ghl_branch = v_branch,
      branch_assigned_at = NOW(),
      branch_trigger_channel = p_trigger_channel,
      branch_trigger_event = p_trigger_event,
      updated_at = NOW()
    WHERE id = p_campaign_contact_id;

    INSERT INTO campaign_activity (
      campaign_contact_id,
      activity_type,
      channel,
      metadata
    ) VALUES (
      p_campaign_contact_id,
      'branch_assigned',
      p_trigger_channel,
      jsonb_build_object(
        'branch', v_branch,
        'trigger_event', p_trigger_event
      )
    );
  END IF;

  RETURN v_branch;
END;
$$ LANGUAGE plpgsql;

-- Function to handle opt-out
CREATE OR REPLACE FUNCTION handle_opt_out(
  p_campaign_contact_id UUID,
  p_channel TEXT,
  p_reason TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE campaign_contacts
  SET
    status = 'opted_out',
    opted_out_at = NOW(),
    opt_out_reason = p_reason,
    opt_out_channel = p_channel,
    lifecycle_tag = 'OPT OUT',
    updated_at = NOW()
  WHERE id = p_campaign_contact_id;

  -- Pause all channel activities
  UPDATE campaign_contact_channels
  SET
    status = 'paused',
    updated_at = NOW()
  WHERE campaign_contact_id = p_campaign_contact_id;

  INSERT INTO campaign_activity (
    campaign_contact_id,
    activity_type,
    channel,
    metadata
  ) VALUES (
    p_campaign_contact_id,
    'opted_out',
    p_channel,
    jsonb_build_object('reason', p_reason)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- Campaign funnel view
CREATE OR REPLACE VIEW campaign_funnel AS
SELECT
  mc.id as campaign_id,
  mc.name as campaign_name,
  COUNT(cc.id) as total_contacts,
  COUNT(cc.id) FILTER (WHERE cc.status = 'active') as active_contacts,
  COUNT(cc.id) FILTER (WHERE cc.first_engagement_at IS NOT NULL) as engaged_contacts,
  COUNT(cc.id) FILTER (WHERE cc.ghl_branch IS NOT NULL) as qualified_contacts,
  COUNT(cc.id) FILTER (WHERE cc.ghl_branch = 'A') as branch_a_count,
  COUNT(cc.id) FILTER (WHERE cc.ghl_branch = 'A+') as branch_a_plus_count,
  COUNT(cc.id) FILTER (WHERE cc.ghl_branch = 'B') as branch_b_count,
  COUNT(cc.id) FILTER (WHERE cc.ghl_branch = 'C') as branch_c_count,
  COUNT(cc.id) FILTER (WHERE cc.quarterly_update_registered = TRUE) as registered_contacts
FROM multichannel_campaigns mc
LEFT JOIN campaign_contacts cc ON cc.campaign_id = mc.id
GROUP BY mc.id, mc.name;

-- Channel performance view
CREATE OR REPLACE VIEW channel_performance AS
SELECT
  ch.id as channel_id,
  ch.campaign_id,
  ch.channel,
  ch.platform,
  COUNT(ccc.id) as total_contacts,
  COUNT(ccc.id) FILTER (WHERE ccc.status = 'active') as active,
  COUNT(ccc.id) FILTER (WHERE ccc.status = 'paused') as paused,
  COUNT(ccc.id) FILTER (WHERE ccc.has_replied = TRUE) as replied,
  COUNT(ccc.id) FILTER (WHERE ccc.linkedin_connected = TRUE) as linkedin_connected,
  COUNT(ccc.id) FILTER (WHERE ccc.engagement_level = 'hot') as hot_leads
FROM campaign_channels ch
LEFT JOIN campaign_contact_channels ccc ON ccc.campaign_channel_id = ch.id
GROUP BY ch.id, ch.campaign_id, ch.channel, ch.platform;

-- Contacts needing Branch C assignment (no response after 7 days)
CREATE OR REPLACE VIEW contacts_for_branch_c AS
SELECT
  cc.id as campaign_contact_id,
  cc.contact_id,
  c.first_name,
  c.last_name,
  c.email,
  c.linkedin_url,
  ccc.current_message_code,
  ccc.current_message_sent_at,
  ch.campaign_id
FROM campaign_contacts cc
JOIN contacts c ON c.id = cc.contact_id
JOIN campaign_contact_channels ccc ON ccc.campaign_contact_id = cc.id
JOIN campaign_channels ch ON ch.id = ccc.campaign_channel_id
WHERE ch.channel = 'linkedin'
  AND ccc.current_message_code = 'L3'
  AND ccc.current_message_sent_at < NOW() - INTERVAL '7 days'
  AND ccc.has_replied = FALSE
  AND cc.ghl_branch IS NULL
  AND cc.status = 'active';

-- ============================================================================
-- UPDATE TRIGGERS
-- ============================================================================

CREATE TRIGGER update_contacts_updated_at
  BEFORE UPDATE ON contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_multichannel_campaigns_updated_at
  BEFORE UPDATE ON multichannel_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_channels_updated_at
  BEFORE UPDATE ON campaign_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_contacts_updated_at
  BEFORE UPDATE ON campaign_contacts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaign_contact_channels_updated_at
  BEFORE UPDATE ON campaign_contact_channels
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE contacts IS 'Central contact repository - all leads, customers, and past participants';
COMMENT ON TABLE multichannel_campaigns IS 'Master campaign records for multi-channel outreach';
COMMENT ON TABLE campaign_channels IS 'Individual channels (LinkedIn, Smartlead, Phone, GHL) within campaigns';
COMMENT ON TABLE campaign_messages IS 'Message templates and sequences for each channel';
COMMENT ON TABLE message_variants IS 'A/B test variants for messages';
COMMENT ON TABLE campaign_contacts IS 'Contact journey through a campaign with branch assignment';
COMMENT ON TABLE campaign_contact_channels IS 'Per-channel status and progress for each contact';
COMMENT ON TABLE campaign_activity IS 'Event log for all campaign activities and webhook events';
COMMENT ON FUNCTION assign_ghl_branch IS 'Routes contact to GHL branch based on engagement signals';
COMMENT ON FUNCTION handle_opt_out IS 'Processes opt-out requests and pauses all channels';
