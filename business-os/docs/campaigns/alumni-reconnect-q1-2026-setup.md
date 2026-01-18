# Alumni Reconnect Q1 2026 - Implementation Setup Guide

## Overview

This document contains the complete setup instructions and verification scripts for the Alumni Reconnect Q1 2026 campaign.

**Campaign ID:** `a1b2c3d4-e5f6-7890-abcd-ef1234567890`

---

## 1. Database Setup

### Run Migration

Execute the migration file to add past-participant domains, SmartLead messages, and phone scripts:

```bash
# In Supabase SQL Editor, run:
supabase/migrations/20260116_add_alumni_campaign_data.sql
```

### Verify Migration

```sql
-- Check domains added
SELECT domain_name, status, daily_limit, platform, notes
FROM domains
WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com');

-- Check SmartLead messages
SELECT message_code, message_name, sequence_order, send_condition
FROM campaign_messages
WHERE channel_id = 'cc222222-3333-4444-5555-666677778888'
ORDER BY sequence_order;

-- Check Phone scripts
SELECT message_code, message_name, message_type
FROM campaign_messages
WHERE channel_id = 'cc333333-4444-5555-6666-777788889999'
ORDER BY sequence_order;

-- Count all campaign messages by channel
SELECT
  cc.channel,
  COUNT(*) as message_count
FROM campaign_messages cm
JOIN campaign_channels cc ON cc.id = cm.channel_id
WHERE cm.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY cc.channel;
```

Expected output:
| channel | message_count |
|---------|---------------|
| linkedin | 3 |
| smartlead | 4 |
| phone | 3 |
| ghl | 12 |

---

## 2. SmartLead Campaign Setup

### Create Campaign via API

```bash
# Create the SmartLead campaign
curl -X POST "https://server.smartlead.ai/api/v1/campaigns?api_key=${SMARTLEAD_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alumni Reconnect Q1 2026 - Past Participants",
    "settings": {
      "schedule": {
        "timezone": "America/New_York",
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri"],
        "startHour": 8,
        "endHour": 17
      }
    }
  }'
```

Save the returned `campaign_id` and update the database:

```sql
-- Update SmartLead channel with campaign ID
UPDATE campaign_channels
SET
  platform_campaign_id = 'YOUR_SMARTLEAD_CAMPAIGN_ID',
  status = 'active',
  started_at = NOW()
WHERE id = 'cc222222-3333-4444-5555-666677778888';
```

### Assign Inboxes to Campaign

In SmartLead Dashboard:
1. Go to the new campaign
2. Click "Email Accounts"
3. Assign all 8 inboxes from `iamlhrseminars.com` and `iamlhrtraining.com`

### Configure Webhook

In SmartLead Dashboard → Campaign Settings → Webhooks:
- **URL:** `https://n8n.realtyamp.ai/webhook/smartlead`
- **Events:** All (sent, open, click, reply, bounce, unsubscribe)

### Add Email Sequences

Create the email sequence in SmartLead with these messages:

| Step | Subject | Delay | Condition |
|------|---------|-------|-----------|
| S1 | Quick question, {{first_name}} | Day 0 | None |
| S2a | Re: Quick question | Day 4 | Opened, no reply |
| S2b | Different approach, {{first_name}} | Day 4 | Not opened |
| S3 | Last note from me | Day 7 | No reply |

---

## 3. HeyReach Campaign Setup

### Create Campaign in HeyReach Dashboard

1. Create new campaign: **"Alumni Reconnect Q1 2026"**
2. Add your LinkedIn account(s)
3. Create sequence:
   - **Step 1 (L2):** Connection Request
   - **Step 2 (L2-Alt):** Already Connected DM (skip if not connected)
   - **Step 3 (L3):** Follow-up Message (3 days after connection)

4. Campaign Settings:
   - Working hours: 9 AM - 6 PM
   - Daily connection limit: 25
   - Daily message limit: 50

5. Get campaign ID and list ID for n8n integration

### Configure HeyReach Webhook

In HeyReach Dashboard → Settings → Webhooks:
- **URL:** `https://n8n.realtyamp.ai/webhook/heyreach-activity`
- **Events:** All (connection_sent, connection_accepted, message_sent, message_replied)

### Update Database

```sql
-- Update HeyReach channel with campaign ID (if different from seed)
UPDATE campaign_channels
SET
  platform_campaign_id = 'YOUR_HEYREACH_CAMPAIGN_ID',
  settings = settings || jsonb_build_object('list_id', 'YOUR_HEYREACH_LIST_ID')
WHERE id = 'cc111111-2222-3333-4444-555566667777';
```

