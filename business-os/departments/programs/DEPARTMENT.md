# Programs & Operations Department

> **CEO Summary:** Programs is the CORE department—everything else exists to fill seats in these programs. They manage the logistics of delivering ~40 seminar programs: faculty assignments, venue coordination, materials, certifications (SHRM/CLE), and participant communications. The key question they answer: "Is each upcoming program ready to deliver successfully?"

## Director Role

**Programs Director** oversees all program delivery operations, coordinating the complex logistics required to deliver ~40 seminar programs with ~70 scheduled instances at any given time. The Director maintains real-time awareness of program readiness, enrollment status, faculty assignments, venue logistics, and materials tracking. They answer "Is each upcoming program ready to deliver successfully?", "Are we on track for the next 90 days?", and "What needs attention right now?" at any time. This is the CORE department of IAML—everything else exists to fill seats in these programs.

## Domain Scope

**Owns:**
- Program scheduling and calendar management
- Program instance readiness tracking (10-point checklist)
- Faculty assignment and confirmation
- Faculty communication and logistics coordination
- Venue selection, contracting, and coordination
- Room block management and attrition monitoring
- Materials ordering, tracking, and shipping
- AV equipment ordering (Amazon)
- Catering coordination
- SHRM/CLE/HRCI certification submissions and tracking
- Registration processing and confirmation
- Participant communications (pre, during, post-program)
- Check-in and attendance tracking
- Post-program certificate issuance
- Program catalog management
- Website listing coordination (content readiness)

**Does Not Own:**
- Marketing campaigns to drive enrollment (→ Marketing)
- Lead sourcing and prospecting (→ Lead Intelligence)
- Website development and deployment (→ Digital)
- Sales conversations and closing (→ Sales)
- Payment processing business logic (→ Finance)
- Content creation for marketing assets (→ Content/Marketing)
- Faculty recruitment and onboarding (→ HR/Executive)
- Venue contract negotiations beyond standard terms (→ Finance/Legal)

---

## Employees (Claude Code)

Interactive roles you can invoke via commands.

| Employee | Role | Commands |
|----------|------|----------|
| Program Coordinator | Manage program readiness and logistics | `/readiness-check`, `/program-status`, `/faculty-brief` |
| Certification Specialist | Handle SHRM/CLE/HRCI submissions | `/submit-shrm`, `/cle-status`, `/cert-renewal` |
| Participant Services | Handle registration and attendee support | `/registration-report`, `/attendee-comms`, `/certificate-batch` |

---

## Workers (Automated)

Background monitors and agents that run via n8n or scheduled tasks.

### Program Planning Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Readiness Monitor | Monitor | Track all programs' readiness scores vs. 10-point checklist | Continuous |
| Schedule Optimizer | Hybrid | Flag scheduling conflicts (holidays, SHRM conferences) | On schedule change |
| Registration Page Monitor | Monitor | Verify website listings are live and accurate | Daily |
| Enrollment Alert | Monitor | Flag programs with low enrollment vs. minimums | Daily |

### Faculty Management Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Faculty Availability Tracker | Monitor | Track faculty confirmations and gaps | Daily |
| Faculty Reminder Agent | Agent | Send logistics emails X days before program | Scheduled |
| Faculty Performance Monitor | Monitor | Track post-program ratings and feedback | Post-program |
| Faculty Gap Alert | Monitor | Alert on unconfirmed faculty within thresholds | Daily |

### Venue & Logistics Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Room Block Monitor | Monitor | Track pickup rates, alert on attrition risk | Daily |
| Venue Contract Tracker | Monitor | Track contract status, deposits, deadlines | Weekly |
| AV Order Tracker | Monitor | Track Amazon orders, delivery status | On order |
| Catering Coordinator | Hybrid | Confirm catering counts X days before program | Scheduled |

### Materials Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Materials Update Tracker | Monitor | Track faculty materials submissions | Weekly |
| Print Order Tracker | Monitor | Track print jobs, delivery timelines | Daily |
| Shipping Monitor | Monitor | Verify materials received at venue/coordinator | Daily |
| Inventory Manager | Monitor | Track materials inventory levels | Weekly |

