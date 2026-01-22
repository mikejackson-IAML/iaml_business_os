# Phase 2: Tier Engine & Notification System

## Goal
Build the automated tier advancement system and email notification infrastructure with magic link authentication.

## Context

### n8n-brain Findings
- **Confidence Score:** 21/100 (ask_first)
- **Supabase Credential:** `EgmvZHbvINHsh6PR` (Supabase Postgres)
- **SendGrid Credential:** Needs verification (user mentioned "Smartlead API")
- **Similar Patterns:** Compliance Monitor, Campaign Analyst (schedule → postgres → code → if)

### Key Decisions
- Magic link tokens **never expire** (per user preference)
- Tier timing: 7 days (Tier 0) → 5 days (Tier 1) → Open indefinitely
- Email service: Verify existing n8n credential during execution

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     TIER ENGINE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Schedule    │───▶│  Advance     │───▶│  Trigger     │  │
│  │  (Daily 6am) │    │  Tiers (DB)  │    │  Notifications│  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   NOTIFICATION SYSTEM                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐  │
│  │  Get         │───▶│  Generate    │───▶│  Send Email  │  │
│  │  Instructors │    │  Magic Links │    │  (SendGrid)  │  │
│  └──────────────┘    └──────────────┘    └──────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Execution Plan

### Wave 1: Database Schema Extensions

#### Task 1.1: Create magic_tokens table
**File:** `supabase/migrations/20260121_faculty_scheduler_phase2.sql`

```sql
-- Magic tokens for passwordless authentication
CREATE TABLE IF NOT EXISTS faculty_scheduler.magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0
  -- No expires_at since tokens never expire
);

CREATE INDEX idx_magic_tokens_token ON faculty_scheduler.magic_tokens(token);
CREATE INDEX idx_magic_tokens_instructor ON faculty_scheduler.magic_tokens(instructor_id);
```

#### Task 1.2: Create notifications table
```sql
-- Notification log
CREATE TABLE IF NOT EXISTS faculty_scheduler.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES faculty(id),
  scheduled_program_id UUID REFERENCES faculty_scheduler.scheduled_programs(id),

  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'tier_release',      -- New programs available at your tier
    'reminder',          -- Reminder: programs still available
    'claim_confirmation', -- You claimed a block
    'claim_cancelled',   -- Your claim was cancelled
    'program_update'     -- Program details changed
  )),

  tier INTEGER,           -- Which tier triggered this (0, 1, 2)
  email_sent_at TIMESTAMPTZ,
  email_subject TEXT,
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN (
    'pending', 'sent', 'failed', 'bounced'
  )),

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_notifications_instructor ON faculty_scheduler.notifications(instructor_id);
CREATE INDEX idx_notifications_program ON faculty_scheduler.notifications(scheduled_program_id);
CREATE INDEX idx_notifications_type ON faculty_scheduler.notifications(notification_type);
```

#### Task 1.3: Create helper functions
```sql
-- Generate or get existing magic token for instructor
CREATE OR REPLACE FUNCTION faculty_scheduler.get_or_create_magic_token(
  p_instructor_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Check for existing token
  SELECT token INTO v_token
  FROM faculty_scheduler.magic_tokens
  WHERE instructor_id = p_instructor_id;

  IF v_token IS NOT NULL THEN
    RETURN v_token;
  END IF;

  -- Generate new token (URL-safe base64, 32 chars)
  v_token := encode(gen_random_bytes(24), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  INSERT INTO faculty_scheduler.magic_tokens (instructor_id, token)
  VALUES (p_instructor_id, v_token);

  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Validate magic token and return instructor
CREATE OR REPLACE FUNCTION faculty_scheduler.validate_magic_token(
  p_token TEXT
)
RETURNS TABLE (
  instructor_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  firm_state TEXT,
  tier_designation INTEGER
) AS $$
BEGIN
  -- Update usage stats
  UPDATE faculty_scheduler.magic_tokens
  SET last_used_at = NOW(), use_count = use_count + 1
  WHERE token = p_token;

  -- Return instructor info
  RETURN QUERY
  SELECT f.id, f.first_name, f.last_name, f.email, f.firm_state, f.tier_designation
  FROM faculty_scheduler.magic_tokens mt
  JOIN faculty f ON f.id = mt.instructor_id
  WHERE mt.token = p_token
    AND f.faculty_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Get instructors to notify for tier change
CREATE OR REPLACE FUNCTION faculty_scheduler.get_instructors_to_notify(
  p_scheduled_program_id UUID,
  p_tier INTEGER
)
RETURNS TABLE (
  instructor_id UUID,
  email TEXT,
  first_name TEXT,
  magic_token TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.email,
    f.first_name,
    faculty_scheduler.get_or_create_magic_token(f.id) as magic_token
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  JOIN faculty_scheduler.scheduled_programs sp ON sp.program_id = iq.program_id
  WHERE sp.id = p_scheduled_program_id
    AND f.faculty_status = 'active'
    AND f.email IS NOT NULL
    AND (f.available_for_teaching = true OR f.available_for_teaching IS NULL)
    -- Tier eligibility
    AND (
      (p_tier = 0 AND f.tier_designation = 0)
      OR (p_tier = 1 AND (f.tier_designation = 0 OR f.firm_state = sp.state))
      OR (p_tier = 2)
    )
    -- Not already notified for this program at this tier
    AND NOT EXISTS (
      SELECT 1 FROM faculty_scheduler.notifications n
      WHERE n.instructor_id = f.id
        AND n.scheduled_program_id = p_scheduled_program_id
        AND n.tier = p_tier
        AND n.notification_type = 'tier_release'
    );
END;
$$ LANGUAGE plpgsql;
```

---

### Wave 2: n8n Workflows

