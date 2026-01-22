# Action Center

## What This Is

A unified task management system within the IAML Business OS that consolidates all actionable items—alerts, approvals, workflow steps, AI recommendations, and manual tasks—into a single interface answering: "What do I need to do?" Built as a new section of the existing Next.js dashboard with Supabase tables and n8n automation.

## Core Value

Nothing falls through the cracks. Every action item flows to one place, with clear instructions scaled to user experience.

## Current Milestone: v1.0 Action Center

**Goal:** Build a complete task management system with automatic task generation, progressive instructions, and workflow dependencies.

**Target features:**
- Task CRUD with filtering, views, and comments
- SOP templates with step-by-step instructions
- Progressive instruction display based on user mastery
- Workflows with task dependencies
- Alert → Task integration (critical/warning alerts become tasks)
- Workflow templates triggered by events (e.g., program instance created)
- Task rules for recurring and condition-based task generation
- Dashboard widget showing priority tasks
- Daily digest notifications
- AI weekly focus generation and pattern detection

**Single-user for v1:** CEO-only, no user management UI, but schema supports multi-user expansion.

**Deferred to v1.1:** iOS app screens (web-first approach)

---

## Requirements

### Validated

(None yet — ship to validate)

### Active

*Task Management:*
- [ ] Task CRUD operations (create, read, update, complete, dismiss)
- [ ] Task types: standard, approval, decision, review
- [ ] Task priorities: critical, high, normal, low
- [ ] Task statuses: open, in_progress, waiting, done, dismissed
- [ ] Due dates with hard/soft types
- [ ] Task filtering and saved views
- [ ] Task comments and activity log

*SOPs & Instructions:*
- [ ] SOP template storage with ordered steps
- [ ] Progressive instruction display based on mastery level
- [ ] Mastery tracking per user per SOP
- [ ] Links and notes within SOP steps

*Workflows:*
- [ ] Workflow management (group related tasks)
- [ ] Task dependencies within workflows
- [ ] Dependency visualization (blocked by / blocking)
- [ ] Workflow status computed from task states

*Automation:*
- [ ] Alert → Task conversion (critical/warning alerts)
- [ ] Workflow templates with event triggers
- [ ] Recurring task rules (daily, weekly schedules)
- [ ] Condition-based task rules (checked periodically)
- [ ] Duplicate prevention for auto-generated tasks

*Dashboard & Notifications:*
- [ ] Action Center widget on main dashboard
- [ ] Daily digest email
- [ ] Notification preferences

*AI Integration:*
- [ ] Weekly AI Focus generation (Monday 7am)
- [ ] AI-suggested tasks with acceptance flow
- [ ] Pattern detection (idle segments, repeated tasks, opportunities)

### Out of Scope

- iOS app screens — deferred to v1.1, web-first approach
- Multi-user management UI — CEO-only for v1, schema supports future
- Team workload balancing — future feature
- Slack integration — future feature
- Calendar integration — future feature
- Multi-step approval chains — future feature
- Custom fields per task type — future feature

---

## Context

**Parent System:** IAML Business OS

**Codebase Location:**
- Dashboard UI: Existing Next.js dashboard (new pages under `/action-center`)
- API Routes: Same dashboard (`/api/tasks`, `/api/workflows`, `/api/sops`, etc.)
- Database: Supabase (new tables in public schema or dedicated schema)
- Automation: n8n workflows for task generation rules

**Existing Infrastructure to Integrate:**
- Alerts system (critical/warning alerts → tasks)
- Department health scores (task metrics feed into health)
- Program instances (workflow triggers)
- iOS app API routes (future: add task endpoints)

**PRD Reference:** Full PRD provided with detailed schema, UI wireframes, and edge cases.

## Constraints

- **Single-user v1**: No user management UI, but schema must support roles/permissions for future
- **Existing dashboard**: Must integrate with current Next.js + Tailwind + Radix UI patterns
- **Supabase**: All task data in Supabase, use existing patterns
- **n8n for automation**: Task generation rules execute via n8n workflows
- **No new frameworks**: Use existing stack (Next.js, Tailwind, Radix UI)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Web-first, iOS deferred | Focus on core system before mobile UI | — Pending |
| SOPs in Supabase, not Notion | Avoid external dependency, all data in one place | — Pending |
| Single-user schema with multi-user support | Build foundation right, skip management UI for now | — Pending |
| Soft dependency enforcement | Users can work on blocked tasks with warning, not hard block | — Pending |
| 4 mastery levels | Novice (0-2), Developing (3-5), Proficient (6-9), Expert (10+) | — Pending |

---
*Last updated: 2026-01-22 after initialization*