### Certifications Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| SHRM Approval Tracker | Monitor | Track SHRM submissions, approvals, expirations | Daily |
| CLE Approval Monitor | Monitor | Track state-by-state CLE approvals | Weekly |
| HRCI Credit Manager | Monitor | Track HRCI certification status | Weekly |
| Certificate Issuer | Agent | Issue certificates to confirmed attendees | Post-program |
| Renewal Alert Agent | Agent | Alert on certifications approaching expiration | Daily |

### Participant Operations Sub-Department

| Worker | Type | Responsibility | Frequency |
|--------|------|----------------|-----------|
| Registration Processor | Agent | Process incoming registrations, send confirmations | Real-time |
| Attendee Communicator | Agent | Send pre-program logistics, reminders | Scheduled |
| Attendance Tracker | Monitor | Track check-ins, flag no-shows | During program |
| Post-Program Agent | Agent | Trigger follow-up surveys, certificate delivery | Post-program |

---

## Key Integrations

| Tool | Purpose | Data Flow |
|------|---------|-----------|
| Supabase | Central database (programs, instances, faculty, venues, registrations) | Read/Write |
| Website (Vercel) | Program listings, registration pages | Write (push data) |
| Stripe | Payment processing webhooks | In (receive) |
| GoHighLevel | Contact management, email sequences | Read/Write |
| Airtable | Legacy data (programs, sessions, faculty) during migration | Read |
| Google Sheets | Hotel tracking reports (room blocks) | Read |
| Amazon | AV equipment order tracking | Manual/Email |
| SHRM Portal | Certification submissions | Manual/Tracked |
| Print Vendor API | Materials ordering and tracking | Out/In |

---

## Decision Authority

### Autonomous (No Approval Needed)
- Routine status monitoring and reporting
- Sending automated faculty reminder emails
- Updating readiness checklist items based on confirmed data
- Tracking room block pickups
- Certificate issuance for confirmed attendees
- Sending standard participant communications
- Logging and tracking materials shipments
- Processing registrations received via website
- Running enrollment and readiness reports

### Recommend + Approve
- Program cancellation or postponement
- Venue changes after contract signed
- Faculty substitutions
- Budget exceptions (materials rush, venue upgrades)
- New program additions to schedule
- Significant schedule changes (dates, locations)
- Registration page content changes
- Catering count changes beyond threshold (±20%)
- Room block releases or reductions

### Escalate Immediately
- Faculty cancellation within 2 weeks of program
- Venue cancellation or major issue (flood, closure)
- Enrollment below 25% of minimum with <30 days to go
- Materials not received within 1 week of program
- SHRM approval rejected or expired for upcoming program
- Payment processing issues affecting registrations
- No-show rate >30% on day of program
- Safety or emergency situation at venue

---

