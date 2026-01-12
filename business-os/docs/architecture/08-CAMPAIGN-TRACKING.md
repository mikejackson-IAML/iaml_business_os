# Campaign Tracking Schema

> **Purpose:** Documents the multi-channel campaign tracking system implemented in Supabase. Use this as the source of truth for campaign-related tables, relationships, and constraints.

> **Last Updated:** January 2025

> **Reference Implementation:** Alumni Reconnect Q1 2026 Campaign

---

## Overview

The campaign tracking system supports multi-channel outreach campaigns with:
- Multiple channels per campaign (LinkedIn, Smartlead, Phone, GHL)
- Message sequences with A/B testing
- Contact journey tracking across channels
- Activity logging and engagement scoring
- GHL branch routing based on engagement signals

---

## Entity Relationship Diagram

```
┌─────────────────────┐
│ multichannel_       │
│ campaigns           │
│ (master campaign)   │
└─────────┬───────────┘
          │
          │ 1:many
          ▼
┌─────────────────────┐      ┌─────────────────────┐
│ campaign_channels   │      │ campaign_messages   │
│ (LinkedIn, SL, etc) │      │ (message templates) │
└─────────┬───────────┘      └─────────┬───────────┘
          │                            │
          │                            │ 1:many
          │                            ▼
          │                  ┌─────────────────────┐
          │                  │ message_variants    │
          │                  │ (A/B test versions) │
          │                  └─────────────────────┘
          │
          │ many:many (via campaign_contact_channels)
          ▼
┌─────────────────────┐
│ campaign_contacts   │◄────────────────┐
│ (contact journey)   │                 │
└─────────┬───────────┘                 │
          │                             │
          │ 1:many                      │ many:1
          ▼                             │
┌─────────────────────┐      ┌─────────┴───────────┐
│ campaign_contact_   │      │ contacts            │
│ channels            │      │ (master contact     │
│ (per-channel status)│      │  record)            │
└─────────┬───────────┘      └─────────────────────┘
          │
          │ 1:many
          ▼
┌─────────────────────┐
│ campaign_activity   │
│ (event log)         │
└─────────────────────┘
```

---

## Table Schemas

### contacts

Central source of truth for all contacts (past participants, leads, customers).

```sql
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,  -- Can be NULL for LinkedIn-only contacts
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  job_title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  
  -- Company verification (for past participants)
  company_status TEXT,  -- 'verified' = same company, 'changed' = new company
  company_verified_at TIMESTAMPTZ,
  previous_company TEXT,  -- If company_status = 'changed'
  
  -- Email validation tracking
  email_status TEXT CHECK (email_status IN ('unknown', 'valid', 'invalid', 'catch_all', 'bounced')),
  email_validated_at TIMESTAMPTZ,
  email_validation_source TEXT,  -- 'neverbounce', 'zerobounce', 'millionverifier', 'apollo', 'manual'
  email_validation_result TEXT,  -- 'valid', 'invalid', 'catch_all', 'unknown'
  email_validation_details JSONB DEFAULT '{}',
  
  -- Lifecycle
  lifecycle_stage TEXT DEFAULT 'customer',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Key indexes
CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_linkedin ON contacts(linkedin_url);
CREATE INDEX idx_contacts_company_status ON contacts(company_status);
CREATE INDEX idx_contacts_email_validation ON contacts(email_validation_result, email_validated_at);
```

**email_validation_details JSONB structure:**
```json
{
  "batch": "Alumni Reconnect Q1 2026 Import",
  "validated_date": "2025-01-09",
  "notes": "Optional notes",
  "original_status": "valid"  // From source file
}
```

---

### multichannel_campaigns

Master campaign record.

```sql
CREATE TABLE multichannel_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT,  -- 'reengagement', 'cold_outreach', 'nurture'
  
  -- Offers
  primary_offer TEXT,
  primary_offer_value TEXT,
  secondary_offer TEXT,
  secondary_offer_programs TEXT[],
  
  -- Status
  status TEXT DEFAULT 'draft',  -- 'draft', 'active', 'paused', 'completed'
  
  -- Timeline
  planned_start_date DATE,
  planned_end_date DATE,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### campaign_channels

Individual channels within a campaign.

```sql
CREATE TABLE campaign_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES multichannel_campaigns(id) ON DELETE CASCADE,
  
  channel TEXT NOT NULL,  -- 'linkedin', 'smartlead', 'phone', 'ghl'
  platform TEXT,  -- 'heyreach', 'smartlead', 'ghl', 'manual'
  internal_name TEXT,  -- e.g., 'Alumni-Reconnect-Q1-LI'
  platform_campaign_id TEXT,  -- ID in external platform
  
  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  
  -- Settings
  settings JSONB DEFAULT '{}',
  
  -- Status
  status TEXT DEFAULT 'draft',  -- 'draft', 'active', 'paused', 'completed'
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### campaign_messages

