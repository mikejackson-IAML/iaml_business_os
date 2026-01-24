# Plan 07-10 Summary: Dismiss with Dependents Dialog

## Status: COMPLETE

## Deliverables

### Files Created
- `dashboard/src/app/dashboard/action-center/components/dismiss-with-dependents-dialog.tsx` - Enhanced dismiss dialog for tasks with dependents

### Files Modified
- `dashboard/src/app/dashboard/action-center/components/dismiss-task-dialog.tsx` - Added blockingCount prop and soft enforcement warning
- `dashboard/src/app/dashboard/action-center/tasks/[id]/task-detail-content.tsx` - Integrated both dismiss dialogs with state management
- `dashboard/src/app/dashboard/action-center/components/index.ts` - Added DismissWithDependentsDialog export

## Implementation Details

### DismissWithDependentsDialog Component
- Modal overlay following existing action center pattern
- Header: "Dismiss Task with Dependents" with XCircle icon
- Warning section with amber styling showing affected task count
- Collapsible list of blocking tasks with status indicators and links
- Two radio button options:
  1. **Dismiss and unblock dependents** - Dependents naturally unblock when task is dismissed
  2. **Dismiss and create decision task** (default, safer option) - Creates a new decision task with:
     - Title: "Handle dismissed dependency: [task title]"
     - Description: Contains reason, notes, and list of affected task titles
     - Task type: decision
     - Same priority, department, and workflow as dismissed task
     - Parent task ID set to dismissed task

### DismissTaskDialog Updates
- Added `blockingCount` prop (default 0)
- Added `onShowDependentsDialog` callback prop
- Shows amber warning banner when task has dependents (DEP-03 soft enforcement)
- Warning includes count and "Handle Dependents" button to switch to enhanced dialog
- Users can still dismiss normally with warning visible

### Task Detail Content Integration
- Imports and renders both DismissTaskDialog and DismissWithDependentsDialog
- Manages state for both dialogs independently
- Passes blocking_count from task to DismissTaskDialog
- Provides callback to switch from regular to enhanced dialog
- Passes task metadata (priority, department, workflowId) to DismissWithDependentsDialog

## Requirements Covered

| Requirement | Implementation |
|-------------|----------------|
| DEP-06: Dismissed task with dependents creates decision task | DismissWithDependentsDialog creates decision task when "create decision task" option selected |
| Must show affected tasks before confirming dismiss | Collapsible list shows all blocking tasks with status |
| DEP-03: Soft enforcement (warning but can proceed) | Both dialogs allow dismissal with warning; user chooses handling |
| Decision task contains context | Description includes reason, notes, and affected task list |

## Decisions Made

1. **Default to "create decision task" option** - Safer choice, prevents accidental orphaning of dependent tasks
2. **Soft enforcement in both dialogs** - DismissTaskDialog shows warning but allows proceed; enhanced dialog gives explicit choice
3. **Lazy load blocking tasks** - Only fetches when dialog opens to avoid unnecessary API calls
4. **Use existing createTaskAction** - Reuses existing server action for decision task creation
5. **Pass task metadata to decision task** - Priority, department, and workflow_id carry forward to maintain context

## Verification Checklist

- [x] Regular dismiss dialog works for tasks without dependents
- [x] Enhanced dialog shows when task has blocking_count > 0
- [x] Lists affected tasks in the dialog (collapsible)
- [x] Option 1 dismisses task normally (dependents unblock automatically)
- [x] Option 2 dismisses task AND creates decision task (DEP-06)
- [x] Decision task has correct fields and links to dismissed task
- [x] Soft enforcement: can proceed with warning (DEP-03)

## Technical Notes

- Decision task uses `source: 'workflow'` to indicate system-generated
- Decision task's `parent_task_id` references the dismissed task for traceability
- BlockingTaskItem component reuses same pattern as TaskDependencies for consistency
- Error handling includes fallback if decision task creation fails after dismiss
