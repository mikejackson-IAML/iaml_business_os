# State

## Current Position
- **Milestone:** 1 - Faculty Program Scheduler MVP
- **Phase:** 5 - Business OS Dashboard Integration
- **Status:** IN PROGRESS (Wave 1-2 complete, Wave 3-4 pending)

## Last Session
- **Date:** 2026-01-22
- **Activity:** Executed plan 05-06 - Recruitment Pipeline Table
- **Next Action:** Execute plan 05-07

## Phase 5 Plan Summary

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 05-01-PLAN.md | 1 | Supabase dashboard views and admin functions | ✅ Complete |
| 05-02-PLAN.md | 1 | Query file with TypeScript types | ✅ Complete |
| 05-03-PLAN.md | 2 | Server actions (skip tier, assign, nudge, override) | ✅ Complete |
| 05-04-PLAN.md | 2 | Dashboard page and skeleton | ✅ Complete |
| 05-05-PLAN.md | 3 | Content component and summary cards | ✅ Complete |
| 05-06-PLAN.md | 3 | Recruitment pipeline table | ✅ Complete |
| 05-07-PLAN.md | 4 | Not responded list and modals | Pending |

### Wave 1 Deliverables (Complete)

| Deliverable | Location |
|-------------|----------|
| Phase 5 Migration | `supabase/migrations/20260122_faculty_scheduler_phase5_dashboard.sql` |
| Query File | `dashboard/src/lib/api/faculty-scheduler-queries.ts` |

### Wave 2 Deliverables (Complete)

| Deliverable | Location |
|-------------|----------|
| Server Actions | `dashboard/src/lib/actions/faculty-scheduler-actions.ts` |
| Dashboard Page | `dashboard/src/app/dashboard/faculty-scheduler/page.tsx` |
| Loading Skeleton | `dashboard/src/app/dashboard/faculty-scheduler/faculty-scheduler-skeleton.tsx` |

### Wave 3 Deliverables (Complete)

| Deliverable | Location |
|-------------|----------|
| Content Component | `dashboard/src/app/dashboard/faculty-scheduler/content.tsx` |
| Summary Cards | `dashboard/src/app/dashboard/faculty-scheduler/components/summary-cards.tsx` |
| Pipeline Table | `dashboard/src/app/dashboard/faculty-scheduler/components/recruitment-pipeline-table.tsx` |

**Views Created:**
- `dashboard_recruitment_pipeline` - Enhanced pipeline with notification/response counts
- `not_responded_instructors` - Instructors needing follow-up
- `dashboard_summary_stats` - Summary card totals and response rate

**Functions Created:**
- `assign_instructor(p_block_id, p_instructor_id)` - Manual assignment (admin override)
- `override_claim(p_claim_id, p_reason)` - Cancel claim and re-open block

**Requirements Coverage:**
- B1: Summary widget → SummaryCards component
- B2: Status per program → Table tier badges
- B3: Required columns → Table columns
- B4: Manually assign → AssignInstructorModal
- B5: Skip tier early → Table action dropdown
- B6: Send reminder nudge → Table action dropdown
- B7: Not responded view → NotRespondedList component
- B8: Override claim → OverrideClaimModal

## Phase 4 Status: COMPLETE

### Plans Executed

| Plan | Wave | Description | Status |
|------|------|-------------|--------|
| 04-01-PLAN.md | 1 | Supabase admin functions | ✅ |
| 04-02-PLAN.md | 2 | Reminder workflow | ✅ |
| 04-03-PLAN.md | 2 | Cancellation re-release workflow | ✅ |

### Deliverables

| Deliverable | Location |
|-------------|----------|
| Phase 4 Migration | `supabase/migrations/20260121_faculty_scheduler_phase4.sql` |
| Reminder Workflow | `pqVg83IQsmbUeoHH` - https://n8n.realtyamp.ai/workflow/pqVg83IQsmbUeoHH |
| Re-release Workflow | `FCUm05vNbAmi6vdd` - https://n8n.realtyamp.ai/workflow/FCUm05vNbAmi6vdd |
| Webhook | https://n8n.realtyamp.ai/webhook/faculty-scheduler-rerelease |

### Functions Created

