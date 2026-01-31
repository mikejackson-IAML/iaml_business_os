# Programs - State

## Project Reference

See: `.planning-programs/PROJECT.md`
See: `.planning-programs/AUTONOMOUS-BUILD-GUIDE.md` (pre-answered decisions)

**Core value:** Complete visibility into program logistics, registrations, payments, attendance, and evaluations — all in one place.
**Current focus:** v1.0 Development

## Current State

**Milestone:** v1.0
**Status:** In Progress
**Phase:** 03-contact-panel IN PROGRESS (3 of 7)
**Plan:** 01 of 3 complete

Progress: [###############.............] 45%

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

## Blockers

**Migrations need manual application:**
- Supabase CLI migration history out of sync
- SQL ready in:
  - `supabase/migrations/20260131_registrations_tab_schema.sql` (cancellation columns, Apollo tracking)
  - `supabase/migrations/20260131_apollo_auto_enrich_trigger.sql` (auto-enrichment trigger)
- Run in Supabase Dashboard SQL Editor before using cancellation/Apollo features

## Session Continuity

- **Last session:** 2026-01-31
- **Stopped at:** Completed 03-01-PLAN.md (Contact Panel Foundation)
- **Next step:** Continue with 03-02-PLAN.md (Panel Content Sections)
- **Resume file:** `.planning-programs/phases/03-contact-panel/03-02-PLAN.md`

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

---
*Last updated: 2026-01-31T21:03Z*
