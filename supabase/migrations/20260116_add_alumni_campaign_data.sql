-- ============================================================================
-- MIGRATION: Add Alumni Reconnect Q1 2026 Campaign Data
-- ============================================================================
-- Run AFTER: 003_seed_alumni_reconnect_campaign.sql
-- Adds: Past-participant domains, SmartLead messages, Phone scripts
-- Date: 2026-01-16
-- ============================================================================

-- ============================================
-- PART 1: ADD PAST-PARTICIPANT DOMAINS
-- ============================================
-- These domains are specifically for past participant outreach
-- They have dedicated inboxes in SmartLead (4 each)

INSERT INTO domains (
  domain_name,
  status,
  daily_limit,
  health_score,
  bounce_rate,
  spam_rate,
  open_rate,
  sent_today,
  platform,
  notes
)
VALUES
  (
    'iamlhrseminars.com',
    'active',
    200,  -- 4 inboxes x 50/inbox
    90,
    1.0,
    0.1,
    35.0,
    0,
    'smartlead',
    'Past participant domain - 4 inboxes for Alumni Reconnect campaign'
  ),
  (
    'iamlhrtraining.com',
    'active',
    200,  -- 4 inboxes x 50/inbox
    90,
    1.0,
    0.1,
    35.0,
    0,
    'smartlead',
    'Past participant domain - 4 inboxes for Alumni Reconnect campaign'
  )
ON CONFLICT (domain_name) DO UPDATE SET
  status = EXCLUDED.status,
  daily_limit = EXCLUDED.daily_limit,
  health_score = EXCLUDED.health_score,
  notes = EXCLUDED.notes,
  updated_at = NOW();
-- ============================================
-- PART 2: ADD SMARTLEAD MESSAGES
-- ============================================
-- SmartLead channel ID: cc222222-3333-4444-5555-666677778888

INSERT INTO campaign_messages (
  campaign_id,
  channel_id,
  message_code,
  message_name,
  message_type,
  sequence_order,
  days_after_previous,
  send_condition,
  subject_line,
  body_content
)
VALUES
  -- S1: Initial Email
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'cc222222-3333-4444-5555-666677778888',
    'S1',
    'Initial Email',
    'email',
    1,
    0,
    NULL,
    'Quick question, {{first_name}}',
    E'Hi {{first_name}},\n\nI noticed you attended one of our programs a while back and wanted to reach out.\n\nWe''ve launched free Quarterly Employment Law Updates for IAML alumni - 30-minute briefings on the latest case law and regulatory changes.\n\nWould you be interested in joining us for the next one?\n\nBest,\n{{sender_name}}\nIAML'
  ),

  -- S2a: Follow-up for Opens (no reply)
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'cc222222-3333-4444-5555-666677778888',
    'S2a',
    'Opened No Reply',
    'email',
    2,
    4,
    'opened_no_reply',
    'Re: Quick question',
    E'Hi {{first_name}},\n\nJust following up on my earlier note about the Quarterly Updates.\n\nThese sessions are designed for busy HR leaders - 30 minutes, focused updates, no fluff.\n\nThe next one covers recent FMLA developments and state law changes.\n\nInterested? Just reply and I''ll send you the registration link.\n\n{{sender_name}}'
  ),

  -- S2b: Follow-up for No Opens
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'cc222222-3333-4444-5555-666677778888',
    'S2b',
    'No Open Follow-up',
    'email',
    2,
    4,
    'no_open',
    'Different approach, {{first_name}}',
    E'Hi {{first_name}},\n\nMy last email may have gotten buried, so I''ll keep this short:\n\nAs an IAML alumni, you have access to our free Quarterly Employment Law Updates.\n\n30 minutes. Latest case law. Practical compliance tips.\n\nWorth a look? Just reply "interested" and I''ll send details.\n\n{{sender_name}}'
  ),

  -- S3: Final Push
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'cc222222-3333-4444-5555-666677778888',
    'S3',
    'Final Push',
    'email',
    3,
    3,
    'no_reply',
    'Last note from me',
    E'Hi {{first_name}},\n\nI don''t want to fill your inbox, so this will be my last email on this.\n\nOur Quarterly Updates are free for alumni and designed for people who don''t have time to track every employment law change themselves.\n\nIf the timing ever feels right: just reply and I''ll add you to the invite list.\n\nEither way, thanks for being part of the IAML community.\n\n{{sender_name}}'
  )
