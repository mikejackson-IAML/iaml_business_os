# Alumni Reconnect Q1 2026 - Complete Implementation Guide

> **Purpose:** This document contains everything needed to complete the campaign implementation on any machine.
>
> **Status:** Infrastructure code is written, needs deployment and platform configuration
>
> **Last Updated:** January 18, 2026

---

## Table of Contents

1. [What Was Built](#1-what-was-built)
2. [What Still Needs to Be Done](#2-what-still-needs-to-be-done)
3. [Step 1: Run Database Migration](#step-1-run-database-migration)
4. [Step 2: Verify Inboxes](#step-2-verify-inboxes)
5. [Step 3: Create SmartLead Campaign](#step-3-create-smartlead-campaign)
6. [Step 4: Create HeyReach Campaign](#step-4-create-heyreach-campaign)
7. [Step 5: Configure GHL Sequences](#step-5-configure-ghl-sequences)
8. [Step 6: Import n8n Workflows](#step-6-import-n8n-workflows)
9. [Step 7: Run Verification](#step-7-run-verification)
10. [Step 8: Launch](#step-8-launch)
11. [Reference: Key IDs](#reference-key-ids)
12. [Reference: File Locations](#reference-file-locations)
13. [Troubleshooting](#troubleshooting)

---

## 1. What Was Built

### Database Migration Created
- **File:** `supabase/migrations/20260116_add_alumni_campaign_data.sql`
- Adds past-participant domains (iamlhrseminars.com, iamlhrtraining.com)
- Adds SmartLead email messages (S1, S2a, S2b, S3)
- Adds Phone call scripts (P1, P1-VM, P2)

### n8n Workflows Created
| File | Purpose |
|------|---------|
| `n8n-workflows/supabase-to-smartlead-exporter.json` | Export contacts to SmartLead |
| `n8n-workflows/supabase-to-heyreach-exporter.json` | Export contacts to HeyReach |
| `n8n-workflows/waterfall-enrichment.json` | Enrich LinkedIn-only contacts |
| `n8n-workflows/multichannel-escalation-scheduler.json` | Escalate between channels |

### Documentation Created
- `business-os/docs/campaigns/alumni-reconnect-q1-2026-setup.md` - Full setup guide
- `supabase/scripts/verify-alumni-reconnect-campaign.sql` - Verification queries

### Already Existed (No Changes Needed)
- Campaign and channel seed data (`003_seed_alumni_reconnect_campaign.sql`)
- HeyReach activity receiver workflow
- SmartLead activity receiver workflow
- Branch C scheduler workflow
- Inbox sync workflows

---

## 2. What Still Needs to Be Done

| Task | Where | Time |
|------|-------|------|
| Run database migration | Supabase SQL Editor | 2 min |
| Trigger inbox sync | n8n | 2 min |
| Create SmartLead campaign | SmartLead API/Dashboard | 10 min |
| Create HeyReach campaign | HeyReach Dashboard (manual) | 15 min |
| Create GHL sequences | GHL Dashboard | 30 min |
| Import n8n workflows | n8n Dashboard | 10 min |
| Configure environment variables | n8n | 5 min |
| Run verification | Supabase SQL Editor | 5 min |
| Test webhooks | Terminal | 5 min |

---

## Step 1: Run Database Migration

### 1.1 Open Supabase SQL Editor

Go to your Supabase project → SQL Editor

### 1.2 Run the Migration

Copy and paste the contents of `supabase/migrations/20260116_add_alumni_campaign_data.sql`:

```sql
-- ============================================================================
-- MIGRATION: Add Alumni Reconnect Q1 2026 Campaign Data
-- ============================================================================

-- PART 1: ADD PAST-PARTICIPANT DOMAINS
INSERT INTO domains (
  domain_name, status, daily_limit, health_score, bounce_rate,
  spam_rate, open_rate, sent_today, platform, notes
)
VALUES
  ('iamlhrseminars.com', 'active', 200, 90, 1.0, 0.1, 35.0, 0, 'smartlead',
   'Past participant domain - 4 inboxes for Alumni Reconnect campaign'),
  ('iamlhrtraining.com', 'active', 200, 90, 1.0, 0.1, 35.0, 0, 'smartlead',
   'Past participant domain - 4 inboxes for Alumni Reconnect campaign')
ON CONFLICT (domain_name) DO UPDATE SET
  status = EXCLUDED.status,
  daily_limit = EXCLUDED.daily_limit,
  health_score = EXCLUDED.health_score,
  notes = EXCLUDED.notes,
  updated_at = NOW();

-- PART 2: ADD SMARTLEAD MESSAGES
INSERT INTO campaign_messages (
  campaign_id, channel_id, message_code, message_name, message_type,
  sequence_order, days_after_previous, send_condition, subject_line, body_content
)
VALUES
  -- S1: Initial Email
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888',
   'S1', 'Initial Email', 'email', 1, 0, NULL,
   'Quick question, {{first_name}}',
   E'Hi {{first_name}},\n\nI noticed you attended one of our programs a while back and wanted to reach out.\n\nWe''ve launched free Quarterly Employment Law Updates for IAML alumni - 30-minute briefings on the latest case law and regulatory changes.\n\nWould you be interested in joining us for the next one?\n\nBest,\n{{sender_name}}\nIAML'),

  -- S2a: Opened No Reply
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888',
   'S2a', 'Opened No Reply', 'email', 2, 4, 'opened_no_reply',
   'Re: Quick question',
   E'Hi {{first_name}},\n\nJust following up on my earlier note about the Quarterly Updates.\n\nThese sessions are designed for busy HR leaders - 30 minutes, focused updates, no fluff.\n\nThe next one covers recent FMLA developments and state law changes.\n\nInterested? Just reply and I''ll send you the registration link.\n\n{{sender_name}}'),

  -- S2b: No Open
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888',
   'S2b', 'No Open Follow-up', 'email', 2, 4, 'no_open',
   'Different approach, {{first_name}}',
   E'Hi {{first_name}},\n\nMy last email may have gotten buried, so I''ll keep this short:\n\nAs an IAML alumni, you have access to our free Quarterly Employment Law Updates.\n\n30 minutes. Latest case law. Practical compliance tips.\n\nWorth a look? Just reply "interested" and I''ll send details.\n\n{{sender_name}}'),

  -- S3: Final Push
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888',
   'S3', 'Final Push', 'email', 3, 3, 'no_reply',
   'Last note from me',
   E'Hi {{first_name}},\n\nI don''t want to fill your inbox, so this will be my last email on this.\n\nOur Quarterly Updates are free for alumni and designed for people who don''t have time to track every employment law change themselves.\n\nIf the timing ever feels right: just reply and I''ll add you to the invite list.\n\nEither way, thanks for being part of the IAML community.\n\n{{sender_name}}')
ON CONFLICT DO NOTHING;

-- PART 3: ADD PHONE SCRIPTS
INSERT INTO campaign_messages (
  campaign_id, channel_id, message_code, message_name, message_type,
  sequence_order, body_content
)
VALUES
  -- P1: Call Script
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc333333-4444-5555-6666-777788889999',
   'P1', 'Call Script', 'call_script', 1,
   E'Hi {{first_name}}, this is [Your Name] from IAML.\n\nI''m calling because you attended one of our programs and I wanted to personally invite you to our free Quarterly Employment Law Updates.\n\nThese are 30-minute briefings on the latest case law and regulatory changes - specifically designed for busy HR professionals like yourself.\n\n[PAUSE FOR RESPONSE]\n\nIF INTERESTED:\n"Great! I''ll send you the registration link right after this call. What''s the best email to use?"\n\nIF NOT NOW:\n"No problem at all. Would it be helpful if I sent you some information for when the timing is better?"\n\nIF NOT INTERESTED:\n"I understand completely. Thanks for your time, and feel free to reach out if you ever need anything from IAML."'),

  -- P1-VM: Voicemail Script
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc333333-4444-5555-6666-777788889999',
   'P1-VM', 'Voicemail Script', 'voicemail', 1,
   E'Hi {{first_name}}, this is [Your Name] from IAML.\n\nI''m calling because you attended one of our programs, and I wanted to personally invite you to our free Quarterly Employment Law Updates for alumni.\n\nThese are quick 30-minute briefings on the latest case law changes.\n\nI''ll follow up with an email, or feel free to reach me at [phone number].\n\nThanks, {{first_name}}!'),

  -- P2: Second Attempt
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc333333-4444-5555-6666-777788889999',
   'P2', 'Second Attempt', 'call_script', 2,
   E'Hi {{first_name}}, this is [Your Name] from IAML again.\n\nI left you a voicemail earlier this week about our free Quarterly Updates for alumni.\n\nDo you have a quick minute to chat?\n\n[SAME RESPONSE HANDLING AS P1]')
ON CONFLICT DO NOTHING;
```

### 1.3 Verify Migration Success

Run these verification queries:

```sql
-- Check domains added
SELECT domain_name, status, daily_limit FROM domains
WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com');
-- Expected: 2 rows

-- Check SmartLead messages
SELECT message_code, message_name FROM campaign_messages
WHERE channel_id = 'cc222222-3333-4444-5555-666677778888';
-- Expected: 4 rows (S1, S2a, S2b, S3)

-- Check Phone scripts
SELECT message_code, message_name FROM campaign_messages
WHERE channel_id = 'cc333333-4444-5555-6666-777788889999';
-- Expected: 3 rows (P1, P1-VM, P2)
```

---

## Step 2: Verify Inboxes

### 2.1 Trigger SmartLead Inbox Sync

In n8n:
1. Find workflow: **"Smartlead Inbox Sync"**
2. Click **"Execute Workflow"** manually
3. Wait for completion

### 2.2 Verify Inboxes in Database

```sql
-- Check inboxes linked to past-participant domains
SELECT
  d.domain_name,
  i.inbox_email,
  i.status,
  i.is_connected
FROM email_inboxes i
JOIN domains d ON i.domain_id = d.id
WHERE d.domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com');
-- Expected: 8 rows (4 per domain)
```

**If inboxes don't appear:** You may need to manually link them. Get the domain IDs first:

```sql
SELECT id, domain_name FROM domains
WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com');
```

Then update inbox records:

```sql
UPDATE email_inboxes
SET domain_id = 'DOMAIN_ID_HERE'
WHERE inbox_email LIKE '%@iamlhrseminars.com';

UPDATE email_inboxes
SET domain_id = 'DOMAIN_ID_HERE'
WHERE inbox_email LIKE '%@iamlhrtraining.com';
```

---

## Step 3: Create SmartLead Campaign

### 3.1 Option A: Via SmartLead Dashboard (Recommended)

1. Log into SmartLead
2. Create new campaign: **"Alumni Reconnect Q1 2026 - Past Participants"**
3. Add email sequence with 4 steps:
   - **Step 1 (S1):** Subject: "Quick question, {{first_name}}" - Day 0
   - **Step 2a (S2a):** Subject: "Re: Quick question" - Day 4, condition: opened but no reply
   - **Step 2b (S2b):** Subject: "Different approach, {{first_name}}" - Day 4, condition: not opened
   - **Step 3 (S3):** Subject: "Last note from me" - Day 7, condition: no reply
4. Assign all 8 inboxes from iamlhrseminars.com and iamlhrtraining.com
5. Configure webhook:
   - URL: `https://n8n.realtyamp.ai/webhook/smartlead`
   - Events: All
6. Note the **Campaign ID** from the URL

### 3.2 Option B: Via API

```bash
curl -X POST "https://server.smartlead.ai/api/v1/campaigns?api_key=YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Alumni Reconnect Q1 2026 - Past Participants"
  }'
```

### 3.3 Update Database with Campaign ID

```sql
UPDATE campaign_channels
SET
  platform_campaign_id = 'YOUR_SMARTLEAD_CAMPAIGN_ID',
  status = 'active',
  started_at = NOW()
WHERE id = 'cc222222-3333-4444-5555-666677778888';
```

---

## Step 4: Create HeyReach Campaign

> **Note:** HeyReach campaigns must be created in the UI - there's no API for campaign creation.

### 4.1 Create Campaign in HeyReach Dashboard

1. Log into HeyReach
2. Create new campaign: **"Alumni Reconnect Q1 2026"**
3. Select your LinkedIn account(s)

### 4.2 Create Sequence

Add these steps:

| Step | Type | Timing | Content |
|------|------|--------|---------|
| 1 | Profile View | Day 0 | (automatic) |
| 2 | Connection Request | Day 1 | Your L2 message |
| 3 | Message (if connected) | Day 4 | Your L3 follow-up |

### 4.3 Configure Settings

- **Working hours:** 9 AM - 6 PM
- **Timezone:** Your timezone
- **Daily connection limit:** 25
- **Daily message limit:** 50

### 4.4 Configure Webhook

In HeyReach Settings → Webhooks:
- **URL:** `https://n8n.realtyamp.ai/webhook/heyreach-activity`
- **Events:** All (connection_sent, connection_accepted, message_sent, message_replied)

### 4.5 Get List ID

1. Go to the campaign's lead list
2. Note the **List ID** from the URL or API

### 4.6 Update Database (If Campaign ID Changed)

```sql
UPDATE campaign_channels
SET
  platform_campaign_id = 'YOUR_HEYREACH_CAMPAIGN_ID',
  settings = settings || jsonb_build_object('list_id', 'YOUR_HEYREACH_LIST_ID')
WHERE id = 'cc111111-2222-3333-4444-555566667777';
```

---

## Step 5: Configure GHL Sequences

### 5.1 Create 4 Email Sequences

In GHL → Marketing → Campaigns → Create 4 sequences:

#### Sequence 1: Alumni Q1 - Qualified (Branch A)

| Email | Timing | Subject |
|-------|--------|---------|
| A1 | Immediate | Great to reconnect, {{first_name}}! |
| A2 | Day 3 | Quick question about your team |
| A3 | Day 7 | Last chance reminder |

**A1 Body:**
```
Hi {{first_name}},

It was wonderful hearing back from you! As a past IAML participant,
you have exclusive access to our Quarterly Employment Law Updates.

Register here: [REGISTRATION_LINK]

These free briefings cover:
- Recent case law developments
- Regulatory changes affecting HR
- Practical compliance updates

Looking forward to seeing you there,
[Sender Name]
IAML
```

#### Sequence 2: Alumni Q1 - Training Interest (Branch A+)

| Email | Timing | Subject |
|-------|--------|---------|
| A+1 | Immediate | Your exclusive training options |
| A+2 | Day 2 | Which program works best? |
| A+3 | Day 5 | Ready when you are |

#### Sequence 3: Alumni Q1 - Nurture (Branch B)

| Email | Timing | Subject |
|-------|--------|---------|
| B1 | Day 7 | Thought you'd find this useful |
| B2 | Day 30 | Quick check-in |

#### Sequence 4: Alumni Q1 - No Contact (Branch C)

| Email | Timing | Subject |
|-------|--------|---------|
| C1 | Day 0 | Trying a different approach |
| C2 | Day 5 | Quick question about {{company}} |
| C3 | Day 10 | Can I be direct? |
| C4 | Day 20 | Last email from me |

### 5.2 Create GHL Workflow

Create a new workflow with:

**Trigger:** Webhook
- The webhook URL is already configured: `https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992`

**Action 1:** Create/Update Contact
- Map fields: first_name, last_name, email, company, job_title
- Custom fields: linkedin_url, trigger_channel, ghl_branch

**Action 2:** Add Tags
- "Alumni Q1 2026"
- "Branch: {{ghl_branch}}"

**Action 3:** Branch (If/Else)
- If `ghl_branch` = "A" → Start "Alumni Q1 - Qualified" sequence
- If `ghl_branch` = "A+" → Start "Alumni Q1 - Training Interest" sequence
- If `ghl_branch` = "B" → Start "Alumni Q1 - Nurture" sequence
- If `ghl_branch` = "C" → Start "Alumni Q1 - No Contact" sequence

### 5.3 Test GHL Webhook

```bash
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

Verify contact was created in GHL and sequence started.

---

## Step 6: Import n8n Workflows

### 6.1 Import These Workflows

In n8n → Workflows → Import:

1. **`n8n-workflows/supabase-to-smartlead-exporter.json`**
2. **`n8n-workflows/supabase-to-heyreach-exporter.json`**
3. **`n8n-workflows/waterfall-enrichment.json`**
4. **`n8n-workflows/multichannel-escalation-scheduler.json`**

### 6.2 Configure Environment Variables

In n8n → Settings → Environment Variables, add:

| Variable | Value | Description |
|----------|-------|-------------|
| `SMARTLEAD_API_KEY` | Your key | SmartLead API key |
| `SMARTLEAD_CAMPAIGN_ID` | From Step 3 | The campaign ID you created |
| `HEYREACH_LIST_ID` | From Step 4 | The HeyReach list ID |
| `NEVERBOUNCE_API_KEY` | Your key | For email validation |

### 6.3 Configure Credentials

Ensure these credentials exist in n8n:

| Credential Name | Type | Used By |
|-----------------|------|---------|
| Supabase Postgres | PostgreSQL | All workflows |
| HeyReach API Key | HTTP Header Auth | HeyReach exporter |
| Apollo API Key | HTTP Header Auth | Waterfall enrichment |

### 6.4 Verify Existing Workflows Are Active

Check these workflows are active:
- ✅ SmartLead Activity Receiver
- ✅ HeyReach Activity Receiver
- ✅ Branch C Scheduler
- ✅ SmartLead Inbox Sync

---

## Step 7: Run Verification

### 7.1 Run Full Verification Script

In Supabase SQL Editor, run `supabase/scripts/verify-alumni-reconnect-campaign.sql`

Or run these key checks:

```sql
-- Summary check
SELECT
  (SELECT COUNT(*) FROM domains WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com') AND status = 'active') as domains_active,
  (SELECT COUNT(*) FROM email_inboxes i JOIN domains d ON i.domain_id = d.id WHERE d.domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com') AND i.status = 'active') as inboxes_active,
  (SELECT COUNT(*) FROM campaign_channels WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') as channels_configured,
  (SELECT COUNT(*) FROM campaign_messages WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890') as messages_created,
  (SELECT COUNT(*) FROM campaign_contacts WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' AND status = 'active') as contacts_enrolled;
```

**Expected:**
- domains_active: 2
- inboxes_active: 8
- channels_configured: 4
- messages_created: 22
- contacts_enrolled: (your contact count)

### 7.2 Test Webhooks

```bash
# Test SmartLead webhook
curl -X POST "https://n8n.realtyamp.ai/webhook/smartlead" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "EMAIL_OPEN", "to_email": "test@example.com"}'

# Test HeyReach webhook
curl -X POST "https://n8n.realtyamp.ai/webhook/heyreach-activity" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "connection_request_accepted", "lead": {"linkedinUrl": "https://linkedin.com/in/test"}}'
```

Check n8n execution history to confirm webhooks received.

---

## Step 8: Launch

### 8.1 Pre-Launch Checklist

- [ ] Database migration run
- [ ] 8 inboxes verified and connected
- [ ] SmartLead campaign created with sequences
- [ ] SmartLead webhook configured
- [ ] HeyReach campaign created with sequences
- [ ] HeyReach webhook configured
- [ ] GHL 4 sequences created
- [ ] GHL workflow created and active
- [ ] n8n workflows imported
- [ ] Environment variables configured
- [ ] All webhooks tested
- [ ] Verification script passed

### 8.2 Activate Channels

```sql
-- Activate SmartLead and Phone channels
UPDATE campaign_channels
SET status = 'active', started_at = NOW()
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND channel IN ('smartlead', 'phone');
```

### 8.3 Run Initial Export

1. In n8n, manually execute **"Supabase to SmartLead Exporter"**
2. In n8n, manually execute **"Supabase to HeyReach Exporter"**

### 8.4 Activate Campaigns in Platforms

1. In SmartLead: Activate the campaign
2. In HeyReach: Start the campaign

### 8.5 Monitor First Hour

```sql
-- Check activity in last hour
SELECT channel, activity_type, COUNT(*)
FROM campaign_activity
WHERE activity_at >= NOW() - INTERVAL '1 hour'
GROUP BY channel, activity_type;
```

---

## Reference: Key IDs

| Entity | ID |
|--------|-----|
| Campaign | `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| LinkedIn Channel | `cc111111-2222-3333-4444-555566667777` |
| SmartLead Channel | `cc222222-3333-4444-5555-666677778888` |
| Phone Channel | `cc333333-4444-5555-6666-777788889999` |
| GHL Channel | `cc444444-5555-6666-7777-888899990000` |
| Supabase Postgres Credential (n8n) | `EgmvZHbvINHsh6PR` |
| SmartLead API Credential (n8n) | `a8mXHIaPChJTGO6S` |

---

## Reference: File Locations

| Purpose | Path |
|---------|------|
| **This guide** | `business-os/docs/campaigns/ALUMNI-RECONNECT-IMPLEMENTATION-GUIDE.md` |
| Campaign data migration | `supabase/migrations/20260116_add_alumni_campaign_data.sql` |
| Verification script | `supabase/scripts/verify-alumni-reconnect-campaign.sql` |
| SmartLead exporter | `n8n-workflows/supabase-to-smartlead-exporter.json` |
| HeyReach exporter | `n8n-workflows/supabase-to-heyreach-exporter.json` |
| Waterfall enrichment | `n8n-workflows/waterfall-enrichment.json` |
| Escalation scheduler | `n8n-workflows/multichannel-escalation-scheduler.json` |
| SmartLead activity receiver | `n8n-workflows/smartlead-activity-receiver.json` |
| HeyReach activity receiver | `n8n-workflows/heyreach-activity-receiver.json` |
| Branch C scheduler | `n8n-workflows/branch-c-scheduler.json` |
| Full setup documentation | `business-os/docs/campaigns/alumni-reconnect-q1-2026-setup.md` |
| Campaign tracking schema | `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md` |

---

## Troubleshooting

### Contacts Not Exporting

**Check:** Are contacts enrolled in the campaign?
```sql
SELECT COUNT(*) FROM campaign_contacts
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND status = 'active';
```

**Check:** Do contacts have required data?
```sql
-- For SmartLead (need email)
SELECT COUNT(*) FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND c.email IS NOT NULL;

-- For HeyReach (need LinkedIn)
SELECT COUNT(*) FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND c.linkedin_url IS NOT NULL;
```

### Webhooks Not Firing

1. Check n8n workflow is active
2. Check webhook URL is correct in platform settings
3. Test with curl command
4. Check n8n execution history for errors

### GHL Not Receiving Contacts

1. Check n8n workflow execution history
2. Verify GHL webhook URL is correct
3. Test webhook with curl
4. Check GHL workflow is active

### Inboxes Not Syncing

1. Check SmartLead API key is valid
2. Manually run inbox sync workflow
3. Check domain_id is set correctly on inboxes

---

## Quick Reference: Daily Operations

### Morning Check
```sql
-- Campaign health
SELECT * FROM campaign_funnel
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

### Check Replies Needing Action
```sql
SELECT c.first_name, c.last_name, c.email, cc.ghl_branch, cc.branch_trigger_event
FROM campaign_contacts cc
JOIN contacts c ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND cc.ghl_branch IS NOT NULL
  AND cc.branch_assigned_at >= NOW() - INTERVAL '24 hours';
```

### Check Phone Queue
```sql
SELECT c.first_name, c.last_name, c.phone, c.company
FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
JOIN campaign_contact_channels ccc ON ccc.campaign_contact_id = cc.id
WHERE ccc.campaign_channel_id = 'cc333333-4444-5555-6666-777788889999'
  AND ccc.status = 'pending';
```
