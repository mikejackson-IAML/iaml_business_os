# Requirements: Action Center v1.0

**Defined:** 2026-01-22
**Core Value:** Nothing falls through the cracks. Every action item flows to one place.

## v1.0 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Database & Schema

- [ ] **DB-01**: Tasks table with all attributes (title, type, status, priority, due_date, assignee, etc.)
- [ ] **DB-02**: Workflows table linking related tasks
- [ ] **DB-03**: SOP templates table with ordered steps in JSONB
- [ ] **DB-04**: Task rules table for automatic generation
- [ ] **DB-05**: Workflow templates table with event triggers
- [ ] **DB-06**: Task comments table
- [ ] **DB-07**: Task activity log table
- [ ] **DB-08**: User task mastery tracking (task_mastery JSONB on users)
- [ ] **DB-09**: Views: tasks_extended, user_task_summary, department_task_summary
- [ ] **DB-10**: Triggers: workflow status update, mastery increment on completion

### Task API

- [ ] **API-01**: GET /api/tasks - list tasks with filters (assignee, status, priority, due date, department)
- [ ] **API-02**: POST /api/tasks - create task
- [ ] **API-03**: GET /api/tasks/:id - get task detail with instructions and dependencies
- [ ] **API-04**: PATCH /api/tasks/:id - update task
- [ ] **API-05**: POST /api/tasks/:id/complete - complete task with optional note
- [ ] **API-06**: POST /api/tasks/:id/dismiss - dismiss task with required reason
- [ ] **API-07**: POST /api/tasks/:id/comments - add comment
- [ ] **API-08**: GET /api/tasks/:id/activity - get activity log

### Workflow API

- [ ] **API-09**: GET /api/workflows - list workflows
- [ ] **API-10**: POST /api/workflows - create workflow
- [ ] **API-11**: GET /api/workflows/:id - get workflow with tasks
- [ ] **API-12**: PATCH /api/workflows/:id - update workflow
- [ ] **API-13**: POST /api/workflows/:id/tasks - add task to workflow

### SOP API

- [ ] **API-14**: GET /api/sops - list SOP templates
- [ ] **API-15**: POST /api/sops - create SOP template
- [ ] **API-16**: GET /api/sops/:id - get SOP detail
- [ ] **API-17**: PATCH /api/sops/:id - update SOP template

### Task Rules API

- [ ] **API-18**: GET /api/task-rules - list rules
- [ ] **API-19**: POST /api/task-rules - create rule
- [ ] **API-20**: PATCH /api/task-rules/:id - update rule (enable/disable)

### Task UI - List

- [ ] **UI-01**: Task list page with table/list view
- [ ] **UI-02**: Filter by status (open, in_progress, waiting, done, dismissed)
- [ ] **UI-03**: Filter by priority (critical, high, normal, low)
- [ ] **UI-04**: Filter by due date (overdue, today, this week, later)
- [ ] **UI-05**: Filter by department
- [ ] **UI-06**: Filter by task type (standard, approval, decision, review)
- [ ] **UI-07**: Filter by source (alert, workflow, manual, AI)
- [ ] **UI-08**: Search by title and description
- [ ] **UI-09**: Default views: My Focus, Overdue, Waiting, Approvals, AI Suggested
- [ ] **UI-10**: Task row shows: priority icon, title, due date, department, source indicator

### Task UI - Detail

- [ ] **UI-11**: Task detail page with all attributes
- [ ] **UI-12**: Status change dropdown (open → in_progress → done)
- [ ] **UI-13**: Complete button with completion note prompt
- [ ] **UI-14**: Dismiss button with required reason prompt
- [ ] **UI-15**: Related entity link (if applicable)
- [ ] **UI-16**: Workflow link and progress (if part of workflow)
- [ ] **UI-17**: Dependencies section: blocked by / blocking
- [ ] **UI-18**: Comments thread with add comment
- [ ] **UI-19**: Activity history

### Task UI - Create

