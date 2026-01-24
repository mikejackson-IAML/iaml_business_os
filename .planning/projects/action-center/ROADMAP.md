# Action Center - Roadmap

## Milestone: v1.0

**Goal:** Build a complete task management system with automatic task generation, progressive instructions, and workflow dependencies.

### Overview

This roadmap builds the Action Center in 12 phases, ordered by technical dependencies. Backend before frontend. Foundation before features. Automation after manual flows work.

**Build Order Rationale:**
1. Database first — everything depends on the schema
2. APIs before UI — backend must exist for frontend to consume
3. Basic UI before advanced — list/detail before workflows/dependencies
4. SOPs before progressive instructions — need content to display
5. Manual flows before automation — prove the core before auto-generation
6. Dashboard/notifications after core — aggregation needs data
7. AI last — needs patterns and data to analyze

### Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 1 | Database Schema | DB-01 to DB-10 | 10 |
| 2 | Task API | API-01 to API-08 | 8 |
| 3 | Workflow & SOP API | API-09 to API-20 | 12 |
| 4 | Task UI - List | UI-01 to UI-10 | 10 |
| 5 | Task UI - Detail & Create | UI-11 to UI-22, APPR-01 to APPR-04 | 16 |
| 6 | SOP Templates | SOP-01 to SOP-05, PROG-01 to PROG-08 | 13 |
| 7 | Workflows & Dependencies | WF-01 to WF-06, DEP-01 to DEP-06 | 12 |
| 8 | Alert Integration | ALERT-01 to ALERT-06 | 6 |
| 9 | Workflow Templates & Rules | TMPL-01 to TMPL-08, RULE-01 to RULE-07 | 15 |
| 10 | Dashboard & Notifications | DASH-01 to DASH-05, NOTIF-01 to NOTIF-04 | 9 |
| 11 | AI Integration | AI-01 to AI-08 | 8 |
| 12 | Metrics & Polish | MET-01 to MET-04 | 4 |

**Total:** 87 requirements across 12 phases

---

### Phase 1: Database Schema
**Goal:** Deploy all database tables, views, triggers, and functions
**Depends on:** Nothing (foundation)
**Requirements:** DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, DB-09, DB-10

**Success Criteria:**
1. Tasks table exists with all columns from PRD schema
2. Workflows, SOP templates, task rules, workflow templates tables exist
3. Task comments and activity log tables exist
4. tasks_extended, user_task_summary, department_task_summary views work
5. Workflow status trigger fires on task status change
6. Mastery increment trigger fires on task completion

**Plans:** 6 plans in 4 waves

Plans:
- [x] 01-01-PLAN.md — Schema and core tables (tasks, workflows, sop_templates) (Wave 1)
- [x] 01-02-PLAN.md — Supporting tables (task_rules, workflow_templates, comments, activity) (Wave 2)
- [x] 01-03-PLAN.md — User task mastery (task_mastery JSONB + helper functions) (Wave 2)
- [x] 01-04-PLAN.md — Views (tasks_extended, user_task_summary, department_task_summary) (Wave 3)
- [x] 01-05-PLAN.md — Triggers and functions (workflow status, mastery increment, activity logging) (Wave 3)
- [x] 01-06-PLAN.md — RLS policies and permissions (Wave 4)

---

### Phase 2: Task API
**Goal:** Full task CRUD API with filtering and actions
**Depends on:** Phase 1 (database schema)
**Requirements:** API-01, API-02, API-03, API-04, API-05, API-06, API-07, API-08

**Success Criteria:**
1. GET /api/tasks returns tasks with all filter options working
2. POST /api/tasks creates task with all required/optional fields
3. GET /api/tasks/:id returns full task detail
4. PATCH /api/tasks/:id updates allowed fields
5. POST /api/tasks/:id/complete marks task done with optional note
6. POST /api/tasks/:id/dismiss marks task dismissed with required reason
7. Comments and activity endpoints work correctly

**Plans:** 8 plans in 4 waves

Plans:
- [x] 02-01-PLAN.md — Types and validation (Wave 1)
- [x] 02-02-PLAN.md — Auth helpers (Wave 1)
- [x] 02-03-PLAN.md — Query functions (Wave 2)
- [x] 02-04-PLAN.md — Mutation functions (Wave 2)
- [x] 02-05-PLAN.md — List and create endpoints (Wave 3)
- [x] 02-06-PLAN.md — Get and update endpoints (Wave 3)
- [x] 02-07-PLAN.md — Complete, dismiss, and comments endpoints (Wave 4)
- [x] 02-08-PLAN.md — Activity endpoint (Wave 4)

---

### Phase 3: Workflow & SOP API
**Goal:** APIs for workflows, SOPs, and task rules
**Depends on:** Phase 1 (database schema)
**Requirements:** API-09, API-10, API-11, API-12, API-13, API-14, API-15, API-16, API-17, API-18, API-19, API-20

