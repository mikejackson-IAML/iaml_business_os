# Plan 01-06 Summary: RLS Policies and Permissions

## Completed: 2026-01-22

## What Was Done

Created Row-Level Security (RLS) policies and permission grants for all Action Center tables.

### Migration File Created

`supabase/migrations/20260122_action_center_rls.sql`

### RLS Enabled On

All 7 Action Center tables:
1. `action_center.tasks`
2. `action_center.workflows`
3. `action_center.sop_templates`
4. `action_center.task_rules`
5. `action_center.workflow_templates`
6. `action_center.task_comments`
7. `action_center.task_activity`

### Policies Created

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| tasks | authenticated | authenticated | authenticated | authenticated |
| workflows | authenticated | authenticated | authenticated | authenticated |
| sop_templates | authenticated | authenticated | authenticated | authenticated |
| task_rules | authenticated | authenticated | authenticated | authenticated |
| workflow_templates | authenticated | authenticated | authenticated | authenticated |
| task_comments | authenticated | authenticated | authenticated | authenticated |
| task_activity | authenticated | service_role | - | - |

**Total policies created:** 25

### Grants Issued

**Schema Usage:**
- `authenticated` can use `action_center` schema
- `service_role` can use `action_center` schema

**Table Permissions:**
- `authenticated`: SELECT, INSERT, UPDATE, DELETE on all tables (except task_activity: SELECT only)
- `service_role`: ALL on all tables

**View Permissions:**
- `authenticated`: SELECT on all views (tasks_extended, user_task_summary, department_task_summary, system_task_summary)

## Policy Strategy

This is a v1 permissive policy where all authenticated users can do everything. The design decision from PROJECT.md:

> "RLS policy for v1: allow all operations for authenticated users"

Future enhancements for multi-user support should include:
- Users can only see tasks they created or are assigned to (unless admin)
- Users can only update tasks assigned to them (unless admin)
- Only admins can delete tasks
- Department-based visibility rules

## Verification Queries

```sql
-- Verify RLS is enabled on all tables
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'action_center'
ORDER BY tablename;

-- Verify policies exist
SELECT schemaname, tablename, policyname, permissive, roles, cmd
FROM pg_policies
WHERE schemaname = 'action_center'
ORDER BY tablename, policyname;

-- Verify grants
SELECT table_schema, table_name, privilege_type, grantee
FROM information_schema.table_privileges
WHERE table_schema = 'action_center'
  AND grantee IN ('authenticated', 'service_role')
ORDER BY table_name, grantee, privilege_type;
```

## Commit

```
f67d21a feat(01-06): add RLS policies and permissions for Action Center
```
