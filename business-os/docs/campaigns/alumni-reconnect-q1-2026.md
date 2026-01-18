# Alumni Reconnect Q1 2026 - Implementation Plan

## Campaign Overview

Re-engage **3,500 past IAML participants** with complimentary Quarterly Employment Law Update access.

| Segment | Count | Available Data | Primary Channel |
|---------|-------|----------------|-----------------|
| Email + LinkedIn | ~2,800 (80%) | Full multi-channel | SmartLead (email-first) |
| LinkedIn only | ~700 (20%) | LinkedIn URL only | HeyReach + enrichment |
| **Total** | **3,500** | | |

---

## Strategy: Email-First, LinkedIn-Parallel

**SmartLead is the PRIMARY channel** for contacts with email. LinkedIn runs in parallel as a secondary touchpoint.

**Key Principle:** SmartLead handles automated sequences. The moment someone replies, they become a conversation that moves to GHL.

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA INTAKE                               │
│                    (3,500 contacts)                              │
└─────────────────────┬───────────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│  HAS EMAIL      │     │  LINKEDIN ONLY  │
│  (~2,800)       │     │  (~700)         │
└────────┬────────┘     └────────┬────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐     ┌─────────────────┐
│ SMARTLEAD       │     │ HEYREACH        │
│ S1 → S2         │     │ L2 → L3         │
│ (14-16 days)    │     │ + Enrichment    │
└────────┬────────┘     └────────┬────────┘
         │                       │
    (On Reply)              (On Reply)
         │                       │
         ▼                       ▼
┌─────────────────────────────────────────┐
│              GHL (OUTCOMES)              │
│  Branch A: Qualified                     │
│  Branch A+: Qualified+ (virtual offer)   │
│  Branch B: Nurture                       │
│  Branch C: No Contact                    │
└─────────────────────────────────────────┘
```

---

## Channel Capacity & Timing

### SmartLead (8 inboxes)

| Setting | Value |
|---------|-------|
| Inboxes | 8 (iamlhrseminars.com + iamlhrtraining.com) |
| Daily limit per inbox | 25 (conservative for warm alumni) |
| **Daily capacity** | **200 emails/day** |
| Sequence | S1 → S2 (2-day delay) |

**Timeline:**
- 2,800 contacts ÷ 200/day = **14 days** to send S1 to all
- Full sequence complete: **16 days**

### HeyReach (LinkedIn - 1 Account + Sales Navigator)

| Setting | Value |
|---------|-------|
| Connection requests/day | 15-20 (Sales Nav may allow slightly higher) |
| Connection requests/week | 75-100 (stay conservative) |
| Profile views/day | 50-100 (warm up before connection) |
| InMails/month | 50 (Sales Navigator) |
| Follow-up DMs/day | 10-20 |

**LinkedIn Engagement Sequence:**
1. Profile view (Day 1) - warm up the contact
2. Connection request (Day 2)
3. InMail if not connected after 7 days (optional, use Sales Nav credits)
4. DM once connected

**Timeline for LinkedIn-only (700 contacts):**
- 700 ÷ 75/week = ~10 weeks (minimum)
- With enrichment adding emails, some move to SmartLead
- InMails can accelerate high-priority contacts

### Phone Strategy

**Key Insight:** Don't call cold. Only call after engagement.

**When to call:**
- Contact replies on LinkedIn/email with phone in signature
- Contact opens/clicks but doesn't reply (warm signal)
- Contact is VIP title and engaged but no reply

**Phone number capture:**
- Extract from email signatures in replies
- Check LinkedIn profile after connection
- Validate against Supabase record

**What NOT to do:**
- Don't call old work phone numbers from database
- Don't cold call without prior engagement

---

## Current State

### What's Already Built

| Component | Status | Details |
|-----------|--------|---------|
| Campaign tracking schema | Complete | `contacts`, `campaign_contacts`, `campaign_contact_channels`, `campaign_activity` |
| Alumni Reconnect Q1 2026 campaign | Seeded | ID: `a1b2c3d4-e5f6-7890-abcd-ef1234567890` |
| HeyReach activity receiver | Complete | `/n8n-workflows/heyreach-activity-receiver.json` |
| SmartLead activity receiver | Complete | `/n8n-workflows/smartlead-activity-receiver.json` |
| AI reply classification | Complete | Gemini-powered, routes to GHL branches |
| Branch C scheduler | Complete | Daily at 6 AM |
| Inbox health sync | Active | Every 4 hours |

### What Needs to Be Built

| Component | Priority | Can Automate? | Notes |
|-----------|----------|---------------|-------|
| SmartLead campaign + sequences | High | **Yes - via SmartLead MCP/API** | `POST /campaigns` and `POST /campaigns/{id}/sequence` |
| HeyReach campaign | High | Manual (UI only) | Create with L2, L2-Alt, L3 sequences |
| Supabase → SmartLead exporter | High | **Yes - n8n workflow** | `POST /campaigns/{id}/leads` |
| Supabase → HeyReach exporter | High | **Yes - n8n workflow** | HeyReach API |
| GHL sequences | High | **Yes - via GHL MCP** | 4 branches (A, A+, B, C) |
| Waterfall enrichment workflow | High | **Yes - n8n + Apollo MCP** | Find emails for LinkedIn-only contacts |
| Phone call scheduler | Medium | **Yes - n8n workflow** | Queue calls for engaged non-responders |

### Available MCPs for This Build

| MCP | Purpose | Status |
|-----|---------|--------|
| `smartlead` | Create campaigns, sequences, add leads | Configured |
| `gohighlevel` | Create workflows, sequences, contacts | Configured |
| `apollo` | Enrich contacts with email/phone | Configured |
| `n8n` | Build automation workflows | Configured |
| `neverbounce` | Validate emails | In `mcp-servers/` |
| `airtable` | Contact data source (if needed) | Configured |

---

## Domain Strategy

### Your Past-Participant Domains

| Domain | Platform | Inboxes | Status |
|--------|----------|---------|--------|
| **iamlhrseminars.com** | SmartLead | 4 inboxes | Active |
| **iamlhrtraining.com** | SmartLead | 4 inboxes | Active |

**Key Insight:** Past participants should receive emails from these dedicated domains - NOT cold outreach domains like `outreach.iaml.com`. Your 8 total inboxes provide good capacity with inbox rotation.

### Capacity Calculation
- 8 inboxes at ~50 emails/day (after warmup) = **400 emails/day**
- 2,166 past participants / 400 = ~5.4 days to reach everyone via email
- LinkedIn can run in parallel with 25 connections + 50 messages/day

### Database Records to Add

```sql
-- Add past-participant domains
INSERT INTO domains (domain_name, status, daily_limit, health_score, platform)
VALUES
  ('iamlhrseminars.com', 'active', 200, 90, 'smartlead'),
  ('iamlhrtraining.com', 'active', 200, 90, 'smartlead');
