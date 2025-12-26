# Business Process Map

> Documentation of all key business processes - how things work today.

---

## Purpose

This map documents:
1. How each key process currently works
2. Who/what is responsible for each step
3. Where there's friction or opportunity
4. Automation status of each step

---

## Process Categories

1. [Revenue Processes](#revenue-processes)
2. [Program Processes](#program-processes)
3. [Marketing Processes](#marketing-processes)
4. [Operations Processes](#operations-processes)

---

## Revenue Processes

### Lead-to-Close

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           LEAD TO CLOSE PROCESS                             │
└─────────────────────────────────────────────────────────────────────────────┘

1. LEAD CAPTURE                    2. QUALIFICATION
┌────────────────────┐             ┌────────────────────┐
│ Sources:           │             │ Criteria:          │
│ • Email outreach   │────────────▶│ • Budget authority │
│ • LinkedIn         │             │ • Need identified  │
│ • Website          │             │ • Timeline exists  │
│ • Referral         │             │ • Right audience   │
└────────────────────┘             └─────────┬──────────┘
                                             │
Owner: Marketing                   Owner: Sales
System: SmartLead/Heyreach        System: GoHighLevel
Auto: ✅ Capture                  Auto: ❌ Manual
                                             │
                                             ▼
3. DISCOVERY                       4. PROPOSAL
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Needs assessment │────────────▶│ • Custom proposal  │
│ • Scope discussion │             │ • Pricing          │
│ • Program fit      │             │ • Timeline         │
└────────────────────┘             └─────────┬──────────┘
                                             │
Owner: You                         Owner: You
System: Zoom/Phone                System: Google Docs
Auto: ❌ Manual                   Auto: ❌ Manual (opportunity: skill)
                                             │
                                             ▼
5. NEGOTIATION                     6. CLOSE
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Terms discussion │────────────▶│ • Contract signed  │
│ • Adjustments      │             │ • Invoice sent     │
│ • Stakeholder buy-in│            │ • Handoff to Prog  │
└────────────────────┘             └────────────────────┘

Owner: You                         Owner: You
System: Email/Phone               System: GoHighLevel/QuickBooks
Auto: ❌ Manual                   Auto: Partial
```

**Metrics:**
- Avg time lead → close: [X days]
- Conversion rate: [X%]
- Avg deal size: $[X]

**Pain Points in This Process:**
- [ ] Proposal creation takes too long
- [ ] No visibility into pipeline status
- [ ] Follow-up sometimes falls through cracks

**Improvement Opportunities:**
- [ ] Proposal generation skill
- [ ] Pipeline dashboard
- [ ] Automated follow-up sequences

---

## Program Processes

### Program Delivery

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          PROGRAM DELIVERY PROCESS                           │
└─────────────────────────────────────────────────────────────────────────────┘

1. SCHEDULING                      2. REGISTRATION
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Date selection   │────────────▶│ • Open registration│
│ • Venue/platform   │             │ • Collect info     │
│ • Instructor book  │             │ • Send confirmation│
└────────────────────┘             └─────────┬──────────┘
                                             │
Owner: You/Program Director        Owner: Automated
System: Calendar/Airtable         System: GoHighLevel
Auto: ❌ Manual                   Auto: ✅ Automated
                                             │
                                             ▼
3. PRE-PROGRAM                     4. DELIVERY
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Send materials   │────────────▶│ • Conduct training │
│ • Reminders        │             │ • Track attendance │
│ • Final prep       │             │ • Engage learners  │
└────────────────────┘             └─────────┬──────────┘
                                             │
Owner: Automated + You             Owner: You
System: GoHighLevel               System: Zoom/In-person
Auto: ✅ Mostly                   Auto: ❌ Manual
                                             │
                                             ▼
5. POST-PROGRAM                    6. FOLLOW-UP
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Send survey      │────────────▶│ • Share resources  │
│ • Issue certs      │             │ • Nurture to next  │
│ • Collect feedback │             │ • Request referral │
└────────────────────┘             └────────────────────┘

Owner: Automated                   Owner: Marketing
System: GoHighLevel               System: SmartLead
Auto: ✅ Automated                Auto: ✅ Sequences
```

**Metrics:**
- Programs delivered/month: [X]
- Avg attendance rate: [X%]
- Satisfaction score: [X/10]

**Pain Points in This Process:**
- [ ] Hard to see registration status at a glance
- [ ] Manual tracking of attendance
- [ ] Survey response rates could be higher

**Improvement Opportunities:**
- [ ] Registration dashboard
- [ ] Automated attendance tracking
- [ ] Incentivized survey system

---

## Marketing Processes

### Email Outreach Campaign

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EMAIL OUTREACH CAMPAIGN PROCESS                      │
└─────────────────────────────────────────────────────────────────────────────┘

1. TARGETING                       2. SEQUENCE CREATION
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Define ICP       │────────────▶│ • Write emails     │
│ • Build list       │             │ • Set timing       │
│ • Segment          │             │ • Personalization  │
└────────────────────┘             └─────────┬──────────┘
                                             │
Owner: Marketing                   Owner: Marketing
System: SmartLead                 System: SmartLead
Auto: ❌ Manual                   Auto: ❌ Manual (opportunity: skill)
                                             │
                                             ▼
3. LAUNCH                          4. MONITOR
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Activate campaign│────────────▶│ • Track opens      │
│ • Warmup domain    │             │ • Track replies    │
│ • Test deliverability│           │ • Adjust as needed │
└────────────────────┘             └─────────┬──────────┘
                                             │
Owner: SmartLead                   Owner: Marketing
System: SmartLead                 System: SmartLead
Auto: ✅ Automated                Auto: ✅ Data / ❌ Analysis
                                             │
                                             ▼
5. RESPOND                         6. CONVERT
┌────────────────────┐             ┌────────────────────┐
│ Activities:        │             │ Activities:        │
│ • Reply to interest│────────────▶│ • Book meeting     │
│ • Qualify          │             │ • Move to pipeline │
│ • Personalize      │             │ • Tag source       │
└────────────────────┘             └────────────────────┘

Owner: You                         Owner: You/Sales
System: Email                     System: GoHighLevel
Auto: ❌ Manual                   Auto: ❌ Manual
```

**Metrics:**
- Open rate: [X%]
- Reply rate: [X%]
- Meeting book rate: [X%]

**Pain Points in This Process:**
- [ ] Email writing takes time
- [ ] Hard to see overall campaign performance
- [ ] No easy way to compare campaigns

**Improvement Opportunities:**
- [ ] Email copy generation skill
- [ ] Campaign dashboard
- [ ] A/B testing system

---

## Process Inventory

| Process | Category | Automation Level | Priority |
|---------|----------|------------------|----------|
| Lead capture | Revenue | 🟢 High | - |
| Lead qualification | Revenue | 🔴 Low | 🟠 |
| Discovery calls | Revenue | 🔴 Low | - |
| Proposal creation | Revenue | 🔴 Low | 🔴 |
| Contract/close | Revenue | 🟡 Medium | 🟡 |
| Program scheduling | Programs | 🔴 Low | 🟡 |
| Registration | Programs | 🟢 High | - |
| Pre-program comms | Programs | 🟢 High | - |
| Program delivery | Programs | 🔴 Low | - |
| Post-program follow-up | Programs | 🟢 High | - |
| Email campaign setup | Marketing | 🟡 Medium | 🟠 |
| LinkedIn outreach | Marketing | 🟢 High | - |
| Content creation | Marketing | 🔴 Low | 🔴 |
| Daily operations | Operations | 🔴 Low | 🔴 |
| Invoicing | Operations | 🟡 Medium | 🟡 |

---

## Update Log

| Date | Process | Change | Reason |
|------|---------|--------|--------|
| - | - | - | - |