**Success Criteria:**
1. Workflow CRUD endpoints work correctly
2. Add task to workflow endpoint works
3. SOP template CRUD endpoints work
4. Task rules CRUD endpoints work
5. All endpoints require authentication

**Plans:** 9 plans in 5 waves

Plans:
- [x] 03-01-PLAN.md — Workflow types and validation (Wave 1)
- [x] 03-02-PLAN.md — SOP types and validation (Wave 1)
- [x] 03-03-PLAN.md — Task rule types and validation (Wave 1)
- [x] 03-04-PLAN.md — Workflow queries and mutations (Wave 2)
- [x] 03-05-PLAN.md — SOP queries and mutations (Wave 2)
- [x] 03-06-PLAN.md — Task rule queries and mutations (Wave 2)
- [x] 03-07-PLAN.md — Workflow CRUD endpoints (Wave 3)
- [x] 03-08-PLAN.md — Workflow tasks + SOP CRUD endpoints (Wave 4)
- [x] 03-09-PLAN.md — Task rules CRUD endpoints (Wave 5)

---

### Phase 4: Task UI - List
**Goal:** Task list page with filtering and saved views
**Depends on:** Phase 2 (task API)
**Requirements:** UI-01, UI-02, UI-03, UI-04, UI-05, UI-06, UI-07, UI-08, UI-09, UI-10

**Success Criteria:**
1. Task list page loads and displays tasks
2. All filter dropdowns work (status, priority, due, department, type, source)
3. Search by title/description works
4. Default views load correct filter presets
5. Task row shows all key info (priority, title, due, department, source)
6. Clicking task row navigates to detail

**Plans:** 5 plans in 3 waves

Plans:
- [x] 04-01-PLAN.md — Page foundation and skeleton (Wave 1)
- [x] 04-02-PLAN.md — View tabs component (Wave 1)
- [x] 04-03-PLAN.md — Filter toolbar component (Wave 1)
- [x] 04-04-PLAN.md — Task table and row components (Wave 2)
- [x] 04-05-PLAN.md — Content integration and state management (Wave 3)

---

### Phase 5: Task UI - Detail & Create
**Goal:** Task detail page with all actions and create modal
**Depends on:** Phase 4 (task list)
**Requirements:** UI-11, UI-12, UI-13, UI-14, UI-15, UI-16, UI-17, UI-18, UI-19, UI-20, UI-21, UI-22, APPR-01, APPR-02, APPR-03, APPR-04

**Success Criteria:**
1. Task detail page shows all task attributes
2. Status can be changed via dropdown
3. Complete button prompts for note and completes task
4. Dismiss button requires reason and dismisses task
5. Related entity links work
6. Workflow progress shows if applicable
7. Dependencies section shows blocked by / blocking
8. Comments thread works
9. Activity history displays
10. Create task modal works with all fields
11. Approval tasks show recommendation and have correct action buttons

**Plans:** 11 plans in 7 waves

Plans:
- [x] 05-01-PLAN.md — Server actions (Wave 1)
- [x] 05-02-PLAN.md — Detail page route with skeleton (Wave 1)
- [x] 05-03-PLAN.md — Task detail content with two-column layout (Wave 2)
- [x] 05-04-PLAN.md — Metadata sidebar component (Wave 2)
- [x] 05-05-PLAN.md — Complete and dismiss dialogs (Wave 3)
- [x] 05-06-PLAN.md — Comments tab (Wave 4)
- [x] 05-07-PLAN.md — Activity tab (Wave 4)
- [x] 05-08-PLAN.md — Create task modal (Wave 5)
- [x] 05-09-PLAN.md — Approval task UI (Wave 6)
- [x] 05-10-PLAN.md — Workflow context component (Wave 6)
- [x] 05-11-PLAN.md — Final integration (Wave 7)

---

### Phase 6: SOP Templates
**Goal:** SOP management UI and progressive instruction display
**Depends on:** Phase 3 (SOP API), Phase 5 (task detail)
**Requirements:** SOP-01, SOP-02, SOP-03, SOP-04, SOP-05, PROG-01, PROG-02, PROG-03, PROG-04, PROG-05, PROG-06, PROG-07, PROG-08

**Success Criteria:**
1. SOP list page with search and filters
2. SOP detail/edit page with step management
3. Steps have all attributes (order, title, description, minutes, links, notes)
4. Preview at different mastery levels works
5. Usage stats show tasks referencing SOP
6. Tasks with SOP reference show instructions at correct mastery level
7. Mastery auto-increments on completion
8. Variable substitution works in instructions

**Plans:** 10 plans in 6 waves

Plans:
- [x] 06-01-PLAN.md — SOP server actions (Wave 1)
- [x] 06-02-PLAN.md — Progressive instructions component (Wave 1)
- [x] 06-03-PLAN.md — SOP list page foundation (Wave 2)
- [x] 06-04-PLAN.md — SOP category group and row components (Wave 2)
- [x] 06-05-PLAN.md — SOP detail page skeleton (Wave 3)
- [x] 06-06-PLAN.md — Step editor component (Wave 4)
- [x] 06-07-PLAN.md — Step list with reordering (Wave 4)
- [x] 06-08-PLAN.md — SOP edit mode (Wave 5)
- [x] 06-09-PLAN.md — Mastery preview and usage stats (Wave 5)
- [x] 06-10-PLAN.md — Task detail integration (Wave 6)