---

## 4. GHL Workflow Setup

### Required Sequences

Create these 4 sequences in GHL:

| Sequence Name | Branch | # Emails |
|---------------|--------|----------|
| Alumni Q1 - Qualified | A | 3 |
| Alumni Q1 - Training Interest | A+ | 3 |
| Alumni Q1 - Nurture | B | 2 |
| Alumni Q1 - No Contact | C | 4 |

### GHL Workflow Configuration

Create a workflow with:

**Trigger:** Webhook
- URL: `https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992`

**Actions:**
1. Create/Update Contact
   - Map: first_name, last_name, email, company, job_title
   - Custom fields: linkedin_url, trigger_channel, reply_text

2. Add Tags
   - "Alumni Q1 2026"
   - "Branch: {{ghl_branch}}"
   - "Source: {{trigger_channel}}"

3. Branch by `ghl_branch` field
   - A → Start "Alumni Q1 - Qualified" sequence
   - A+ → Start "Alumni Q1 - Training Interest" sequence
   - B → Start "Alumni Q1 - Nurture" sequence
   - C → Start "Alumni Q1 - No Contact" sequence

### Test GHL Webhook

```bash
# Test payload
curl -X POST "https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "ghl_branch": "A",
    "campaign_name": "Alumni Reconnect Q1 2026",
    "trigger_event": "positive_reply",
    "trigger_channel": "smartlead"
  }'
```

---

## 5. n8n Workflow Setup

### Import Workflows

Import these workflow JSON files into n8n:

| File | Purpose |
|------|---------|
| `n8n-workflows/supabase-to-smartlead-exporter.json` | Export contacts to SmartLead |
| `n8n-workflows/supabase-to-heyreach-exporter.json` | Export contacts to HeyReach |
| `n8n-workflows/waterfall-enrichment.json` | Enrich LinkedIn-only contacts |
| `n8n-workflows/multichannel-escalation-scheduler.json` | Escalate between channels |
| `n8n-workflows/smartlead-activity-receiver.json` | Receive SmartLead webhooks |
| `n8n-workflows/heyreach-activity-receiver.json` | Receive HeyReach webhooks |
| `n8n-workflows/branch-c-scheduler.json` | Schedule Branch C contacts |

### Configure Environment Variables

In n8n, set these environment variables:
- `SMARTLEAD_API_KEY`: Your SmartLead API key
- `SMARTLEAD_CAMPAIGN_ID`: The campaign ID from step 2
- `HEYREACH_LIST_ID`: The HeyReach list ID from step 3
- `NEVERBOUNCE_API_KEY`: Your NeverBounce API key

### Activate Workflows

1. Activate `smartlead-activity-receiver` workflow
2. Activate `heyreach-activity-receiver` workflow
3. Activate `branch-c-scheduler` workflow
4. Keep export workflows inactive until launch

---

## 6. Pre-Launch Verification

### Database Checks

```sql
-- 1. Verify domains added
SELECT COUNT(*) as domain_count
FROM domains
WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com')
  AND status = 'active';
-- Expected: 2

-- 2. Verify all messages created
SELECT COUNT(*) as message_count
FROM campaign_messages
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
-- Expected: 22 (3 LinkedIn + 4 SmartLead + 3 Phone + 12 GHL)

-- 3. Check contact enrollment readiness
SELECT
  COUNT(*) as total_contacts,
  COUNT(*) FILTER (WHERE c.linkedin_url IS NOT NULL) as has_linkedin,
  COUNT(*) FILTER (WHERE c.email IS NOT NULL AND c.email_validation_result = 'valid') as has_valid_email,
  COUNT(*) FILTER (WHERE c.phone IS NOT NULL) as has_phone
FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND cc.status = 'active';

-- 4. Verify channels are configured
SELECT
  channel,
  platform,
  platform_campaign_id,
  status
FROM campaign_channels
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### Webhook Tests

```bash
# Test SmartLead webhook
curl -X POST "https://n8n.realtyamp.ai/webhook/smartlead" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "EMAIL_OPEN", "to_email": "test@example.com", "campaign_id": "test"}'

# Test HeyReach webhook
curl -X POST "https://n8n.realtyamp.ai/webhook/heyreach-activity" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "connection_request_accepted", "lead": {"linkedinUrl": "https://linkedin.com/in/testuser"}}'