```

---

## Contact Segmentation & Workflows

### Segment 1: Has Email (~2,800 contacts)

**Channels:** SmartLead (primary) + HeyReach (parallel)

**Daily Execution - Parallel Workflow:**

| Day | SmartLead (Email) | HeyReach (LinkedIn) |
|-----|-------------------|---------------------|
| 1 | — | Profile view (if capacity) |
| 2 | **S1: Initial email** | L2: Connection request |
| 3-4 | Monitor opens/clicks | L3: DM if connected |
| 4 | **S2: Follow-up** | Continue DMs |
| 5-8 | Monitor | Monitor |
| 8+ | If reply → GHL | If reply → GHL |

**LinkedIn Priority (VIP Treatment):**

| Priority | Criteria | LinkedIn Treatment |
|----------|----------|-------------------|
| 1 (Highest) | VP+, Director, C-level | Profile view + connection request IMMEDIATELY (even if email sent) |
| 2 | Manager level | Add to LinkedIn queue after S1 sent |
| 3 | Email non-openers | LinkedIn outreach after S2 with no open |
| 4 | All others | LinkedIn only if capacity remains |

**Week-by-week strategy:**
- Week 1-2: LinkedIn to VIP titles (150 contacts)
- Week 3+: LinkedIn to email non-responders only

**SQL for VIP identification:**
```sql
SELECT * FROM contacts
WHERE job_title ILIKE ANY(ARRAY['%VP%', '%Vice President%', '%Director%', '%Chief%', '%C-Level%', '%Head of%', '%SVP%', '%EVP%'])
  AND campaign_contacts.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

**On Reply (either channel):**
- AI classifies reply
- Push to GHL with branch assignment
- Stop SmartLead sequence (if from SmartLead)
- Log activity

**No Reply after Day 8 - Phone Escalation:**
- **Only call if:** Contact opened/clicked (warm signal) OR is VIP title
- **How to get phone:** Extract from reply signature, LinkedIn profile, or confirmed in Supabase
- **Do NOT:** Cold call using old database phone numbers
- If no contact after phone attempts → Branch C

**Phone Trigger Workflow:**
```sql
-- Find engaged contacts ready for phone
SELECT c.*, cc.lifecycle_tag
FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
JOIN campaign_contact_channels ccc ON ccc.campaign_contact_id = cc.id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
  AND ccc.engagement_level IN ('warm', 'engaged')  -- Opened or clicked
  AND ccc.has_replied = FALSE
  AND ccc.current_message_sent_at < NOW() - INTERVAL '8 days'
  AND c.phone IS NOT NULL
  AND c.phone != '';
```

---

### Segment 2: LinkedIn Only (~700 contacts)

**Channels:** HeyReach (primary) + Waterfall Enrichment

**Workflow:**

| Day | Action |
|-----|--------|
| 1 | Profile view |
| 2 | L2: Connection request |
| 3-7 | Wait for connection |
| 7 | L3: DM if connected |
| 14 | Follow-up DM |
| 21+ | Phone (if available) → GHL Branch C |

**Waterfall Enrichment Workflow (parallel):**

```
┌────────────────────────────────────────────────────────────────┐
│         WATERFALL ENRICHMENT FOR LINKEDIN-ONLY CONTACTS        │
└────────────────────────────────────────────────────────────────┘

TRIGGER: LinkedIn connection accepted OR daily batch of LinkedIn-only contacts

┌─────────────────────────────────────────────────────────────┐
│ Step 1: Check LinkedIn Profile                               │
│   - Parse profile for work email (if visible)                │
│   - Extract company domain                                   │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼ No email found
┌─────────────────────────────────────────────────────────────┐
│ Step 2: Apollo Enrichment (via MCP)                          │
│   - Search by: first_name + last_name + company              │
│   - Or search by: linkedin_url                               │
│   - Returns: work email, phone, title                        │
└─────────────────────────┬───────────────────────────────────┘
                          │
                          ▼ Email found
┌─────────────────────────────────────────────────────────────┐
│ Step 3: NeverBounce Validation (via MCP)                     │
│   - Validate email address                                   │
│   - Returns: valid, invalid, catch_all, unknown              │
└─────────────────────────┬───────────────────────────────────┘
                          │
               ┌──────────┴──────────┐
               ▼                     ▼
         Valid Email            Invalid/Unknown
               │                     │
               ▼                     ▼
┌─────────────────────────┐ ┌─────────────────────────┐
│ Update contacts table   │ │ Log result, stay        │
│ Add to SmartLead queue  │ │ LinkedIn-only           │
│ Enroll in email segment │ └─────────────────────────┘
└─────────────────────────┘
```

**n8n Workflow: `waterfall-enrichment.json`**
- Trigger: Daily schedule + webhook on connection accepted
- Tools: Apollo MCP, NeverBounce MCP, Supabase
- Updates: `contacts.email`, `contacts.email_validation_result`
- Action: Auto-add to SmartLead segment when email valid

**Pacing:**
- 25-30 connection requests/week to this segment
- 45-50/week to Segment 1 priorities
- Full segment touched: ~24 weeks

---

