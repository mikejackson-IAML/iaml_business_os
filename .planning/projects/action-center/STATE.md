# Action Center - Project State

## Project Reference

See: .planning/projects/action-center/PROJECT.md (updated 2026-01-22)

**Core value:** Nothing falls through the cracks. Every action item flows to one place.
**Current focus:** Phase 11 - AI Integration

## Current Status

**Milestone:** v1.0 Action Center
**Phase:** 11 of 12 (AI Integration) - NOT STARTED
**Plan:** 0/? complete
**Status:** Phase 10 complete, ready for Phase 11

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
| 11 | AI Integration | Not Started |
| 12 | Metrics & Polish | Not Started |

## Context for Next Session

**Last action:** Completed Phase 10 (Dashboard & Notifications)
**Next action:** Run `/gsd:discuss-phase 11 --project action-center` to plan AI Integration

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

## Phase 8 Summary

Phase 8 (Alert Integration) complete:

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 08-01 | Alert Webhook Schema and Standardization | 1 | COMPLETE |
| 08-02 | Alert Accumulation Tracking | 1 | COMPLETE |
| 08-03 | Alert-to-Task n8n Workflow Skeleton | 2 | COMPLETE |
| 08-04 | AI Title Transformation | 2 | COMPLETE |
| 08-05 | Full Duplicate Detection Logic | 2 | COMPLETE |
| 08-06 | Business Hours Due Date Calculation | 3 | COMPLETE |
| 08-07 | Alert Resolution and Documentation | 4 | COMPLETE |

### Files Created (Phase 8)

**Database Migrations:**
- `supabase/migrations/20260124_alert_webhook_schema.sql` - alert_config table
- `supabase/migrations/20260124_alert_accumulation.sql` - alert_occurrences table and functions
- `supabase/migrations/20260124_alert_dedupe_functions.sql` - check_alert_dedupe, escalate_task_priority
- `supabase/migrations/20260124_due_date_calculation.sql` - calculate_alert_due_date, is_business_hours
- `supabase/migrations/20260124_alert_resolution_trigger.sql` - task_alert_resolution trigger

**n8n Workflows:**
- `business-os/workflows/alert-to-task.json` - Complete workflow JSON

**Documentation:**
- `business-os/workflows/README-alert-to-task.md` - Comprehensive workflow documentation
- `business-os/workflows/README.md` - Updated with Alert-to-Task entry

**Scripts:**
- `supabase/scripts/register-alert-to-task-workflow.sql` - Workflow registration template

### Key Decisions (Phase 8)

- [08-04]: Claude 3 Haiku selected for fast, cost-effective AI transformation
- [08-04]: Fallback verb mapping for 8 alert types when AI fails
- [08-04]: Priority-based due date: critical=4h, high=next day 17:00, normal=3d, low=7d
- [08-04]: Task created via direct Supabase INSERT (not Dashboard API)
- [08-05]: Dedupe key format: `{alert_type}:{affected_resource}`
- [08-05]: `check_alert_dedupe()` returns structured result with escalation recommendation
- [08-05]: `escalate_task_priority()` logs activity with `alert_escalation` source
- [08-06]: Business hours = 9am-6pm CT, weekdays only
- [08-06]: Critical alerts after hours due next business day 9am
- [08-06]: Warning alerts default to Friday 5pm if no metadata offset
- [08-07]: Added `alert_resolved` and `alert_escalation` to task_activity constraint
- [08-07]: Graceful handling when faculty_scheduler.alerts table doesn't exist

### Requirements Covered (Phase 8)

- ALT-01: System alerts create tasks automatically
- ALT-02: AI transforms alert titles to action-oriented task titles
- ALT-03: Deduplication prevents duplicate tasks for same issue
- ALT-04: Priority escalation when higher severity alert for existing task
- ALT-05: Info alerts accumulate (3x/24h) before creating task
- ALT-06: Business hours respected for due date calculation
- ALT-07: Completing alert task resolves source alert

