# Plan 07-01 Summary: Workflow Server Actions

## Deliverables

### Files Created
- `dashboard/src/app/dashboard/action-center/workflow-actions.ts` - Workflow server actions file

### Files Modified
- `dashboard/src/lib/api/task-types.ts` - Added `source` field to `CreateTaskRequest`
- `dashboard/src/lib/api/task-mutations.ts` - Updated `createTask` to use `data.source` parameter

### Server Actions Implemented

| Action | Purpose | Returns |
|--------|---------|---------|
| `getWorkflowsAction` | Fetch paginated workflow list with filters | `WorkflowListResult` |
| `getWorkflowDetailAction` | Fetch workflow with all associated tasks | `WorkflowDetailResult` |
| `addTaskToWorkflowAction` | Add existing task to a workflow | `ActionResult` |
| `createDecisionTaskAction` | Create decision task linked to parent | `ActionResult` with taskId |

### Types Defined

```typescript
interface CreateDecisionTaskRequest {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  department: string;
  workflow_id: string | null;
  parent_task_id: string;
  related_entity_type: 'task';
  related_entity_id: string;
}

interface WorkflowListResult {
  success: boolean;
  error?: string;
  data?: {
    workflows: WorkflowExtended[];
    cursor: string | null;
    has_more: boolean;
  };
}

interface WorkflowDetailResult {
  success: boolean;
  error?: string;
  data?: {
    workflow: WorkflowDetail;
  };
}
```

## Decisions Made

1. **ActionResult Pattern**: Reused existing `ActionResult` type from `actions.ts` for consistency
2. **Source Field Addition**: Extended `CreateTaskRequest` to include optional `source` field, defaulting to `'manual'` in `createTask` but allowing override
3. **Decision Task Source**: Decision tasks use `source: 'workflow'` to indicate they originate from workflow context
4. **Path Revalidation**: All mutation actions revalidate:
   - `/dashboard/action-center` (main list)
   - `/dashboard/action-center/workflows/{id}` (workflow detail if applicable)
   - `/dashboard/action-center/tasks/{id}` (related task details)

## Verification

- [x] `getWorkflowsAction` returns paginated workflow list
- [x] `getWorkflowDetailAction` returns workflow with tasks
- [x] `addTaskToWorkflowAction` successfully adds task and revalidates
- [x] `createDecisionTaskAction` creates decision task with correct fields
- [x] TypeScript compiles without errors (path aliases require Next.js context)

## Notes

- All server actions follow the established error handling pattern with user-friendly error messages
- Specific error codes (e.g., `WORKFLOW_NOT_FOUND`, `DUPLICATE_DEDUPE_KEY`) are translated to descriptive messages
- The `getTaskDependenciesAction` was also added to this file (part of plan 07-02) for dependency queries
