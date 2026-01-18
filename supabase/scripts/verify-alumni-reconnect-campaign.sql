-- ============================================================================
-- VERIFICATION SCRIPT: Alumni Reconnect Q1 2026 Campaign
-- ============================================================================
-- Run this script to verify the complete campaign setup before launch
-- Campaign ID: a1b2c3d4-e5f6-7890-abcd-ef1234567890
-- ============================================================================

-- ============================================
-- SECTION 1: DOMAIN VERIFICATION
-- ============================================

-- Check past-participant domains exist and are active
SELECT
  '1.1 Domain Check' as check_name,
  CASE WHEN COUNT(*) = 2 THEN 'PASS' ELSE 'FAIL' END as status,
  COUNT(*) as found,
  2 as expected
FROM domains
WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com')
  AND status = 'active';

-- Domain details
SELECT
  domain_name,
  status,
  daily_limit,
  health_score,
  platform
FROM domains
WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com');

-- ============================================
-- SECTION 2: INBOX VERIFICATION
-- ============================================

-- Check inboxes linked to past-participant domains
SELECT
  '2.1 Inbox Check' as check_name,
  CASE WHEN COUNT(*) >= 8 THEN 'PASS' ELSE 'CHECK' END as status,
  COUNT(*) as found,
  8 as expected_minimum
FROM email_inboxes i
JOIN domains d ON i.domain_id = d.id
WHERE d.domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com')
  AND i.status IN ('active', 'warming');

-- Inbox details by domain
SELECT
  d.domain_name,
  COUNT(*) as inbox_count,
  COUNT(*) FILTER (WHERE i.status = 'active') as active_count,
  COUNT(*) FILTER (WHERE i.is_connected = TRUE) as connected_count
FROM domains d
LEFT JOIN email_inboxes i ON i.domain_id = d.id
WHERE d.domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com')
GROUP BY d.domain_name;

-- ============================================
-- SECTION 3: CAMPAIGN STRUCTURE VERIFICATION
-- ============================================

-- Check campaign exists
SELECT
  '3.1 Campaign Check' as check_name,
  CASE WHEN COUNT(*) = 1 THEN 'PASS' ELSE 'FAIL' END as status,
  name,
  status as campaign_status
FROM multichannel_campaigns
WHERE id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY name, status;

-- Check all channels exist
SELECT
  '3.2 Channels Check' as check_name,
  CASE WHEN COUNT(*) = 4 THEN 'PASS' ELSE 'FAIL' END as status,
  COUNT(*) as found,
  4 as expected
FROM campaign_channels
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Channel details
SELECT
  channel,
  platform,
  internal_name,
  platform_campaign_id,
  status
FROM campaign_channels
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY channel;

-- ============================================
-- SECTION 4: MESSAGE VERIFICATION
-- ============================================

-- Check message counts by channel
SELECT
  '4.1 Message Count by Channel' as check_name,
  cc.channel,
  COUNT(*) as message_count,
  CASE
    WHEN cc.channel = 'linkedin' AND COUNT(*) >= 3 THEN 'PASS'
    WHEN cc.channel = 'smartlead' AND COUNT(*) >= 4 THEN 'PASS'
    WHEN cc.channel = 'phone' AND COUNT(*) >= 3 THEN 'PASS'
    WHEN cc.channel = 'ghl' AND COUNT(*) >= 12 THEN 'PASS'
    ELSE 'CHECK'
  END as status
FROM campaign_messages cm
JOIN campaign_channels cc ON cc.id = cm.channel_id
WHERE cm.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY cc.channel;

-- LinkedIn messages
SELECT
  '4.2 LinkedIn Messages' as section,
  message_code,
  message_name,
  message_type,
  sequence_order
FROM campaign_messages
WHERE channel_id = 'cc111111-2222-3333-4444-555566667777'
ORDER BY sequence_order;

-- SmartLead messages
SELECT
  '4.3 SmartLead Messages' as section,
  message_code,
  message_name,
  message_type,
  sequence_order,
  send_condition
FROM campaign_messages
WHERE channel_id = 'cc222222-3333-4444-5555-666677778888'
ORDER BY sequence_order;

-- Phone messages
SELECT
  '4.4 Phone Messages' as section,
  message_code,
  message_name,
  message_type,
  sequence_order
FROM campaign_messages
WHERE channel_id = 'cc333333-4444-5555-6666-777788889999'
ORDER BY sequence_order;

-- GHL messages by branch
SELECT
  '4.5 GHL Messages by Branch' as section,
  ghl_branch,
  message_code,
  message_name,
  sequence_order
FROM campaign_messages
WHERE channel_id = 'cc444444-5555-6666-7777-888899990000'
ORDER BY ghl_branch, sequence_order;

-- ============================================
-- SECTION 5: CONTACT ENROLLMENT VERIFICATION
-- ============================================