### Segment 3: Email Only (no LinkedIn)

**Channels:** SmartLead only → Phone → GHL

**Workflow:** Same as Segment 1, but without LinkedIn touchpoints

---

## Multi-Channel Campaign Flow (Comprehensive)

### Master Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PAST PARTICIPANT ENTERS                          │
└────────────────────────────────┬────────────────────────────────────────┘
                                 │
                    ┌────────────┴────────────┐
                    ▼                         ▼
            Has LinkedIn URL?           No LinkedIn URL
                    │                         │
                    ▼                         ▼
        ┌───────────────────┐      ┌───────────────────┐
        │  LINKEDIN CHANNEL │      │  Has Valid Email? │
        │  (HeyReach)       │      └─────────┬─────────┘
        └─────────┬─────────┘                │
                  │                    Yes   │   No
           ┌──────┴──────┐                   │    │
           ▼             ▼                   ▼    ▼
    L2: Connection    Already              EMAIL  PAUSED
    Request          Connected             ONLY   (enrich later)
           │             │                   │
           ▼             ▼                   │
    Connected?     L2-Alt: DM               │
      │   │              │                  │
     Yes  No             │                  │
      │   │              │                  │
      ▼   ▼              ▼                  │
    L3: Follow-up   Wait 7 Days            │
         │               │                  │
         ▼               ▼                  │
    ┌─────────────────────────────┐         │
    │     REPLY RECEIVED?         │         │
    └───────────┬─────────────────┘         │
                │                           │
        ┌───────┴────────┐                  │
        ▼                ▼                  │
   YES (Engaged)     NO (7+ days)          │
        │                │                  │
        ▼                ▼                  │
┌───────────────┐  ┌─────────────────┐      │
│ AI CLASSIFY   │  │ HAS VALID EMAIL?│      │
│ REPLY         │  └────────┬────────┘      │
└───────┬───────┘           │               │
        │              Yes  │  No           │
┌───────┴───────────┐       │   │           │
│                   │       │   ▼           │
▼                   ▼       │  PHONE        │
Positive      Not Now       │  CHANNEL      │
│             │             │               │
▼             ▼             ▼               │
GHL           GHL      ┌────────────────────┴───┐
BRANCH A      BRANCH B │    EMAIL CHANNEL       │
│             │        │    (SmartLead)         │
▼             ▼        └───────────┬────────────┘
Confirmation  Nurture              │
Sequence      Sequence             ▼
                           S1: Initial Email
                           (3 A/B variants)
                                   │
                                   ▼
                           ┌───────────────┐
                           │ REPLY/OPEN?   │
                           └───────┬───────┘
                                   │
                      ┌────────────┼────────────┐
                      ▼            ▼            ▼
                   Opened       Replied      No Activity
                   No Reply        │         (7+ days)
                      │            │            │
                      ▼            ▼            ▼
                   S2a: Soft   AI CLASSIFY  S2b: Different
                   Follow-up   REPLY        Angle
                      │            │            │
                      │      ┌─────┴──────┐     │
                      │      ▼            ▼     │
                      │   Positive    Not Now   │
                      │      │            │     │
                      │      ▼            ▼     │
                      │   GHL A/A+     GHL B    │
                      │                         │
                      └────────────┬────────────┘
                                   │
                                   ▼
                           Still No Reply?
                           (14+ days total)
                                   │
                                   ▼
                        ┌──────────────────┐
                        │  PHONE CHANNEL   │
                        │  (Manual)        │
                        └────────┬─────────┘
                                 │
                                 ▼
                           P1: Call Script
                                 │
                        ┌────────┴────────┐
                        ▼                 ▼
                   Connected          No Answer
                        │                 │
                        ▼                 ▼
                   Qualify         P1-VM: Voicemail
                   Response        + 2nd Attempt
                        │                 │
                        ▼                 ▼
             ┌──────────┴──────────┐      │
             ▼          ▼          ▼      │
          Interested  Not Now   Not       │
             │          │      Interested │
             ▼          ▼          │      │
          GHL A      GHL B     Opt Out    │
                                          ▼
                              Still No Contact?
                              (3+ attempts)
                                          │
                                          ▼
                                    ┌──────────┐
                                    │  GHL C   │
                                    │  Branch  │
                                    └────┬─────┘
                                         │
                                         ▼
                               C1: Fresh Start Email
                               C2: Different Angle
                               C3: Direct Ask
                               C4: Final Attempt
                                         │
                                         ▼
                                    EXHAUSTED
                                    (Mark complete)