- [ ] **UI-20**: Create task modal/page
- [ ] **UI-21**: Required: title, department
- [ ] **UI-22**: Optional: description, task type, priority, due date, assignee, workflow, related entity

### Approval Tasks

- [ ] **APPR-01**: Approval task type shows recommendation and reasoning
- [ ] **APPR-02**: Approval actions: Approve, Modify & Approve, Reject
- [ ] **APPR-03**: Modification requires details entry
- [ ] **APPR-04**: Approval outcome logged in activity

### SOP Templates

- [ ] **SOP-01**: SOP list page with search and filter by department/category
- [ ] **SOP-02**: SOP detail/edit page with ordered steps
- [ ] **SOP-03**: Step attributes: order, title, description, estimated_minutes, links, notes
- [ ] **SOP-04**: Preview at different mastery levels
- [ ] **SOP-05**: Usage stats (tasks referencing this SOP)

### Progressive Instructions

- [ ] **PROG-01**: Task with SOP reference shows instructions based on user mastery
- [ ] **PROG-02**: Mastery level 0-2 (Novice): full step-by-step
- [ ] **PROG-03**: Mastery level 3-5 (Developing): condensed key steps
- [ ] **PROG-04**: Mastery level 6-9 (Proficient): summary + link
- [ ] **PROG-05**: Mastery level 10+ (Expert): "You know this" + link
- [ ] **PROG-06**: "Show more/less detail" toggle
- [ ] **PROG-07**: Mastery auto-increments on task completion
- [ ] **PROG-08**: Variable substitution in instructions ({{program.name}}, etc.)

### Workflows

- [ ] **WF-01**: Workflow list page
- [ ] **WF-02**: Workflow detail page showing all tasks in dependency order
- [ ] **WF-03**: Progress indicator (X of Y complete)
- [ ] **WF-04**: Blocked tasks highlighted
- [ ] **WF-05**: Add task to workflow action
- [ ] **WF-06**: Workflow status computed: not_started, in_progress, blocked, completed

### Dependencies

- [ ] **DEP-01**: Task can depend on other tasks (multiple dependencies, AND logic)
- [ ] **DEP-02**: Dependent tasks show "blocked" indicator
- [ ] **DEP-03**: Soft enforcement: warning but can proceed
- [ ] **DEP-04**: "Blocked by" shows incomplete dependencies
- [ ] **DEP-05**: "Blocking" shows what this task blocks
- [ ] **DEP-06**: Dismissed task with dependents creates decision task

### Alert Integration

- [ ] **ALERT-01**: n8n workflow: new alert → create task
- [ ] **ALERT-02**: Critical alerts create critical priority tasks due today
- [ ] **ALERT-03**: Warning alerts create high priority tasks due this week
- [ ] **ALERT-04**: Info alerts do not create tasks
- [ ] **ALERT-05**: Duplicate prevention (check existing open task for alert)
- [ ] **ALERT-06**: Task links back to alert source

### Workflow Templates

- [ ] **TMPL-01**: Workflow template definition with trigger config
- [ ] **TMPL-02**: Event triggers (e.g., program_instance.created)
- [ ] **TMPL-03**: Trigger conditions (e.g., format = 'in-person')
- [ ] **TMPL-04**: Due date calculation from reference field + offset
- [ ] **TMPL-05**: Task templates with relative timing (days_before_due)
- [ ] **TMPL-06**: Dependency mapping within template
- [ ] **TMPL-07**: Role-based assignment
- [ ] **TMPL-08**: Variable substitution in title/description

### Task Rules

- [ ] **RULE-01**: Recurring rules (daily, weekly schedule)
- [ ] **RULE-02**: Event-triggered rules
- [ ] **RULE-03**: Condition-based rules (checked daily)
- [ ] **RULE-04**: n8n workflow: execute recurring rules on schedule
- [ ] **RULE-05**: n8n workflow: execute condition checks daily
- [ ] **RULE-06**: Duplicate prevention with dedupe_key
- [ ] **RULE-07**: Enable/disable rules

### Dashboard Widget

