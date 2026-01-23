# Phase 1: Database Schema - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Deploy all database tables, views, triggers, and functions for the Action Center task management system. This includes tasks, workflows, SOP templates, task rules, workflow templates, comments, activity logs, and supporting views/triggers.

</domain>

<decisions>
## Implementation Decisions

### Schema location
- Dedicated `action_center` schema (matches n8n_brain pattern)
- Plural table names: tasks, workflows, sop_templates, etc.
- Enable Row-Level Security from the start
- Use `gen_random_uuid()` for UUIDs (built-in, no extension)

### Task status model
- 5-status model: open, in_progress, waiting, done, dismissed
- `waiting` is computed from dependencies (auto-set if has incomplete deps), can also be set manually
- No status transition enforcement at DB level (UI handles appropriate options)
- `dismissed_reason` required via CHECK constraint when status='dismissed'

### SOP storage
- Steps stored as JSONB array on sop_templates table
- Simple version number (increment on save, don't keep old versions)
- 4-tier mastery levels: 0-2=Novice (full), 3-5=Developing (condensed), 6-9=Proficient (summary), 10+=Expert (link only)
- User mastery stored as JSONB on users table: `task_mastery` column with `{sop_id: level, ...}`

### Multi-user prep
- `assignee_id` UUID column, nullable (references users table)
- Include `created_by` and `updated_by` audit columns on all tables
- No separate owner concept — single assignee per task
- RLS policy for v1: allow all operations for authenticated users

### Claude's Discretion
- Exact column order within tables
- Index naming conventions
- Trigger function naming
- Whether to use partial indexes vs full indexes

</decisions>

<specifics>
## Specific Ideas

- Match n8n_brain pattern for schema organization
- CHECK constraint pattern: `status = 'dismissed' AND dismissed_reason IS NOT NULL` or `status != 'dismissed'`
- Computed `waiting` status via view or trigger that checks dependency completion

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-database-schema*
*Context gathered: 2026-01-22*