```

### Message Templates

#### LinkedIn Messages (HeyReach)

| Code | Name | Trigger | Days After |
|------|------|---------|------------|
| L2 | Connection Request | Entry | Day 0 |
| L2-Alt | Already Connected DM | If already connected | Day 0 |
| L3 | Follow-up Message | After connection accepted | Day 3 |

#### SmartLead Email Messages (TO BE ADDED)

| Code | Name | Condition | Days After |
|------|------|-----------|------------|
| S1 | Initial Email | Has valid email | Day 0 |
| S2a | Opened, No Reply | `opened=true`, `replied=false` | Day 4 |
| S2b | No Open | `opened=false` | Day 4 |
| S3 | Final Email Push | Still no reply | Day 7 |

#### Phone Messages (TO BE ADDED)

| Code | Name | Trigger | Notes |
|------|------|---------|-------|
| P1 | Call Script | No response after email/LinkedIn | Live call script |
| P1-VM | Voicemail Script | No answer | Leave VM, schedule callback |
| P2 | Second Attempt | After VM, no callback | Try different time |

#### GHL Branch Messages (Already Seeded)

**Branch A (Qualified - Positive Response)**
- A1: Confirmation + Quarterly Updates link
- A2: Secondary Offer (Virtual Training)
- A3: Reminder

**Branch A+ (Qualified+ - Wants Training)**
- A+1: Virtual Training Focus
- A+2: Program Selection
- A+3: Final Reminder

**Branch B (Nurture - Not Now)**
- B1: Pure Value (no ask)
- B2: Light Touch

**Branch C (No Contact - Exhausted Other Channels)**
- C1: Fresh Start (new approach)
- C2: Different Angle
- C3: Direct Ask
- C4: Final Attempt

### Branch Assignment Logic

```
TRIGGER EVENT              → BRANCH → MEANING
─────────────────────────────────────────────────
positive_reply             → A      → Interested in offer
interested_secondary       → A+     → Wants virtual training
yes_reply                  → A      → Affirmative response
call_interested            → A      → Phone interest
not_now_polite             → B      → Timing issue
maybe_later                → B      → Soft no
call_not_now               → B      → Phone soft decline
no_response (7+ days)      → C      → LinkedIn exhausted
no_response (14+ days)     → C      → Email exhausted
calls_exhausted            → C      → Phone exhausted
not_interested             → OPT OUT
unsubscribe                → OPT OUT
```

---

## GHL Sequences (Detailed Handoff & Nurture)

### The GHL Handoff - How It Works

**Trigger:** Any meaningful reply on SmartLead or HeyReach

**Why move to GHL on any reply (not just positive)?**
- Past participants are warm - every response deserves personal attention
- AI classification routes them to the right branch automatically
- GHL emails come from iaml.com (your primary domain) - more personal
- SmartLead = automation. GHL = conversation.

**What happens:**
1. SmartLead/HeyReach receives a reply
2. n8n webhook captures it
3. Gemini AI classifies the reply sentiment
4. Contact pushed to GHL with branch assignment
5. GHL workflow triggers based on branch
6. Contact enters appropriate nurture sequence

**Classification → Branch Mapping:**

| Reply Type | AI Classification | GHL Branch | Next Step |
|------------|-------------------|------------|-----------|
| "Yes, I'm interested!" | `positive_reply` | A | Confirmation + registration link |
| "Tell me about training" | `interested_secondary` | A+ | Virtual training options |
| "Not right now" | `not_now_polite` | B | Value-add nurture |
| "Please remove me" | `unsubscribe` | Opt Out | Stop all communication |
| No reply after sequence | `no_response` | C | Fresh approach sequence |

**GHL Webhook (already configured):**
```
https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992
```

**Payload sent to GHL:**
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john.doe@company.com",
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "ghl_branch": "A",
  "campaign_name": "Alumni Reconnect Q1 2026",
  "trigger_event": "positive_reply",
  "trigger_channel": "smartlead",
  "reply_text": "Yes, I'd love to learn more about the quarterly updates!",
  "company": "Acme Corp",
  "job_title": "VP of HR"
}
```

**GHL sends all emails from: `iaml.com` (your primary domain)**

---

## GHL Workflow Architecture

### How to Build in GHL

For each branch, you need:
1. **Trigger:** Webhook with filter on `ghl_branch` field
2. **Actions:** Add tags, create/update contact, start sequence
3. **Sequence:** Email sequence with timing delays

```
┌────────────────────────────────────────────────────────────────┐
│                    GHL WORKFLOW STRUCTURE                       │
└────────────────────────────────────────────────────────────────┘

WORKFLOW: "Alumni Reconnect - Inbound Handler"
┌─────────────────────────────────────────────────────────────┐
│ TRIGGER: Webhook received                                    │
│ FILTER: campaign_name = "Alumni Reconnect Q1 2026"          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Create/Update Contact                                │
│   - first_name, last_name, email, company, job_title        │
│   - Custom field: linkedin_url                              │
│   - Custom field: trigger_channel                           │
│   - Custom field: reply_text                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ ACTION: Add Tags                                             │
│   - "Alumni Q1 2026"                                        │
│   - "Branch: {ghl_branch}"                                  │
│   - "Source: {trigger_channel}"                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ BRANCH: Route by ghl_branch value                            │
├──────────────┬──────────────┬──────────────┬────────────────┤
│ Branch = A   │ Branch = A+  │ Branch = B   │ Branch = C     │
│              │              │              │                │
│ Start        │ Start        │ Start        │ Start          │
│ "Qualified"  │ "Training"   │ "Nurture"    │ "No Contact"   │
│ Sequence     │ Sequence     │ Sequence     │ Sequence       │
└──────────────┴──────────────┴──────────────┴────────────────┘
```

### GHL Sequences to Create

| Sequence Name | Branch | # Emails | Trigger |
|---------------|--------|----------|---------|
| Alumni Q1 - Qualified | A | 3 | Positive reply |
| Alumni Q1 - Training Interest | A+ | 3 | Wants virtual training |
| Alumni Q1 - Nurture | B | 2 | Not now / polite decline |
| Alumni Q1 - No Contact | C | 4 | No response after full sequence |

### What Happens in Each Branch

---

### Branch A: Qualified (Made Contact - Interested)

**Trigger:** Positive reply on LinkedIn or SmartLead

**Goal:** Convert to Quarterly Updates registration + offer Virtual Training

**Sequence:**

| Step | Timing | Subject | Content |
|------|--------|---------|---------|
| A1 | Immediate | Great to reconnect! | Confirmation + Quarterly Updates registration link + what to expect |
| A2 | Day 3 | Quick question about your team | Secondary offer: Virtual Training discount for them or colleague |
| A3 | Day 7 | Last chance reminder | Registration deadline + value proposition recap |

**A1: Confirmation Email**
```
Subject: Great to reconnect, {first_name}!

Hi {first_name},

It was wonderful hearing back from you! As a past IAML participant,
you have exclusive access to our Quarterly Employment Law Updates.

Register here: [LINK]

These free briefings cover:
- Recent case law developments
- Regulatory changes affecting HR
- Practical compliance updates

The next session is [DATE]. I'll send you a reminder.

Looking forward to seeing you there,
[Sender Name]
IAML
```

**A2: Secondary Offer (Virtual Training)**
```
Subject: Something for you or your team

Hi {first_name},

I wanted to share something I thought might interest you (or someone
on your team).

We're offering IAML alumni an exclusive discount on our virtual
training programs:
- Employment Law Update
- FMLA Fundamentals
- Strategic HR Leadership

Would you or a colleague benefit from refresher training?

Just reply to this email and I'll send details.

Best,
[Sender Name]
```

