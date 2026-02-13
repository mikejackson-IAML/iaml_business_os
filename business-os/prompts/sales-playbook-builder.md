# IAML Sales Playbook Builder Prompt

> **How to use:** Copy everything below the divider into a fresh Claude chat. Claude will have all the context needed to build a comprehensive sales playbook with you.

---

You are helping me build a comprehensive Sales Playbook for IAML (Institute for Applied Management & Law). This is not a theoretical exercise. This will be the operational document my team and I use every day to execute outreach, qualify prospects, move them through our pipeline, and convert them into program registrants and long-term advocates.

## ABOUT IAML

IAML is the premier intensive employment law education provider for HR professionals, benefits specialists, and in-house counsel. We've trained 80,000+ professionals since 1979. Our programs are multi-day intensives (2-4.5 days) taught by practicing employment law attorneys from top firms (Taft, Thompson Hine, Alston & Bird, Littler Mendelson, Barnes & Thornburg, Foley Hoag).

**Our primary domain is iaml.com.** All personal, high-touch emails come from iaml.com via GoHighLevel.

## OUR PROGRAMS & PRICING

### Full Certificate Programs (4.5 days, $2,375 each)
- **Certificate in Employee Relations Law** (29.75 SHRM/HRCI/CLE credits)
  - Block 1: Comprehensive Labor Relations ($1,375, 2 days)
  - Block 2: Discrimination Prevention & Defense ($1,375, 2 days)
  - Block 3: Special Issues in Employment Law ($575, 0.5 days)
- **Certificate in Employee Benefits Law** (29.75 credits)
  - Block 1: Retirement Plans ($1,375, 2 days)
  - Block 2: Benefit Plan Claims ($575, 1 day)
  - Block 3: Welfare Benefits ($975, 1.5 days)
- **Certificate in Strategic HR Leadership** (29.75 credits)
  - Block 1: HR Law Fundamentals ($1,375, 2 days)
  - Block 2: Strategic HR Management ($1,575, 2.5 days)

### Advanced & Specialty Programs (2 days, $1,575 each)
- Advanced Certificate in Strategic Employment Law (13 credits)
- Advanced Certificate in Employee Benefits Law (13 credits)
- Certificate in Workplace Investigations (13 credits)

### Continuing Education
- Quarterly Employment Law Updates: $397/session (90 min, 1.5 credits)
  - FREE for all IAML alumni (12 months included with certificate programs)
  - 4 sessions/year (January, April, July, October)

### Formats
- In-Person (nationwide hotel venues)
- Virtual (live Zoom, same faculty)
- On-Demand (90-day access, select programs)

### 2026 Schedule
70 total sessions across 9 cities. Programs run year-round.

## OUR THREE TARGET TIERS

This is the core of the playbook. We are NOT blasting everyone with the same message. We have three distinct tiers with different messaging, different offers, and different goals:

### TIER 1: DIRECTORS (Primary Focus)
**Titles:** HR Director, Director of Employee Relations, Director of HR Operations, Director of People, Director of Total Rewards, Director of Talent, Senior HR Manager
**Why they're Tier 1:** They are the sweet spot. They have budget influence, they attend programs themselves, AND they send their team members. They're accessible (not behind gatekeepers like executives), and they have direct pain points our programs solve.
**Goal:** Get them to attend a program personally, then refer/send their team.
**Offer progression:**
1. Free Quarterly Employment Law Update (entry point)
2. Free virtual block attendance (if they engage with quarterly update)
3. Paid program attendance (for themselves)
4. Team registrations (send their reports to IAML)
5. Corporate training conversation (on-site for their whole team)

### TIER 2: EXECUTIVES (Different Message, Different Goal)
**Titles:** VP of HR, SVP of HR, CHRO, Chief People Officer, EVP
**Why they're Tier 2:** They control budgets and make training decisions for their teams, but they rarely attend training themselves. The message to them is about developing their team and protecting the organization, not about their personal development.
**Goal:** Build a relationship where they see IAML as their team's development partner. Get them to send directors and managers to our programs.
**Offer progression:**
1. Free Quarterly Update (demonstrates IAML quality to them personally)
2. Offer to send one team member to a free virtual block
3. Paid registrations for their team
4. Corporate training proposal
5. Long-term partnership (annual training plan)

### TIER 3: MANAGERS (Volume Play)
**Titles:** HR Manager, HR Generalist, HR Business Partner, Employee Relations Manager, Benefits Manager
**Why they're Tier 3:** They're our actual attendees in many cases, but they don't control budget. They need approval from their director or VP to attend. The message to them is about career advancement, confidence, and filling knowledge gaps.
**Goal:** Get them to attend a program (starting with a block if full program is too much), and get them to advocate internally so their boss sends more people.
**Offer progression:**
1. Educational content (employment law tips, case studies)
2. Free Quarterly Update invitation
3. Block attendance recommendation (lower barrier than full program)
4. Full certificate program
5. Refer a colleague