# Test GHL webhook
curl -X POST "https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Test", "last_name": "User", "email": "test@test.com", "ghl_branch": "A"}'
```

---

## 7. Launch Checklist

### Friday Evening
- [ ] Run database migration
- [ ] Verify domains and messages in database
- [ ] Run SmartLead inbox sync workflow manually
- [ ] Verify 8 inboxes appear in `email_inboxes` table

### Saturday Morning
- [ ] Create SmartLead campaign
- [ ] Assign inboxes to SmartLead campaign
- [ ] Configure SmartLead webhook
- [ ] Create HeyReach campaign in UI
- [ ] Configure HeyReach webhook

### Saturday Afternoon
- [ ] Import n8n workflows
- [ ] Configure environment variables
- [ ] Activate activity receiver workflows
- [ ] Test all webhooks

### Saturday Evening
- [ ] Create GHL sequences (A, A+, B, C)
- [ ] Create GHL inbound workflow
- [ ] Test GHL webhook

### Sunday
- [ ] Export 10 test contacts to SmartLead
- [ ] Export 5 test contacts to HeyReach
- [ ] Send test email and verify tracking
- [ ] Reply to test email and verify GHL routing
- [ ] Run all verification queries
- [ ] Fix any issues found

### Monday Morning Launch
- [ ] 6:00 AM - Final health check
- [ ] 7:00 AM - Activate SmartLead and Phone channels
- [ ] 8:00 AM - Run full contact export workflows
- [ ] 9:00 AM - Activate campaigns in SmartLead and HeyReach
- [ ] 10:00 AM - Monitor first hour of activity

---

## 8. Post-Launch Monitoring

### Hourly (First Day)

```sql
-- Activity in last hour
SELECT
  channel,
  activity_type,
  COUNT(*) as count
FROM campaign_activity
WHERE activity_at >= NOW() - INTERVAL '1 hour'
GROUP BY channel, activity_type
ORDER BY channel, count DESC;
```

### Daily

```sql
-- Campaign funnel
SELECT * FROM campaign_funnel
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Channel performance
SELECT * FROM channel_performance
WHERE channel_id IN (
  SELECT id FROM campaign_channels
  WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
);

-- GHL branch distribution
SELECT
  ghl_branch,
  COUNT(*) as contact_count,
  branch_trigger_channel
FROM campaign_contacts
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND ghl_branch IS NOT NULL
GROUP BY ghl_branch, branch_trigger_channel
ORDER BY contact_count DESC;
```

---

## 9. Troubleshooting

### Contact Not Found in Webhook

If activity receiver logs "match_failed":
1. Check LinkedIn URL normalization
2. Verify email is lowercase in database
3. Check if contact exists in `contacts` table

### GHL Not Receiving Contacts

1. Check n8n workflow execution history
2. Verify GHL webhook URL is correct
3. Test webhook with curl command above

### SmartLead Export Failing

1. Check SmartLead API key is valid
2. Verify campaign ID is correct
3. Check n8n environment variables

---

## 10. Key Reference IDs

| Entity | ID |
|--------|-----|
| Campaign | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| LinkedIn Channel | `cc111111-2222-3333-4444-555566667777` |
| SmartLead Channel | `cc222222-3333-4444-5555-666677778888` |
| Phone Channel | `cc333333-4444-5555-6666-777788889999` |
| GHL Channel | `cc444444-5555-6666-7777-888899990000` |
| Supabase Postgres Credential | `EgmvZHbvINHsh6PR` |
| SmartLead API Credential | `a8mXHIaPChJTGO6S` |

---

## 11. File Locations

| Purpose | Path |
|---------|------|
| Campaign data migration | `supabase/migrations/20260116_add_alumni_campaign_data.sql` |
| SmartLead exporter | `n8n-workflows/supabase-to-smartlead-exporter.json` |
| HeyReach exporter | `n8n-workflows/supabase-to-heyreach-exporter.json` |
| Waterfall enrichment | `n8n-workflows/waterfall-enrichment.json` |
| Escalation scheduler | `n8n-workflows/multichannel-escalation-scheduler.json` |
| SmartLead activity receiver | `n8n-workflows/smartlead-activity-receiver.json` |
| HeyReach activity receiver | `n8n-workflows/heyreach-activity-receiver.json` |
| Branch C scheduler | `n8n-workflows/branch-c-scheduler.json` |
| Campaign tracking schema | `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md` |