**A3: Reminder**
```
Subject: Reminder: Quarterly Updates registration

Hi {first_name},

Just a quick reminder - our next Quarterly Employment Law Update
is coming up on [DATE].

If you haven't registered yet: [LINK]

Hope to see you there!

[Sender Name]
```

---

### Branch A+: Qualified+ (Made Contact - Wants Virtual Training)

**Trigger:** Reply mentioning interest in training, colleague referral, or virtual programs

**Goal:** Convert to Virtual Training enrollment (self or colleague)

**Sequence:**

| Step | Timing | Subject | Content |
|------|--------|---------|---------|
| A+1 | Immediate | Your virtual training options | Program details + pricing + scheduling |
| A+2 | Day 2 | Which program works best? | Program comparison + recommendation based on role |
| A+3 | Day 5 | Ready when you are | Final call + limited spots + easy next step |

**A+1: Virtual Training Focus**
```
Subject: Your exclusive training options

Hi {first_name},

Thank you for your interest in our virtual training programs!

As an IAML alumni, you (and any colleagues you'd like to include)
get preferred pricing:

- Employment Law Update - $X (save $Y)
- FMLA Fundamentals - $X (save $Y)
- Strategic HR Leadership - $X (save $Y)

All programs are live, virtual, and include:
- Expert-led sessions
- Interactive Q&A
- Certificate of completion
- HRCI/SHRM credits

Which program interests you? I can send specific dates and details.

[Sender Name]
```

**A+2: Program Selection**
```
Subject: Quick recommendation

Hi {first_name},

Based on your role as {job_title}, I'd particularly recommend:

[PERSONALIZED RECOMMENDATION]

Would you like me to hold a spot for the upcoming session?

[Sender Name]
```

---

### Branch B: Nurture (Made Contact - Not Now)

**Trigger:** "Not right now," "Maybe later," "Timing isn't right"

**Goal:** Stay top of mind, add value, soft touch for future engagement

**Sequence:**

| Step | Timing | Subject | Content |
|------|--------|---------|---------|
| B1 | Day 7 | Thought you'd find this useful | Pure value (article, insight, update) - NO ask |
| B2 | Day 30 | Quick check-in | Light touch, offer to help, mention upcoming events |

**B1: Pure Value (No Ask)**
```
Subject: Thought you'd find this useful

Hi {first_name},

I came across this and thought of you:

[RELEVANT ARTICLE/INSIGHT/CASE SUMMARY]

No action needed - just wanted to share.

[Sender Name]
```

**B2: Light Touch**
```
Subject: Quick check-in

Hi {first_name},

Hope things are going well at {company}!

Just wanted to let you know we have some great events coming up
this quarter. If your schedule opens up, I'd love to see you at one.

No pressure - just keeping you in the loop.

Best,
[Sender Name]
```

---

### Branch C: No Contact (Exhausted Other Channels)

**Trigger:** No response after LinkedIn + Email + Phone attempts (7+ days each)

**Goal:** Fresh approach via GHL email from iaml.com, different angle, last attempts

**Sequence:**

| Step | Timing | Subject | Content |
|------|--------|---------|---------|
| C1 | Day 0 | Different approach | Fresh start, acknowledge previous attempts may have been missed |
| C2 | Day 5 | From a different angle | Lead with value/curiosity, not ask |
| C3 | Day 10 | Direct and honest | Direct ask, acknowledge it's been a while |
| C4 | Day 20 | Final attempt | Last email, clear next step, respect their time |

**C1: Fresh Start**
```
Subject: Trying a different approach

Hi {first_name},

I've tried reaching out a few times but may have caught you at
a busy time (story of all our lives, right?).

I'm reaching out because you attended [PROGRAM] with IAML, and
we've launched something new that I think you'd genuinely find valuable.

Can I share a quick 2-minute overview?

[Sender Name]
```

**C2: Different Angle**
```
Subject: Quick question about [company]

Hi {first_name},

I'm curious - how is {company} handling the recent [RELEVANT HR TOPIC]?

We've been hearing a lot from HR leaders about [CHALLENGE], and
I wondered if that's on your radar too.

Either way, I'd love to reconnect.

[Sender Name]
```

**C3: Direct Ask**
```
Subject: Can I be direct?

Hi {first_name},

I'll keep this short - I've reached out a few times because I
genuinely believe our Quarterly Updates would be valuable for you.

If you're interested: [LINK]
If not: Just reply "no thanks" and I'll respect that.

Either way, I appreciate your time.

[Sender Name]
```

**C4: Final Attempt**
```
Subject: Last email from me

Hi {first_name},

This is my last email on this topic.

Our Quarterly Updates are designed specifically for busy HR
leaders who want to stay current without the time commitment
of a full seminar.

If the timing ever feels right: [LINK]

Thanks for being part of the IAML community.

[Sender Name]
```

---

### GHL Sequences to Build in Platform

**Summary of what needs to be set up in GHL:**

| Branch | Sequence Name | # Emails | Sender Domain |
|--------|--------------|----------|---------------|
| A | Alumni Reconnect - Qualified | 3 | iaml.com |
| A+ | Alumni Reconnect - Training Interest | 3 | iaml.com |
| B | Alumni Reconnect - Nurture | 2 | iaml.com |
| C | Alumni Reconnect - No Contact | 4 | iaml.com |

**GHL Workflow Triggers:**
- Each branch should have a workflow triggered by the incoming webhook
- Filter by `ghl_branch` field in the webhook payload
- Start the corresponding sequence
- Tag the contact appropriately (e.g., "Alumni Q1 2026", "Branch A")

**GHL Setup Checklist:**
- [ ] Create 4 sequences (A, A+, B, C) with email copy above
- [ ] Create 4 workflows triggered by webhook with branch filtering
- [ ] Configure iaml.com as sender domain
- [ ] Set up proper unsubscribe handling
- [ ] Test each workflow with sample webhook payload

