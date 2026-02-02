# Programs

> **CEO Summary:** A complete program management system that tracks logistics, registrations, payments, attendance, and evaluations for all IAML certificate programs across 9 cities and virtual delivery — giving you instant visibility into what's ready, what needs attention, and who's signed up.

## What This Is

A centralized dashboard for managing professional development programs end-to-end: from instructor booking and hotel logistics through registration tracking, payment collection, attendance recording, and post-program evaluations. Includes AI-powered natural language reporting.

## Core Value

Complete visibility into program logistics, registrations, payments, attendance, and evaluations — all in one place.

## Current State

**Version:** v1.0 (SHIPPED 2026-02-02)
**Status:** Production Ready

### Shipped Features (v1.0)

- [x] Programs list with filtering (city, program type, status, date range)
- [x] Program detail page with three tabs (Registrations, Logistics, Attendance/Evaluations)
- [x] Per-block registration tracking with payment status
- [x] Contact slide-out panel with Apollo enrichment
- [x] Engagement history (GA4 + SmartLead + GoHighLevel)
- [x] Colleague outreach workflow trigger (n8n)
- [x] Logistics checklist (instructors, hotels, room block, venue, BEO, materials, AV)
- [x] Post-program expense tracking
- [x] Attendance tracking per block
- [x] Evaluation surveys (custom, stored in Supabase)
- [x] Virtual program handling with certificate progress tracking
- [x] AI chat for querying program data
- [x] Archive for completed programs
- [x] GO/CLOSE/NEEDS status badges with logistics alerts

### Requirements

#### Validated (v1.0)

- PROG-01 to PROG-09 — Programs list with filtering, sorting, virtual blocks
- PROG-10 to PROG-19 — Registrations tab with roster, filters, cancellations
- PROG-20 to PROG-32 — Contact panel with enrichment, engagement, actions
- PROG-33 to PROG-44 — Logistics tab with all checklist cards, expenses
- PROG-45 to PROG-52 — Attendance/evaluations tab with cross-block tracking
- PROG-53 to PROG-60 — Status badges and 11 alert threshold types
- PROG-61 to PROG-64 — AI reporting chat with tables/charts
- PROG-65 to PROG-70 — All integrations (Apollo, GA4, SmartLead, GHL, n8n)

#### Active

(None — v1.0 complete, next milestone not yet defined)

#### Out of Scope

- **Faculty scheduling system** — Separate initiative; already built; may integrate later
- **Building n8n workflows** — Only triggering existing workflows; workflow creation is separate
- **Payment processing** — Tracking payment status, not processing payments
- **Certificate generation** — Tracking completion, not generating certificates (future)

## Context

### Where It Lives
- **Route:** `/dashboard/programs`
- **Integrates With:** Supabase (data), Apollo (enrichment), GA4 (website behavior), SmartLead (cold email), GoHighLevel (warm email), n8n (workflows)
- **Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Supabase

### Codebase Stats
- ~9,700 lines of TypeScript
- 53 React components
- 10 API routes
- 4 Supabase migrations

## Programs Overview

### Program Types (6 total)

| Program | Blocks | Block Breakdown |
|---------|--------|-----------------|
| Certificate in Employee Relations Law | 3 | Mon-Tue, Wed-Thu, Fri |
| Certificate in Strategic HR Leadership | 2 | Mon-Tue, Wed-Fri |
| Certificate in Employee Benefits Law | 3 | Mon-Tue, Wed, Thu-Fri |
| Advanced Certificate in Strategic Employment Law | 0 | — |
| Certificate in Workplace Investigation | 0 | — |
| Advanced Certificate in Employee Benefits Law | 0 | — |

### In-Person vs Virtual

| Aspect | In-Person | Virtual |
|--------|-----------|---------|
| Schedule | All blocks in one week | Blocks on separate weeks |
| Marketing | Single event | Individual blocks AND full certificate |
| Registration | Select blocks within one program | Register for block event OR certificate |
| Certificate | Complete all blocks that week | Link attendance across weeks |

## Key Decisions

| Decision | Chosen | Rationale | Outcome |
|----------|--------|-----------|---------|
| Tab order | Registrations first | Primary view users want to see | Good |
| Contact detail | Slide-out panel (600px+) | Stay in context, quick navigation | Good |
| Virtual block handling | Linked separate events | Matches marketing reality; cleaner registration | Good |
| Enrichment trigger | Auto on registration | Reduce manual work | Good |
| Evaluation storage | Supabase | Own the data; customize freely | Good |
| Reporting | AI chat | More flexible; can query anything | Good |
| Program health display | Separate status + logistics | CEO needs quick GO/NO-GO; ops needs checklist | Good |
| Attendance editing | Immediate save | Faster workflow | Good |
| Alert calculation | TypeScript utility | Better testability than SQL views | Good |

## Constraints

| Constraint | Description |
|------------|-------------|
| Technical | Must use existing Next.js/Supabase stack; follow dashboard-kit patterns |
| Integrations | Apollo API (check rate limits), GA4 (read-only), SmartLead API, GoHighLevel API |
| Data | No max enrollment; registration is per-block with pricing tiers |
| Virtual complexity | Virtual blocks are separate events that link to certificate completion |

## User Setup Required

Before full production use:
1. **Evaluation survey questions** — User will provide template
2. **Block 3 name for Employee Benefits Law** — User to confirm
3. **n8n webhook URL** — When user creates colleague outreach workflow
4. **API credentials** — GA4, SmartLead, GHL specifics need configuration

---
*Created: 2026-01-30*
*v1.0 shipped: 2026-02-02*
*Last updated: 2026-02-02 after v1.0 milestone*
