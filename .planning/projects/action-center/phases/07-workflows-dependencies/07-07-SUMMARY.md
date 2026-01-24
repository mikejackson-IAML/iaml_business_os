# Plan 07-07 Summary: Workflow Task List with Dependencies

## Status: COMPLETE

## Deliverables

### Files Created
1. **`dashboard/src/app/dashboard/action-center/components/workflow-task-row.tsx`**
   - Single task row component for workflow task list
   - Link wrapper to task detail page
   - Visual indentation based on depth (0, 1, 2 levels)
   - Status icons: CheckCircle=done, Clock=in_progress/waiting, Circle=open
   - Priority indicator colored dot
   - Due date with overdue/today highlighting
   - Blocked badge showing count of blocking tasks
   - Blocked-by indicator showing parent task name

2. **`dashboard/src/app/dashboard/action-center/components/workflow-task-list.tsx`**
   - Container component with "Tasks in this Workflow" header
   - Card wrapper with divide-y for task rows
   - `sortTasksByDependency` function using Kahn's algorithm for topological sort
   - Builds dependency graph from `depends_on` arrays
   - Calculates depth level (0=root, 1-2=dependent, capped at 2)
   - Handles circular dependencies gracefully with console warning
   - Empty state for workflows without tasks

### Files Modified
1. **`dashboard/src/app/dashboard/action-center/workflows/[id]/workflow-detail-content.tsx`**
   - Imported WorkflowTaskList component
   - Replaced placeholder task list with WorkflowTaskList
   - Passes workflow.tasks for dependency-sorted display

2. **`dashboard/src/app/dashboard/action-center/components/index.ts`**
   - Added export for WorkflowTaskList
   - Added export for WorkflowTaskRow

## Decisions Made

1. **Depth capped at 2 levels**: Visual indentation is limited to 3 levels (0, 1, 2) to maintain readability while still showing dependency hierarchy.

2. **Blocked-by indicator shows first dependency**: When a task has multiple dependencies, only the first one's name is shown in the blocked-by indicator to keep the UI clean.

3. **Circular dependency handling**: Tasks with circular dependencies are logged with a warning and placed at the end of the list rather than crashing.

4. **taskStatusConfig retained**: The config was kept in workflow-detail-content.tsx as it's still used for the task count breakdown badges in the header.

## Requirements Covered

- **WF-02**: Tasks display in dependency order (parents before children)
- **WF-04**: Blocked tasks show muted styling and warning badge
- **must_have_1**: Tasks in dependency order, not just creation order
- **must_have_2**: Blocked tasks visually highlighted per context decision
- **must_have_3**: Indentation clearly shows dependency relationships
- **must_have_4**: Task rows are clickable links to detail pages

## Verification Checklist

- [x] Tasks display in dependency order (parents before children)
- [x] Dependent tasks are visually indented
- [x] Blocked tasks show muted styling and warning badge
- [x] Clicking task row navigates to task detail
- [x] Status icons match task status
- [x] Empty state shows when workflow has no tasks
- [x] Progress matches header (X of Y complete) - uses same data source

## Notes

- The dependency sorting algorithm handles edge cases including:
  - Tasks with no dependencies (sorted first)
  - Tasks with dependencies outside the current workflow (treated as no dependency)
  - Circular dependencies (warned and flattened)
- Priority colors match the existing task row component pattern
- Due date highlighting follows the same pattern as task list
