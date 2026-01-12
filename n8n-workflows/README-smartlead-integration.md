# Smartlead Email Activity Tracking Integration

This integration receives webhook events from Smartlead (cold email platform), logs activity to the campaign tracking database, and routes contacts to GHL branches based on engagement signals.

## Overview

```
Smartlead (Email) -> n8n Webhook -> Supabase -> GHL Workflows
```

**Workflow:** `smartlead-activity-receiver.json`

---

## Setup Checklist

### 1. Ensure Database Is Ready

The campaign schema and Smartlead channel should already exist:

```sql
-- Verify Smartlead channel exists
SELECT * FROM campaign_channels
WHERE id = 'cc222222-3333-4444-5555-666677778888';
```

### 2. Import Workflow

1. Go to n8n -> Workflows -> Import from File
2. Import `smartlead-activity-receiver.json`
3. Verify the Supabase Postgres credential ID matches your setup
   - Current ID: `EgmvZHbvINHsh6PR`
   - If different, search and replace in the JSON before importing

### 3. Activate Webhook

1. Open **Smartlead Activity Receiver** workflow
2. Click "Activate" to enable the webhook
3. Copy the webhook URL: `https://n8n.realtyamp.ai/webhook/smartlead`

### 4. Configure Smartlead Webhook

1. Go to Smartlead -> Settings -> Webhooks (or API -> Webhooks)
2. Create new webhook:
   - **URL:** `https://n8n.realtyamp.ai/webhook/smartlead`
   - **Events:** Select all:
     - EMAIL_SENT
     - EMAIL_OPEN
     - EMAIL_LINK_CLICK
     - EMAIL_REPLY
     - EMAIL_BOUNCE
     - LEAD_UNSUBSCRIBED
     - LEAD_CATEGORY_UPDATED
3. Note down the `secret_key` if you want to add verification later

### 5. Test the Integration

```bash
curl -X POST "https://n8n.realtyamp.ai/webhook/smartlead" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "EMAIL_SENT",
    "event_timestamp": "2026-01-11T10:00:00Z",
    "to_email": "test@example.com",
    "to_name": "Test User",
    "from_email": "sender@iaml.com",
    "subject": "Quarterly Updates for IAML Alumni",
    "campaign_id": "12345",
    "campaign_name": "Alumni-Reconnect-Q1-SL",
    "sequence_number": 1,
    "stats_id": "test-123"
  }'
```

---

## Workflow Details

### Event Flow

```
1. Receive webhook POST from Smartlead
2. Respond immediately with 200 OK (non-blocking)
3. Extract and normalize payload fields
4. Map Smartlead event_type to our activity_type
5. Validate email is present
6. Check for duplicate event (by stats_id)
7. Lookup contact by email
8. Get campaign_contact and campaign_contact_channels records
9. Insert activity into campaign_activity
10. Route by event type:
    - sent: Update channel status, increment touches
    - opened: Update opened_at, set engagement=warm
    - clicked: Update clicked_at, set engagement=engaged
    - replied: Classify reply, potentially assign branch
    - bounced: Pause channel, mark email as invalid
    - unsubscribed: Opt out contact
    - category_updated: Process lead category, potentially assign branch
```

### Event Type Mapping

| Smartlead Event | Our Activity Type | Description |
|-----------------|-------------------|-------------|
| `EMAIL_SENT` | `sent` | Email was sent to recipient |
| `EMAIL_OPEN` | `opened` | Recipient opened the email |
| `EMAIL_LINK_CLICK` | `clicked` | Recipient clicked a link |
| `EMAIL_REPLY` | `replied` | Recipient replied to email |
| `EMAIL_BOUNCE` | `bounced` | Email bounced (hard/soft) |
| `LEAD_UNSUBSCRIBED` | `unsubscribed` | Recipient unsubscribed |
| `LEAD_CATEGORY_UPDATED` | `status_changed` | Lead category changed in Smartlead |

### Engagement Level Updates

| Event | Engagement Level |
|-------|-----------------|
| sent | (no change) |
| opened | `cold` -> `warm` |
| clicked | `cold`/`warm` -> `engaged` |
| replied | -> `hot` |

### Reply Classification

Replies are classified using Smartlead's `reply_category` field first. If not available, AI (Gemini) classifies the reply text.

| Classification | Branch | Meaning |
|----------------|--------|---------|
| `positive_reply` | A | Interested in reconnecting |
| `interested_secondary` | A+ | Wants virtual training |
| `not_now_polite` | B | Maybe later, timing issue |
| `neutral` | None | Unclear, no action |
| `not_interested` | Opt Out | Firm no |
| `unsubscribe` | Opt Out | Remove me |

### Lead Category Mapping

Smartlead's lead categories are mapped to actions:

| Category Contains | Action |
|-------------------|--------|
| "Interested" (not "Not") | Branch A |
| "Meeting", "Demo", "Call" | Branch A |
| "Not Interested" | Opt Out |
| "Wrong Person" | Pause Contact |
| "Out of Office", "Auto Reply" | Log only |
| "Unsubscribe" | Opt Out |
| "Maybe", "Later", "Not Now" | Branch B |

---

