# Faculty Program Scheduler

## What This Is

A tiered instructor assignment system that automatically notifies qualified faculty about available teaching opportunities, respects priority relationships (VIP → Local → Open), and provides IAML with full visibility into the instructor recruitment pipeline.

## Core Value

Faculty members receive magic-link emails when programs become available to their tier, view a personalized list of claimable blocks, and instantly lock in teaching assignments — while IAML monitors the entire process from a Business OS dashboard.

## Current Milestone: v1.0 MVP

**Goal:** Build the complete Faculty Program Scheduler from foundation to dashboard integration.

**Target features:**
- Supabase database with programs, instructors, claims, and tier logic
- Automated tier advancement (VIP 7d → Local 5d → Open)
- Magic link authentication (no passwords)
- Faculty-facing sign-up page at faculty.iaml.com
- Email notifications via SendGrid (release, confirmation, reminders)
- n8n workflows for automation
- Business OS dashboard widget for admin management

**Key constraints:**
- Must integrate with existing Supabase infrastructure
- Automations via n8n
- Faculty data migrated from Airtable
- Frontend hosted at faculty.iaml.com subdomain

---

## Requirements

### Validated

*Decisions locked in:*

- Frontend: Next.js 14+ App Router + shadcn/ui (Radix + CVA + Tailwind)
- Backend: Supabase PostgreSQL
- Automations: n8n
- Email: SendGrid (transactional)
- Hosting: Vercel (frontend), Supabase (backend)
- Authentication: Magic links (no passwords)
- Tier structure: VIP (7d) → Local (5d) → Open
- Local definition: Same state as program location
- Claim model: Instant, first-come-first-served
- View format: List only (no calendar)

### Active

*Current scope (v1.0 MVP):*

- [ ] Database schema: programs, program_blocks, instructors, claims, notifications, magic_tokens
- [ ] Data migration from Airtable to Supabase
- [ ] Tier engine with automatic advancement
- [ ] Email notification system (tier release, confirmation, reminders)
- [ ] Magic link generation and validation
- [ ] Faculty sign-up page (Next.js)
- [ ] Admin release controls
- [ ] Business OS dashboard widget

### Deferred (v2+)

- Instructor response tracking (viewed but not claimed)
- Historical teaching record display
- Instructor preference capture
- Waitlist functionality
- Travel distance calculation (replace state-based)
- Dashboard alerts (unfilled programs, unresponsive VIPs)

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