---

## Implementation Plan

### Status Summary

| Item | Status | Action Needed |
|------|--------|---------------|
| Contacts in Supabase | Partial | Import remaining contacts |
| SmartLead Domains | Known | Add `iamlhrseminars.com` and `iamlhrtraining.com` to DB |
| HeyReach Campaign | Not Created | Create campaign with L2, L2-Alt, L3 sequences |
| Email Copy | Ready | Load into SmartLead campaign |
| Export Workflows | Not Built | Build Supabase → HeyReach/SmartLead exporters |

---

### Phase 1: Data Preparation (Friday Evening / Saturday Morning)

**Step 1.1: Add Past-Participant Domains to Database**
```sql
INSERT INTO domains (domain_name, status, daily_limit, health_score, platform)
VALUES
  ('iamlhrseminars.com', 'active', 200, 90, 'smartlead'),
  ('iamlhrtraining.com', 'active', 200, 90, 'smartlead');
```

**Step 1.2: Sync Inboxes from SmartLead**
- Run SmartLead inbox sync workflow manually (or trigger it)
- Verify 8 inboxes appear in `email_inboxes` table
- Confirm they're linked to the correct domain_id

**Step 1.3: Import Remaining Contacts**
- Identify source of remaining contacts (CSV, Airtable, etc.)
- Import to `contacts` table with:
  - `email` (validated)
  - `linkedin_url` (normalized format)
  - `company_status` (verified/changed)
  - `lifecycle_stage` = 'customer'
- Create `campaign_contacts` records to enroll in campaign
- Estimated contacts: ~2,166 total

**Step 1.4: Validate Contact Data**
```sql
-- Check contact readiness
SELECT
  COUNT(*) as total,
  COUNT(*) FILTER (WHERE linkedin_url IS NOT NULL) as has_linkedin,
  COUNT(*) FILTER (WHERE email_validation_result = 'valid') as valid_email,
  COUNT(*) FILTER (WHERE company_status = 'verified') as same_company
FROM contacts c
JOIN campaign_contacts cc ON c.id = cc.contact_id
WHERE cc.campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```

---

### Phase 2: Platform Setup (Saturday)

**Step 2.1: Create HeyReach Campaign**

In HeyReach platform:
1. Create new campaign: "Alumni Reconnect Q1 2026"
2. Add LinkedIn account(s) to use
3. Create sequence with 3 steps:
   - **Step 1 (L2):** Connection Request
     - Message: [Your connection request copy]
     - Daily limit: 25
   - **Step 2 (L2-Alt):** Already Connected DM (for those already connected)
     - Skip if not connected
   - **Step 3 (L3):** Follow-up Message (3 days after connection)
     - Condition: Connection accepted
4. Configure campaign settings:
   - Working hours: 9 AM - 6 PM
   - Timezone: Your timezone
   - Daily connection limit: 25
   - Daily message limit: 50
5. Get campaign ID and list ID for n8n integration
6. Configure webhook:
   - URL: `https://n8n.realtyamp.ai/webhook/heyreach`
   - Events: All (connection_sent, connection_accepted, message_sent, message_replied)
7. Update `campaign_channels` with platform_campaign_id

**Step 2.2: Create SmartLead Campaign**

In SmartLead platform:
1. Create new campaign: "Alumni Reconnect Q1 2026 - Past Participants"
2. Assign your 8 inboxes from `iamlhrseminars.com` and `iamlhrtraining.com`
3. Create email sequence:
   - **S1:** Initial Email (your ready copy) - Day 0
     - Add A/B variants if testing
   - **S2a:** Follow-up for Opens (Day 4, condition: opened but no reply)
   - **S2b:** Follow-up for No Opens (Day 4, condition: not opened)
   - **S3:** Final Push (Day 7, condition: no reply)
4. Configure campaign settings:
   - Sending hours: 8 AM - 5 PM
   - Days: Mon-Fri
   - Max emails per day per inbox: 50
5. Get campaign ID for n8n integration
6. Configure webhook:
   - URL: `https://n8n.realtyamp.ai/webhook/smartlead`
   - Events: All (sent, open, click, reply, bounce, unsubscribe)

**Step 2.3: Add SmartLead Messages to Database**
```sql
INSERT INTO campaign_messages (campaign_id, channel_id, message_code, message_name, message_type, sequence_order, days_after_previous, send_condition)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888', 'S1', 'Initial Email', 'email', 1, 0, NULL),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888', 'S2a', 'Opened No Reply', 'email', 2, 4, 'opened_no_reply'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888', 'S2b', 'No Open Follow-up', 'email', 2, 4, 'no_open'),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc222222-3333-4444-5555-666677778888', 'S3', 'Final Push', 'email', 3, 7, 'no_reply');
```

**Step 2.4: Add Phone Scripts to Database**
```sql
INSERT INTO campaign_messages (campaign_id, channel_id, message_code, message_name, message_type, sequence_order)
VALUES
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc333333-4444-5555-6666-777788889999', 'P1', 'Call Script', 'call_script', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc333333-4444-5555-6666-777788889999', 'P1-VM', 'Voicemail Script', 'voicemail', 1),
  ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'cc333333-4444-5555-6666-777788889999', 'P2', 'Second Attempt', 'call_script', 2);
```

---

### Phase 3: Build Export Workflows (Saturday)

**Workflow 1: Supabase → HeyReach Exporter**
- File: `/n8n-workflows/supabase-to-heyreach-exporter.json`
- Trigger: Manual (for launch), then webhook for new imports
- Flow:
  1. Query contacts with LinkedIn URLs not yet in HeyReach
  2. Batch into groups of 50 (API limit)
  3. POST to HeyReach API: `POST /lists/{list_id}/leads`
  4. Create `campaign_contact_channels` records (LinkedIn channel)
  5. Log activity with `activity_type = 'exported_to_platform'`

