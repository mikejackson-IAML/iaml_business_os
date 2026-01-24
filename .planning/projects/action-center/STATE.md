# Action Center - Project State

## Project Reference

See: .planning/projects/action-center/PROJECT.md (updated 2026-01-22)

**Core value:** Nothing falls through the cracks. Every action item flows to one place.
**Current focus:** Phase 8 - Alert Integration

## Current Status

**Milestone:** v1.0 Action Center
**Phase:** 8 of 12 (Alert Integration) - IN PROGRESS
**Plan:** 3/7 complete
**Status:** 08-03 complete - Alert-to-Task n8n workflow skeleton created

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
| 8 | Alert Integration | IN PROGRESS |
| 9 | Workflow Templates & Rules | Not Started |
| 10 | Dashboard & Notifications | Not Started |
| 11 | AI Integration | Not Started |
| 12 | Metrics & Polish | Not Started |

## Context for Next Session

**Last action:** Completed 08-03 (Alert-to-Task n8n Workflow Skeleton)
**Next action:** Execute 08-04 (AI Title Transformation)

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

## Phase 7 Summary

Phase 7 (Workflows & Dependencies) complete:

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 07-01 | Workflow Server Actions | 1 | COMPLETE |
| 07-02 | Dependency Query Functions | 1 | COMPLETE |
| 07-03 | Workflow List Page Foundation | 2 | COMPLETE |
| 07-04 | Workflow Table and Row Components | 3 | COMPLETE |
| 07-05 | Workflow Detail Page Skeleton | 3 | COMPLETE |
| 07-06 | Workflow Header with Progress | 3 | COMPLETE |
| 07-07 | Workflow Task List with Dependencies | 4 | COMPLETE |
| 07-08 | Enhanced Dependency Section | 4 | COMPLETE |
| 07-09 | Add Task to Workflow Modal | 5 | COMPLETE |
| 07-10 | Dismiss with Dependents Dialog | 5 | COMPLETE |

### Files Created (Phase 7)

**Server Actions:**
- `dashboard/src/app/dashboard/action-center/workflow-actions.ts`

**API Queries:**
- `dashboard/src/lib/api/task-queries.ts` (updated with dependency functions)

**Workflow List Page:**
- `dashboard/src/app/dashboard/action-center/workflows/page.tsx`
- `dashboard/src/app/dashboard/action-center/workflows/workflow-list-skeleton.tsx`
- `dashboard/src/app/dashboard/action-center/workflows/workflow-list-data-loader.tsx`
- `dashboard/src/app/dashboard/action-center/workflows/workflow-list-content.tsx`

**Workflow Detail Page:**
- `dashboard/src/app/dashboard/action-center/workflows/[id]/page.tsx`
- `dashboard/src/app/dashboard/action-center/workflows/[id]/workflow-detail-skeleton.tsx`
- `dashboard/src/app/dashboard/action-center/workflows/[id]/workflow-detail-content.tsx`
- `dashboard/src/app/dashboard/action-center/workflows/[id]/not-found.tsx`

**Components:**
- `dashboard/src/app/dashboard/action-center/components/workflow-table.tsx`
- `dashboard/src/app/dashboard/action-center/components/workflow-row.tsx`
- `dashboard/src/app/dashboard/action-center/components/workflow-progress.tsx`
- `dashboard/src/app/dashboard/action-center/components/workflow-task-list.tsx`
- `dashboard/src/app/dashboard/action-center/components/workflow-task-row.tsx`
- `dashboard/src/app/dashboard/action-center/components/task-dependencies.tsx`
- `dashboard/src/app/dashboard/action-center/components/add-task-to-workflow-modal.tsx`
- `dashboard/src/app/dashboard/action-center/components/dismiss-with-dependents-dialog.tsx`

**Modified:**
- `dashboard/src/app/dashboard/action-center/components/dismiss-task-dialog.tsx` (soft enforcement warning)
- `dashboard/src/app/dashboard/action-center/tasks/[id]/task-detail-content.tsx` (dependency section)
- `dashboard/src/app/dashboard/action-center/components/index.ts` (exports)

### Requirements Covered (Phase 7)

- WF-01: Workflow list page shows all workflows
- WF-02: Workflow detail shows tasks in dependency order
- WF-03: Progress indicator shows X of Y complete
- WF-04: Blocked tasks are highlighted
- WF-05: Can add task to workflow
- WF-06: Workflow status computed correctly
- DEP-01: Tasks can have multiple dependencies
- DEP-02: Dependent tasks show blocked indicator
- DEP-03: Soft enforcement with warning works
- DEP-04: Blocked By section shows task links
- DEP-05: Blocking section shows waiting tasks
- DEP-06: Dismissing task with dependents creates decision task

## Known Technical Debt

- **Supabase Types:** The generated types.ts doesn't include action_center schema. TypeScript shows type errors but code works at runtime. Should regenerate types to include action_center schema.

## Phase 8 Progress

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 08-01 | Alert Webhook Schema and Standardization | 1 | COMPLETE |
| 08-02 | Alert Accumulation Tracking | 1 | COMPLETE |
| 08-03 | Alert-to-Task n8n Workflow Skeleton | 2 | COMPLETE |
| 08-04 | AI Title Transformation | 2 | NOT STARTED |
| 08-05 | Full Duplicate Detection Logic | 2 | NOT STARTED |
| 08-06 | Business Hours Due Date Calculation | 3 | NOT STARTED |
| 08-07 | Connect Existing Monitors | 3 | NOT STARTED |

### Files Created (Phase 8)

**Database:**
- `supabase/migrations/20260124_alert_webhook_schema.sql`
- `supabase/migrations/20260124_alert_accumulation.sql`

**n8n Workflows:**
- `business-os/workflows/alert-to-task.json`

---
*Last updated: 2026-01-24 after 08-03 complete*
