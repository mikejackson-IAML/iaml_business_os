# State

## Project Reference

See: .planning-faculty-scheduler/PROJECT.md (updated 2026-01-22)

**Core value:** Faculty members receive magic-link emails when programs become available to their tier, view a personalized list of claimable blocks, and instantly lock in teaching assignments — while IAML monitors the entire process from a Business OS dashboard.
**Current focus:** Planning next milestone

## Current Position

Phase: v1.1 complete
Plan: All plans complete
Status: Milestone shipped
Last activity: 2026-01-22 — v1.1 milestone archived and tagged

Progress: [████████████████████] 100% (v1.1)

**Next step:** Run `/gsd:new-milestone` to define v1.2 or v2.0 scope.

## Milestone Context

**Last completed:** v1.1 Analytics & Insights (shipped 2026-01-22)
**Phases completed:** 8 total (5 in v1.0, 3 in v1.1)
**Requirements shipped:** 48 total (38 in v1.0, 10 in v1.1)

**Next milestone:** TBD — run `/gsd:new-milestone` to define

## Accumulated Context

### Key Decisions

Decisions from v1.0 that affect v1.1:

- Next.js 14+ App Router + shadcn/ui for frontend
- Magic link authentication (no passwords)
- 3-tier system: VIP (7d) -> Local (5d) -> Open
- Local definition: Same state as program location
- Instant first-come-first-served claims (no approval workflow)
- SendGrid for transactional emails
- Supabase for database and auth

### Pending Todos

None.

### Blockers/Concerns

None currently.

## File Locations

| Purpose | Location |
|---------|----------|
| GSD Planning | `.planning-faculty-scheduler/` |
| Roadmap | `.planning-faculty-scheduler/ROADMAP.md` |
| Requirements | `.planning-faculty-scheduler/REQUIREMENTS.md` |
| Schema Migration | `supabase/migrations/20260120_create_faculty_scheduler_schema.sql` |
| Phase 2 Migration | `supabase/migrations/20260121_faculty_scheduler_phase2.sql` |
| Phase 4 Migration | `supabase/migrations/20260121_faculty_scheduler_phase4.sql` |
| Phase 5 Migration | `supabase/migrations/20260122_faculty_scheduler_phase5_dashboard.sql` |
| Phase 6 Migration | `supabase/migrations/20260122_faculty_scheduler_phase6_response_tracking.sql` |
| Phase 7 Migration | `supabase/migrations/20260122_faculty_scheduler_phase7_history.sql` |
| Phase 8 Migration | `supabase/migrations/20260122_faculty_scheduler_phase8_alerts.sql` |
| Query File | `dashboard/src/lib/api/faculty-scheduler-queries.ts` |
| Server Actions | `dashboard/src/app/dashboard/faculty-scheduler/actions.ts` |
| Dashboard Page | `dashboard/src/app/dashboard/faculty-scheduler/page.tsx` |
| Faculty Portal | `faculty-portal/` |

## All Verified Workflows (Faculty Scheduler)

| Workflow | ID | Trigger | Status |
|----------|-----|---------|--------|
| Faculty Availability Tracker | `GOiy6L7XYjevYDSA` | Schedule | Verified |
| Tier Advancement | `23UINuBMopcU4LTm` | Schedule | Verified |
| Claim Confirmation | `CxPvF01qUzvREo9R` | Webhook | Verified |
| Reminder Notifications | `pqVg83IQsmbUeoHH` | Schedule (7am CT) | Verified |
| Cancellation Re-release | `FCUm05vNbAmi6vdd` | Webhook | Verified |

---
*Last updated: 2026-01-22 after v1.1 milestone archived and tagged*