Message templates for each channel.

```sql
CREATE TABLE campaign_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES multichannel_campaigns(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES campaign_channels(id) ON DELETE CASCADE,
  
  message_code TEXT NOT NULL,  -- 'L2', 'S1', 'A1', etc.
  message_name TEXT NOT NULL,
  message_type TEXT,  -- 'connection_request', 'follow_up', 'email', 'call_script', 'voicemail'
  
  -- Sequence position
  sequence_order INTEGER,
  days_after_previous INTEGER,
  
  -- Content
  subject_line TEXT,
  body_content TEXT,
  
  -- Conditions
  send_condition TEXT,  -- 'opened_no_reply', 'no_open', 'connected', etc.
  
  -- GHL branch (for GHL channel)
  ghl_branch TEXT,  -- 'A', 'A+', 'B', 'C'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Message Code Convention:**
| Prefix | Channel | Example |
|--------|---------|---------|
| L | LinkedIn | L2, L3 |
| S | Smartlead | S1, S2a, S2b |
| P | Phone | P1, P1-VM |
| A | GHL Branch A (Qualified) | A1, A2, A3 |
| A+ | GHL Branch A+ (Qualified+) | A+1, A+2, A+3 |
| B | GHL Branch B (Nurture) | B1, B2 |
| C | GHL Branch C (No Contact) | C1, C2, C3, C4 |

---

### message_variants

A/B test variants for messages.

```sql
CREATE TABLE message_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES campaign_messages(id) ON DELETE CASCADE,
  
  variant_code TEXT NOT NULL,  -- 'A', 'B', 'C'
  variant_name TEXT,
  
  -- Content override
  subject_line TEXT,
  body_content TEXT,
  
  -- Traffic allocation
  traffic_percentage INTEGER DEFAULT 33,  -- Percentage of traffic
  
  -- Performance tracking
  sends INTEGER DEFAULT 0,
  opens INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  replies INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### campaign_contacts

Contact's journey through a campaign.

```sql
CREATE TABLE campaign_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID REFERENCES multichannel_campaigns(id) ON DELETE CASCADE,
  contact_id UUID REFERENCES contacts(id) ON DELETE CASCADE,
  
  -- Lifecycle tracking
  lifecycle_tag TEXT DEFAULT 'STANDARD',
  lifecycle_tag_updated_at TIMESTAMPTZ,
  
  -- GHL branch assignment
  ghl_branch TEXT,  -- 'A', 'A+', 'B', 'C', NULL
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
  secondary_offer_recipient TEXT,  -- 'self' or 'colleague'
  
  -- Colleague referral
  colleague_name TEXT,
  colleague_email TEXT,
  colleague_registered BOOLEAN DEFAULT FALSE,
  
  -- Status
  status TEXT DEFAULT 'active',  -- 'active', 'paused', 'completed', 'opted_out'
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
```

**Lifecycle Tags:**
| Tag | Description |
|-----|-------------|
| `STANDARD` | Default starting state |
| `HOT LEAD` | High engagement signals |
| `ENGAGED` | Has interacted but not converted |
| `WARM` | Some engagement |
| `COLD` | No engagement |
| `QUALIFIED` | Ready for GHL Branch A |
| `QUALIFIED+` | Ready for GHL Branch A+ |
| `NURTURE` | GHL Branch B |
| `PAUSED` | Temporarily paused (e.g., invalid email) |
| `NO CONTACT` | Exhausted all channels |
| `OPT OUT` | Explicitly opted out |

---

### campaign_contact_channels

Per-channel status for each contact.

