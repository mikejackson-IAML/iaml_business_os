# Faculty Program Scheduler

## What This Is

A tiered instructor assignment system that automatically notifies qualified faculty about available teaching opportunities, respects priority relationships (VIP → Local → Open), and provides IAML with full visibility into the instructor recruitment pipeline.

## Core Value

Faculty members receive magic-link emails when programs become available to their tier, view a personalized list of claimable blocks, and instantly lock in teaching assignments — while IAML monitors the entire process from a Business OS dashboard.

## Current State

**Version:** v1.0 MVP (Shipped 2026-01-22)

**What shipped:**
- Supabase database with programs, instructors, claims, and tier logic
- Automated tier advancement (VIP 7d -> Local 5d -> Open)
- Magic link authentication (no passwords)
- Faculty sign-up portal (Next.js) at faculty-portal/
- Email notifications via SendGrid (release, confirmation, reminders, re-release)
- 5 n8n workflows for automation
- Business OS dashboard with full admin controls

**Key metrics:**
- 38 requirements shipped
- 5 phases, 17 plans
- ~2,900 lines of TypeScript/SQL

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

### Active (v1.1)

*Next milestone scope:*

- [ ] Instructor response tracking (viewed but not claimed)
- [ ] Historical teaching record display
- [ ] Dashboard alerts (unfilled programs, unresponsive VIPs)

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