## Phase 10 Summary

Phase 10 (Dashboard & Notifications) COMPLETE:

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 10-01 | Database Migration for Notification Preferences | 1 | COMPLETE |
| 10-02 | Install Dependencies - Resend and Sonner | 1 | COMPLETE |
| 10-03 | Action Center Dashboard Widget Component | 2 | COMPLETE |
| 10-04 | Navigation Badge with Real-time Subscription | 2 | COMPLETE |
| 10-05 | Widget Integration on Main Dashboard | 2 | COMPLETE |
| 10-06 | Notification Preferences Form in Settings | 3 | COMPLETE |
| 10-07 | Resend Email Service and Digest Template | 4 | COMPLETE |
| 10-08 | Digest Generation Function and API Endpoint | 4 | COMPLETE |
| 10-09 | n8n Workflow for Daily Digest Scheduling | 5 | COMPLETE |

### Files Created (Phase 10)

**Database Migrations:**
- `supabase/migrations/20260125_notification_prefs_task_counts.sql` - notification preferences columns, get_task_counts() RPC

**Dashboard Components:**
- `dashboard/src/components/widgets/action-center-widget.tsx` - Dashboard widget with count chips
- `dashboard/src/components/nav/action-center-badge.tsx` - Navigation badge component
- `dashboard/src/hooks/use-task-badge-count.ts` - Real-time task count hook
- `dashboard/src/components/ui/toggle.tsx` - Reusable toggle switch component

**Email System:**
- `dashboard/src/lib/email/resend.ts` - Resend client utility
- `dashboard/src/lib/email/templates/daily-digest.tsx` - React Email digest template
- `dashboard/src/lib/email/send-digest.ts` - Digest sending function
- `dashboard/src/lib/email/generate-digest-data.ts` - Digest data generation
- `dashboard/src/app/api/digest/send/route.ts` - Digest API endpoint

**n8n Workflows:**
- `business-os/workflows/daily-digest-sender.json` - Daily digest scheduling workflow
- `business-os/workflows/README-daily-digest.md` - Workflow documentation
- `supabase/scripts/register-daily-digest-workflow.sql` - Workflow registration script

**Modified Files:**
- `dashboard/src/app/dashboard/dashboard-content.tsx` - Widget and badge integration
- `dashboard/src/app/dashboard/page.tsx` - Task counts fetch
- `dashboard/src/app/settings/page.tsx` - Notification preferences section
- `dashboard/src/lib/supabase/types.ts` - Profile type with notification fields
- `dashboard/src/lib/api/task-queries.ts` - getTaskCounts() function

### Key Decisions (Phase 10)

- [10-01]: get_task_counts() returns badge_count as critical_count + overdue_count
- [10-02]: Sonner toasts with richColors and top-right position
- [10-03]: Count chips link to filtered task list views
- [10-04]: Real-time subscription with 1-minute polling fallback
- [10-04]: Badge hidden when count is 0 or loading
- [10-05]: Widget placed as first element in dashboard left column
- [10-06]: Toggle component uses semantic role="switch" and aria-checked
- [10-07]: Daily digest uses React Email with inline CSS for compatibility
- [10-07]: Digest skipped when no urgent items (configurable via forceSend)
- [10-08]: API supports single-user and batch mode with rate limiting
- [10-08]: Batch mode respects user timezone and digest_time preferences
- [10-09]: Workflow runs hourly 6-9am CT weekdays

### Requirements Covered (Phase 10)

- DASH-01 through DASH-05: Dashboard widget, task counts, navigation, badge
- NOTIF-01 through NOTIF-04: Daily digest, notification preferences, email template

## Phase 9 Summary

Phase 9 (Workflow Templates & Rules) COMPLETE:

