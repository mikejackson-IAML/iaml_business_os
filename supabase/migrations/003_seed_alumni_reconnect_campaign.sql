-- ============================================================================
-- MIGRATION 003: Seed Alumni Reconnect Q1 2026 Campaign
-- ============================================================================
-- Run this AFTER 002_campaign_tracking_tables.sql
-- Creates the reference campaign and HeyReach LinkedIn channel
-- ============================================================================

-- Insert the Alumni Reconnect Q1 2026 campaign
INSERT INTO multichannel_campaigns (
  id,
  name,
  description,
  campaign_type,
  primary_offer,
  primary_offer_value,
  secondary_offer,
  secondary_offer_programs,
  status,
  planned_start_date,
  planned_end_date
) VALUES (
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'Alumni Reconnect Q1 2026',
  'Re-engagement campaign targeting past IAML participants to reconnect them with quarterly updates and virtual training opportunities.',
  'reengagement',
  'Quarterly Updates',
  'Free executive briefings on employment law changes',
  'Virtual Training',
  ARRAY['Employment Law Update', 'FMLA Fundamentals', 'Strategic HR Leadership'],
  'active',
  '2026-01-15',
  '2026-03-31'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

-- Insert LinkedIn channel (HeyReach)
INSERT INTO campaign_channels (
  id,
  campaign_id,
  channel,
  platform,
  internal_name,
  platform_campaign_id,
  utm_source,
  utm_medium,
  status,
  settings
) VALUES (
  'cc111111-2222-3333-4444-555566667777',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'linkedin',
  'heyreach',
  'Alumni-Reconnect-Q1-LI',
  '298521',
  'linkedin',
  'social',
  'active',
  jsonb_build_object(
    'webhook_enabled', true,
    'sequence_messages', ARRAY['L2', 'L2-Alt', 'L3'],
    'daily_connection_limit', 25,
    'daily_message_limit', 50
  )
) ON CONFLICT (id) DO UPDATE SET
  platform_campaign_id = EXCLUDED.platform_campaign_id,
  status = EXCLUDED.status;

-- Insert Smartlead channel
INSERT INTO campaign_channels (
  id,
  campaign_id,
  channel,
  platform,
  internal_name,
  utm_source,
  utm_medium,
  status
) VALUES (
  'cc222222-3333-4444-5555-666677778888',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'smartlead',
  'smartlead',
  'Alumni-Reconnect-Q1-SL',
  'email',
  'cold_email',
  'draft'
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- Insert Phone channel
INSERT INTO campaign_channels (
  id,
  campaign_id,
  channel,
  platform,
  internal_name,
  status
) VALUES (
  'cc333333-4444-5555-6666-777788889999',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'phone',
  'manual',
  'Alumni-Reconnect-Q1-Phone',
  'draft'
) ON CONFLICT (id) DO UPDATE SET
  status = EXCLUDED.status;

-- Insert GHL channel
INSERT INTO campaign_channels (
  id,
  campaign_id,
  channel,
  platform,
  internal_name,
  status,
  settings
) VALUES (
  'cc444444-5555-6666-7777-888899990000',
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  'ghl',
  'ghl',
  'Alumni-Reconnect-Q1-GHL',
  'active',
  jsonb_build_object(
    'webhook_url', 'https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992',
    'branches', ARRAY['A', 'A+', 'B', 'C']
  )
) ON CONFLICT (id) DO UPDATE SET
  settings = EXCLUDED.settings,
  status = EXCLUDED.status;

-- Insert LinkedIn message templates
INSERT INTO campaign_messages (campaign_id, channel_id, message_code, message_name, message_type, sequence_order, days_after_previous, send_condition)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc111111-2222-3333-4444-555566667777', 'L2', 'Connection Request', 'connection_request', 1, 0, NULL),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc111111-2222-3333-4444-555566667777', 'L2-Alt', 'Already Connected Message', 'follow_up', 1, 0, 'already_connected'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc111111-2222-3333-4444-555566667777', 'L3', 'Follow-up Message', 'follow_up', 2, 3, 'connected')
ON CONFLICT DO NOTHING;

-- Insert GHL branch messages
INSERT INTO campaign_messages (campaign_id, channel_id, message_code, message_name, message_type, ghl_branch, sequence_order)
VALUES
  -- Branch A (Qualified)
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'A1', 'Confirmation', 'email', 'A', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'A2', 'Secondary Offer', 'email', 'A', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'A3', 'Reminder', 'email', 'A', 3),
  -- Branch A+ (Qualified+)
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'A+1', 'Virtual Training Focus', 'email', 'A+', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'A+2', 'Program Selection', 'email', 'A+', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'A+3', 'Final Reminder', 'email', 'A+', 3),
  -- Branch B (Nurture)
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'B1', 'Pure Value', 'email', 'B', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'B2', 'Light Touch', 'email', 'B', 2),
  -- Branch C (No Contact)
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'C1', 'Fresh Start', 'email', 'C', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'C2', 'Different Angle', 'email', 'C', 2),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'C3', 'Direct Ask', 'email', 'C', 3),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc444444-5555-6666-7777-888899990000', 'C4', 'Final Attempt', 'email', 'C', 4)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the seed data:
--
-- SELECT * FROM multichannel_campaigns WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
-- SELECT * FROM campaign_channels WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
-- SELECT * FROM campaign_messages WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' ORDER BY channel_id, sequence_order;