**Workflow 2: Supabase → SmartLead Exporter**
- File: `/n8n-workflows/supabase-to-smartlead-exporter.json`
- Trigger: Manual (for launch), then scheduled
- Flow:
  1. Query contacts with valid emails not yet in SmartLead
  2. Batch into groups of 100
  3. POST to SmartLead API: `POST /campaigns/{id}/leads`
  4. Create `campaign_contact_channels` records (SmartLead channel)
  5. Log activity

**Workflow 3: Multi-Channel Escalation Scheduler**
- File: `/n8n-workflows/multichannel-escalation-scheduler.json`
- Trigger: Daily at 6 AM (after Branch C scheduler)
- Flow:
  1. Find LinkedIn contacts with no response after 7 days AND valid email
  2. Export to SmartLead if not already there
  3. Find Email contacts with no response after 14 days AND phone number
  4. Queue for phone outreach (create task or notification)

---

### Phase 4: Testing (Sunday)

**Pre-Launch Checklist:**

**Database:**
- [ ] Domains added (`iamlhrseminars.com`, `iamlhrtraining.com`)
- [ ] Inboxes synced (8 inboxes visible in `email_inboxes`)
- [ ] All contacts imported and enrolled in campaign
- [ ] SmartLead messages added (S1, S2a, S2b, S3)
- [ ] Phone scripts added (P1, P1-VM, P2)

**HeyReach:**
- [ ] Campaign created with correct sequence
- [ ] Webhook configured and tested
- [ ] API key saved in n8n
- [ ] Test export of 5 contacts successful

**SmartLead:**
- [ ] Campaign created with email copy
- [ ] 8 inboxes assigned and healthy
- [ ] Webhook configured and tested
- [ ] Test export of 5 contacts successful

**Integration:**
- [ ] HeyReach activity receiver workflow active
- [ ] SmartLead activity receiver workflow active
- [ ] Branch C scheduler workflow active
- [ ] Export workflows tested

**End-to-End Test:**
- [ ] Send test connection request → verify webhook fires
- [ ] Send test email → verify open tracking works
- [ ] Reply to test email → verify AI classification and GHL routing

---

### Phase 5: Launch (Monday Morning)

**Launch Sequence:**

1. **6:00 AM** - Final health check
   - Run inbox sync, verify all 8 inboxes connected
   - Check domain health scores
   - Verify n8n workflows are active

2. **7:00 AM** - Activate channels
   ```sql
   UPDATE campaign_channels
   SET status = 'active', started_at = NOW()
   WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
     AND channel IN ('smartlead', 'phone');
   ```

3. **8:00 AM** - Export contacts to platforms
   - Run HeyReach exporter (all LinkedIn contacts)
   - Run SmartLead exporter (all email contacts)
   - Verify counts match

4. **9:00 AM** - Start campaigns
   - Activate HeyReach campaign in platform
   - Activate SmartLead campaign in platform

5. **10:00 AM** - Monitor first activity
   ```sql
   SELECT activity_type, COUNT(*)
   FROM campaign_activity
   WHERE activity_at >= NOW() - INTERVAL '1 hour'
   GROUP BY activity_type;
   ```

6. **Ongoing** - Daily monitoring
   - Check funnel conversion rates
   - Review AI classification accuracy
   - Adjust messaging if needed

---

## Critical Files

| Purpose | Path |
|---------|------|
| HeyReach activity receiver | `/n8n-workflows/heyreach-activity-receiver.json` |
| SmartLead activity receiver | `/n8n-workflows/smartlead-activity-receiver.json` |
| Campaign schema | `/supabase/migrations/002_campaign_tracking_tables.sql` |
| Campaign seed data | `/supabase/migrations/003_seed_alumni_reconnect_campaign.sql` |
| Inbox schema | `/supabase/migrations/20260115_create_email_inboxes_schema.sql` |
| SmartLead inbox sync | `/business-os/workflows/smartlead-inbox-sync.json` |
| Lead Intelligence types | `/dashboard/src/dashboard-kit/types/departments/lead-intelligence.ts` |

---

## API Configuration

### HeyReach
- Base URL: `https://api.heyreach.io/api/v1/`
- Auth: Header `X-API-KEY: {key}`
- Add leads: `POST /lists/{list_id}/leads`

### SmartLead
- Base URL: `https://server.smartlead.ai/api/v1/`
- Auth: Query param `?api_key={key}`
- Add leads: `POST /campaigns/{campaign_id}/leads`
- Credential ID in n8n: `a8mXHIaPChJTGO6S`

---

## Questions to Resolve

1. **SmartLead domain names**: What are the exact domain names for the 2 past-participant domains?
2. **Contact data location**: Are past participants already in Supabase `contacts` table, or do they need to be imported?
3. **HeyReach campaign**: Is there an existing HeyReach campaign/list, or do we need to create one?
4. **SmartLead campaign**: Is there an existing SmartLead campaign for past participants, or create new?
5. **Inbox warmup status**: Are the 8 inboxes fully warmed up, or still ramping?

---

## Verification

After implementation, verify success by:

1. **Database checks:**
   ```sql
   -- Check contacts enrolled
   SELECT COUNT(*) FROM campaign_contact_channels WHERE status = 'active';

   -- Check activity logging
   SELECT activity_type, COUNT(*) FROM campaign_activity
   WHERE activity_at > NOW() - INTERVAL '1 hour' GROUP BY activity_type;
   ```

2. **Platform checks:**
   - HeyReach dashboard shows correct lead count
   - SmartLead dashboard shows correct lead count
   - Webhooks firing (check n8n execution history)

3. **End-to-end test:**
   - Send yourself a LinkedIn connection request
   - Send yourself a test email
   - Reply to test email, verify GHL branch assignment

---

## Weekend Build Roadmap (Complete)

### Friday Evening - Data & Infrastructure

| Task | Tool | Details |
|------|------|---------|
| **Add domains to Supabase** | SQL | Insert `iamlhrseminars.com`, `iamlhrtraining.com` |
| **Run SmartLead inbox sync** | n8n | Trigger manually to pull 8 inboxes |
| **Start contact import** | Supabase/Airtable | Import remaining contacts with LinkedIn URLs |