| Plan | Name | Wave | Status |
|------|------|------|--------|
| 09-01 | Core Utilities | 1 | COMPLETE |
| 09-02 | Workflow Template Types and Validation | 1 | COMPLETE |
| 09-03 | Event Webhook Endpoint | 2 | COMPLETE |
| 09-04 | Workflow Template Instantiation | 2 | COMPLETE |
| 09-05 | Task Rule Execution | 2 | COMPLETE |
| 09-06 | Task Rules API Extensions | 3 | COMPLETE |
| 09-07 | Workflow Templates API | 3 | COMPLETE |
| 09-08 | n8n Workflows for Scheduled Rules | 4 | COMPLETE |

### Files Created (Phase 9)

**Core Libraries:**
- `dashboard/src/lib/action-center/template-utils.ts` - Condition evaluation, variable substitution, due date calculation, dedupe keys
- `dashboard/src/lib/action-center/workflow-template-types.ts` - TypeScript interfaces for workflow templates
- `dashboard/src/lib/action-center/workflow-template-validation.ts` - Zod schemas and validation functions
- `dashboard/src/lib/action-center/workflow-template-instantiation.ts` - Template to workflow/task conversion
- `dashboard/src/lib/action-center/task-rule-types.ts` - Rule types and Zod validation
- `dashboard/src/lib/action-center/task-rule-execution.ts` - Rule execution logic for all 3 rule types

**API Endpoints:**
- `dashboard/src/app/api/action-center/events/route.ts` - Event webhook (GET, POST)
- `dashboard/src/app/api/action-center/execute-rules/route.ts` - Execute scheduled rules (POST)
- `dashboard/src/app/api/action-center/workflow-templates/route.ts` - List, Create (GET, POST)
- `dashboard/src/app/api/action-center/workflow-templates/[id]/route.ts` - Get, Update, Delete (GET, PATCH, DELETE)
- `dashboard/src/app/api/action-center/workflow-templates/[id]/toggle/route.ts` - Toggle active (POST)
- `dashboard/src/app/api/action-center/workflow-templates/[id]/test/route.ts` - Dry run (GET, POST)
- `dashboard/src/app/api/action-center/task-rules/[id]/toggle/route.ts` - Toggle active (POST)
- `dashboard/src/app/api/action-center/task-rules/[id]/test/route.ts` - Dry run (GET, POST)

**Database Migrations:**
- `supabase/migrations/20260125_condition_query_rpc.sql` - Safe SQL execution RPC for condition rules

**n8n Workflows:**
- `business-os/workflows/recurring-rules-executor.json` - Daily 7:00 AM CT execution
- `business-os/workflows/condition-rules-executor.json` - Daily 7:05 AM CT execution
- `business-os/workflows/README-task-rules-executor.md` - Documentation

### Key Decisions (Phase 9)

- [09-01]: 6 condition operators: equals, not_equals, in, not_in, exists, not_exists
- [09-01]: Dedupe key format: `wt:{template_id}:{entity_id}` or `tr:{rule_id}:{entity_id}`
- [09-02]: Trigger event format: `entity.action` (e.g., `program_instance.created`)
- [09-02]: Used `z.record(z.string(), z.unknown())` for Zod v4 compatibility
- [09-03]: One event can trigger multiple templates - all matching ones fire
- [09-04]: Dependencies mapped from template order to actual task IDs after creation
- [09-04]: dryRunWorkflowTemplate() for testing without DB changes
- [09-05]: Three rule types: event, recurring (cron), condition (SQL query)
- [09-06]: Test endpoints show what would be created without persisting
- [09-08]: Recurring rules at 7:00 AM, condition rules at 7:05 AM to stagger load

### Requirements Covered (Phase 9)

- TMPL-01 through TMPL-08: Workflow template storage, triggers, conditions, instantiation
- RULE-01 through RULE-07: Task rules for event/recurring/condition triggers with deduplication

## Known Technical Debt

- **Supabase Types:** The generated types.ts doesn't include action_center schema. TypeScript shows type errors but code works at runtime. Should regenerate types to include action_center schema.

---
*Last updated: 2026-01-25 after 09-03 complete*
