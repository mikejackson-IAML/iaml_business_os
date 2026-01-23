# Plan 03-04 Summary: Workflow Queries and Mutations

## What Was Built

Created database query and mutation functions for the Action Center workflows, following the patterns established in task-queries.ts and task-mutations.ts.

### Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/lib/api/action-center-workflow-queries.ts` | Read operations for action_center.workflows |
| `dashboard/src/lib/api/action-center-workflow-mutations.ts` | Write operations for action_center.workflows |

### Query Functions (action-center-workflow-queries.ts)

| Function | Description |
|----------|-------------|
| `listWorkflows(params)` | Cursor-based pagination with filters for status, department, workflow_type, search |
| `getWorkflowById(id)` | Fetch single workflow with computed progress_percentage and template_name |
| `getWorkflowDetail(id)` | Fetch workflow with tasks array and task_count_by_status summary |

### Mutation Functions (action-center-workflow-mutations.ts)

| Function | Description |
|----------|-------------|
| `createWorkflow(data, createdBy)` | Create new workflow with metadata |
| `updateWorkflow(id, data, updatedBy)` | Partial update of workflow fields |
| `addTaskToWorkflow(workflowId, taskId, updatedBy)` | Link task to workflow and update task counts |
| `recomputeWorkflowStatus(workflowId)` | Derive workflow status from task states |

### Features

**Query Features:**
- Cursor-based pagination with configurable limit (max 100)
- Filters: status[], department, workflow_type, search (name/description)
- Sort by: created_at (default), name, target_completion_date
- Computed fields: progress_percentage, template_name

**Mutation Features:**
- Partial updates (only provided fields updated)
- Audit tracking (created_by, updated_by)
- Automatic task count updates when tasks added
- Status derivation logic based on task states

## Naming Note

Files were named `action-center-workflow-*.ts` instead of `workflow-*.ts` because `workflow-queries.ts` already exists for the n8n workflow health dashboard (different feature).

## Must Haves Verification

| Requirement | Status |
|-------------|--------|
| Query functions exist: listWorkflows, getWorkflowById, getWorkflowDetail | Done |
| Mutation functions exist: createWorkflow, updateWorkflow, addTaskToWorkflow, recomputeWorkflowStatus | Done |
| listWorkflows supports cursor-based pagination with filters | Done |
| getWorkflowDetail returns workflow with tasks array and task_count_by_status | Done |
| addTaskToWorkflow updates both task's workflow_id and workflow's task counts | Done |

## Commits

1. `feat(03-04): add workflow query functions` - Query functions for listing and fetching workflows
2. `feat(03-04): add workflow mutation functions` - Mutation functions for CRUD operations

## TypeScript Notes

The Supabase type definitions (`dashboard/src/lib/supabase/types.ts`) do not include the `action_center` schema tables. This matches the existing task-queries/mutations pattern - the code is structurally correct but relies on runtime behavior rather than compile-time type checking for these specific tables. This is a pre-existing condition from Phase 2.