ON CONFLICT DO NOTHING;
-- ============================================
-- PART 3: ADD PHONE SCRIPTS
-- ============================================
-- Phone channel ID: cc333333-4444-5555-6666-777788889999

INSERT INTO campaign_messages (
  campaign_id,
  channel_id,
  message_code,
  message_name,
  message_type,
  sequence_order,
  body_content
)
VALUES
  -- P1: Call Script
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'cc333333-4444-5555-6666-777788889999',
    'P1',
    'Call Script',
    'call_script',
    1,
    E'Hi {{first_name}}, this is [Your Name] from IAML.\n\nI''m calling because you attended one of our programs and I wanted to personally invite you to our free Quarterly Employment Law Updates.\n\nThese are 30-minute briefings on the latest case law and regulatory changes - specifically designed for busy HR professionals like yourself.\n\n[PAUSE FOR RESPONSE]\n\nIF INTERESTED:\n"Great! I''ll send you the registration link right after this call. What''s the best email to use?"\n\nIF NOT NOW:\n"No problem at all. Would it be helpful if I sent you some information for when the timing is better?"\n\nIF NOT INTERESTED:\n"I understand completely. Thanks for your time, and feel free to reach out if you ever need anything from IAML."'
  ),

  -- P1-VM: Voicemail Script
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'cc333333-4444-5555-6666-777788889999',
    'P1-VM',
    'Voicemail Script',
    'voicemail',
    1,
    E'Hi {{first_name}}, this is [Your Name] from IAML.\n\nI''m calling because you attended one of our programs, and I wanted to personally invite you to our free Quarterly Employment Law Updates for alumni.\n\nThese are quick 30-minute briefings on the latest case law changes.\n\nI''ll follow up with an email, or feel free to reach me at [phone number].\n\nThanks, {{first_name}}!'
  ),

  -- P2: Second Attempt Script
  (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'cc333333-4444-5555-6666-777788889999',
    'P2',
    'Second Attempt',
    'call_script',
    2,
    E'Hi {{first_name}}, this is [Your Name] from IAML again.\n\nI left you a voicemail earlier this week about our free Quarterly Updates for alumni.\n\nDo you have a quick minute to chat?\n\n[SAME RESPONSE HANDLING AS P1]'
  )
ON CONFLICT DO NOTHING;
-- ============================================
-- PART 4: UPDATE SMARTLEAD CHANNEL WITH CAMPAIGN ID
-- ============================================
-- This will be updated once the SmartLead campaign is created via API

-- Placeholder for SmartLead campaign ID
-- UPDATE campaign_channels
-- SET platform_campaign_id = 'YOUR_SMARTLEAD_CAMPAIGN_ID'
-- WHERE id = 'cc222222-3333-4444-5555-666677778888';

-- ============================================
-- VERIFICATION QUERIES
-- ============================================
-- Run these to verify the migration:
--
-- Check domains added:
-- SELECT domain_name, status, daily_limit, platform FROM domains
-- WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com');
--
-- Check SmartLead messages:
-- SELECT message_code, message_name, sequence_order FROM campaign_messages
-- WHERE channel_id = 'cc222222-3333-4444-5555-666677778888'
-- ORDER BY sequence_order;
--
-- Check Phone scripts:
-- SELECT message_code, message_name, message_type FROM campaign_messages
-- WHERE channel_id = 'cc333333-4444-5555-6666-777788889999'
-- ORDER BY sequence_order;
--
-- Count all campaign messages:
-- SELECT
--   cm.channel_id,
--   cc.channel,
--   COUNT(*) as message_count
-- FROM campaign_messages cm
-- JOIN campaign_channels cc ON cc.id = cm.channel_id
-- WHERE cm.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
-- GROUP BY cm.channel_id, cc.channel;;