## OUR MARKETING STACK & HOW IT FLOWS

### Platform Roles
| Platform | Role | When Used |
|----------|------|-----------|
| **SmartLead** | Cold email automation | First touch. Sends automated email sequences from marketing domains. Handles opens, clicks, bounce tracking. |
| **HeyReach** | LinkedIn automation | Parallel to SmartLead. Sends connection requests, DMs. Uses Sales Navigator. |
| **GoHighLevel (GHL)** | CRM + personal email sequences | After first engagement. When someone replies to SmartLead or HeyReach, they get moved to GHL. All GHL emails come from iaml.com. This is where the relationship becomes personal. |
| **Supabase** | Database + tracking | Backend. Stores all contacts, tracks all activity, powers dashboards. |
| **n8n** | Workflow automation | Glue between platforms. Webhooks, data sync, AI classification. |
| **Gemini AI** | Reply classification | Classifies every reply as positive, not now, not interested, etc. Routes to correct GHL branch automatically. |

### The Flow (This is Critical)

```
COLD OUTREACH (SmartLead + HeyReach)
  - Marketing domains (NOT iaml.com)
  - Automated sequences
  - Goal: Get a reply (any reply)
         |
         v
ON ANY REPLY → AI classifies → Routes to GHL
         |
         v
GHL PERSONAL OUTREACH (iaml.com domain)
  - Branch A: Positive reply → Confirmation + offers
  - Branch A+: Wants training → Program options
  - Branch B: Not now → Value nurture
  - Branch C: No contact → Fresh approach from iaml.com
         |
         v
PHONE FOLLOW-UP (when warranted)
  - Only after engagement signals (opens, clicks, partial replies)
  - Only for Tier 1 and Tier 2 contacts
  - Never cold call from old database numbers
```

**Key insight: SmartLead/HeyReach = automation. GHL = conversation. The handoff from automation to personal outreach is when they enter GHL.**

### When We Switch to iaml.com (GHL)
- The moment someone replies on any channel
- When they're classified as Branch C (no contact after full automated sequence) - we try a fresh approach from iaml.com which looks and feels different from the marketing domain emails
- When a VIP title (Tier 2 executive) shows engagement signals (opens 3+ emails, clicks) but doesn't reply

### When a Phone Call is Warranted
- Contact replied positively but hasn't registered (Tier 1 or 2 only)
- Contact opened/clicked 3+ times but never replied (warm signal, Tier 1 or 2)
- Contact is at a Fortune 500 or high-value target company
- Contact replied "not now" but seemed genuinely interested (call in 30 days)
- NEVER cold call. NEVER call Tier 3 unless they explicitly ask for a call.

## EMAIL INFRASTRUCTURE

### 60 Total Mailboxes
| Type | Count | Platform | Use |
|------|-------|----------|-----|
| General marketing domains | 30 | Google Workspace / SmartLead | Cold outreach to new prospects |
| SHRM-referenced domains | 4 | Microsoft 365 | Target SHRM-CP/SCP holders |
| HRCI-referenced domains | 4 | Microsoft 365 | Target PHR/SPHR holders |
| IAML-branded (iamlhrseminars.com, iamlhrtraining.com) | 8 | SmartLead | Alumni/past participants |
| invitationtohrtraining.com | 4 | Microsoft 365 | Colleague referral campaigns |
| Other | 10 | Microsoft 365 | Various/expansion |

### Sending Limits (Conservative)
- New domains: 20-25/mailbox/day
- Established: 30-50/mailbox/day
- Total daily capacity: ~1,500 emails/day
- Best days: Tue/Wed/Thu
- Best times: 9-11 AM or 1-3 PM recipient local time

### Domain Strategy
- **Cold prospects:** General marketing domains via SmartLead
- **Alumni/past participants:** iamlhrseminars.com / iamlhrtraining.com via SmartLead
- **Personal follow-up after engagement:** iaml.com via GHL
- **Colleague referrals:** invitationtohrtraining.com

## INCENTIVES & OFFERS (What We Can Give Away)

| Offer | Who Gets It | Purpose |
|-------|-------------|---------|
| Free Quarterly Employment Law Update (12 months) | All tiers, all prospects | Entry point, demonstrates quality |
| Free virtual block attendance | Tier 1 directors who engage with quarterly update, OR one team member of Tier 2 executives | Deeper demonstration of IAML value |
| Alumni discount (15%) on future programs | Past participants returning | Loyalty reward |
| Certificate bundle savings ($1,000+ savings vs buying blocks separately) | Anyone considering full program | Incentivize full commitment |
| Corporate on-site training proposal | Tier 2 executives with 10+ HR team | Scale opportunity |
| Colleague referral discount | Anyone who refers a colleague (invitationtohrtraining.com) | Word-of-mouth growth |

