# Programs - State

## Project Reference

See: `.planning-programs/PROJECT.md`
See: `.planning-programs/AUTONOMOUS-BUILD-GUIDE.md` (pre-answered decisions)

**Core value:** Complete visibility into program logistics, registrations, payments, attendance, and evaluations — all in one place.
**Current focus:** v1.0 Development

## Current State

**Milestone:** v1.0
**Status:** In Progress
**Phase:** 06-program-status-alerts (6 of 7)
**Plan:** 2 of 3 complete

Progress: [####################################----] 92%

Phase 06 in progress - Status badges and alert display on programs list complete

## Quick Context

- **Route:** `/dashboard/programs`
- **Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind, Supabase
- **Integrations:** Apollo, GA4, SmartLead, GoHighLevel, n8n

## Decisions

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-30 | Project initialized | Documents converted to GSD format |
| 2026-01-31 | Used Record<string, unknown> for Supabase mapping | Avoids TypeScript inference issues with generic DB responses |
| 2026-01-31 | Array.from() for Set iteration | Better TypeScript compatibility than spread operator |
| 2026-01-31 | Replaced dashboard view with list view | Plan 01-02 spec called for list view, not dashboard |
| 2026-01-31 | Used indicatorClassName for Progress colors | Proper approach for dynamic Progress bar coloring |
| 2026-01-31 | Filter panel uses local state for open/close | URL params only for filter values (shareable) |
| 2026-01-31 | On-demand programs show N/A for logistics | No logistics tracking needed per AUTONOMOUS-BUILD-GUIDE |
| 2026-01-31 | Used native HTML date inputs for date range filter | Simpler than adding date picker library, works well |
| 2026-01-31 | LATERAL JOIN for child aggregation in view | Better performance than correlated subquery |
| 2026-01-31 | mountedTabs Set for lazy tab loading | Prevents unnecessary renders of unmounted tabs |
| 2026-01-31 | Registration count in tab label | Quick reference without switching tabs |
| 2026-01-31 | BLOCK_CONFIG constant for program blocks | Program-to-blocks mapping in code, supports partial name match |
| 2026-01-31 | Migration requires manual run | CLI history out of sync with remote, SQL ready in file |
| 2026-01-31 | Certificate vs Block-only by attendance_type | 'Full' = certificate registrant, else block-only |
| 2026-01-31 | Block selection via case-insensitive name match | Flexible matching for various block name formats |
| 2026-01-31 | Roster filter state in URL params | Shareable/bookmarkable filter combinations |
| 2026-01-31 | pg_net for async HTTP from DB triggers | Non-blocking enrichment calls |
| 2026-01-31 | 24-hour enrichment cache | Prevents redundant Apollo API calls |
| 2026-01-31 | app_config table for API URL | Configurable base URL for triggers |
| 2026-01-31 | Sheet width responsive: full on mobile, 600px on desktop | Per RESEARCH.md pitfall guidance |
| 2026-01-31 | Kept triggerEnrichment function for ContactPanel | Will be used by panel enrich button later |
| 2026-01-31 | Extended RegistrationRosterItem type for Apollo fields | Includes linkedin_url, photo, company data for Contact Panel |
| 2026-01-31 | Company history via API route | Async loading with skeleton state for client-side fetch |
| 2026-01-31 | Quick action buttons disabled as placeholders | Will be wired in later phase when payment tracking added |
| 2026-01-31 | Graceful degradation for integration APIs | Return { configured: false } when env vars missing |
| 2026-01-31 | Parallel API fetching via Promise.all | Load all integrations simultaneously for speed |
| 2026-01-31 | GA4 implementation deferred | Requires user ID tracking setup in GA4 property |
| 2026-01-31 | Workflow URL from workflow_registry | Lookup webhook URL at request time for flexibility |
| 2026-01-31 | Button state machine pattern | Tracks not_started/triggering/triggered/error for UX |
| 2026-02-01 | ADD COLUMN IF NOT EXISTS for idempotent migration | Safe to re-run migration without errors |
| 2026-02-01 | ON DELETE CASCADE for program_expenses | Auto-cleanup when program instance deleted |
| 2026-02-01 | Helper function pattern for Supabase mutations | Type workaround using any cast, follows lead-intelligence pattern |
| 2026-02-01 | Upsert for logistics updates | Creates record on first update, no explicit creation needed |
| 2026-02-01 | LogisticsCard adapted from EngagementCard pattern | Consistent expandable card UI across app |
| 2026-02-01 | Extended ProgramDetail with room_block fields | RoomBlockCard needs hotel, rooms_booked, block_size, cutoff |
| 2026-02-01 | Auto-create storage bucket on first upload | ensureBucket() pattern from Lead Intelligence |
| 2026-02-01 | Adaptive materials checklist (7 vs 4 items) | Virtual programs skip print/ship steps |
| 2026-02-01 | Virtual setup cards in single file | Cleaner imports for PlatformReady, Calendar, Reminders |
| 2026-02-01 | Expenses grouped by 5 categories | Accommodations, Venue, Materials, Equipment, Other |
| 2026-02-01 | Grand total at top of expenses section | Quick reference without scrolling through categories |
| 2026-02-01 | Receipt uploads via attachments API | Reuses existing upload infrastructure |
| 2026-02-01 | JSONB for attendance_by_block | Flexible per-block tracking without schema changes |
| 2026-02-01 | UNIQUE(registration_id) on evaluation_responses | One evaluation per registration ensures integrity |
| 2026-02-01 | Database view for aggregate scores | Efficient calculation server-side |
| 2026-02-01 | Client-side fetch for EvaluationsSection | Flexibility for tab mount loading |
| 2026-02-01 | Color coding: green >= 4, yellow >= 3, red < 3 | Per CONTEXT.md evaluation display spec |
| 2026-02-01 | Show more/less for excerpts (maxVisible=3) | Manageable initial view of free-text |
| 2026-02-01 | Optimistic UI for attendance checkboxes | Immediate visual feedback, revert on failure |
| 2026-02-01 | AlertDialog for bulk mark-all action | Confirmation before destructive bulk action |
| 2026-02-01 | Fragment for paired Reg/Att table cells | Clean JSX for multiple cells per block |
| 2026-02-01 | hr element for separator in AttendanceTab | Dashboard-kit lacks Separator component |
| 2026-02-01 | Registrations API supports includeAttendance param | Extends base data with attendance fields |
| 2026-02-02 | Alert calculation in TypeScript utility | Better testability than SQL views |
| 2026-02-02 | 11 alert threshold pairs from PROG-60 | Centralized constants for consistency |
| 2026-02-02 | Payment alerts rolled up to program level | Single alert "3 invoices past due" vs multiple |
| 2026-02-02 | Badge format uses parentheses not pipe | "GO (8)" per CONTEXT.md decision |
| 2026-02-02 | Alert thresholds checked: instructor 30/45d, venue 60/90d | Simplified threshold checks for list view |
| 2026-02-02 | AlertCountBadge returns null when no alerts | Clean display per CONTEXT.md "no visual noise" |

## Session Log

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-30 | Project initialized | Created GSD structure from PRD documents |
| 2026-01-31 | Completed 01-01-PLAN.md | Schema & Types Foundation - 8min |
| 2026-01-31 | Completed 01-02-PLAN.md | Programs List Page - 12min |
| 2026-01-31 | Completed 01-03-PLAN.md | Filtering & Date Range - 2min |
| 2026-01-31 | Completed 01-04-PLAN.md | Date Range Filter UI (gap closure) - 2min |
| 2026-01-31 | Completed 01-05-PLAN.md | Virtual Block Data Wiring (gap closure) - 3min |
| 2026-01-31 | Completed 02-02-PLAN.md | Program Detail Page with Tabs - 4min |
| 2026-01-31 | Completed 02-01-PLAN.md | Schema Extensions & Types - 10min |
| 2026-01-31 | Completed 02-03-PLAN.md | Registrations Roster - 6min |
| 2026-01-31 | Completed 02-04-PLAN.md | Apollo Enrichment Integration - 2min |
| 2026-01-31 | Completed 03-01-PLAN.md | Contact Panel Foundation - 3min |
| 2026-01-31 | Completed 03-02-PLAN.md | Panel Content Sections - 5min |
| 2026-01-31 | Completed 03-03-PLAN.md | Engagement Section - 3min |
| 2026-01-31 | Completed 03-04-PLAN.md | Action Buttons - 2min |
| 2026-02-01 | Completed 04-01-PLAN.md | Schema & Types for Logistics - 3min |
| 2026-02-01 | Completed 04-02-PLAN.md | Logistics Tab UI - 3min |
| 2026-02-01 | Completed 04-03-PLAN.md | Remaining Cards (Venue, BEO, Materials, AV, Virtual) - 4min |
| 2026-02-01 | Completed 04-04-PLAN.md | Expenses & Tab Integration - 3min |
| 2026-02-01 | Completed 05-01-PLAN.md | Schema & Query Foundation - 3min |
| 2026-02-01 | Completed 05-03-PLAN.md | Evaluations Section UI - 3min |
| 2026-02-01 | Completed 05-02-PLAN.md | Attendance Tab UI - 3min |
| 2026-02-01 | Completed 05-04-PLAN.md | Tab Integration - 2min |
| 2026-02-02 | Completed 06-01-PLAN.md | Alert Calculation Utility - 1min |
| 2026-02-02 | Completed 06-02-PLAN.md | Status Badge UI - 2min |

## Blockers

**Migrations need manual application:**
- Supabase CLI migration history out of sync
- SQL ready in:
  - `supabase/migrations/20260131_registrations_tab_schema.sql` (cancellation columns, Apollo tracking)
  - `supabase/migrations/20260131_apollo_auto_enrich_trigger.sql` (auto-enrichment trigger)
  - `supabase/migrations/20260201_logistics_tab_schema.sql` (logistics columns, expenses table)
  - `supabase/migrations/20260201_attendance_evaluations_schema.sql` (attendance columns, evaluation tables)
- Run in Supabase Dashboard SQL Editor before using these features

## Session Continuity

- **Last session:** 2026-02-02
- **Stopped at:** Completed 06-02-PLAN.md (Status Badge UI)
- **Next step:** Continue with 06-03-PLAN.md (Program Detail Alerts)
- **Resume file:** None

## Key Reference Documents

- `AUTONOMOUS-BUILD-GUIDE.md` — Pre-answered decisions for autonomous development
- `REQUIREMENTS.md` — 70 requirements with traceability
- `ROADMAP.md` — 7 phases with success criteria

## What Still Requires User Input

Per AUTONOMOUS-BUILD-GUIDE.md:
1. **Evaluation survey questions** — User will provide template
2. **Block 3 name for Employee Benefits Law** — User to confirm
3. **n8n webhook URL** — When user creates it
4. **API credentials** — GA4/SmartLead/GHL specifics

## Completed Plans

| Phase | Plan | Name | Duration | Commits |
|-------|------|------|----------|---------|
| 01 | 01 | Schema & Types Foundation | 8min | ff434df9, ca7c212b |
| 01 | 02 | Programs List Page | 12min | 55d01c6f, 29b99148 |
| 01 | 03 | Filtering & Date Range | 2min | 21265fee, 65936102 |
| 01 | 04 | Date Range Filter UI (gap closure) | 2min | 690622e3, bffb1e1f |
| 01 | 05 | Virtual Block Data Wiring (gap closure) | 3min | e928f91d, 7fc8f1ab |
| 02 | 01 | Schema Extensions & Types | 10min | 8abdd5b5, 57bc09b8 |
| 02 | 02 | Program Detail Page with Tabs | 4min | 3f394bef, 462dafc7, 7c622e50 |
| 02 | 03 | Registrations Roster | 6min | 18fc661b, f4d550a5, 6cafc17b |
| 02 | 04 | Apollo Enrichment Integration | 2min | 88f9257e, 1ea0e458, b034444a, 76b08952 |
| 03 | 01 | Contact Panel Foundation | 3min | 1dca5084, de9eb73a, 7508d0ac |
| 03 | 02 | Panel Content Sections | 5min | d767ba3d, ccfb3bea, f0cc7e4a, 9381df52, b3d885b9 |
| 03 | 03 | Engagement Section | 3min | e8f73571, d9820af2, cd2f2173, 0ebdbaa1 |
| 03 | 04 | Action Buttons | 2min | 7ce3d5c8, 775884ca, 5676dd51 |
| 04 | 01 | Schema & Types for Logistics | 3min | 708e03a4, ea0dad81, 44eef8d6 |
| 04 | 02 | Logistics Tab UI | 3min | 3c982149, 645c6736, d3c0959e |
| 04 | 03 | Remaining Cards (Venue, BEO, Materials, AV, Virtual) | 4min | 878a1dba, 3026dea7, e88be07f |
| 04 | 04 | Expenses & Tab Integration | 3min | f82387c1, 239eb172, 8444faeb |
| 05 | 01 | Schema & Query Foundation | 3min | 6fbd129a, 7aeb00ca, ee885b08 |
| 05 | 03 | Evaluations Section UI | 3min | b23268c4, 06d2ff72, af347cef |
| 05 | 02 | Attendance Tab UI | 3min | b9e1d1fe, 39e00523, 06d793a2 |
| 05 | 04 | Tab Integration | 2min | 9c9d6279, f5c87eaa, 94310cb3 |
| 06 | 01 | Alert Calculation Utility | 1min | d18a946c |
| 06 | 02 | Status Badge UI | 2min | f75f8621, 88b8e3ee, 3fe680a0 |

---
*Last updated: 2026-02-02T16:22Z*