## Database Updates

### On EMAIL_SENT

**campaign_contact_channels:**
- `status` = 'active'
- `current_message_code` = 'S{sequence_number}'
- `current_message_sent_at` = event_timestamp

**campaign_contacts:**
- `total_touches` += 1
- `first_touch_at` = COALESCE(first_touch_at, event_timestamp)
- `last_touch_at` = event_timestamp

### On EMAIL_OPEN

**campaign_contact_channels:**
- `last_email_opened_at` = event_timestamp
- `engagement_level` = 'warm' (if was 'cold')

**campaign_contacts:**
- `last_touch_at` = event_timestamp
- `first_engagement_at` = COALESCE(first_engagement_at, event_timestamp)

### On EMAIL_LINK_CLICK

**campaign_contact_channels:**
- `last_email_clicked_at` = event_timestamp
- `engagement_level` = 'engaged' (if was 'cold' or 'warm')

**campaign_contacts:**
- `last_touch_at` = event_timestamp
- `first_engagement_at` = COALESCE(first_engagement_at, event_timestamp)

### On EMAIL_REPLY

**campaign_contact_channels:**
- `has_replied` = TRUE
- `replied_at` = event_timestamp
- `engagement_level` = 'hot'
- `reply_sentiment` = classification result

**campaign_contacts:**
- `last_touch_at` = event_timestamp
- `first_engagement_at` = COALESCE(first_engagement_at, event_timestamp)

### On EMAIL_BOUNCE

**campaign_contact_channels:**
- `status` = 'paused'

**contacts:**
- `email_status` = 'bounced'
- `email_validation_result` = 'invalid'
- `email_validated_at` = NOW()
- `email_validation_source` = 'smartlead_bounce'

### On LEAD_UNSUBSCRIBED

**campaign_contact_channels:**
- `status` = 'paused'

**campaign_contacts:**
- `status` = 'opted_out'
- `opted_out_at` = NOW()
- `opt_out_reason` = 'Unsubscribed via Smartlead'
- `opt_out_channel` = 'smartlead'

---

## GHL Integration

When a reply or category update triggers a branch assignment, the workflow pushes to GHL:

**Webhook URL:**
```
https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992
```

**Payload:**
```json
{
  "first_name": "...",
  "last_name": "...",
  "email": "...",
  "linkedin_url": "...",
  "ghl_branch": "A|A+|B|C",
  "campaign_name": "Alumni Reconnect Q1 2026",
  "trigger_event": "positive_reply|not_now_polite|...",
  "trigger_channel": "smartlead",
  "reply_text": "...",
  "reply_sentiment": "...",
  "source": "n8n_smartlead_integration"
}
```

---

## Error Handling

The workflow logs errors to `campaign_activity` with `activity_type = 'webhook_error'`:

| Error | Meaning |
|-------|---------|
| No email in payload | Smartlead sent event without `to_email` |
| Contact not found by email | Email not in contacts table |
| No campaign context found | Contact exists but not in this campaign |

All error logs include the raw event data in metadata for debugging.

---

## Monitoring

**Check recent Smartlead activity:**
```sql
SELECT
  activity_type,
  metadata->>'smartlead_event_id' as event_id,
  metadata->>'sequence_number' as seq,
  created_at
FROM campaign_activity
WHERE channel = 'smartlead'
ORDER BY created_at DESC
LIMIT 20;
```

**Check email channel status:**
```sql
SELECT
  c.email,
  c.first_name,
  c.last_name,
  ccc.status,
  ccc.current_message_code,
  ccc.has_replied,
  ccc.engagement_level
FROM campaign_contact_channels ccc
JOIN campaign_contacts cc ON cc.id = ccc.campaign_contact_id
JOIN contacts c ON c.id = cc.contact_id
WHERE ccc.campaign_channel_id = 'cc222222-3333-4444-5555-666677778888'
ORDER BY ccc.updated_at DESC;
```

**Check bounces:**
```sql
SELECT
  c.email,
  c.email_status,
  c.email_validation_source,
  c.email_validated_at
FROM contacts c
WHERE c.email_status = 'bounced'
  AND c.email_validation_source = 'smartlead_bounce'
ORDER BY c.email_validated_at DESC;
```

---

## Troubleshooting

### Webhook not receiving events
1. Check n8n workflow is active
2. Verify Smartlead webhook URL matches exactly
3. Check Smartlead webhook is enabled and not paused

### Contacts not matching
1. Verify email addresses match (case-insensitive)
2. Check `campaign_activity` for `webhook_error` events
3. Ensure contacts are enrolled in the campaign

### Reply classification issues
1. Check if Smartlead is providing `reply_category`
2. Review `gemini_raw_response` in activity metadata
3. Default behavior: classify as `neutral` on error

### Duplicate events
1. Events are de-duplicated by `stats_id`
2. Check `campaign_activity` metadata for the event ID

---

## Files

| File | Purpose |
|------|---------|
| `n8n-workflows/smartlead-activity-receiver.json` | Main webhook workflow |
| `supabase/migrations/003_seed_alumni_reconnect_campaign.sql` | Includes Smartlead channel seed |
| `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md` | Schema documentation |
