# Alumni Campaign Generator

Create alumni re-engagement and nurture emails following IAML playbooks.

## Usage

```
/alumni-campaign re-engagement       # Initial re-engagement blast
/alumni-campaign monthly-value       # Monthly value email
/alumni-campaign quarterly-reminder  # Quarterly update reminder
/alumni-campaign colleague-referral  # Colleague referral sequence
/alumni-campaign program-specific    # Program-specific push
/alumni-campaign                     # Interactive mode
```

## Your Task

Create ready-to-send email campaigns for IAML's alumni audience (past participants).

---

## STEP 1: Determine Campaign Type

### If No Arguments Provided (Interactive Mode)

Ask:

> **What type of alumni campaign do you need?**
>
> 1. **Re-engagement** — Initial blast offering complimentary 12-month quarterly updates
> 2. **Monthly Value** — Regular value email with insights + program highlights
> 3. **Quarterly Reminder** — Reminder before upcoming quarterly update session
> 4. **Colleague Referral** — Encourage referrals with discount incentive
> 5. **Program-Specific** — Push for specific upcoming program

### Additional Context Questions

Based on type, ask relevant follow-ups:

**For Monthly Value:**
> What's the primary topic or insight to share? (Or should I suggest one?)

**For Quarterly Reminder:**
> What's the date and topic of the upcoming session?

**For Program-Specific:**
> Which program and dates are you promoting?

---

## STEP 2: Reference Playbook

Read the EMAIL_NURTURE_ALUMNI.md playbook:
- **Location**: `business-os/knowledge/CHANNEL_PLAYBOOKS/EMAIL_NURTURE_ALUMNI.md`

Key sections to reference:
- Email Infrastructure Rules (domain usage, frequency)
- Alumni Re-Engagement Campaign templates
- Ongoing Alumni Nurture templates
- Colleague Referral Sequence
- Program-Specific Campaigns

---

## STEP 3: Gather Data (Use MCPs)

**Use Airtable MCP (`airtable`) for:**
- Upcoming program dates and locations
- Quarterly update schedule
- Faculty information
- Pricing details

**Use Supabase MCP (`supabase`) for:**
- Alumni database stats
- Segment information
- Recent engagement data

---

## STEP 4: Generate Email

### Format Based on Campaign Type

---

#### RE-ENGAGEMENT CAMPAIGN

**Purpose:** Offer 12-month complimentary quarterly update access to all alumni

**Email 1: Re-Engagement Announcement**

**Subject Line Options:**
1. [First Name], a thank you from IAML
2. Your IAML alumni benefit is ready
3. Complimentary access for IAML alumni

**Body:** [Generate using playbook template, include:]
- Acknowledgment of past program attendance
- Introduction of alumni benefit
- What's included (4 quarterly sessions, CE credits, recordings)
- Next session date and topic
- Clear CTA to claim access
- P.S. with colleague referral mention

**Email 2: Reminder for Non-Openers** (5-7 days later)

**Subject Line Options:**
1. Did you see this, [First Name]?
2. Your complimentary IAML access
3. Quick reminder: alumni benefit

**Body:** [Shorter version with same CTA]

---

#### MONTHLY VALUE EMAIL

**Purpose:** Provide ongoing value while promoting programs

**Structure:**
- Opening: Timely employment law insight (2-3 sentences)
- Middle: Practical application
- Section break
- **Upcoming from IAML**: One of:
  - Quarterly Update promotion
  - Program highlight
  - Colleague referral prompt
- Closing: Invitation to reply with questions

**Subject Line Options:**
1. [Topic]: What HR needs to know
2. Quick update on [legal development]
3. This month from IAML

---

#### QUARTERLY REMINDER

**Purpose:** Drive attendance to upcoming quarterly update

**Timing:** 1 week before session

**Subject Line Options:**
1. [Topic] – Next week's quarterly update
2. Quarterly update: [Date]
3. [First Name], joining us for [Topic]?

**Body:** [Include:]
- Date, time, topic
- 3-4 bullet points of what's covered
- Faculty name and credentials
- Reminder: complimentary for alumni
- Registration link
- Recording availability note

---

#### COLLEAGUE REFERRAL

**Purpose:** Encourage alumni to refer colleagues

**Timing Options:**
- Pre-program (1 week after registration)
- During program (Day 2)
- Post-program (2 weeks after completion)

**Subject Line Options:**
1. Bringing a colleague to [Program Name]?
2. Team training opportunity, [First Name]
3. Know someone who needs this?

**Body:** [Include:]
- Benefits of colleagues attending
- Discount amount for referrals
- How to refer (forward email or mention name)
- Future discount for referrer

---

#### PROGRAM-SPECIFIC PUSH

**Purpose:** Fill seats in upcoming program

**Subject Line Options:**
1. [Program Name] in [City] – [Date]
2. [X] seats remaining for [City]
3. [First Name], joining us in [City]?

**Body:** [Include:]
- Program name, location, dates
- What's covered (3 bullet points)
- Faculty highlights
- Format (in-person/virtual/both)
- Pricing with alumni discount
- Credits count
- Registration link
- Alternative locations/dates

---

## STEP 5: Format Output

Present the campaign in this format:

---

### ALUMNI CAMPAIGN

**Type:** [Campaign Type]
**Domain:** IAML-branded domains (Microsoft 365)
**Generated:** [Date]

---

### EMAIL

**Subject Line Options:**
1. [Subject A]
2. [Subject B]
3. [Subject C]

**Preview Text:** [First 50-60 characters that appear in inbox]

**Body:**
```
[Full email body with personalization tokens]
```

---

### SENDING RECOMMENDATIONS

- **Segment:** [Who should receive this]
- **Timing:** [When to send]
- **Frequency:** [Monthly / One-time / Sequence]
- **Domain:** IAML-branded domains

---

### SUCCESS METRICS

For this campaign type, target:
- **Open Rate:** [Target based on warm audience: 35-50%]
- **Click Rate:** [Target: 5-10%]
- **Reply Rate:** [If applicable]

---

## STEP 6: Offer Follow-Up Actions

After presenting the campaign:

1. "Would you like me to generate variations for A/B testing?"
2. "Should I create the full sequence (if applicable)?"
3. "Want me to check upcoming program data for accurate details?"

---

## Quality Standards

### Voice Check (Alumni-Appropriate)
- [ ] Warmer, more personal tone (they know us)
- [ ] Don't over-explain who IAML is
- [ ] Reference their past participation appropriately
- [ ] Value-first approach

### Content Check
- [ ] Accurate program dates and pricing
- [ ] Correct faculty information
- [ ] Proper alumni discount amounts
- [ ] Working registration links (placeholder)

### Compliance
- [ ] Respect sending frequency (monthly max for general)
- [ ] Include unsubscribe option
- [ ] Clear sender identification
