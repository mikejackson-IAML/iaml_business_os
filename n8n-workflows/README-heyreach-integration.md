# HeyReach LinkedIn Activity Tracking Integration

This integration receives webhook events from HeyReach (LinkedIn automation), logs activity to the campaign tracking database, and routes contacts to GHL branches based on engagement signals.

## Overview

```
HeyReach (LinkedIn) → n8n Webhook → Supabase → GHL Workflows
```

**Workflows:**
1. **heyreach-activity-receiver.json** — Main webhook handler
2. **branch-c-scheduler.json** — Daily job to assign Branch C to non-responders

---

## Setup Checklist

### 1. Run Database Migrations

Execute these SQL files in order in the Supabase SQL Editor:

```bash
# Order matters!
supabase/migrations/001_core_foundation_tables.sql   # If not already run
supabase/migrations/002_campaign_tracking_tables.sql # Campaign schema
supabase/migrations/003_seed_alumni_reconnect_campaign.sql # Reference campaign
```

### 2. Configure n8n Credentials

Before importing workflows, set up these credentials in n8n:

| Credential | Type | Notes |
|------------|------|-------|
| **Supabase Postgres** | Postgres | Your Supabase connection string |
| **Gemini API** | HTTP Header Auth | Header: `x-goog-api-key`, Value: your API key |

### 3. Import Workflows

1. Go to n8n → Workflows → Import from File
2. Import `heyreach-activity-receiver.json`
3. Import `branch-c-scheduler.json`
4. Update credential IDs in each workflow:
   - Search for `YOUR_SUPABASE_CREDENTIAL_ID` and replace with your credential ID
   - Search for `YOUR_GEMINI_CREDENTIAL_ID` and replace with your credential ID

### 4. Activate Webhooks

1. Open **HeyReach Activity Receiver** workflow
2. Click "Activate" to enable the webhook
3. Copy the webhook URL (will look like: `https://n8n.realtyamp.ai/webhook/heyreach-activity`)

### 5. Configure HeyReach Webhook

1. Go to HeyReach → Integrations → Webhooks
2. Create new webhook:
   - **Name:** `n8n Activity Tracker`
   - **URL:** `https://n8n.realtyamp.ai/webhook/heyreach-activity`
   - **Campaigns:** Select "Alumni Reconnect Q1" (ID: 298521)
   - **Events:** Select all:
     - Connection Request Sent
     - Connection Request Accepted
     - Message Sent
     - Message Reply Received
     - Profile Viewed

### 6. Test the Integration

**Test GHL Webhook:**
```bash
curl -X POST "https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992" \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "Contact",
    "email": "test@example.com",
    "ghl_branch": "A",
    "source": "n8n_test"
  }'
```

**Test n8n Webhook:**
```bash
curl -X POST "https://n8n.realtyamp.ai/webhook/heyreach-activity" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "connection_request_accepted",
    "lead": {
      "firstName": "Test",
      "lastName": "User",
      "linkedinUrl": "https://linkedin.com/in/test-user",
      "emailAddress": "test@example.com",
      "companyName": "Test Corp",
      "position": "VP of HR"
    },
    "campaign": {
      "id": "298521",
      "name": "Alumni-Reconnect-Q1-LI"
    },
    "timestamp": "2026-01-09T14:30:00Z"
  }'
```

---

## Workflow Details

### HeyReach Activity Receiver

**Trigger:** HTTP POST webhook from HeyReach

**Event Flow:**
```
1. Receive webhook POST
2. Extract & normalize payload
3. Normalize LinkedIn URL (remove www, trailing slash, etc.)
4. Check for duplicate event (by heyreach_event_id)
5. Lookup contact by LinkedIn URL
6. If not found → Create new contact
7. Get/create campaign_contact and campaign_contact_channels records
8. Insert activity into campaign_activity
9. Update channel status fields (linkedin_connected, has_replied, etc.)
10. If reply event:
    a. Classify reply with Gemini Flash
    b. If positive/interested → Assign Branch A
    c. If interested in secondary → Assign Branch A+
    d. If "maybe later" → Assign Branch B
    e. If opt-out → Handle opt-out, pause all channels
11. Push to GHL webhook with branch assignment
```