```sql
CREATE TABLE campaign_contact_channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  campaign_channel_id UUID REFERENCES campaign_channels(id) ON DELETE CASCADE,
  
  -- Message progress
  current_message_code TEXT,
  current_message_sent_at TIMESTAMPTZ,
  next_message_code TEXT,
  next_message_scheduled_at TIMESTAMPTZ,
  
  -- Status
  status TEXT DEFAULT 'pending',  -- 'pending', 'active', 'paused', 'completed', 'exhausted'
  
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
  last_call_outcome TEXT,  -- 'connected', 'no_answer', 'voicemail', 'callback_scheduled'
  callback_scheduled_at TIMESTAMPTZ,
  callback_notes TEXT,
  
  -- Engagement
  engagement_level TEXT DEFAULT 'cold',  -- 'cold', 'warm', 'engaged', 'hot'
  has_replied BOOLEAN DEFAULT FALSE,
  replied_at TIMESTAMPTZ,
  reply_sentiment TEXT,  -- 'positive', 'neutral', 'negative'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(campaign_contact_id, campaign_channel_id)
);
```

---

### campaign_activity

Event log for all campaign activities.

```sql
CREATE TABLE campaign_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_contact_id UUID REFERENCES campaign_contacts(id) ON DELETE CASCADE,
  campaign_channel_id UUID REFERENCES campaign_channels(id),
  message_id UUID REFERENCES campaign_messages(id),
  variant_id UUID REFERENCES message_variants(id),
  
  activity_type TEXT NOT NULL,
  activity_at TIMESTAMPTZ DEFAULT NOW(),
  channel TEXT,  -- 'linkedin', 'smartlead', 'phone', 'ghl', 'system'
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint on activity_type
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
  'tag_changed', 'branch_assigned', 'status_changed', 'opted_out'
));
```

---

## Helper Functions

### update_contact_lifecycle_tag

Changes lifecycle tag and logs the change.

```sql
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
    lifecycle_tag_updated_at = NOW()
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
```

### assign_ghl_branch

Routes contact to appropriate GHL branch based on trigger event.

```sql
CREATE OR REPLACE FUNCTION assign_ghl_branch(
  p_campaign_contact_id UUID,
  p_trigger_channel TEXT,
  p_trigger_event TEXT
) RETURNS TEXT AS $$
DECLARE
  v_branch TEXT;
BEGIN
  -- Determine branch based on trigger event
  v_branch := CASE
    WHEN p_trigger_event IN ('positive_reply', 'interested', 'call_interested', 'yes_reply') THEN 'A'
    WHEN p_trigger_event IN ('interested_secondary', 'wants_virtual_training') THEN 'A+'
    WHEN p_trigger_event IN ('not_now_polite', 'maybe_later', 'call_not_now') THEN 'B'
    WHEN p_trigger_event IN ('no_contact_exhausted', 'calls_exhausted', 'no_response') THEN 'C'
    WHEN p_trigger_event IN ('not_interested', 'unsubscribe') THEN NULL  -- Opt out, no branch
    ELSE NULL
  END;
  
  IF v_branch IS NOT NULL THEN
    UPDATE campaign_contacts
    SET 
      ghl_branch = v_branch,
      branch_assigned_at = NOW(),
      branch_trigger_channel = p_trigger_channel,
      branch_trigger_event = p_trigger_event
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
```

---

## Views

### campaign_funnel

Shows campaign conversion funnel.

```sql
CREATE OR REPLACE VIEW campaign_funnel AS
SELECT 
  mc.id as campaign_id,
  mc.name as campaign_name,
  COUNT(cc.id) as total_contacts,
  COUNT(cc.id) FILTER (WHERE cc.status = 'active') as active_contacts,
  COUNT(cc.id) FILTER (WHERE cc.first_engagement_at IS NOT NULL) as engaged_contacts,
  COUNT(cc.id) FILTER (WHERE cc.ghl_branch IS NOT NULL) as qualified_contacts,
  COUNT(cc.id) FILTER (WHERE cc.quarterly_update_registered = TRUE) as registered_contacts
FROM multichannel_campaigns mc
LEFT JOIN campaign_contacts cc ON cc.campaign_id = mc.id
GROUP BY mc.id, mc.name;
```

### channel_performance

Shows per-channel metrics.

```sql
CREATE OR REPLACE VIEW channel_performance AS
SELECT 
  ch.id as channel_id,
  ch.channel,
  ch.platform,
  COUNT(ccc.id) as total_contacts,
  COUNT(ccc.id) FILTER (WHERE ccc.status = 'active') as active,
  COUNT(ccc.id) FILTER (WHERE ccc.status = 'paused') as paused,
  COUNT(ccc.id) FILTER (WHERE ccc.has_replied = TRUE) as replied,
  COUNT(ccc.id) FILTER (WHERE ccc.engagement_level = 'hot') as hot_leads
FROM campaign_channels ch
LEFT JOIN campaign_contact_channels ccc ON ccc.campaign_channel_id = ch.id
GROUP BY ch.id, ch.channel, ch.platform;
```

