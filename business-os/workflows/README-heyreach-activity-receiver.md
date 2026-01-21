# HeyReach Activity Receiver

> **CEO Summary:** Automatically captures LinkedIn outreach activity from HeyReach, uses AI to classify replies, and routes qualified leads to GHL for follow-up.

## What It Does

This workflow receives webhooks from HeyReach whenever LinkedIn activity occurs (connection requests, messages, replies). For reply events, it uses Google's Gemini AI to classify the sentiment and automatically routes qualified leads to the appropriate GHL follow-up sequence.

## Workflow Details

| Property | Value |
|----------|-------|
| **Workflow ID** | `9bt5BdyoosqB8ChU` |
| **URL** | https://n8n.realtyamp.ai/workflow/9bt5BdyoosqB8ChU |
| **Status** | Active |
| **Trigger** | Webhook (`/webhook/heyreach-activity`) |
| **Test Status** | Verified (2026-01-21) |

## Data Flow

```
HeyReach Webhook
       ↓
Extract & Normalize LinkedIn URL
       ↓
Check Duplicate Event (skip if already processed)
       ↓
Lookup Contact ──→ Create if not found
       ↓
Get/Create Campaign Context
       ↓
Log Activity to campaign_activity
       ↓
Is Reply? ──No──→ End (non-reply events just logged)
       ↓ Yes
Classify with Gemini AI
       ↓
┌──────────────────────────────────────────┐
│ Classification → GHL Branch              │
├──────────────────────────────────────────┤
│ positive_reply      → Branch A (Qualified)│
│ interested_secondary→ Branch A+ (Team)    │
│ not_now_polite      → Branch B (Nurture)  │
│ not_interested      → Opt Out             │
│ unsubscribe         → Opt Out             │
│ neutral             → No branch           │
└──────────────────────────────────────────┘
       ↓
Assign GHL Branch & Push to GHL
```

## Integrations

| Service | Purpose |
|---------|---------|
| HeyReach | Source of LinkedIn activity webhooks |
| Supabase | Contact storage, campaign tracking, activity logging |
| Gemini AI | Reply sentiment classification |
| GHL | CRM for qualified lead follow-up |

## Event Types Handled

| HeyReach Event | Mapped Activity | Action |
|----------------|-----------------|--------|
| `connection_request_sent` | `connection_sent` | Log only |
| `connection_request_accepted` | `connection_accepted` | Log + update channel status |
| `message_sent` | `message_sent` | Log only |
| `reply_received` | `message_replied` | Log + AI classify + route to GHL |
| `message_reply_received` | `message_replied` | Log + AI classify + route to GHL |

## Error Handling

- All Postgres nodes have `onError: continueRegularOutput` for graceful degradation
- Duplicate events are detected and skipped
- Invalid LinkedIn URLs are logged and skipped
- Slack and email alerts on workflow errors

## Database Tables Used

- `contacts` - Master contact records
- `campaign_contacts` - Contact journey through campaign
- `campaign_contact_channels` - Per-channel status (LinkedIn)
- `campaign_activity` - Event log

## Configuration

The workflow is hardcoded for the Alumni Reconnect Q1 2026 campaign:
- Campaign ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890`
- LinkedIn Channel ID: `cc111111-2222-3333-4444-555566667777`

To use for other campaigns, update these IDs in the `Get/Create Campaign Context` node.

## Testing

Test with curl:
```bash
curl -X POST "https://n8n.realtyamp.ai/webhook/heyreach-activity" \
  -H "Content-Type: application/json" \
  -d '{
    "event_type": "reply_received",
    "id": "test-123",
    "lead": {
      "firstName": "Test",
      "lastName": "User",
      "linkedinUrl": "https://linkedin.com/in/test-user",
      "emailAddress": "test@example.com",
      "companyName": "Test Corp",
      "position": "Director"
    },
    "message": {
      "text": "Yes, I am interested in learning more!"
    },
    "campaign": {
      "id": "campaign-999",
      "name": "Test Campaign"
    },
    "timestamp": "2026-01-21T12:00:00.000Z"
  }'
```

## Known Issues

- The `trigger_heyreach_export` trigger on the contacts table must be disabled (uses pg_net which isn't enabled)

## Related

- Campaign Tracking Schema: `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md`
- Alumni Reconnect Campaign: `business-os/docs/campaigns/alumni-reconnect-q1-2026.md`