#### Workflow 1: Tier Advancement Engine
**Name:** `Faculty Scheduler - Tier Advancement`
**Trigger:** Schedule (Daily at 6:00 AM CT)
**Credential:** Supabase Postgres (`EgmvZHbvINHsh6PR`)

```
[Schedule Trigger]
    → [Postgres: Call advance_tiers()]
    → [IF: Programs advanced?]
        → YES: [Postgres: Get programs that just advanced]
              → [Loop: For each program]
                  → [Postgres: Get instructors to notify]
                  → [HTTP Request: Trigger notification workflow]
        → NO: [No-op: Log "No tier changes"]
```

**Key SQL:**
```sql
-- Get programs that just changed tier (within last 5 minutes)
SELECT
  sp.id,
  sp.name,
  sp.city,
  sp.state,
  sp.status,
  CASE
    WHEN sp.status = 'tier_1' THEN 1
    WHEN sp.status = 'tier_2' THEN 2
  END as new_tier
FROM faculty_scheduler.scheduled_programs sp
WHERE sp.updated_at >= NOW() - INTERVAL '5 minutes'
  AND sp.status IN ('tier_1', 'tier_2');
```

#### Workflow 2: Notification Sender
**Name:** `Faculty Scheduler - Send Notifications`
**Trigger:** Webhook (called by Tier Advancement or manually)
**Credentials:** Supabase Postgres, SendGrid API

```
[Webhook: Receive program_id, tier, notification_type]
    → [Postgres: Get instructors to notify]
    → [Loop: For each instructor]
        → [Code: Build email content with magic link]
        → [SendGrid: Send email]
        → [Postgres: Log notification]
    → [Respond: Return count sent]
```

**Webhook Payload:**
```json
{
  "program_id": "uuid",
  "tier": 0,
  "notification_type": "tier_release"
}
```

#### Workflow 3: Claim Confirmation Sender
**Name:** `Faculty Scheduler - Claim Confirmation`
**Trigger:** Webhook (called after successful claim)

```
[Webhook: Receive claim_id, instructor_id, block_ids]
    → [Postgres: Get claim details with program info]
    → [Code: Build confirmation email]
    → [SendGrid: Send confirmation]
    → [Postgres: Log notification]
```

---

### Wave 3: Email Templates

#### Template 1: Tier Release Email
**Subject:** `New Teaching Opportunities Available - {{ program_count }} Programs`

```html
Hi {{ first_name }},

{{ #if tier_0 }}
As a VIP instructor, you have exclusive first access to new teaching opportunities!
{{ else if tier_1 }}
New programs in your area are available for teaching!
{{ else }}
New teaching opportunities are now open to all qualified instructors!
{{ /if }}

**Available Programs:**
{{ #each programs }}
- **{{ name }}** | {{ city }}, {{ state }} | {{ start_date }}
  {{ open_blocks }} block(s) available
{{ /each }}

[View & Claim Programs]({{ magic_link }})

{{ #if tier_0 }}
⏰ VIP access ends in {{ days_remaining }} days
{{ else if tier_1 }}
⏰ Local priority ends in {{ days_remaining }} days
{{ /if }}

Questions? Reply to this email.

—IAML Program Coordination
```

#### Template 2: Claim Confirmation Email
**Subject:** `Confirmed: You're Teaching {{ program_name }}`

```html
Hi {{ first_name }},

Great news! You've been confirmed to teach:

**{{ program_name }}**
📍 {{ venue }}, {{ city }}, {{ state }}
📅 {{ dates }}

**Your Block(s):**
{{ #each blocks }}
- {{ block_name }}: {{ date }}
{{ /each }}

**Next Steps:**
1. Mark your calendar
2. Materials will be sent 2 weeks before
3. Contact us if you need travel arrangements

[View Your Schedule]({{ magic_link }})

Thank you for teaching with IAML!

—IAML Program Coordination
```

---

## Deliverables

| # | Deliverable | Type |
|---|-------------|------|
| 1 | Phase 2 schema migration | SQL |
| 2 | Tier Advancement workflow | n8n |
| 3 | Notification Sender workflow | n8n |
| 4 | Claim Confirmation workflow | n8n |
| 5 | Email templates (2) | SendGrid/HTML |

---

## Acceptance Criteria

- [ ] magic_tokens table created with token generation function
- [ ] notifications table logging all sent emails
- [ ] Tier Advancement runs daily and advances programs correctly
- [ ] Tier 0→1 transition triggers emails to local instructors
- [ ] Tier 1→2 transition triggers emails to all qualified instructors
- [ ] Magic links work and identify the correct instructor
- [ ] Claim confirmation emails sent immediately on claim
- [ ] All notifications logged in database

---

## Configuration

### Environment Variables (n8n)
```
FACULTY_SCHEDULER_BASE_URL=https://faculty.iaml.com
```

### Tier Timing (configurable in release_program())
```
TIER_0_DAYS=7
TIER_1_DAYS=5
```

### n8n Credentials Needed
| Service | Credential ID | Status |
|---------|--------------|--------|
| Supabase Postgres | EgmvZHbvINHsh6PR | ✅ Mapped |
| SendGrid | TBD | ⚠️ Verify in n8n |

---

## Open Items

| Item | Notes |
|------|-------|
| SendGrid credential | User mentioned "Smartlead API" - verify actual SendGrid credential in n8n |
| Base URL | faculty.iaml.com - confirm domain setup |
| Email from address | Need sender email (e.g., programs@iaml.com) |

---

## n8n-brain Patterns to Reference

| Pattern | Use For |
|---------|---------|
| Compliance Monitor | Schedule → Postgres → Code → If structure |
| Campaign Analyst | Daily scheduled database query pattern |
| Smartlead Activity Receiver | Webhook → Database → Notification pattern |