---

## Reference Implementation: Alumni Reconnect Q1 2026

### Campaign Structure

```
Campaign: Alumni Reconnect Q1 2026
├── LinkedIn Channel (HeyReach)
│   ├── L2: Connection Request
│   ├── L2-Alt: Already Connected Message
│   └── L3: Follow-up Message
├── Smartlead Channel
│   ├── S1: Initial Email (3 A/B variants)
│   ├── S2a: Follow-up - Opened No Reply
│   └── S2b: Follow-up - No Open
├── Phone Channel (Manual)
│   ├── P1: Call Script
│   └── P1-VM: Voicemail Script
└── GHL Channel
    ├── Branch A (Qualified)
    │   ├── A1: Confirmation
    │   ├── A2: Secondary Offer
    │   └── A3: Reminder
    ├── Branch A+ (Qualified+)
    │   ├── A+1: Virtual Training Focus
    │   ├── A+2: Program Selection
    │   └── A+3: Final Reminder
    ├── Branch B (Nurture)
    │   ├── B1: Pure Value
    │   └── B2: Light Touch
    └── Branch C (No Contact)
        ├── C1: Fresh Start
        ├── C2: Different Angle
        ├── C3: Direct Ask
        └── C4: Final Attempt
```

### Contact Segments

| Segment | Count | Email Status | Channels Active |
|---------|-------|--------------|-----------------|
| Same company - valid email | 1,100 | Valid | All |
| Same company - invalid email | 88 | Invalid | None (paused) |
| Same company - no email | 399 | None | LinkedIn, Phone |
| Changed company - valid email | 579 | Valid | All |
| **Total** | **2,166** | | |

### Campaign ID

```
a1b2c3d4-e5f6-7890-abcd-ef1234567890
```

---

## Common Queries

### Get all contacts in campaign with status

```sql
SELECT 
  c.first_name,
  c.last_name,
  c.email,
  c.company,
  c.company_status,
  c.email_validation_result,
  cc.status,
  cc.lifecycle_tag,
  cc.ghl_branch
FROM campaign_contacts cc
JOIN contacts c ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY c.last_name;
```

### Get channel status breakdown

```sql
SELECT 
  ch.channel,
  ccc.status,
  COUNT(*) as count
FROM campaign_contact_channels ccc
JOIN campaign_channels ch ON ch.id = ccc.campaign_channel_id
JOIN campaign_contacts cc ON cc.id = ccc.campaign_contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
GROUP BY ch.channel, ccc.status
ORDER BY ch.channel, ccc.status;
```

### Find contacts ready for GHL

```sql
SELECT 
  c.first_name,
  c.last_name,
  c.email,
  cc.ghl_branch,
  cc.branch_trigger_event
FROM campaign_contacts cc
JOIN contacts c ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND cc.ghl_branch IS NOT NULL
ORDER BY cc.branch_assigned_at DESC;
```

### Reactivate contact after finding email

```sql
-- After finding/verifying a new email for a LinkedIn-only contact
UPDATE contacts
SET 
  email = 'new.email@company.com',
  email_validated_at = NOW(),
  email_validation_source = 'manual',
  email_validation_result = 'valid',
  email_status = 'valid'
WHERE id = [contact_id];

-- Reactivate email channels
UPDATE campaign_contact_channels ccc
SET status = 'pending'
FROM campaign_channels ch
WHERE ccc.campaign_channel_id = ch.id
  AND ccc.campaign_contact_id = (
    SELECT id FROM campaign_contacts 
    WHERE contact_id = [contact_id] 
    AND campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  )
  AND ch.channel IN ('smartlead', 'ghl');
```

---

## Integration Points

### Webhook Events to Capture

| Platform | Event | Maps To |
|----------|-------|---------|
| HeyReach | connection_accepted | `connection_accepted` |
| HeyReach | message_replied | `message_replied` |
| Smartlead | email_opened | `opened` |
| Smartlead | email_clicked | `clicked` |
| Smartlead | email_replied | `replied` |
| Smartlead | email_bounced | `bounced` |
| GHL | email_opened | `opened` |
| GHL | email_clicked | `clicked` |

### n8n Workflows Needed

1. **Activity Tracker** - Receives webhooks, logs to campaign_activity
2. **Branch Router** - Watches for qualifying events, assigns GHL branch
3. **Lifecycle Updater** - Combines signals across channels, updates lifecycle_tag
4. **Daily Metrics** - Aggregates activity into daily rollups