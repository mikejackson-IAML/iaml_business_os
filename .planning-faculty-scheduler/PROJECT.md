# Faculty Program Scheduler

## What This Is

A tiered instructor assignment system that automatically notifies qualified faculty about available teaching opportunities, respects priority relationships (VIP → Local → Open), and provides IAML with full visibility into the instructor recruitment pipeline.

## Core Value

Faculty members receive magic-link emails when programs become available to their tier, view a personalized list of claimable blocks, and instantly lock in teaching assignments — while IAML monitors the entire process from a Business OS dashboard.

## Current Milestone: v1.1 Analytics & Insights — SHIPPED

**Shipped:** 2026-01-22

**Delivered:**
- Response tracking (magic link click timestamps)
- Instructor teaching history in dashboard
- Configurable alerts for tier deadlines and VIP non-response

---

## Current State

**Version:** v1.1 Analytics & Insights (Shipped 2026-01-22)

**What shipped in v1.1:**
- Response tracking (viewed_at timestamps on notifications)
- Instructor teaching history table and dashboard UI
- Dashboard alerts for tier deadlines and VIP non-response
- Configurable alert thresholds via preferences

**Cumulative (v1.0 + v1.1):**
- 48 requirements shipped (38 + 10)
- 8 phases, 27 plans
- ~4,050 lines of TypeScript/SQL

---

## Requirements

### Validated (v1.0)

*Shipped and confirmed:*

- Database schema: programs, program_blocks, instructors, claims, notifications, magic_tokens - v1.0
- Data migration from Airtable to Supabase - v1.0
- Tier engine with automatic advancement - v1.0
- Email notification system (tier release, confirmation, reminders) - v1.0
- Magic link generation and validation - v1.0
- Faculty sign-up page (Next.js) - v1.0
- Admin release controls - v1.0
- Business OS dashboard widget - v1.0

### Validated (v1.1)

*Shipped 2026-01-22:*

- [x] RT-01: System records when instructor clicks magic link (portal entry)
- [x] RT-02: Notification record updated with viewed_at timestamp
- [x] RT-03: Dashboard shows "Viewed" vs "Not Viewed" status per instructor
- [x] IH-01: Database stores historical teaching records
- [x] IH-02: Dashboard displays instructor's past programs
- [x] IH-03: Instructor history shows in assign modal
- [x] DA-01: Alert when program approaching tier end with no claims
- [x] DA-02: Alert when VIP instructor hasn't viewed after N days
- [x] DA-03: Alerts displayed as badge/banner in dashboard
- [x] DA-04: Alerts list with dismiss/acknowledge action

### Deferred (v2+)

- Instructor preference capture
- Waitlist functionality
- Travel distance calculation (replace state-based)

---

## Tech Stack

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | Next.js 14+ (App Router) | faculty.iaml.com |
| UI Components | shadcn/ui (Radix + CVA + Tailwind) | Modern, accessible |
| Backend/DB | Supabase (PostgreSQL) | Existing infrastructure |
| Automations | n8n | Existing platform |
| Email | SendGrid | Transactional emails |
| Hosting | Vercel + Supabase | Frontend + Backend |

---

## Users

### Faculty/Instructors
- Existing IAML faculty stored in database
- Receive email notifications when programs become available
- Access personalized sign-up page via magic link
- Claim one or more program blocks
- Receive confirmation with materials

### IAML Admin (Mike)
- Enters programs into database
- Manually releases programs to Tier 0
- Monitors recruitment pipeline via Business OS dashboard
- Can manually assign instructors or skip tiers
- Can override/remove claims
- Sends reminder nudges

---

## Success Metrics

- Time from program release to instructor confirmed
- % of programs filled before going to Tier 2 (Open)
- Instructor response rate per tier
- Reduction in manual email coordination

---

## Non-Goals (v1)

- Instructor self-registration (all faculty pre-exist in database)
- Payment/compensation tracking
- Calendar integration (Google Calendar, Outlook)
- Instructor ratings or performance tracking
- Automated program creation (programs entered manually)
- Password-based authentication
- Mobile app (responsive web sufficient)
