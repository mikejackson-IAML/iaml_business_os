# Requirements

## Table Stakes (Must Have)

### Data Model

| ID | Requirement | Phase |
|----|-------------|-------|
| D1 | Programs table with: id, name, description, location_city, location_state, venue, is_certificate_program, parent_program_id (for blocks), status, release_date, tier_0_ends, tier_1_ends | 1 |
| D2 | Program Blocks table with: id, program_id, block_name, dates (start/end), sequence_order, instructor_id (nullable), claimed_at | 1 |
| D3 | Instructors table with: id, first_name, last_name, email, state, tier_designation (0=VIP, null=normal), qualified_programs (array or junction), active | 1 |
| D4 | Claims table with: id, instructor_id, block_id, claimed_at, status (confirmed/cancelled), cancelled_at, cancelled_reason | 1 |
| D5 | Notifications table with: id, instructor_id, program_id, tier, sent_at, type (release/reminder/confirmation/cancellation) | 2 |
| D6 | Magic tokens table with: id, instructor_id, token, created_at, expires_at, used_at | 2 |

### Tier System

| ID | Requirement | Phase |
|----|-------------|-------|
| T1 | Tier 0 (VIP): ~3 designated instructors see ALL programs first for 7 days | 1 |
| T2 | Tier 1 (Local): Instructors in same state as program location, 5 days | 1 |
| T3 | Tier 2 (Open): All qualified instructors until filled | 1 |
| T4 | Automatic tier advancement when window expires (no manual intervention) | 2 |
| T5 | Programs show only to instructors qualified to teach that program type | 1 |
| T6 | VIP instructors remain Tier 0 even if also local (no double-tier) | 1 |

### Instructor Sign-up Page

| ID | Requirement | Phase |
|----|-------------|-------|
| S1 | Personalized greeting: "Welcome back, [First Name]" | 3 |
| S2 | List view of available programs (no calendar view) | 3 |
| S3 | Filter by: program type, date range, location/state | 3 |
| S4 | Grouped display: parent program as header, blocks as checkable items below | 3 |
| S5 | Each block shows: block name, dates | 3 |
| S6 | Checkbox selection: can select parent (all blocks) or individual blocks | 3 |
| S7 | Multi-select across different programs before confirming | 3 |
| S8 | "Claim Selected (N)" button → confirmation screen | 3 |
| S9 | Only show programs/blocks available to this instructor's current tier | 3 |
| S10 | Instant claim confirmation (first-come-first-served, no approval) | 3 |

### Notifications/Emails

| ID | Requirement | Phase |
|----|-------------|-------|
| N1 | Tier release email: sent when programs become available to instructor's tier | 2 |
| N2 | Magic link in all emails: auto-identifies instructor, no login required | 2 |
| N3 | Reminder email: sent partway through tier window (e.g., 3 days left) | 4 |
| N4 | Confirmation email: program details, dates, location, materials attached, request for material updates | 2 |
| N5 | Cancellation re-release email: immediate notification to all qualified when spot opens | 4 |
| N6 | Emails link to calendar view showing ALL available programs, not one per email | 2 |

### Business OS Dashboard

| ID | Requirement | Phase |
|----|-------------|-------|
| B1 | Summary widget in Program Coordination section | 5 |
| B2 | Status per program: Awaiting Tier 0 → Awaiting Tier 1 → Open → Claimed → Confirmed | 5 |
| B3 | Columns: Program name, date, location, current tier, days left in tier, # notified, # responded, instructor assigned, last activity | 5 |
| B4 | Action: Manually assign instructor | 5 |
| B5 | Action: Skip tier early (accelerate to open) | 5 |
| B6 | Action: Send reminder nudge | 5 |
| B7 | View: Who's been notified but hasn't responded | 5 |
| B8 | Action: Override/remove existing claim | 5 |

### Program Management

| ID | Requirement | Phase |
|----|-------------|-------|
| P1 | Programs entered in Supabase (migrated from Airtable) | 1 |
| P2 | Manual "release" switch per program (flip to start Tier 0) | 4 |
| P3 | "Activate all" bulk release option | 4 |
| P4 | Once released, system runs automatically through tiers | 2 |
| P5 | Unfilled programs remain "Open" indefinitely until claimed | 2 |

### Migration

| ID | Requirement | Phase |
|----|-------------|-------|
| M1 | Migrate instructor data from Airtable to Supabase | 1 |
| M2 | Migrate program data from Airtable to Supabase | 1 |
| M3 | Map existing data fields to new schema | 1 |
| M4 | Validate data integrity post-migration | 1 |

## Differentiators (Nice to Have - v2)

| ID | Requirement | Notes |
|----|-------------|-------|
| V2-1 | Instructor response tracking (viewed but not claimed) | For dashboard insights |
| V2-2 | Historical teaching record display on sign-up page | "You've taught 12 programs since 2019" |
| V2-3 | Instructor preference capture | "I prefer morning sessions" |
| V2-4 | Waitlist for popular programs | If claimed, others can express interest |
| V2-5 | Travel distance calculation | More precise than state-based matching |
| V2-6 | Alerts: "Program 14 days out and unfilled" | Proactive warnings |
| V2-7 | Alerts: "VIP hasn't responded to 3 programs" | Relationship management |

## Anti-Features (Deliberately NOT Building)

| Item | Reason |
|------|--------|
| Instructor self-registration | All faculty pre-approved, no public signup |
| Password-based auth | Magic links are simpler, more secure |
| Calendar view | List view sufficient, less complexity |
| Approval workflow for claims | First-come-first-served is cleaner |
| Payment processing | Handled separately |
| Program content editing | Materials managed outside this system |
| Mobile app | Responsive web sufficient |

## Business Rules

### Tier Eligibility

```
For each program:
  Tier 0: instructor.tier_designation = 0 (VIP)
  Tier 1: instructor.state = program.location_state AND instructor.tier_designation != 0
  Tier 2: instructor is qualified for program type AND not already claimed this block
```

### Tier Timing

```
Program released → Tier 0 active for 7 days
After 7 days → Tier 1 active for 5 days
After 5 more days → Tier 2 (Open) indefinitely
```

### Claiming Rules

```
- One instructor per block (exclusive)
- Multiple instructors can teach different blocks of same program
- Instructor can claim multiple blocks across multiple programs in one session
- Claim is instant (no approval)
- No minimum lead time (can claim 5 days before program)
```

### Cancellation Rules

```
- Admin can override/remove any claim
- Cancelled blocks return to pool at current tier
- Immediate notification to all qualified instructors in current tier
```

### Notification Rules

```
- Magic link token expires after 30 days (or never, TBD)
- Link identifies instructor, loads personalized view
- One email per tier transition (not per program)
- Reminder sent at ~50% through tier window
```

## Open Questions

| Question | Status | Resolution |
|----------|--------|------------|
| Magic link expiration period? | Open | 30 days recommended |
| Reminder timing (50% through window vs. fixed days)? | Open | Suggest 50% |
| Store materials in system or link to external? | Open | Link/attach in confirmation email |
| What qualifies instructor for program type? | Open | Junction table or array field |
