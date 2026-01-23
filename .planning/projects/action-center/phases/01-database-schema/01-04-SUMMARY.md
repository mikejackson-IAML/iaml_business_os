# Plan 01-04 Summary: Views

## Objective

Created database views for aggregated task data as specified in DB-09.

## Completed

### Views Created

| View | Purpose |
|------|---------|
| `tasks_extended` | Extended task view with computed fields and joins |
| `user_task_summary` | Per-user task statistics for personal dashboard |
| `department_task_summary` | Per-department task statistics |
| `system_task_summary` | System-wide task statistics for dashboard |

### tasks_extended View

Computed fields:
- `is_overdue` - Boolean based on due_date/due_time vs current time
- `due_category` - Enum: no_date, overdue, today, this_week, later
- `is_blocked` - Boolean if any dependencies are incomplete
- `blocked_by_count` - Count of incomplete dependencies
- `blocking_count` - Count of tasks this task blocks

Joined data:
- `workflow_name`, `workflow_status` - From workflows table
- `sop_name`, `sop_category` - From sop_templates table
- `assignee_name`, `assignee_email` - From profiles table

### user_task_summary View

Aggregates per user:
- Counts by status (open, in_progress, waiting, done, dismissed)
- Actionable count (open + in_progress)
- Overdue, due today, due this week counts
- Critical and high priority counts
- Completed this week and last 7 days
- Average completion time (30 days)

### department_task_summary View

Aggregates per department:
- Counts by status
- Overdue and due today counts
- Priority counts
- Created and completed last 7 days
- 30-day completion rate and average completion time

### system_task_summary View

System-wide aggregates:
- All status counts
- Actionable, overdue, due today counts
- Priority counts
- Weekly creation/completion metrics
- 7-day completion rate

## Migration File

`supabase/migrations/20260122_action_center_views.sql`

## Commits

1. `feat(01-04): create migration file header`
2. `feat(01-04): create tasks_extended view`
3. `feat(01-04): create user_task_summary view`
4. `feat(01-04): create department_task_summary view`
5. `feat(01-04): create system_task_summary view`

## Must Haves Satisfied

- [x] DB-09: tasks_extended view exists with is_overdue, due_category, is_blocked computed fields and joined workflow/SOP/assignee data
- [x] DB-09: user_task_summary view exists with counts by status, overdue, due dates, priority, completion metrics per user
- [x] DB-09: department_task_summary view exists with counts by status, overdue, priority, completion rate per department

## Next Step

Execute plan 01-05 (RLS Policies)
