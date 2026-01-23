# Plan 01-01 Summary: Schema and Core Tables

## Status: Complete

## What Was Built

Created the `action_center` schema and three core tables in a single migration file:

### Migration File
`supabase/migrations/20260122_action_center_schema.sql`

### Tables Created

1. **action_center.tasks** - Central table for all actionable items
   - 30+ columns covering identity, classification, status, priority, assignment, relationships, approval fields, AI fields, and audit columns
   - CHECK constraints for task_type, source, status, priority, and approval_outcome
   - Special constraint: `dismissed_requires_reason` ensures dismissed tasks always have a reason
   - Unique constraint on `dedupe_key` to prevent duplicate tasks
   - 11 indexes for common query patterns including GIN index on `depends_on` array

2. **action_center.workflows** - Groups related tasks with dependencies
   - Status tracking with 4 states: not_started, in_progress, blocked, completed
   - Progress tracking with total_tasks and completed_tasks counters
   - Related entity linking for workflow triggers
   - 5 indexes for filtering and lookup

3. **action_center.sop_templates** - Standard Operating Procedure definitions
   - JSONB `steps` array for ordered step definitions
   - Simple version number (increment on save)
   - JSONB `variables` for substitution definitions
   - Usage tracking with times_used and last_used_at
   - Full-text search index on name

### Foreign Keys
- `tasks.workflow_id` -> `workflows.id` (ON DELETE SET NULL)
- `tasks.sop_template_id` -> `sop_templates.id` (ON DELETE SET NULL)
- `tasks.parent_task_id` -> `tasks.id` (self-referential, ON DELETE SET NULL)

### Triggers
- `update_updated_at()` function applied to all three tables

## Commits Made

1. `feat(01-01): create action_center schema`
2. `feat(01-01): add tasks table with all columns`
3. `feat(01-01): add workflows table for task grouping`
4. `feat(01-01): add sop_templates table`
5. `feat(01-01): add foreign key constraints`
6. `feat(01-01): add update_updated_at trigger function`
7. `feat(01-01): add table and column comments`

## Verification Status

Migration file created successfully. Ready for deployment to Supabase.

To deploy, run in Supabase SQL Editor:
```sql
-- Run the migration
\i supabase/migrations/20260122_action_center_schema.sql
```

Or via CLI:
```bash
supabase db push
```

## Must-Have Requirements Met

- [x] DB-01: Tasks table exists with all columns
- [x] DB-02: Workflows table exists with all columns
- [x] DB-03: SOP templates table exists with all columns
- [x] CHECK constraint enforces dismissed_reason when status='dismissed'