## Dashboard View (CEO)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ PROGRAMS & OPERATIONS                                    Health: 87 (▲ +3)      │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│ UPCOMING PROGRAMS (Next 90 Days)                                                │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ Program                      │ Date      │ Location  │ Enrolled │ Ready │ ⚠ │ │
│ ├─────────────────────────────────────────────────────────────────────────────┤ │
│ │ Cert in Employee Relations   │ Jan 27-31 │ San Diego │ 18/20    │ 90%   │   │ │
│ │ FMLA/ADA Compliance          │ Feb 3-4   │ Chicago   │ 12/15    │ 85%   │   │ │
│ │ Strategic HR Leadership      │ Feb 10-14 │ Phoenix   │ 8/20     │ 75%   │ ⚠ │ │
│ │ Benefits Law Boot Camp       │ Feb 17-18 │ Virtual   │ 22/25    │ 95%   │   │ │
│ │ Labor Relations Summit       │ Feb 24-28 │ Orlando   │ 6/18     │ 60%   │ ⚠ │ │
│ │ ... 65 more programs                                                        │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ READINESS BREAKDOWN                                                             │
│ ┌─────────────────────────────────────────────────────────────────────────────┐ │
│ │ ✓ Faculty Confirmed      68/70  97%  ████████████████████░                  │ │
│ │ ✓ Venue Confirmed        70/70 100%  █████████████████████                  │ │
│ │ ⚠ Materials Ordered      62/70  89%  ██████████████████░░░                  │ │
│ │ ✓ Materials Received     58/70  83%  █████████████████░░░░                  │ │
│ │ ✓ SHRM Approved          67/70  96%  ████████████████████░                  │ │
│ │ ⚠ AV Ordered             55/70  79%  ████████████████░░░░░                  │ │
│ │ ✓ Catering Confirmed     64/70  91%  ███████████████████░░                  │ │
│ │ ✓ Room Block Active      45/52  87%  ██████████████████░░░                  │ │
│ │ ✓ Reg Page Live          70/70 100%  █████████████████████                  │ │
│ │ ⚠ Faculty Brief Sent     52/70  74%  ███████████████░░░░░░                  │ │
│ └─────────────────────────────────────────────────────────────────────────────┘ │
│                                                                                  │
│ AT-RISK PROGRAMS                                     FACULTY GAPS               │
│ ┌────────────────────────────────────┐   ┌────────────────────────────────────┐ │
│ │ ⚠ Labor Relations Summit          │   │ Strategic HR (Feb 10) - Day 3     │ │
│ │   33% enrolled, 45 days out       │   │ Benefits Law (Feb 17) - Day 2     │ │
│ │   ACTION: Escalate to Marketing   │   │                                    │ │
│ │                                    │   │ CONFIRM BY: Jan 20                │ │
│ │ ⚠ Strategic HR Leadership         │   └────────────────────────────────────┘ │
│ │   40% enrolled, 32 days out       │                                          │
│ │   Materials not yet ordered       │   ROOM BLOCK ALERTS                      │
│ │                                    │   ┌────────────────────────────────────┐ │
│ │ ⚠ Advanced ERISA (Mar 3)          │   │ San Diego Marriott (Jan 27)       │ │
│ │   SHRM approval pending           │   │   Pickup: 12/25 (48%)             │ │
│ │   Deadline: Jan 15                │   │   Attrition date: Jan 17          │ │
│ └────────────────────────────────────┘   │   ACTION: Release 5 rooms?        │ │
│                                          │                                    │ │
│ UPCOMING DEADLINES                       │ Phoenix Hilton (Feb 10)           │ │
│ ┌────────────────────────────────────┐   │   Pickup: 8/20 (40%)              │ │
│ │ Jan 10 - Materials to printer (3) │   │   Attrition date: Jan 27          │ │
│ │ Jan 13 - Faculty briefs due (5)   │   └────────────────────────────────────┘ │
│ │ Jan 15 - SHRM submission (2)      │                                          │
│ │ Jan 17 - Room block decision (1)  │   ENROLLMENT TRENDS (90-day)             │
│ │ Jan 20 - AV orders due (4)        │   ┌────────────────────────────────────┐ │
│ └────────────────────────────────────┘   │ Total Seats: 1,240                │ │
│                                          │ Enrolled: 782 (63%)               │ │
│ RECENT ACTIVITY                          │ Target: 80% at T-30               │ │
│ ┌────────────────────────────────────┐   │ Trend: ▲ +45 this week            │ │
│ │ 10m ago - Registration: J.Smith   │   └────────────────────────────────────┘ │
│ │ 1h ago  - Materials shipped (2)   │                                          │
│ │ 2h ago  - Faculty confirmed (1)   │                                          │
│ │ 4h ago  - SHRM approved (1)       │                                          │
│ └────────────────────────────────────┘                                          │
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Health Score Components

| Component | Weight | Measurement |
|-----------|--------|-------------|
| Programs Ready (≥80% readiness) | 0.30 | % of upcoming programs with readiness score ≥80% |
| Enrollment vs. Target | 0.25 | Avg enrollment % across programs weighted by days-out |
| Faculty Confirmed (90-day) | 0.15 | % of program instances with confirmed faculty |
| Materials On Track | 0.10 | % of programs with materials ordered/received on schedule |
| Certifications Current | 0.10 | % of programs with valid SHRM/CLE approvals |
| No Critical Blockers | 0.10 | Binary: 100 if no critical alerts, 0 if any |

**Total: 1.0**

### Threshold Levels

| Level | Score | Meaning |
|-------|-------|---------|
| Healthy | ≥80 | All systems operating normally, on track |
| Warning | 60-79 | Issues need attention but not critical |
| Critical | <60 | Significant problems requiring immediate action |

---

## Program Readiness Checklist (10 Points)

Each program instance is scored against this checklist. Each item = 10 points when complete.