---

### Phase 7: Workflows & Dependencies
**Goal:** Workflow UI and task dependency management
**Depends on:** Phase 5 (task detail)
**Requirements:** WF-01, WF-02, WF-03, WF-04, WF-05, WF-06, DEP-01, DEP-02, DEP-03, DEP-04, DEP-05, DEP-06

**Success Criteria:**
1. Workflow list page shows all workflows
2. Workflow detail shows tasks in dependency order
3. Progress indicator shows X of Y complete
4. Blocked tasks are highlighted
5. Can add task to workflow
6. Workflow status computed correctly
7. Tasks can have multiple dependencies
8. Dependent tasks show blocked indicator
9. Soft enforcement with warning works
10. Dismissing task with dependents creates decision task

**Plans:** TBD

---

### Phase 8: Alert Integration
**Goal:** Alerts automatically create tasks via n8n
**Depends on:** Phase 2 (task API)
**Requirements:** ALERT-01, ALERT-02, ALERT-03, ALERT-04, ALERT-05, ALERT-06

**Success Criteria:**
1. n8n workflow receives alert webhooks
2. Critical alerts create critical priority tasks due today
3. Warning alerts create high priority tasks due this week
4. Info alerts do not create tasks
5. Duplicate prevention works (no duplicate task for same alert)
6. Task links back to alert source

**Plans:** TBD

---

### Phase 9: Workflow Templates & Rules
**Goal:** Automatic task and workflow generation
**Depends on:** Phase 3 (rules API), Phase 7 (workflows)
**Requirements:** TMPL-01, TMPL-02, TMPL-03, TMPL-04, TMPL-05, TMPL-06, TMPL-07, TMPL-08, RULE-01, RULE-02, RULE-03, RULE-04, RULE-05, RULE-06, RULE-07

**Success Criteria:**
1. Workflow template definitions stored with triggers
2. Event triggers fire on matching events (e.g., program_instance.created)
3. Conditions filter trigger execution
4. Due dates calculated from reference + offset
5. Task templates have relative timing
6. Dependencies mapped within template
7. Recurring rules execute on schedule
8. Condition-based rules check daily
9. Duplicate prevention with dedupe_key

**Plans:** TBD

---

### Phase 10: Dashboard & Notifications
**Goal:** Dashboard widget and email digest
**Depends on:** Phase 4 (task list)
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04

**Success Criteria:**
1. Action Center widget on main dashboard
2. Shows critical and high priority task counts
3. Tap opens task list with appropriate filter
4. "View all" link works
5. Task count badge in nav
6. Daily digest email sends at 7am
7. Digest shows critical, due today, overdue, summary
8. Notification preferences in settings

**Plans:** TBD

---

### Phase 11: AI Integration
**Goal:** Weekly AI focus and suggested tasks
**Depends on:** Phase 9 (rules)
**Requirements:** AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08

**Success Criteria:**
1. Weekly AI Focus runs Monday 7am
2. AI analyzes open tasks, overdue, patterns
3. Creates "Weekly Focus Review" task
4. AI-suggested tasks have status = 'suggested'
5. AI Suggested view shows pending suggestions
6. Accept/Reject/Modify flow works
7. Confidence score displays
8. At least 2 pattern detection types working

**Plans:** TBD

---

### Phase 12: Metrics & Polish
**Goal:** Stats, reporting, and edge case handling
**Depends on:** Phase 10 (dashboard)
**Requirements:** MET-01, MET-02, MET-03, MET-04

**Success Criteria:**
1. Personal stats show on dashboard
2. System overview stats available
3. Department metrics show
4. Task metrics feed into department health scores
5. Edge cases handled (deleted entity, chain dismissal, overdue handling)
6. Completed task reopening within 7 days

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status |
|-------|----------------|--------|
| 1. Database Schema | 6/6 | COMPLETE |
| 2. Task API | 8/8 | COMPLETE |
| 3. Workflow & SOP API | 9/9 | COMPLETE |
| 4. Task UI - List | 5/5 | COMPLETE |
| 5. Task UI - Detail & Create | 11/11 | COMPLETE |
| 6. SOP Templates | 10/10 | COMPLETE |
| 7. Workflows & Dependencies | 0/? | Not started |
| 8. Alert Integration | 0/? | Not started |
| 9. Workflow Templates & Rules | 0/? | Not started |
| 10. Dashboard & Notifications | 0/? | Not started |
| 11. AI Integration | 0/? | Not started |
| 12. Metrics & Polish | 0/? | Not started |

---
*Roadmap created: 2026-01-22*
*Last updated: 2026-01-23 after completing Phase 5*
