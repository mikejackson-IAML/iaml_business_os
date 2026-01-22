# State

## Project Reference

See: .planning-faculty-scheduler/PROJECT.md (updated 2026-01-22)

**Core value:** Faculty members receive magic-link emails when programs become available to their tier, view a personalized list of claimable blocks, and instantly lock in teaching assignments — while IAML monitors the entire process from a Business OS dashboard.
**Current focus:** v1.1 Analytics & Insights

## Current Position

Phase: 8 of 8 (Dashboard Alerts)
Plan: 4 of 4 complete
Status: Complete
Last activity: 2026-01-22 — Phase 8 complete (Dashboard Alerts)

Progress: [████████████████████] 100%

**Next step:** v1.1 milestone complete. Ready for milestone audit or archive.

## Milestone Context

**Milestone:** v1.1 Analytics & Insights
**Phases:** Starting at Phase 6 (continues from v1.0)
**Requirements:** 10 total

**Previous milestone:** v1.0 MVP (5 phases, 38 requirements)

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
*Last updated: 2026-01-22 after Phase 8 execution (Dashboard Alerts complete, v1.1 milestone complete)*