### Saturday Morning - Platform Setup

| Task | Tool | Details |
|------|------|---------|
| **Create SmartLead campaign** | SmartLead MCP | `POST /campaigns` with name, settings |
| **Create SmartLead sequences** | SmartLead MCP | `POST /campaigns/{id}/sequence` with S1, S2-A, S2-B |
| **Create HeyReach campaign** | Manual (UI) | L2, L2-Alt, L3 sequences with connection logic |
| **Configure HeyReach webhook** | HeyReach UI | Point to `n8n.realtyamp.ai/webhook/heyreach` |

### Saturday Afternoon - n8n Workflows

| Task | Tool | Details |
|------|------|---------|
| **Build SmartLead exporter** | n8n MCP | Query Supabase → push to SmartLead |
| **Build HeyReach exporter** | n8n MCP | Query Supabase → push to HeyReach |
| **Build waterfall enrichment** | n8n MCP | Apollo → NeverBounce → Supabase |
| **Update activity receivers** | n8n | Ensure SmartLead campaign ID is correct |

### Saturday Evening - GHL Setup

| Task | Tool | Details |
|------|------|---------|
| **Create GHL sequences** | GHL MCP | 4 sequences (A, A+, B, C) with email content |
| **Create GHL inbound workflow** | GHL MCP | Webhook trigger → branch router → sequence start |
| **Test GHL webhook** | curl | Send test payload, verify contact created |

### Sunday - Testing & Validation

| Task | Tool | Details |
|------|------|---------|
| **Export 10 test contacts** | n8n | To SmartLead and HeyReach |
| **Send test email** | SmartLead | Verify tracking works |
| **Send test connection** | HeyReach | Verify webhook fires |
| **Test reply classification** | Manual | Reply to test email, check GHL routing |
| **Run pre-launch checklist** | SQL | All verification queries |
| **Fix any issues** | Various | Based on test results |

### Monday Morning - Launch

| Time | Task | Details |
|------|------|---------|
| 6:00 AM | Health check | Inbox sync, domain health, workflow status |
| 7:00 AM | Activate channels | Set SmartLead/Phone channels to 'active' |
| 8:00 AM | Export contacts | Run full export to SmartLead and HeyReach |
| 9:00 AM | Start campaigns | Activate in SmartLead and HeyReach platforms |
| 10:00 AM | Monitor | Check first activity in `campaign_activity` |
| Ongoing | Daily ops | Reply handling, phone calls, GHL monitoring |

---

## What Can Be Automated vs Manual

| Task | Automated? | Tool |
|------|------------|------|
| Create SmartLead campaign | Yes | SmartLead MCP |
| Create SmartLead sequences | Yes | SmartLead MCP |
| Create HeyReach campaign | **No** | Must use HeyReach UI |
| Create GHL sequences | Yes | GHL MCP |
| Export contacts to SmartLead | Yes | n8n workflow |
| Export contacts to HeyReach | Yes | n8n workflow |
| Enrichment (find emails) | Yes | Apollo + NeverBounce MCPs |
| Reply classification | Yes | Gemini AI (already built) |
| GHL branch routing | Yes | n8n workflow (already built) |
| Phone call scheduling | Partially | n8n creates task, human makes call |

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| HeyReach rate limits | Batch exports in groups of 50 with delays |
| Duplicate contacts | Check `campaign_contact_channels` before export |
| Email deliverability | Use dedicated PP domains (iamlhrseminars.com, iamlhrtraining.com) |
| Activity not tracking | Test webhooks with curl before launch |
| Inbox disconnection | Morning health check before launch |
| GHL not receiving contacts | Test webhook with sample payload before launch |
| AI misclassifying replies | Review first 10 classifications, adjust prompts if needed |

---

## Verification Plan

### After Implementation - Before Launch

**1. Database Verification**
```sql
-- Verify domains added
SELECT * FROM domains WHERE domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com');

-- Verify inboxes synced
SELECT d.domain_name, COUNT(i.id) as inbox_count
FROM domains d
JOIN email_inboxes i ON i.domain_id = d.id
WHERE d.domain_name IN ('iamlhrseminars.com', 'iamlhrtraining.com')
GROUP BY d.domain_name;

-- Verify contacts enrolled
SELECT COUNT(*) FROM campaign_contacts
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- Verify messages added
SELECT message_code, message_name, channel_id FROM campaign_messages
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
ORDER BY channel_id, sequence_order;
```

**2. Webhook Tests**
```bash
# Test HeyReach activity receiver
curl -X POST "https://n8n.realtyamp.ai/webhook/heyreach" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "connection_request_accepted", "lead": {"email": "test@example.com"}}'

# Test SmartLead activity receiver
curl -X POST "https://n8n.realtyamp.ai/webhook/smartlead" \
  -H "Content-Type: application/json" \
  -d '{"event_type": "EMAIL_OPEN", "to_email": "test@example.com"}'

# Test GHL webhook
curl -X POST "https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/webhook-trigger/cb929231-04f8-4235-b107-8f43dc03f992" \
  -H "Content-Type: application/json" \
  -d '{"first_name": "Test", "last_name": "User", "email": "test@example.com", "ghl_branch": "A"}'
```

**3. End-to-End Test**
1. Add yourself as a test contact in Supabase
2. Export to HeyReach and SmartLead
3. Send connection request / email
4. Reply with positive message
5. Verify:
   - Activity logged in `campaign_activity`
   - AI classification correct
   - GHL receives contact
   - GHL sequence starts

### Post-Launch Monitoring

**Hourly for first day:**
```sql
SELECT
  channel,
  activity_type,
  COUNT(*) as count
FROM campaign_activity
WHERE activity_at >= NOW() - INTERVAL '1 hour'
GROUP BY channel, activity_type
ORDER BY channel, count DESC;
```

**Daily:**
```sql
SELECT * FROM campaign_funnel
WHERE campaign_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
```
