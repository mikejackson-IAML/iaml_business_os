# Faculty Management Sub-Department

## Focus

Faculty Management owns all aspects of instructor coordination, from assignment confirmation through post-program performance tracking. IAML's faculty are external contractors (150+ attorneys and HR experts), requiring proactive communication and relationship management.

## Key Responsibilities

- **Faculty Assignment** — Match faculty to programs based on expertise and availability
- **Confirmation Tracking** — Ensure all faculty are confirmed within required timelines
- **Logistics Communication** — Send faculty briefs with venue, schedule, materials info
- **Availability Management** — Track faculty calendars and prevent double-booking
- **Performance Tracking** — Collect and analyze post-program faculty ratings
- **Gap Identification** — Alert when programs lack confirmed faculty

## Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Faculty Fill Rate | ≥95% | % of program slots with confirmed faculty |
| Confirmation at T-60 | 100% | All faculty confirmed 60 days out |
| Brief Sent by T-14 | 100% | Faculty communications sent on time |
| Avg Faculty Rating | ≥4.5/5 | Post-program participant feedback |

## Decision Authority

**Autonomous:**
- Sending scheduled faculty reminders
- Tracking confirmation status
- Flagging gaps and at-risk assignments
- Recording faculty performance data

**Recommend + Approve:**
- Faculty substitutions
- New faculty assignments
- Schedule conflicts resolution
- Faculty performance discussions

## Workers

| Worker | Type | Purpose |
|--------|------|---------|
| Faculty Availability Tracker | Monitor | Track confirmations and identify gaps |
| Faculty Reminder Agent | Agent | Send logistics emails before programs |
| Faculty Performance Monitor | Monitor | Track ratings and feedback |
| Faculty Gap Alert | Monitor | Alert on unconfirmed faculty |

## Faculty Communication Timeline

| Days Before | Communication | Content |
|-------------|--------------|---------|
| T-60 | Initial Assignment | Program details, confirmation request |
| T-30 | Confirmation Follow-up | If not yet confirmed |
| T-14 | Faculty Brief | Full logistics packet |
| T-7 | Final Reminder | Last-minute details, contact info |
| T-1 | Day-Before | Final confirmation, emergency contacts |

## Integration Points

| System | Purpose |
|--------|---------|
| Supabase | Faculty profiles, assignments, ratings |
| GoHighLevel | Email communications |
| Airtable | Legacy faculty data |
| Google Calendar | Faculty availability sync |

## Handoffs

| From | To | Trigger |
|------|----|---------|
| Program Planning | Faculty Management | Program scheduled, needs faculty |
| Faculty Management | Venue & Logistics | Faculty travel arrangements needed |
| Faculty Management | Materials | Faculty materials updates due |
| Faculty Management | Program Planning | Faculty gap unresolved at T-30 |