| # | Item | Target Timing | Owner |
|---|------|---------------|-------|
| 1 | Faculty Confirmed | T-60 days | Faculty Management |
| 2 | Faculty Communication Sent | T-14 days | Faculty Management |
| 3 | Venue Confirmed (contract signed) | T-90 days | Venue & Logistics |
| 4 | Materials Ordered (sent to printer) | T-21 days | Materials |
| 5 | Materials Received (at venue/coordinator) | T-7 days | Materials |
| 6 | SHRM Approval Obtained | T-30 days | Certifications |
| 7 | AV Equipment Ordered | T-14 days | Venue & Logistics |
| 8 | Catering Confirmed | T-7 days | Venue & Logistics |
| 9 | Room Block Active/Monitored | T-45 days | Venue & Logistics |
| 10 | Registration Page Live | T-60 days | Program Planning |

**Readiness Score Formula:**
```
readiness_score = (completed_items / 10) * 100
```

---

## Key Metrics

### Program-Level Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Readiness Score | % of checklist complete | ≥80% at T-14 |
| Enrollment % | Current enrolled / Minimum capacity | ≥100% at T-7 |
| Days Until Start | Calendar days to program date | N/A |
| Room Block Pickup % | Rooms booked / Block size | ≥80% at attrition |

### Department-Level Metrics

| Metric | Description | Target |
|--------|-------------|--------|
| Programs Ready | % with readiness ≥80% | ≥90% |
| Faculty Fill Rate | % of slots with confirmed faculty | ≥95% |
| On-Time Materials | % delivered on schedule | ≥95% |
| Certification Compliance | % with valid approvals | 100% |
| Enrollment Rate | Total enrolled / Total capacity | ≥75% |
| NPS (Post-Program) | Net Promoter Score from attendees | ≥50 |

---

## Timeline and Thresholds

### Standard Program Timeline

| Days Out | Milestone | Alert If Not Complete |
|----------|-----------|----------------------|
| T-90 | Venue contract signed | Warning |
| T-60 | Faculty confirmed, Reg page live | Warning |
| T-45 | Room block set up | Warning |
| T-30 | SHRM approval obtained | Critical |
| T-21 | Materials to printer | Warning |
| T-14 | Faculty brief sent, AV ordered | Warning |
| T-7 | Materials received, Catering confirmed | Critical |
| T-0 | Program delivery | - |
| T+3 | Certificates issued, Survey sent | - |

### Enrollment Thresholds

| Days Out | Minimum Enrollment | Alert Level |
|----------|-------------------|-------------|
| T-60 | 25% of capacity | Info |
| T-45 | 40% of capacity | Warning |
| T-30 | 60% of capacity | Warning |
| T-14 | 80% of capacity | Critical |
| T-7 | 100% of minimum | Decision point |

### Room Block Thresholds

| Metric | Warning | Critical |
|--------|---------|----------|
| Pickup at T-14 | <60% | <40% |
| Pickup at attrition | <75% | <60% |
| Days to attrition | <7 days | <3 days |

---

## Learning Objectives

What Programs & Operations should get better at over time:

1. **Enrollment Patterns** — Learn which programs fill early vs. late, optimal marketing timing
2. **Faculty Reliability** — Track which faculty confirm early and which need follow-up
3. **Venue Performance** — Identify best-performing venues by attendee satisfaction and logistics
4. **Materials Timing** — Optimize lead times based on printer performance and shipping
5. **Room Block Optimization** — Learn pickup patterns to right-size initial blocks
6. **Certification Timing** — Track SHRM review times to optimize submission schedules
7. **Cancellation Predictors** — Identify early warning signs for low-enrollment programs
8. **Participant Behavior** — Understand no-show patterns, optimal reminder timing

---

## Cross-Department Coordination

| Scenario | Coordinates With | How |
|----------|------------------|-----|
| Need leads for upcoming program | Lead Intelligence | Request capacity allocation via Marketing |
| Program ready for promotion | Marketing | Hand off program details, target dates |
| Low enrollment alert | Marketing | Request additional promotion, campaign push |
| Registration received | Marketing | Attribution tracking, source reporting |
| Website listing updates needed | Digital | Request content changes, verify deployment |
| Faculty bio updates | Digital | Push updated content to website |
| New program launch | All | Orchestrate cross-department checklist |
| Payment issues | Finance | Escalate, coordinate with Stripe |
| Contract negotiations | Finance/Legal | Escalate non-standard terms |

---

## Data Pipeline