**Event Type Mapping:**

| HeyReach Event | Activity Type |
|----------------|---------------|
| `connection_request_sent` | `connection_sent` |
| `connection_request_accepted` | `connection_accepted` |
| `message_sent` | `message_sent` |
| `message_reply_received` | `message_replied` |
| `viewed_profile` | `profile_viewed` |

**Reply Classification (AI):**

| Classification | Branch | Meaning |
|----------------|--------|---------|
| `positive_reply` | A | Interested in reconnecting |
| `interested_secondary` | A+ | Wants virtual training |
| `not_now_polite` | B | Maybe later, timing issue |
| `neutral` | None | Unclear, no action |
| `not_interested` | Opt Out | Firm no |
| `unsubscribe` | Opt Out | Remove me |

### Branch C Scheduler

**Trigger:** Daily at 6:00 AM

**Logic:**
1. Query contacts where:
   - LinkedIn channel is active
   - Last message was L3 (final follow-up)
   - Sent more than 7 days ago
   - No reply received
   - No branch assigned yet
2. For each contact:
   - Assign Branch C via `assign_ghl_branch()` function
   - Push to GHL webhook

---

## Database Schema

Key tables used:

| Table | Purpose |
|-------|---------|
| `contacts` | Master contact records |
| `multichannel_campaigns` | Campaign definitions |
| `campaign_channels` | Channels per campaign (LinkedIn, Smartlead, etc.) |
| `campaign_contacts` | Contact journey through campaign |
| `campaign_contact_channels` | Per-channel status |
| `campaign_activity` | Event log |

**Helper Functions:**
- `assign_ghl_branch(campaign_contact_id, channel, trigger_event)` — Routes to GHL branch
- `handle_opt_out(campaign_contact_id, channel, reason)` — Processes opt-outs
- `update_contact_lifecycle_tag(...)` — Updates lifecycle tags

---

## GHL Integration

**Inbound Webhook URL:**
```
https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992
```

**Payload Fields:**

| Field | Description |
|-------|-------------|
| `first_name` | Contact first name |
| `last_name` | Contact last name |
| `email` | Contact email (required by GHL) |
| `linkedin_url` | LinkedIn profile URL |
| `ghl_branch` | Assigned branch (A, A+, B, C) |
| `campaign_name` | Campaign name |
| `trigger_event` | What triggered the branch assignment |
| `trigger_channel` | Which channel triggered (linkedin) |
| `company` | Contact's company |
| `job_title` | Contact's job title |
| `reply_text` | Reply message (if applicable) |
| `reply_sentiment` | AI classification |

---

## Troubleshooting

### Webhook not receiving events
1. Check n8n workflow is active
2. Verify HeyReach webhook URL matches exactly
3. Check HeyReach webhook is enabled for correct campaign

### Contacts not matching
1. Check LinkedIn URL normalization is working
2. Look at `campaign_activity` for `match_failed` events
3. Verify contacts have LinkedIn URLs in the database

### AI classification issues
1. Check Gemini API key is valid
2. Review `gemini_raw_response` in activity metadata
3. Default behavior: classify as `neutral` on error

### Duplicate events
1. Events are de-duplicated by `heyreach_event_id`
2. Check `campaign_activity` metadata for the event ID
3. HeyReach retries up to 5 times on failure

---

## Monitoring

**Check recent activity:**
```sql
SELECT
  activity_type,
  channel,
  metadata,
  created_at
FROM campaign_activity
ORDER BY created_at DESC
LIMIT 20;
```

**Check branch distribution:**
```sql
SELECT
  ghl_branch,
  COUNT(*) as count
FROM campaign_contacts
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY ghl_branch;
```

**Check pending Branch C candidates:**
```sql
SELECT * FROM contacts_for_branch_c;
```

---

## Files

| File | Purpose |
|------|---------|
| `n8n-workflows/heyreach-activity-receiver.json` | Main webhook workflow |
| `n8n-workflows/branch-c-scheduler.json` | Daily Branch C assignment |
| `supabase/migrations/002_campaign_tracking_tables.sql` | Campaign schema |
| `supabase/migrations/003_seed_alumni_reconnect_campaign.sql` | Reference campaign data |
| `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md` | Schema documentation |