-- Contact enrollment summary
SELECT
  '5.1 Contact Enrollment' as check_name,
  COUNT(*) as total_enrolled,
  COUNT(*) FILTER (WHERE status = 'active') as active,
  COUNT(*) FILTER (WHERE status = 'paused') as paused,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'opted_out') as opted_out
FROM campaign_contacts
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Contact data completeness
SELECT
  '5.2 Contact Data Completeness' as check_name,
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.email != '') as has_email,
  COUNT(*) FILTER (WHERE c.linkedin_url IS NOT NULL AND c.linkedin_url != '') as has_linkedin,
  COUNT(*) FILTER (WHERE c.phone IS NOT NULL AND c.phone != '') as has_phone,
  COUNT(*) FILTER (WHERE c.email_validation_result = 'valid') as valid_email,
  COUNT(*) FILTER (WHERE c.email_validation_result IN ('valid', 'catch_all')) as usable_email
FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND cc.status = 'active';

-- Segment breakdown
SELECT
  '5.3 Contact Segments' as check_name,
  CASE
    WHEN c.email IS NOT NULL AND c.linkedin_url IS NOT NULL THEN 'Email + LinkedIn'
    WHEN c.email IS NOT NULL AND c.linkedin_url IS NULL THEN 'Email Only'
    WHEN c.email IS NULL AND c.linkedin_url IS NOT NULL THEN 'LinkedIn Only'
    ELSE 'No Contact Info'
  END as segment,
  COUNT(*) as count
FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND cc.status = 'active'
GROUP BY segment
ORDER BY count DESC;

-- ============================================
-- SECTION 6: CHANNEL ASSIGNMENT VERIFICATION
-- ============================================

-- Contacts assigned to each channel
SELECT
  '6.1 Channel Assignments' as check_name,
  cc.channel,
  COUNT(ccc.id) as assigned_contacts,
  COUNT(ccc.id) FILTER (WHERE ccc.status = 'pending') as pending,
  COUNT(ccc.id) FILTER (WHERE ccc.status = 'active') as active,
  COUNT(ccc.id) FILTER (WHERE ccc.has_replied = TRUE) as replied
FROM campaign_channels cc
LEFT JOIN campaign_contact_channels ccc ON ccc.campaign_channel_id = cc.id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY cc.channel, cc.id
ORDER BY cc.channel;

-- ============================================
-- SECTION 7: ACTIVITY LOG VERIFICATION
-- ============================================

-- Recent activity summary
SELECT
  '7.1 Recent Activity (24h)' as check_name,
  channel,
  activity_type,
  COUNT(*) as count
FROM campaign_activity ca
JOIN campaign_contacts cc ON cc.id = ca.campaign_contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND ca.activity_at >= NOW() - INTERVAL '24 hours'
GROUP BY channel, activity_type
ORDER BY channel, count DESC;

-- ============================================
-- SECTION 8: GHL BRANCH DISTRIBUTION
-- ============================================

SELECT
  '8.1 GHL Branch Distribution' as check_name,
  COALESCE(ghl_branch, 'Not Assigned') as branch,
  COUNT(*) as count,
  branch_trigger_channel,
  branch_trigger_event
FROM campaign_contacts
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY ghl_branch, branch_trigger_channel, branch_trigger_event
ORDER BY ghl_branch NULLS FIRST;

-- ============================================
-- SECTION 9: FUNNEL METRICS
-- ============================================

SELECT
  '9.1 Campaign Funnel' as check_name,
  *
FROM campaign_funnel
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ============================================
-- SECTION 10: CAPACITY CHECK
-- ============================================

-- Daily sending capacity
SELECT
  '10.1 Daily Capacity' as check_name,
  d.domain_name,
  d.daily_limit as domain_limit,
  d.sent_today,
  d.daily_limit - d.sent_today as remaining_today,
  COUNT(i.id) as inbox_count
FROM domains d
LEFT JOIN email_inboxes i ON i.domain_id = d.id AND i.status = 'active'
WHERE d.domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com')
GROUP BY d.id, d.domain_name, d.daily_limit, d.sent_today;

-- Total capacity
SELECT
  '10.2 Total Daily Capacity' as check_name,
  SUM(daily_limit) as total_daily_capacity,
  SUM(sent_today) as total_sent_today,
  SUM(daily_limit - sent_today) as total_remaining
FROM domains
WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com')
  AND status = 'active';

-- ============================================
-- SUMMARY
-- ============================================

SELECT
  '=== VERIFICATION SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM domains WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com') AND status = 'active') as domains_active,
  (SELECT COUNT(*) FROM email_inboxes i JOIN domains d ON i.domain_id = d.id WHERE d.domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com') AND i.status = 'active') as inboxes_active,
  (SELECT COUNT(*) FROM campaign_channels WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') as channels_configured,
  (SELECT COUNT(*) FROM campaign_messages WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') as messages_created,
  (SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND status = 'active') as contacts_enrolled;
