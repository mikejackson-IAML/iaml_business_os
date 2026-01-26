# Action Center - Project State

## Project Reference

See: .planning/projects/action-center/PROJECT.md (updated 2026-01-22)

**Core value:** Nothing falls through the cracks. Every action item flows to one place.
**Current focus:** Phase 12 - Metrics & Polish

## Current Status

**Milestone:** v1.0 Action Center
**Phase:** 11 of 12 (AI Integration) - COMPLETE
**Plan:** 8/8 complete
**Status:** Phase 11 complete, ready for Phase 12

## Progress Overview

| Phase | Name | Status |
|-------|------|--------|
| 1 | Database Schema | COMPLETE |
| 2 | Task API | COMPLETE |
| 3 | Workflow & SOP API | COMPLETE |
| 4 | Task UI - List | COMPLETE |
| 5 | Task UI - Detail & Create | COMPLETE |
| 6 | SOP Templates | COMPLETE |
| 7 | Workflows & Dependencies | COMPLETE |
| 8 | Alert Integration | COMPLETE |
| 9 | Workflow Templates & Rules | COMPLETE |
| 10 | Dashboard & Notifications | COMPLETE |
| 11 | AI Integration | COMPLETE |
| 12 | Metrics & Polish | Not Started |

## Context for Next Session

**Last action:** Completed Phase 11 (AI Integration) - 8 plans across 5 waves
**Next action:** Run `/gsd:discuss-phase 12 --project action-center` to plan Metrics & Polish

## Phase 11 Summary

Phase 11 (AI Integration) COMPLETE:

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 11-01 | AI Analysis API Endpoint | 1 | COMPLETE |
| 11-02 | Weekly Focus n8n Workflow | 1 | COMPLETE |
| 11-03 | Weekly Focus Dashboard Widget | 2 | COMPLETE |
| 11-04 | AI Suggestion Creation and Storage | 2 | COMPLETE |
| 11-05 | Confidence Score Display | 3 | COMPLETE |
| 11-06 | Accept/Reject Flow | 3 | COMPLETE |
| 11-07 | Pattern Detection Algorithms | 4 | COMPLETE |
| 11-08 | Suggestion Expiry and Final Integration | 5 | COMPLETE |

### Files Created (Phase 11)

**Core AI Libraries:**
- `dashboard/src/lib/action-center/ai-analysis-types.ts` - TypeScript interfaces for AI analysis
- `dashboard/src/lib/action-center/ai-analysis.ts` - Claude API integration, prompt building, 90-day analysis
- `dashboard/src/lib/action-center/ai-suggestion-service.ts` - Suggestion creation with deduplication
- `dashboard/src/lib/action-center/pattern-detection.ts` - 4 pattern detection algorithms

**API Endpoint:**
- `dashboard/src/app/api/action-center/ai-analysis/route.ts` - POST for analysis, GET for health check

**UI Components:**
- `dashboard/src/components/widgets/weekly-focus-widget.tsx` - Dashboard widget showing weekly focus
- `dashboard/src/app/dashboard/action-center/components/confidence-badge.tsx` - Color-coded confidence display
- `dashboard/src/app/dashboard/action-center/components/ai-suggestion-actions.tsx` - Accept/Reject buttons
- `dashboard/src/app/dashboard/action-center/components/reject-suggestion-dialog.tsx` - Rejection reason dialog

**n8n Workflow:**
- `business-os/workflows/weekly-ai-focus.json` - Sunday 7pm + Friday 5pm schedule
- `business-os/workflows/README-weekly-ai-focus.md` - Workflow documentation
- `supabase/scripts/register-weekly-ai-focus-workflow.sql` - Registration script

**Database Migration:**
- `supabase/migrations/20260125_ai_suggestion_expiry.sql` - expire_ai_suggestions() function

**Modified Files:**
- `dashboard/src/lib/api/task-queries.ts` - getLatestWeeklyFocus(), getAISuggestionCount()
- `dashboard/src/lib/api/task-types.ts` - ai_confidence, ai_suggested_at fields
- `dashboard/src/lib/api/task-mutations.ts` - AI fields support
- `dashboard/src/app/dashboard/action-center/components/task-row.tsx` - Confidence badge, expiry indicator
- `dashboard/src/app/dashboard/action-center/tasks/[id]/task-detail-content.tsx` - AI suggestion actions
- `dashboard/src/app/dashboard/action-center/actions.ts` - Accept/reject server actions
- `dashboard/src/app/dashboard/dashboard-content.tsx` - Weekly Focus widget integration
- `dashboard/src/app/dashboard/page.tsx` - Weekly focus data fetching

