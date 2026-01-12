# Participant Operations Sub-Department

## Focus

Participant Operations owns the complete participant experience from registration through post-program follow-up. This sub-department processes registrations, manages attendee communications, handles check-in, tracks attendance, and coordinates certificate delivery and surveys.

## Key Responsibilities

- **Registration Processing** — Process incoming registrations, confirm payments
- **Attendee Communications** — Send confirmations, reminders, logistics
- **Check-In Management** — Track attendance on program days
- **Post-Program Follow-up** — Surveys, certificates, thank-you communications
- **Special Requests** — Dietary needs, accessibility, cancellations
- **Customer Service** — Handle participant inquiries and issues

## Key Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Registration Processing | <1 hour | Time from payment to confirmation |
| Pre-Program Comms Sent | 100% | Logistics emails to all registered |
| Attendance Tracking | 100% | All attendees checked in |
| Certificate Delivery | T+3 days | Certificates within 3 days of program |
| Survey Response Rate | >60% | Post-program survey completion |

## Participant Communication Timeline

| Days Before | Communication | Content |
|-------------|--------------|---------|
| T+0 (registration) | Confirmation | Registration details, receipt |
| T-14 | Logistics Email | Venue, schedule, what to bring |
| T-7 | Final Reminder | Last-minute details, room block |
| T-3 | Pre-Program | Agenda, emergency contacts |
| T-1 | Day Before | Final reminder, check-in info |
| T+1 (after program) | Thank You | Survey link, certificate info |
| T+3 | Certificate | Certificate delivery |

## Decision Authority

**Autonomous:**
- Processing standard registrations
- Sending scheduled communications
- Logging attendance
- Certificate generation and delivery
- Survey distribution

**Recommend + Approve:**
- Cancellation refunds
- Transfers between programs
- Special accommodations
- Group registration changes
- Unusual requests

## Workers

| Worker | Type | Purpose |
|--------|------|---------|
| Registration Processor | Agent | Process incoming registrations |
| Attendee Communicator | Agent | Send participant communications |
| Attendance Tracker | Monitor | Track check-ins during programs |
| Post-Program Agent | Agent | Handle surveys, certificates, follow-up |

## Registration Flow

```
Website Form → Stripe Payment → Webhook → Registration Processor
                                               │
                              ┌────────────────┼────────────────┐
                              │                │                │
                              ▼                ▼                ▼
                        Create Record    Send Confirm     Update Enrollment
                        in Supabase      Email (GHL)      Counter
                              │
                              └───────────────┬───────────────────┐
                                              │                   │
                                              ▼                   ▼
                                        Add to Comms         Sync to CRM
                                        Queue (Auto)         (GHL Contact)
```

## Integration Points

| System | Purpose |
|--------|---------|
| Supabase | Registration data, attendance |
| Stripe | Payment webhooks |
| GoHighLevel | Email communications, CRM |
| Website | Registration forms |
| Certificate Generator | PDF certificates |

## Cancellation Policy

| Timing | Refund | Process |
|--------|--------|---------|
| >30 days before | Full refund | Auto-process |
| 15-30 days | 50% refund or transfer | Approval needed |
| <15 days | Transfer only | Approval needed |
| No-show | No refund | Offer next session |

## Handoffs

| From | To | Trigger |
|------|----|---------|
| Stripe (webhook) | Participant Ops | Payment received |
| Participant Ops | Program Planning | Enrollment count update |
| Participant Ops | Venue & Logistics | Final attendee count |
| Certifications | Participant Ops | Certificate ready |
| Participant Ops | Marketing | Attribution data |