- [ ] **DASH-01**: Action Center widget on main dashboard
- [ ] **DASH-02**: Shows critical tasks count with tap to view
- [ ] **DASH-03**: Shows high priority tasks count
- [ ] **DASH-04**: "View all X tasks" link
- [ ] **DASH-05**: Task count badge in nav

### Notifications

- [ ] **NOTIF-01**: Daily digest email at 7am
- [ ] **NOTIF-02**: Digest shows: critical, due today, overdue, summary stats
- [ ] **NOTIF-03**: Notification preferences in settings
- [ ] **NOTIF-04**: Email digest on/off toggle

### AI Integration

- [ ] **AI-01**: Weekly AI Focus generation (Monday 7am)
- [ ] **AI-02**: AI analyzes open tasks, overdue items, patterns
- [ ] **AI-03**: Creates "Weekly Focus Review" task with prioritized list
- [ ] **AI-04**: AI-suggested tasks with status = 'suggested'
- [ ] **AI-05**: AI Suggested view shows pending suggestions
- [ ] **AI-06**: Accept/Reject/Modify flow for suggestions
- [ ] **AI-07**: Confidence score display
- [ ] **AI-08**: Pattern detection: idle segment, repeated task type, opportunity

### Metrics

- [ ] **MET-01**: Personal stats: completed this week, avg completion time, open, overdue
- [ ] **MET-02**: System overview: total open, overdue, created/completed 7d, completion rate
- [ ] **MET-03**: Department metrics: open, overdue, completion rate 30d
- [ ] **MET-04**: Task metrics feed into department health scores

## v1.1 Requirements (Future)

Deferred to next milestone. Tracked but not in current roadmap.

### iOS App

- **IOS-01**: Task list view in iOS app
- **IOS-02**: Task detail view in iOS app
- **IOS-03**: Complete tasks from iOS
- **IOS-04**: Add comments from iOS

### Multi-User

- **USER-01**: User management UI
- **USER-02**: Role assignment (owner, admin, manager, member, external)
- **USER-03**: Manager training override for SOPs
- **USER-04**: Team workload view
- **USER-05**: Task reassignment

### Advanced Features

- **ADV-01**: Slack notifications
- **ADV-02**: Calendar integration (due dates as events)
- **ADV-03**: Email-to-task creation
- **ADV-04**: Multi-step approval chains
- **ADV-05**: Custom fields per task type

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| iOS app screens | Web-first approach, defer to v1.1 |
| User management UI | Single-user (CEO) for v1, schema supports future |
| Hard dependency enforcement | Soft enforcement preferred, users can override |
| Notion integration for SOPs | Keep SOPs in Supabase for simplicity |
| Real-time collaboration | Single-user, no need for live sync |
| Time tracking | Not in original requirements |
| Gantt chart view | Future enhancement, basic workflow view first |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 to DB-10 | Phase 1 | Complete |
| API-01 to API-08 | Phase 2 | Complete |
| API-09 to API-20 | Phase 3 | Pending |
| UI-01 to UI-10 | Phase 4 | Pending |
| UI-11 to UI-22 | Phase 5 | Pending |
| APPR-01 to APPR-04 | Phase 5 | Pending |
| SOP-01 to SOP-05 | Phase 6 | Pending |
| PROG-01 to PROG-08 | Phase 6 | Pending |
| WF-01 to WF-06 | Phase 7 | Pending |
| DEP-01 to DEP-06 | Phase 7 | Pending |
| ALERT-01 to ALERT-06 | Phase 8 | Pending |
| TMPL-01 to TMPL-08 | Phase 9 | Pending |
| RULE-01 to RULE-07 | Phase 9 | Pending |
| DASH-01 to DASH-05 | Phase 10 | Pending |
| NOTIF-01 to NOTIF-04 | Phase 10 | Pending |
| AI-01 to AI-08 | Phase 11 | Pending |
| MET-01 to MET-04 | Phase 12 | Pending |

**Coverage:**
- v1.0 requirements: 87 total
- Mapped to phases: 87
- Unmapped: 0 ✓

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after roadmap creation*