## COMPETITIVE LANDSCAPE (Brief)

| Competitor | Their Pitch | Our Counter |
|------------|------------|-------------|
| SHRM Conferences | Brand recognition, broad HR exposure | We go deep, not broad. 4.5 days on one subject vs 90-min sessions on 20 topics. |
| Law Firm CLEs | Free, convenient | 2-hour overview vs multi-day mastery. One firm's view vs multiple attorney perspectives. |
| Boutique providers (Lorman, NELI) | Cheaper, shorter | Less depth, less prestige, no 45-year track record, weaker faculty. |
| Internal training | Customized, no travel | No external perspective, no peer networking, no credential. We also offer on-site. |

## WHAT SUCCESS LOOKS LIKE

### Ultimate Goals
1. Increase program registrations (volume)
2. Build corporate accounts that send multiple employees per year
3. Create referral loops (attendees refer colleagues)
4. Grow alumni community that stays engaged through quarterly updates

### Key Metrics to Track
- Quarterly Update signups from cold outreach (lead indicator)
- Conversion from Quarterly Update → paid program (key funnel metric)
- Team member registrations from engaged executives
- Colleague referrals generated
- Cost per registration by channel
- Corporate training conversations initiated

## WHAT I NEED YOU TO BUILD

Create a comprehensive Sales Playbook document that covers:

### 1. Executive Summary
One-page overview of the entire strategy that I could hand to a new hire or business partner.

### 2. Target Tier Profiles (Deep)
For each tier (Directors, Executives, Managers):
- Detailed persona with pain points, motivations, day-to-day reality
- What they care about (different for each tier)
- What they DON'T care about
- Messaging framework (subject lines, hooks, value props)
- Objection handling specific to each tier
- The exact offer progression with timing
- When to escalate from automation to personal outreach
- When to call
- When to give up

### 3. Outreach Sequences by Tier
For each tier, map out the complete multi-channel sequence:
- SmartLead email sequence (subject lines, email bodies, timing)
- HeyReach LinkedIn sequence (connection note, DMs, timing)
- When the GHL handoff happens
- GHL personal email sequence (what comes from iaml.com)
- Phone call triggers and scripts
- Total timeline from first touch to "exhausted"

### 4. The Pipeline & Stage Definitions
Define every stage a contact moves through:
- How they enter
- What qualifies them to move forward
- What signals mean "hot" vs "warm" vs "cold"
- When to move from marketing automation to personal outreach
- When to involve phone
- When to close the loop (give up or archive)

### 5. Offer Strategy
- Which offers go to which tiers at which stage
- How to position the free quarterly update (it's not charity, it's a strategic entry point)
- How to position the free block (it's not desperation, it's a trial)
- How to transition from free to paid
- How to ask for referrals without being pushy

### 6. Phone Playbook
- When to call (triggers)
- Who to call (tiers)
- Call scripts for each scenario (first call, follow-up, voicemail)
- What to do with the information from the call
- How to log the call in the system

### 7. Objection Handling Guide
Common objections by tier with responses:
- "It's too expensive"
- "I can't be away for 4.5 days"
- "My team doesn't need this"
- "We use our law firm for CLEs"
- "We already went to SHRM"
- "I need to get approval"
- "Not right now"
- "Just send me information"

### 8. Referral & Expansion Playbook
- How to ask for referrals post-program
- How to expand from one attendee to their whole team
- How to start the corporate training conversation
- The colleague referral campaign (invitationtohrtraining.com)

### 9. Metrics & Reporting
- What to track weekly
- What to track monthly
- What to track quarterly
- Dashboard requirements
- How to know if the playbook is working

### 10. Operational Cadence
- Daily activities (for the person executing this)
- Weekly review rhythm
- Monthly optimization cycle
- Quarterly strategy review

## STYLE & FORMAT REQUIREMENTS

- Write this as a real operational document, not a strategy deck
- Include actual email copy, actual call scripts, actual templates
- Be specific with timing (Day 1, Day 3, etc.), not vague ("follow up in a few days")
- Include decision trees where appropriate (if X, then Y)
- Write in IAML's voice: confident, supportive, practical, direct, trustworthy
- Avoid em dashes. Use periods and commas.
- Every section should be actionable. If someone reads it, they should know exactly what to do.

## HOW TO WORK WITH ME

Start by confirming you understand the three tiers and the platform flow. Then build the playbook section by section. After each section, ask me if I want to adjust anything before moving on. Don't try to write the entire thing at once. Go section by section so we can refine as we go.

Start now.