### Registration Flow
```
Website Form → Stripe Payment → Webhook → Supabase → GHL Contact
     │              │              │           │           │
   Submit        Process       Confirm    Store Data   Update CRM
                                            │
                              ┌─────────────┴─────────────┐
                              │                           │
                         Enrollment                  Participant
                          Counter                    Communications
```

### Readiness Tracking Flow
```
Program Instance Created
        │
        ▼
┌───────────────────────────────────────────────────────────────┐
│                    READINESS CHECKLIST                        │
├───────────────────────────────────────────────────────────────┤
│  □ Faculty    □ Venue    □ Materials    □ SHRM    □ AV       │
│  □ Faculty    □ Room     □ Materials    □ Catering           │
│    Brief        Block      Received                           │
│  □ Reg Page                                                   │
├───────────────────────────────────────────────────────────────┤
│              Readiness Score: [  ]%                           │
└───────────────────────────────────────────────────────────────┘
        │
        ▼
  Dashboard Display ──→ Alerts if below threshold
```

---

## Knowledge Base References

The Programs & Operations Department draws on these knowledge resources:

- `business-os/knowledge/PROGRAMS_CATALOG.md` — Full program catalog, descriptions
- `business-os/knowledge/FACULTY_DIRECTORY.md` — Faculty profiles, specialties, availability
- `business-os/knowledge/VENUE_GUIDE.md` — Preferred venues, contacts, requirements
- `business-os/knowledge/MATERIALS_SPECS.md` — Print specifications, vendor contacts
- `business-os/knowledge/CERTIFICATION_REQUIREMENTS.md` — SHRM, CLE, HRCI submission guides
- `business-os/knowledge/PARTICIPANT_COMMUNICATIONS.md` — Email templates, timing playbooks
- `business-os/knowledge/ROOM_BLOCK_PLAYBOOK.md` — Attrition management, negotiation tips

---

## Program Types Reference

| Type | Typical Duration | Format Options | Certifications |
|------|------------------|----------------|----------------|
| Certificate Programs | 4-5 days | In-person, Virtual | SHRM, HRCI |
| Single-Day Seminars | 1 day | In-person, Virtual, Hybrid | SHRM, CLE |
| Multi-Day Workshops | 2-3 days | In-person, Virtual | SHRM, HRCI |
| Boot Camps | 2-3 days | Intensive In-person | SHRM |
| Summits | 4-5 days | In-person | SHRM, CLE, HRCI |

### Capacity Guidelines

| Program Type | Minimum | Target | Maximum |
|--------------|---------|--------|---------|
| Certificate | 15 | 25 | 35 |
| Single-Day | 12 | 20 | 30 |
| Workshop | 15 | 22 | 30 |
| Boot Camp | 18 | 28 | 40 |
| Summit | 20 | 35 | 50 |

---

## Venue Partners

| Chain | Typical Properties | Notes |
|-------|-------------------|-------|
| Marriott | JW, Renaissance, Sheraton | Preferred partner, M&C rates |
| Hilton | Conrad, DoubleTree, Embassy | Strong meeting space |
| Caesars | Flamingo, Harrah's, Paris | Vegas programs only |
| Hyatt | Regency, Grand | West coast preference |

### Key Venue Requirements

- Meeting room for 20-50 attendees (classroom style)
- Breakout space for small groups
- AV support or space for IAML equipment
- F&B capabilities (breaks, lunch options)
- Room block availability (min 15-20 rooms)
- Airport proximity (<30 min ideal)

---

## Emergency Protocols

### Faculty Cancellation (<2 weeks)
1. Immediately alert Programs Director
2. Check faculty bench for qualified replacement
3. If no replacement: escalate to CEO for decision
4. Options: postpone, virtual pivot, cancel with refunds

### Venue Issue (emergency)
1. Immediately alert Programs Director and CEO
2. Contact venue GM for resolution
3. Identify backup venues in market
4. Communicate with registered participants

### Low Enrollment Decision (at T-7)
1. Programs Director prepares recommendation
2. Options: proceed, postpone, cancel, merge with future
3. CEO decision required
4. If cancel: coordinate refunds with Finance

### Materials Not Received (at T-3)
1. Escalate to Programs Director
2. Contact printer/shipper for status
3. Emergency options: overnight ship, digital backup, local print
4. Update participants if format changes

---

## Status

- [x] Department specification complete
- [ ] Supabase schema created
- [ ] Worker workflows built
- [ ] Dashboard implemented
- [ ] Integration testing
- [ ] Production deployment