### Key Decisions (Phase 11)

- [11-01]: Claude Opus 4.5 for weekly analysis (quality over speed)
- [11-01]: 90-day task history lookback
- [11-01]: "Encouraging coach" tone in system prompt
- [11-02]: Dual schedule: Sunday 7pm CT (planning) + Friday 5pm CT (recap)
- [11-03]: Weekly Focus widget shows summary and AI suggestion count badge
- [11-04]: Week-scoped dedupe keys: `ai:{type}:{year}-W{week}:{hash}`
- [11-04]: Max 10 suggestions per week (configurable)
- [11-05]: Confidence colors: green ≥80%, amber 60-79%, neutral <60%
- [11-05]: Reasoning tooltip shown when confidence < 80%
- [11-06]: Accept = status → in_progress; Reject = dismiss with ai_rejected: prefix
- [11-06]: 5 predefined rejection reasons + custom text option
- [11-07]: 4 pattern types: recurring_neglect, workload_imbalance, velocity_trend, deadline_clustering
- [11-08]: Auto-expire after 7 days with dismissed_reason='ai_expired'
- [11-08]: Expiry indicator shows "Expires in Xd" for suggestions with ≤2 days remaining

### Requirements Covered (Phase 11)

- AI-01: Weekly AI Focus generation (Sunday 7pm + Friday 5pm CT)
- AI-02: AI analyzes open tasks, overdue items, patterns (90-day lookback)
- AI-03: Creates "Weekly Focus Review" task with prioritized list
- AI-04: AI-suggested tasks with source='ai', ai_confidence, 10/week cap, 7-day expiry
- AI-05: AI Suggested view shows pending suggestions (Phase 4)
- AI-06: Accept/Reject/Modify flow with optional rejection reason
- AI-07: Confidence score display with color-coded badges
- AI-08: Pattern detection (4 types implemented)

## Key Decisions Made

- Web-first approach, iOS deferred to v1.1
- Single-user (CEO) for v1, schema supports multi-user
- SOPs stored in Supabase, not Notion
- Soft dependency enforcement (warning, not blocking)
- [02-01]: API Key reuse - same MOBILE_API_KEY for consistency
- [02-01]: User-friendly verbose validation error messages
- [02-01]: Cannot PATCH status='dismissed' - must use /dismiss endpoint
- [02-02]: PostgreSQL alphabetical sort for priority (critical < high < low < normal)
- [02-04]: Activity limit default 10, max 500 for full history
- [03-04]: Workflow files named `action-center-workflow-*.ts` to avoid conflict with n8n workflow files
- [04-04]: Task row originally expanded inline; changed in 05-11 to navigate to detail page
- [05-01]: Extended UpdateTaskRequest to support approval_outcome and approval_modifications fields
- [05-03]: Inline placeholder rendering for comments/activity/dialogs - to be replaced by dedicated components in later plans
- [05-06]: Enter key submits comment form (Shift+Enter for new line), system comments rendered at opacity-70
- [07-01]: Decision tasks use `source: 'workflow'` to indicate workflow origin
- [07-02]: getTasksBlocking uses Supabase `contains()` filter on depends_on array
- [07-02]: TaskDependencies interface with `blockedBy` and `blocking` arrays
- [07-04]: Workflow status colors: gray (not_started), blue (in_progress), amber (blocked), green (completed)
- [07-07]: Kahn's algorithm for topological sort of tasks by dependencies
- [07-07]: Dependency depth capped at 2 levels for visual hierarchy
- [07-08]: TaskDependencies component uses lazy loading via server action
- [07-09]: `no_workflow` filter shows tasks not already in a workflow
- [07-10]: Soft enforcement: DismissTaskDialog shows warning but allows proceeding (DEP-03)
- [07-10]: Dismiss with dependents can create decision task for cascade handling (DEP-06)

## Blockers

None.

## Known Technical Debt

- **Supabase Types:** The generated types.ts doesn't include action_center schema. TypeScript shows type errors but code works at runtime. Should regenerate types to include action_center schema.

---
*Last updated: 2026-01-25 after Phase 11 complete*
