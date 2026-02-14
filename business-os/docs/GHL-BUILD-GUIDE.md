# GHL (GoHighLevel) Build-Out Guide

> **CEO Summary:** Step-by-step instructions to build the complete IAML sales pipeline, automations, sequences, and email templates inside GoHighLevel — directly from the Sales Playbook.

---

## Table of Contents

1. [Pipeline & Stages](#1-pipeline--stages)
2. [Custom Fields](#2-custom-fields)
3. [Tags](#3-tags)
4. [Contact Segments / Smart Lists](#4-contact-segments--smart-lists)
5. [Automations (Workflows)](#5-automations-workflows)
6. [Email Sequences](#6-email-sequences)
7. [Email Templates](#7-email-templates)
8. [Calendars & Tasks](#8-calendars--tasks)
9. [Integrations (n8n Webhooks)](#9-integrations-n8n-webhooks)
10. [Validation Checklist](#10-validation-checklist)

---

## 1. Pipeline & Stages

### Create Pipeline: "IAML Sales Pipeline"

Create one pipeline with the following 10 stages **in this order**:

| Stage # | Stage Name | Color | Description |
|---------|-----------|-------|-------------|
| 1 | **Uncontacted** | Gray | In database, never received outreach. Max 7 days. |
| 2 | **Prospecting** | Blue | In active SmartLead/HeyReach sequence, no engagement yet. 10-28 days. |
| 3 | **Engaged** | Green | Showed engagement signal, handed off to GHL. Max 30 days. |
| 4 | **Opportunity** | Orange | Clear buying intent, evaluating programs. Max 45 days. |
| 5 | **Won** | Dark Green | Registered and paid. Ongoing. |
| 6 | **National Drip** | Light Blue | Long-term nurture, completed sequences without converting. Up to 12 months. |
| 7 | **Parked** | Yellow | Interested but gave a future timeline. Max 6 months. |
| 8 | **Lost** | Red | Opportunity that did not convert. 30-day cool-down then drip. |
| 9 | **Archived** | Dark Gray | No longer reachable (bounced, 12+ months no opens, left HR). |
| 10 | **Do Not Contact** | Black | Explicitly asked to be removed. NEVER re-add. Non-negotiable. |

### Create Opportunity Sub-Stages (under Opportunity)

Use **custom field** or **tags** to track Opportunity sub-stages:

| Sub-Stage | Definition |
|-----------|-----------|
| Evaluating | Interested but hasn't committed |
| Approval Pending | Wants to attend, needs internal approval |
| Ready to Register | Approval secured or self-authorized |
| Registered | Payment received, confirmed |

---

## 2. Custom Fields

### Contact-Level Custom Fields

Create these custom fields under **Settings > Custom Fields > Contact**:

| Field Name | Field Type | Options/Notes |
|-----------|-----------|---------------|
| `Tier` | Dropdown | `Tier 1 - Director`, `Tier 2 - Executive`, `Tier 3 - Manager` |
| `Branch` | Dropdown | `Branch A (Positive)`, `Branch A+ (Wants Training)`, `Branch B (Not Now)`, `Branch C (No Contact)`, `Branch D (Not Interested)` |
| `Campaign Source` | Dropdown | `SL-T1-CORE`, `SL-T2-CORE`, `SL-T3-CORE-A`, `SL-T3-CORE-B`, `SL-AL-REENGAGE`, `SL-CE-TRIGGER`, `SL-LP-GEO`, `SL-ND-NURTURE`, `HR-T1-CORE`, `HR-T2-CORE`, `HR-AL-NOEMAIL`, `GHL-T1-ENGAGE`, `GHL-T2-ENGAGE`, `GHL-T3-ENGAGE`, `GHL-AL-ENGAGE`, `Inbound`, `Referral` |
| `AI Reply Classification` | Dropdown | `Positive`, `Not Now`, `Not Interested`, `Question`, `Auto-Reply`, `Unclassified` |
| `Gemini Classification Date` | Date | When Gemini AI classified the reply |
| `Original Reply Text` | Long Text | The actual reply text that triggered engagement |
| `Quarterly Update Status` | Dropdown | `Not Invited`, `Invited`, `Registered`, `Attended`, `No-Show` |
| `QU Registration Date` | Date | |
| `QU Attendance Date` | Date | |
| `Free Block Status` | Dropdown | `Not Offered`, `Offered`, `Accepted`, `Attended`, `Declined` |
| `Free Block Program` | Text | Which program block they attended |
| `Alumni Status` | Dropdown | `Not Alumni`, `Alumni - Active`, `Alumni - Lapsed` |
| `Alumni Program` | Text | Which program they previously attended |
| `Alumni Discount Used` | Checkbox | |
| `Colleague Of` | Text | Name/company of the colleague who triggered expansion |
| `Colleague Discount Eligible` | Checkbox | |
| `Convince My Boss Sent` | Checkbox | |
| `Convince My Boss Date` | Date | |
| `Parked Follow-Up Date` | Date | When to follow up with a Parked contact |
| `Parked Reason` | Text | What they said ("Check back in Q3", etc.) |
| `Lost Reason` | Dropdown | `Too Expensive`, `Bad Timing`, `Not Interested`, `Went Competitor`, `No Budget Approval`, `No Response`, `Other` |
| `Call Temperature` | Dropdown | `Hot`, `Warm`, `Cool`, `Cold` |
| `Last Call Date` | Date | |
| `Last Call Outcome` | Text | Summary of last phone call |
| `Last Call Blocker` | Text | What's blocking them |
| `Next Action` | Text | |
| `Next Action Date` | Date | |
| `Expansion Signals` | Long Text | Notes about team/colleague signals |
| `Programs Interested In` | Multi-Select or Text | Which specific programs they've asked about |
| `State` | Text | For geographic targeting |
| `Company Size` | Dropdown | `< 100`, `100-499`, `500-999`, `1,000-4,999`, `5,000+`, `Unknown` |
| `Supabase ID` | Text | Link back to Supabase master record |
| `SmartLead ID` | Text | Cross-reference |
| `HeyReach ID` | Text | Cross-reference |

### Opportunity-Level Custom Fields

| Field Name | Field Type | Options/Notes |
|-----------|-----------|---------------|
| `Opp Sub-Stage` | Dropdown | `Evaluating`, `Approval Pending`, `Ready to Register`, `Registered` |
| `Program` | Dropdown | `Certificate in Employee Relations Law`, `2-Day Program`, `Individual Block`, `Quarterly Update Only` |
| `Program City` | Text | |
| `Program Dates` | Text | |
| `Program Price` | Number | |
| `Discount Applied` | Dropdown | `None`, `Alumni $500`, `Alumni $300`, `Alumni $100`, `Colleague $500`, `Colleague $300`, `Colleague $100` |
| `Revenue` | Number | Actual amount paid |
| `Days in Stage` | Number | Auto-calculated if possible, otherwise manual |

---

## 3. Tags

### Tier Tags
- `Tier 1 - Director`
- `Tier 2 - Executive`
- `Tier 3 - Manager`
- `Alumni`

### Branch Tags
- `Branch A - Positive`
- `Branch A+ - Wants Training`
- `Branch B - Not Now`
- `Branch C - No Contact`
- `Branch D - Not Interested`

### Campaign Source Tags
- `SL-T1-CORE`
- `SL-T2-CORE`
- `SL-T3-CORE-A`
- `SL-T3-CORE-B`
- `SL-AL-REENGAGE`
- `SL-CE-TRIGGER`
- `SL-LP-GEO`
- `SL-ND-NURTURE`
- `HR-T1-CORE`
- `HR-T2-CORE`
- `HR-AL-NOEMAIL`
- `GHL-T1-ENGAGE`
- `GHL-T2-ENGAGE`
- `GHL-T3-ENGAGE`
- `GHL-AL-ENGAGE`
- `GHL-CE-ENGAGE`
- `GHL-NURTURE`
- `GHL-FRESHSTART`
- `Inbound`
- `Referral`

### Status Tags
- `QU - Invited`
- `QU - Registered`
- `QU - Attended`
- `QU - No Show`
- `Free Block - Offered`
- `Free Block - Accepted`
- `Free Block - Attended`
- `Convince My Boss - Sent`
- `Convince My Boss - Used`
- `Call Scheduled`
- `Call Completed`
- `Referral Source` (they referred someone)
- `Referred By` (they were referred)

### Geographic Tags (for local campaigns)
- `Geo - Atlanta`
- `Geo - Chicago`
- `Geo - Dallas`
- `Geo - Las Vegas`
- `Geo - Los Angeles`
- `Geo - New York`
- `Geo - San Francisco`
- `Geo - Washington DC`
- (Add more as needed per your program cities)

### Engagement Signal Tags
- `Opened 3+ Emails`
- `Clicked Link`
- `Replied`
- `LinkedIn Connected`
- `LinkedIn Replied`
- `Multi-Registration Company`

---

## 4. Contact Segments / Smart Lists

Create these Smart Lists for daily operations:

| Smart List Name | Filter Criteria | Purpose |
|----------------|----------------|---------|
| **Today's Follow-Ups** | `Next Action Date` = Today | Morning priority list |
| **Unhandled Replies** | `Branch` = any AND `Stage` = Engaged AND no GHL email sent in 24h | Zero unhandled replies daily |
| **Tier 1 Engaged** | `Tier` = Tier 1 AND `Stage` = Engaged | Personal outreach from Mike |
| **Tier 2 Engaged** | `Tier` = Tier 2 AND `Stage` = Engaged | Personal outreach from Mike |
| **Tier 3 Engaged** | `Tier` = Tier 3 AND `Stage` = Engaged | IAML outreach |
| **Active Opportunities** | `Stage` = Opportunity | Pipeline dashboard |
| **Stalled Opportunities** | `Stage` = Opportunity AND no activity in 10+ days | Call targets |
| **Parked - Due This Week** | `Stage` = Parked AND `Parked Follow-Up Date` = this week | Follow-up triggers |
| **Post-QU Follow-Up** | `QU Attendance Date` in last 48 hours AND no call logged | Call within 48 hours |
| **Post-Free Block** | `Free Block Status` = Attended AND no follow-up sent | Conversion opportunity |
| **Convince My Boss Users** | `Convince My Boss Sent` = Yes AND no call in 3 days | High-intent call targets |
| **Colleague Expansion Ready** | `Stage` = Won AND `Colleague Of` is empty | Trigger expansion campaign |
| **Alumni Re-Engaged** | `Alumni Status` = Alumni AND `Stage` = Engaged | Alumni conversion |
| **Multi-Reg Companies** | Tag = `Multi-Registration Company` | Corporate training candidates |
| **National Drip Re-Activation** | `Stage` = National Drip AND opened 3+ emails in 30 days | Move back to active |
| **Do Not Contact** | `Stage` = Do Not Contact | Suppression list for all campaigns |

---

## 5. Automations (Workflows)

Build these GHL automations. Each is triggered by n8n webhooks or internal GHL events.

### Automation 1: Inbound Contact Handler

**Trigger:** New contact created in GHL (inbound — form submission, direct email, phone call)

**Actions:**
1. Tag with `Inbound`
2. Assign tier based on title (use If/Else branching):
   - Title contains "Director" / "Senior Manager" → Tag `Tier 1 - Director`
   - Title contains "VP" / "SVP" / "CHRO" / "Chief People" / "EVP" → Tag `Tier 2 - Executive`
   - Title contains "Manager" / "Generalist" / "Business Partner" / "Specialist" → Tag `Tier 3 - Manager`
3. Create opportunity in pipeline at "Engaged" stage
4. Notify Mike via internal notification
5. Webhook to n8n (sync to Supabase)

### Automation 2: Branch A — Positive Reply Handler

**Trigger:** n8n webhook fires (Gemini classified reply as "Positive")

**Actions:**
1. Update `Branch` field → `Branch A (Positive)`
2. Update `AI Reply Classification` → `Positive`
3. Tag with `Branch A - Positive`
4. Move pipeline stage to "Engaged"
5. **If** `Tier` = Tier 1 or Tier 2:
   - Add to sequence `GHL-T1-ENGAGE` or `GHL-T2-ENGAGE`
   - Create task: "Personal follow-up - {{contact.name}}" due today
6. **If** `Tier` = Tier 3:
   - Add to sequence `GHL-T3-ENGAGE`
7. Notify Mike: "New positive reply from {{contact.name}} ({{contact.tier}})"

### Automation 3: Branch A+ — Wants Training Handler

**Trigger:** n8n webhook fires (Gemini classified reply as "Wants Training")

**Actions:**
1. Update `Branch` → `Branch A+ (Wants Training)`
2. Tag with `Branch A+ - Wants Training`
3. Move pipeline stage directly to "Opportunity"
4. Set `Opp Sub-Stage` → `Ready to Register`
5. Create task: "URGENT - {{contact.name}} wants to register" due today
6. Notify Mike immediately
7. **If** Tier 1 or 2: Create task "Call {{contact.name}} within 24 hours"

### Automation 4: Branch B — Not Now Handler

**Trigger:** n8n webhook fires (Gemini classified as "Not Now")

**Actions:**
1. Update `Branch` → `Branch B (Not Now)`
2. Tag with `Branch B - Not Now`
3. Move to "Parked" stage
4. Set `Parked Follow-Up Date` → 30/60/90 days from now (default 60)
5. Add to sequence `GHL-NURTURE`
6. Send immediate email: "Completely understand" acknowledgment (Template: `GHL-B-ACK`)
7. Create task: "Follow up with {{contact.name}}" on Parked date

### Automation 5: Branch C — No Contact / Strong Signals Handler

**Trigger:** n8n webhook fires (sequence complete, no reply, but 3+ opens or clicks)

**Actions:**
1. Update `Branch` → `Branch C (No Contact)`
2. Tag with `Branch C - No Contact`
3. Move to "Engaged" stage
4. Wait 7 days (cool-down from SmartLead sequence)
5. Add to sequence `GHL-FRESHSTART`

### Automation 6: Branch D — Not Interested Handler

**Trigger:** n8n webhook fires (Gemini classified as "Not Interested" / "Remove Me")

**Actions:**
1. Update `Branch` → `Branch D (Not Interested)`
2. Tag with `Branch D - Not Interested`
3. Move to "Do Not Contact" stage immediately
4. Remove from ALL active sequences
5. Remove from ALL campaigns
6. Webhook to n8n: suppress in SmartLead, HeyReach, and Supabase

### Automation 7: QU Registration Handler

**Trigger:** n8n webhook fires (Quarterly Update registration confirmed)

**Actions:**
1. Update `Quarterly Update Status` → `Registered`
2. Set `QU Registration Date` → today
3. Tag with `QU - Registered`
4. **If** stage is Prospecting → move to Engaged
5. **If** stage is National Drip → move to Engaged

### Automation 8: QU Attendance Handler

**Trigger:** n8n webhook fires (Quarterly Update attended)

**Actions:**
1. Update `Quarterly Update Status` → `Attended`
2. Set `QU Attendance Date` → today
3. Tag with `QU - Attended`
4. **If** Tier 1 or 2:
   - Create task: "Call {{contact.name}} - Post-QU follow-up" due in 24 hours
   - Add to sequence `GHL-POST-QU-T1T2`
5. **If** Tier 3:
   - Send email: Post-QU follow-up with program details (Template: `GHL-POST-QU-T3`)
6. **If** Alumni:
   - Create task: "Call {{contact.name}} - Alumni post-QU" due in 24 hours
   - Send email: Alumni-specific follow-up with discount (Template: `GHL-POST-QU-ALUMNI`)

### Automation 9: Won — Registration Confirmed

**Trigger:** Pipeline stage changes to "Won"

**Actions:**
1. Send registration confirmation email (Template: `GHL-WON-CONFIRM`)
2. Send pre-program logistics email (wait 2 days)
3. Tag with `Active Registrant`
4. Webhook to n8n: trigger Colleague Expansion campaign
5. Create tasks:
   - "Post-program thank-you" — due: program end date + 2 days
   - "Referral ask" — due: program end date + 14 days
   - "Next program recommendation" — due: program end date + 30 days
   - "Alumni discount reminder" — due: program end date + 60 days
   - "QU renewal reminder" — due: program end date + 10 months

### Automation 10: Stale Stage Monitor

**Trigger:** Schedule (daily at 8 AM)

**Actions (use date-based conditions):**
1. Contacts in "Engaged" with no activity for 14 days → move to National Drip, add 90-day re-engagement flag
2. Contacts in "Engaged" with no activity for 30 days → move to National Drip
3. Contacts in "Opportunity" with no activity for 10 days → Create task "Call stalled opportunity: {{contact.name}}"
4. Contacts in "Opportunity" with no activity for 45 days → move to "Lost", set `Lost Reason` = "No Response"
5. Contacts in "Parked" past 6 months → move to National Drip
6. Contacts in "National Drip" with zero opens for 12 months → move to Archived

### Automation 11: Colleague Expansion Incoming

**Trigger:** n8n webhook fires (new colleague expansion contact)

**Actions:**
1. Create contact with all enriched data
2. Set `Colleague Of` → registrant's name
3. Tag with `Colleague Discount Eligible`, `SL-CE-TRIGGER`
4. Set tier based on title
5. Move to "Prospecting" stage
6. Webhook confirmation back to n8n

### Automation 12: National Drip Re-Activation

**Trigger:** Contact in National Drip opens 3+ emails in 30 days OR clicks any link OR replies

**Actions:**
1. **If** opens 3+ → move to Prospecting with fresh sequence
2. **If** clicks link → move to Engaged, trigger appropriate GHL sequence
3. **If** replies → trigger Gemini AI classification via n8n webhook, then route through Branch automations

---

## 6. Email Sequences

### Sequence: GHL-T1-ENGAGE (Tier 1 Directors — Personal from Mike)

| Step | Timing | Template | Notes |
|------|--------|----------|-------|
| 1 | Trigger + 0 days | `GHL-T1-E1-POSITIVE` or `GHL-T1-E1-NOTNOW` | Branch on `AI Reply Classification`. Respond to what they said. |
| 2 | After QU attendance (48h) | `GHL-T1-E2-POST-QU` | Offer complimentary virtual block |
| 3 | After free block attendance | `GHL-T1-E3-CONVERSION` | Push toward paid program |

**Important:** This is NOT a timed sequence. Steps 2 and 3 are event-triggered (QU attendance, block attendance). Build as automation with conditional waits, not a traditional drip.

### Sequence: GHL-T2-ENGAGE (Tier 2 Executives — Personal from Mike)

| Step | Timing | Template | Notes |
|------|--------|----------|-------|
| 1 | Trigger + 0 days | `GHL-T2-E1-POSITIVE` | Team-development framing. Offer to send one team member to free block. |
| 2 | After QU attendance (24h) | `GHL-T2-E2-POST-QU` | Offer to send team member to free block |
| 3 | After free block (team member) | `GHL-T2-E3-TEAM-PROPOSAL` | Team registration proposal |

### Sequence: GHL-T3-ENGAGE (Tier 3 Managers — From "IAML", not Mike personally)

| Step | Timing | Template | Notes |
|------|--------|----------|-------|
| 1 | Trigger + 0 days | `GHL-T3-E1-POSITIVE` | Program details, lower-barrier offer |
| 2 | After QU attendance (48h) | `GHL-T3-E2-POST-QU` | Program recommendation with Convince My Boss tool |
| 3 | If "need approval" signal | `GHL-T3-E3-CONVINCE-BOSS` | Send Convince My Boss tool link |
| 4 | After free block (if offered) | `GHL-T3-E4-CONVERSION` | Paid program recommendation |

### Sequence: GHL-AL-ENGAGE (Alumni — Personal from Mike for T1/T2, IAML for T3)

| Step | Timing | Template | Notes |
|------|--------|----------|-------|
| 1 | On reply/QU registration | `GHL-AL-E1-WELCOME-BACK` | Personal reconnection |
| 2 | After engagement | `GHL-AL-E2-ALUMNI-DISCOUNT` | $500/$300/$100 off + QU renewal |
| 3 | After positive interaction | `GHL-AL-E3-REFERRAL` | Referral ask |
| 4 | Ongoing | `GHL-AL-E4-RENEWAL` | QU access renewal on re-enrollment |

### Sequence: GHL-FRESHSTART (Branch C — Fresh approach from iaml.com)

| Step | Timing | Template | Notes |
|------|--------|----------|-------|
| 1 | 7 days after SmartLead sequence ends | `GHL-FS-E1` | Fresh angle, no reference to previous emails. From iaml.com. |
| 2 | + 5 days | `GHL-FS-E2` | QU offer with different framing |
| 3 | + 5 days | `GHL-FS-E3` | Soft close |

### Sequence: GHL-NURTURE (Branch B — Timed follow-up)

| Step | Timing | Template | Notes |
|------|--------|----------|-------|
| 1 | On Parked Follow-Up Date | `GHL-NUR-E1` | "Checking back in as promised" |
| 2 | + 14 days (if no response) | `GHL-NUR-E2` | One more attempt |
| 3 | If still no response | Move to National Drip | End sequence |

### Sequence: GHL-POST-PROGRAM (Won — Post-attendance follow-up)

| Step | Timing | Template | Notes |
|------|--------|----------|-------|
| 1 | Program end + 2 days | `GHL-PP-E1-THANKYOU` | Thank-you email |
| 2 | Program end + 14 days | `GHL-PP-E2-REFERRAL` | Referral ask |
| 3 | Program end + 30 days | `GHL-PP-E3-NEXT-PROGRAM` | Next program recommendation |
| 4 | Program end + 60 days | `GHL-PP-E4-ALUMNI-DISCOUNT` | Alumni discount reminder |
| 5 | Program end + 90 days | `GHL-PP-E5-REFERRAL-2` | Second referral ask, different angle |
| 6 | Program end + 10 months | `GHL-PP-E6-QU-RENEWAL` | "Your QU access renews when you enroll" |

---

## 7. Email Templates

### From Address Rules

| Audience | From Name | From Email |
|----------|----------|-----------|
| Tier 1 Directors | Mike Van Horn | mike@iaml.com |
| Tier 2 Executives | Mike Van Horn | mike@iaml.com |
| Tier 3 Managers | IAML Client Services | clientservices@iaml.com |
| Alumni (T1/T2) | Mike Van Horn | mike@iaml.com |
| Alumni (T3) | IAML Client Services | clientservices@iaml.com |

### Template: GHL-T1-E1-POSITIVE

**Subject:** Re: {{original_subject_line}}

```
{{firstName}}, really glad to hear from you. {{personalized_response_to_their_reply}}

{{context_based_next_step}}

I'm here if you have any questions at all. Happy to jump on a quick call if that's easier.

Mike
Manager of Client Services, IAML
{{phone_number}}
```

### Template: GHL-T1-E1-NOTNOW

**Subject:** Re: {{original_subject_line}}

```
Completely understand, {{firstName}}. I'll check back in {{30/60/90_days}}.

In the meantime, our Quarterly Employment Law Update is always complimentary for you (normally $397). No commitment required, and it's a good way to stay current. I'll send you an invite when the next one comes around.

Mike
Manager of Client Services, IAML
```

### Template: GHL-T1-E2-POST-QU (Post-Quarterly Update)

**Subject:** Glad you joined us, {{firstName}}

```
Hi {{firstName}},

Thanks for joining the Quarterly Employment Law Update. I hope you found it valuable.

I wanted to mention something based on what was covered in the session. If any of those topics resonated, specifically {{reference_key_topics}}, our {{relevant_program_name}} goes much deeper on those issues. {{duration}} / {{credits}} credits / available in-person or virtually.

As a thank-you for joining the Quarterly Update, I'd like to offer you a complimentary virtual program block so you can experience the full depth of an IAML program before making any commitment. This is normally $575-$1,375. No cost, no strings.

Would that be useful?

Mike
Manager of Client Services, IAML
{{phone_number}}
```

### Template: GHL-T1-E3-CONVERSION (Post-Free Block)

**Subject:** What did you think?

```
Hi {{firstName}},

Now that you've experienced an IAML program block firsthand, I'd love to hear your thoughts.

If the depth and quality matched what you're looking for, the full {{certificate_program_name}} builds on what you just experienced across 4.5 days and 29.75 credits. Your enrollment includes 12 months of complimentary Quarterly Updates, a $1,588 value. {{program_page_link}}

You can also continue with individual blocks if the full certificate is more than you need right now.

Happy to talk through which option makes the most sense for your situation. I can also help if you need to make the case internally for the investment.

Mike
Manager of Client Services, IAML
{{phone_number}}
```

### Template: GHL-T2-E1-POSITIVE

**Subject:** Re: {{original_subject_line}}

```
{{firstName}}, appreciate you getting back to me. {{personalized_response}}

I'd like to offer this: I'll put one of your team members through a virtual program block at no cost. They experience the quality, you get their honest feedback before committing anything. No strings.

Who on your team would benefit most from deeper employment law training?

Mike
Manager of Client Services, IAML
{{phone_number}}
```

### Template: GHL-T3-E1-POSITIVE

**Subject:** Re: {{original_subject_line}}

```
Hi {{firstName}},

Thanks for getting back to us. {{personalized_response}}

Based on what you mentioned, here are a few options that might be a good fit:

- **2-day program** ({{program_name}}, {{credits}} credits, ${{price}}) — {{brief_description}}
- **Individual block** ({{block_name}}, {{block_credits}} credits, ${{block_price}}) — a focused deep-dive

And our complimentary Quarterly Employment Law Update (normally $397, mid-April, 90 minutes, 1.5 credits) is a great no-commitment starting point.

Would any of these be useful to explore further?

Best,
IAML Client Services
```

### Template: GHL-T3-E3-CONVINCE-BOSS

**Subject:** A tool to help you make the case

```
Hi {{firstName}},

I completely understand needing approval. We've built a tool specifically for this situation.

Our Business Case Generator creates a professional document you can send to your director that includes:
- Full cost breakdown (tuition, travel, per diem)
- ROI justification (outside counsel savings)
- Credits earned
- A ready-to-send email to your manager

Here's the link: {{convince_my_boss_url}}

If it would help, I'm also happy to speak with your director directly to explain the program. Sometimes hearing from us makes the conversation easier.

Best,
IAML Client Services
```

### Template: GHL-AL-E2-ALUMNI-DISCOUNT

**Subject:** Welcome back pricing for IAML alumni

```
Hi {{firstName}},

As an IAML alumnus, you have exclusive pricing on any future program:

- $500 off any full certificate program (4.5 days, 29.75 credits)
- $300 off any 2-day advanced or specialty program
- $100 off individual program blocks

Plus, complimentary access to every Quarterly Employment Law Update — a $397 value each session.

When you re-enroll, your complimentary access to all four Quarterly Updates resets for another 12 months. That's $1,588 in ongoing education included with your next program.

Here's our full 2026 schedule: {{schedule_link}}

Mike
Manager of Client Services, IAML
{{phone_number}}
```

### Template: GHL-AL-E3-REFERRAL

**Subject:** Know someone who'd benefit from IAML?

```
Hi {{firstName}},

One quick ask. If you have colleagues in HR, whether at {{companyName}} or at other organizations, who deal with employment law questions regularly, I'd love to extend two things to them:

1. Complimentary access to our Quarterly Employment Law Update (normally $397 per session, next one is mid-April)
2. Information about our programs tailored to their role and interests

You don't need to make a formal introduction. If you'd like to share their name and email, I'll reach out personally and mention that you recommended them. Or you can forward this email to them directly and they can reply to me.

Either way, no pressure. I just know that the best way people find out about IAML is from someone who's been through the experience.

Thanks, {{firstName}}.

Mike
Manager of Client Services, IAML
```

### Template: GHL-FS-E1 (FreshStart — Branch C)

**Subject:** Quick question about employment law training, {{firstName}}

```
Hi {{firstName}},

I'm reaching out from IAML. We provide intensive employment law training for HR professionals, taught by practicing attorneys from the nation's top firms. We've trained more than 80,000 professionals since 1979.

I'd like to offer you complimentary access to our Quarterly Employment Law Update. It's normally $397, 90 minutes, 1.5 SHRM/HRCI credits, and covers the most important employment law developments from the past quarter.

The next session is mid-April. Would that be useful?

Mike
Manager of Client Services, IAML
```

### Template: GHL-NUR-E1 (Nurture — Parked Follow-Up)

**Subject:** Checking back in, {{firstName}}

```
Hi {{firstName}},

When we last spoke, you mentioned {{parked_reason}}. I wanted to check in and see if now is a better time to explore IAML's employment law training.

Our next Quarterly Employment Law Update is {{next_QU_date}} — 90 minutes, 1.5 SHRM/HRCI credits, complimentary for you (normally $397). It's a no-commitment way to stay current.

And if you're ready to discuss programs, I'm here. Happy to talk through what makes the most sense for your situation.

Mike
Manager of Client Services, IAML
{{phone_number}}
```

### Template: GHL-WON-CONFIRM (Registration Confirmation)

**Subject:** You're confirmed for {{program_name}}, {{firstName}}

```
Hi {{firstName}},

Great news — you're confirmed for IAML's {{program_name}}.

Here are your details:
- Program: {{program_name}}
- Dates: {{program_dates}}
- Location: {{program_location}} (or Virtual)
- Credits: {{credits}} SHRM/HRCI/CLE

Your enrollment includes 12 months of complimentary Quarterly Employment Law Updates — that's all four sessions, a $1,588 value.

I'll send logistics details (hotel recommendations, schedule, materials) closer to the program date.

Looking forward to having you with us.

Mike
Manager of Client Services, IAML
{{phone_number}}
```

### Template: GHL-PP-E2-REFERRAL (Post-Program Referral Ask)

**Subject:** One quick thing, {{firstName}}

```
Hi {{firstName}},

It's been two weeks since {{program_name}}. Hope you've had a chance to put some of what you learned into practice.

If you have colleagues in HR — whether at {{companyName}} or elsewhere — who deal with employment law questions regularly, I'd love to extend complimentary access to our Quarterly Employment Law Update (normally $397) and information about our programs.

You can share their name and email, or just forward this note to them. I'll mention you recommended them.

No pressure at all. Just know that the best referrals we get come from people who've experienced the programs firsthand.

Thanks, {{firstName}}.

Mike
Manager of Client Services, IAML
```

---

## 8. Calendars & Tasks

### Task Categories (for internal GHL tasks)

| Category | Color | Used For |
|----------|-------|----------|
| Call - Post QU | Blue | Call within 48h of QU attendance |
| Call - Follow-Up | Green | Positive reply, hasn't registered |
| Call - Stalled Opp | Orange | Opportunity stalled 10+ days |
| Call - Convince My Boss | Red | High-intent Tier 3, call in 3 days |
| Call - Colleague Expansion | Purple | Tier 1/2 positive replies from expansion |
| Follow-Up - Parked | Yellow | Parked contact due for follow-up |
| Follow-Up - Post-Program | Gray | Post-program timeline actions |
| Admin - Pipeline Hygiene | Light Gray | Weekly cleanup tasks |

### Weekly Call Block Schedule

Set up recurring calendar blocks:
- **Tuesday 9:00-11:00 AM** — Phone calls
- **Wednesday 9:00-11:00 AM** — Phone calls
- **Thursday 9:00-11:00 AM** — Phone calls

---

## 9. Integrations (n8n Webhooks)

GHL receives contacts and events from n8n. Set up these webhook endpoints in GHL and register them in your n8n workflows.

### Inbound Webhooks (n8n → GHL)

| Webhook Name | When n8n Fires It | What GHL Does |
|-------------|-------------------|---------------|
| `ghl-new-engaged` | SmartLead/HeyReach reply + Gemini classification | Create/update contact, set branch, trigger automation |
| `ghl-qu-registered` | Quarterly Update registration confirmed | Update QU fields, move stage |
| `ghl-qu-attended` | Quarterly Update attendance recorded | Update QU fields, trigger post-QU automation |
| `ghl-colleague-expansion` | New colleague contacts enriched | Create contacts with colleague tags |
| `ghl-block-attended` | Free block attendance recorded | Update block fields, trigger conversion sequence |
| `ghl-smartlead-activity` | SmartLead activity sync (opens, clicks) | Update activity, check for re-activation triggers |
| `ghl-heyreach-activity` | HeyReach activity sync (connections, messages) | Update LinkedIn activity |

### Outbound Webhooks (GHL → n8n)

| Webhook Name | When GHL Fires It | What n8n Does |
|-------------|-------------------|---------------|
| `n8n-contact-updated` | Any contact field update in GHL | Sync back to Supabase |
| `n8n-stage-changed` | Pipeline stage changes | Update Supabase, trigger downstream actions |
| `n8n-won-registration` | Stage → Won | Trigger colleague expansion, sync to Airtable/Supabase |
| `n8n-dnc-added` | Contact moved to Do Not Contact | Suppress in SmartLead, HeyReach, Supabase |
| `n8n-call-logged` | Call logged in GHL | Sync call data to Supabase |

### Setup Steps

1. **In GHL:** Go to Settings > Integrations > Webhooks
2. Create each outbound webhook with the n8n webhook URL
3. **In n8n:** Create webhook trigger nodes for each inbound webhook
4. Pass the GHL webhook URLs to n8n workflow configuration
5. Test each webhook with a test contact

---

## 10. Validation Checklist

Run through this checklist after building each section:

### Pipeline
- [ ] All 10 stages exist in order
- [ ] Stage colors match the guide
- [ ] Test: move a contact through each stage manually

### Custom Fields
- [ ] All contact fields created with correct types
- [ ] All opportunity fields created
- [ ] Dropdown options match exactly (spellings matter for automation matching)

### Tags
- [ ] All tier tags created
- [ ] All branch tags created
- [ ] All campaign source tags created
- [ ] All status tags created
- [ ] All geographic tags created (at minimum for cities with upcoming programs)

### Smart Lists
- [ ] "Today's Follow-Ups" returns correct contacts
- [ ] "Unhandled Replies" filter logic is correct
- [ ] "Do Not Contact" list works as suppression

### Automations
- [ ] Branch A automation: test with mock positive reply webhook
- [ ] Branch A+ automation: test — contact jumps to Opportunity
- [ ] Branch B automation: test — contact goes to Parked with follow-up date
- [ ] Branch C automation: test — contact enters FreshStart sequence after 7-day wait
- [ ] Branch D automation: test — contact goes to DNC, removed from all sequences
- [ ] QU Registration automation: test — fields update, stage changes
- [ ] QU Attendance automation: test — call task created (T1/T2)
- [ ] Won automation: test — confirmation sent, expansion webhook fires
- [ ] Stale Monitor: test — verify date calculations work correctly

### Sequences
- [ ] GHL-T1-ENGAGE sequence exists with correct templates
- [ ] GHL-T2-ENGAGE sequence exists
- [ ] GHL-T3-ENGAGE sequence exists
- [ ] GHL-AL-ENGAGE sequence exists
- [ ] GHL-FRESHSTART sequence exists (3 emails, 5-day spacing)
- [ ] GHL-NURTURE sequence exists (event-triggered, not timed)
- [ ] GHL-POST-PROGRAM sequence exists (6 steps, spread over 10 months)

### Webhooks
- [ ] All inbound webhooks registered and tested
- [ ] All outbound webhooks firing to n8n
- [ ] Supabase sync confirmed (GHL → n8n → Supabase round-trip)

### End-to-End Test Scenarios

Run these with test contacts:

1. **Happy path:** Positive reply → Engaged → QU Attended → Free Block → Paid Program → Won → Colleague Expansion fires
2. **Not now path:** Branch B reply → Parked → Follow-up email on date → Re-engage or Drip
3. **No contact path:** Sequence complete, 3+ opens → Branch C → FreshStart sequence → Reply → Back to Engaged
4. **DNC path:** "Remove me" → Branch D → DNC stage → Suppressed everywhere
5. **Alumni path:** Alumni re-engages → Alumni sequence → Discount offer → Registration → Referral ask
6. **Tier 3 approval path:** Positive reply → Engaged → "Need approval" → Convince My Boss sent → Call in 3 days

---

## Build Order (Recommended)

Build in this order to minimize rework:

1. **Custom Fields** — Everything else depends on these existing
2. **Tags** — Needed for automations and smart lists
3. **Pipeline & Stages** — Core structure
4. **Email Templates** — Sequences need these
5. **Sequences** — Automations trigger these
6. **Automations** — Wire everything together
7. **Smart Lists** — For daily operations
8. **Webhooks** — Connect to n8n
9. **Tasks & Calendar** — Operational setup
10. **End-to-End Testing** — Validate everything

---

*Built from IAML Sales Playbook (February 2026). Update this guide when the playbook changes.*