| Function | Purpose |
|----------|---------|
| `release_all()` | Bulk-releases all draft programs to tier_0 |
| `skip_tier()` | Advances a program to tier_1 or tier_2 |
| `get_programs_needing_reminder()` | Returns programs at 45-55% of tier window |
| `get_instructors_needing_reminder()` | Returns eligible instructors for reminders |
| `get_instructors_for_rerelease()` | Returns eligible instructors for re-release |

## All Verified Workflows (Faculty Scheduler)

| Workflow | ID | Trigger | Status |
|----------|-----|---------|--------|
| Faculty Availability Tracker | `GOiy6L7XYjevYDSA` | Schedule | ✅ Verified |
| Tier Advancement | `23UINuBMopcU4LTm` | Schedule | ✅ Verified |
| Claim Confirmation | `CxPvF01qUzvREo9R` | Webhook | ✅ Verified |
| Reminder Notifications | `pqVg83IQsmbUeoHH` | Schedule (7am CT) | ✅ Verified |
| Cancellation Re-release | `FCUm05vNbAmi6vdd` | Webhook | ✅ Verified |

### Key Fixes Applied (Phase 4, logged in n8n-brain)
1. SendGrid nodes require explicit Sender Name and Message Body after import
2. After action nodes (SendGrid), use `$('SourceNode').item.json.*` to access original data

## Key Decisions

| Decision | Choice | Date | Rationale |
|----------|--------|------|-----------|
| Frontend framework | Next.js 14+ App Router + shadcn/ui | 2025-01-20 | Matches existing site rebuild approach |
| Component library | shadcn/ui (Radix + CVA + Tailwind) | 2025-01-20 | Modern, accessible, customizable |
| Authentication | Magic links via SendGrid | 2025-01-20 | Zero friction, already emailing instructors |
| Database | Supabase PostgreSQL | 2025-01-20 | Existing infrastructure |
| Automations | n8n | 2025-01-20 | Existing automation platform |
| Email provider | SendGrid | 2025-01-20 | Already set up for transactional |
| Tier structure | 3 tiers (VIP 7d → Local 5d → Open) | 2025-01-20 | Balances priority with urgency |
| Local definition | Same state | 2025-01-20 | Simple, avoids geodistance complexity |
| Claim model | Instant, first-come-first-served | 2025-01-20 | No approval bottleneck |

## Blockers
None currently.

## Open Questions

| Question | Owner | Status |
|----------|-------|--------|
| Magic link expiration period | Mike | Open - suggest 30 days |
| Where are program materials stored currently? | Mike | Open - need URL/attachment strategy |
| Domain setup for faculty.iaml.com | Mike | Open - need Vercel/DNS config |

## Context for Next Session

This project creates a tiered instructor assignment system for IAML. Key points:

1. **Tier System:** VIP instructors (~3 people) get 7 days exclusive access to ALL programs. Then local instructors (same state) get 5 days. Then everyone qualified.

2. **Certificate Programs:** Some programs have multiple blocks. Instructors can claim individual blocks or all blocks. Different instructors can teach different blocks.

3. **Magic Links:** No passwords. Email contains unique token that identifies instructor. Page is personalized.

4. **Dashboard:** Mike needs visibility into which programs are in which tier, who's been notified, who's responded, with ability to manually intervene.

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
| Query File | `dashboard/src/lib/api/faculty-scheduler-queries.ts` |
| Server Actions | `dashboard/src/lib/actions/faculty-scheduler-actions.ts` |
| Dashboard Page | `dashboard/src/app/dashboard/faculty-scheduler/page.tsx` |
| Dashboard Skeleton | `dashboard/src/app/dashboard/faculty-scheduler/faculty-scheduler-skeleton.tsx` |
| Content Component | `dashboard/src/app/dashboard/faculty-scheduler/content.tsx` |
| Summary Cards | `dashboard/src/app/dashboard/faculty-scheduler/components/summary-cards.tsx` |
| Pipeline Table | `dashboard/src/app/dashboard/faculty-scheduler/components/recruitment-pipeline-table.tsx` |
| Frontend | `faculty.iaml.com` (Vercel) - TBD |
| Database | Supabase project (existing) |
| Automations | n8n instance at n8n.realtyamp.ai |
