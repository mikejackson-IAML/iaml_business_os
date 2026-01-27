# Phase 7: Workflows & Dependencies - Research Findings

**Researched:** 2026-01-24
**Status:** Ready for planning

---

## 1. Existing API

### Workflow Types (workflow-types.ts)

Complete type definitions exist for workflow operations:

```typescript
// Core workflow entity
interface Workflow {
  id: string;
  name: string;
  description: string | null;
  workflow_type: string | null;
  department: string | null;
  status: WorkflowStatus; // 'not_started' | 'in_progress' | 'blocked' | 'completed'
  related_entity_type: string | null;
  related_entity_id: string | null;
  template_id: string | null;
  total_tasks: number;
  completed_tasks: number;
  started_at: string | null;
  completed_at: string | null;
  target_completion_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Extended with computed fields
interface WorkflowExtended extends Workflow {
  progress_percentage: number;
  template_name: string | null;
}

// Full detail with tasks
interface WorkflowDetail extends WorkflowExtended {
  tasks: TaskExtended[];
  task_count_by_status: {
    open: number;
    in_progress: number;
    waiting: number;
    done: number;
    dismissed: number;
  };
}
```

### API Endpoints (Fully Implemented)

| Endpoint | Method | Purpose | Location |
|----------|--------|---------|----------|
| `/api/workflows` | GET | List workflows with filters | `dashboard/src/app/api/workflows/route.ts` |
| `/api/workflows` | POST | Create workflow | `dashboard/src/app/api/workflows/route.ts` |
| `/api/workflows/:id` | GET | Get workflow detail with tasks | `dashboard/src/app/api/workflows/[id]/route.ts` |
| `/api/workflows/:id` | PATCH | Update workflow | `dashboard/src/app/api/workflows/[id]/route.ts` |
| `/api/workflows/:id/tasks` | POST | Add task to workflow | `dashboard/src/app/api/workflows/[id]/tasks/route.ts` |

### Query Functions (action-center-workflow-queries.ts)

```typescript
// List with pagination and filters
async function listWorkflows(params: WorkflowListParams): Promise<ListWorkflowsResult>

// Get single workflow
async function getWorkflowById(id: string): Promise<WorkflowExtended | null>

// Get workflow with all tasks
async function getWorkflowDetail(id: string): Promise<WorkflowDetail | null>
```

### Mutation Functions (action-center-workflow-mutations.ts)

```typescript
// Create workflow
async function createWorkflow(data: CreateWorkflowRequest, createdBy: string | null): Promise<WorkflowExtended>

// Update workflow properties
async function updateWorkflow(id: string, data: UpdateWorkflowRequest, updatedBy: string | null): Promise<WorkflowExtended>

// Add task to workflow
async function addTaskToWorkflow(workflowId: string, taskId: string, updatedBy: string | null): Promise<void>

// Recompute workflow status from tasks
async function recomputeWorkflowStatus(workflowId: string): Promise<void>
```

### Task Types with Dependency Fields (task-types.ts)

```typescript
interface Task {
  // ... other fields ...
  depends_on: string[];  // Array of task IDs this depends on
  workflow_id: string | null;
}

interface TaskExtended extends Task {
  is_blocked: boolean;        // Computed: has incomplete dependencies
  blocked_by_count: number;   // Count of incomplete dependencies
  blocking_count: number;     // Count of tasks this blocks
  workflow_name: string | null;
  workflow_status: string | null;
}
```

---

## 2. Database Schema

### Workflows Table (action_center.workflows)

```sql
CREATE TABLE action_center.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT,  -- 'program_prep', 'onboarding', 'campaign', etc.
  department TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'blocked', 'completed'
  )),
  related_entity_type TEXT,
  related_entity_id UUID,
  template_id UUID,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  target_completion_date DATE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tasks Table - Dependency Fields

```sql
-- Key dependency field in action_center.tasks
depends_on UUID[] DEFAULT '{}',  -- Array of task IDs this depends on
```

### Tasks Extended View - Blocked Status Computation

The `tasks_extended` view computes blocked status in real-time:

```sql
-- is_blocked: TRUE if any dependency is incomplete
CASE
  WHEN t.depends_on IS NULL OR t.depends_on = '{}' THEN FALSE
  ELSE EXISTS (
    SELECT 1 FROM action_center.tasks dep
    WHERE dep.id = ANY(t.depends_on)
      AND dep.status NOT IN ('done', 'dismissed')
  )
END AS is_blocked,

-- blocked_by_count: Count of incomplete dependencies
(
  SELECT COUNT(*)::INTEGER FROM action_center.tasks dep
  WHERE dep.id = ANY(COALESCE(t.depends_on, '{}'))
    AND dep.status NOT IN ('done', 'dismissed')
) AS blocked_by_count,

-- blocking_count: Count of tasks this blocks
(
  SELECT COUNT(*)::INTEGER FROM action_center.tasks blocker
  WHERE t.id = ANY(COALESCE(blocker.depends_on, '{}'))
    AND blocker.status NOT IN ('done', 'dismissed')
) AS blocking_count
```

### Workflow Status Computation Trigger

```sql
-- Trigger fires on task status/workflow_id changes
CREATE TRIGGER trigger_task_workflow_status
  AFTER INSERT OR UPDATE OF status, workflow_id OR DELETE
  ON action_center.tasks
  FOR EACH ROW
  EXECUTE FUNCTION action_center.trigger_update_workflow_status();

-- Function computes status
CREATE OR REPLACE FUNCTION action_center.compute_workflow_status(p_workflow_id UUID)
RETURNS TEXT AS $$
-- Returns: not_started, in_progress, blocked, completed
-- Logic:
--   - If no tasks: not_started
--   - If all done: completed
--   - If any waiting: blocked
--   - If any in_progress or completed: in_progress
--   - Otherwise: not_started
```

### Dependency Unblock Trigger

When a blocking task completes, dependent tasks are automatically unblocked:

```sql
-- Trigger on task status change
CREATE TRIGGER trigger_dependency_completion
  AFTER UPDATE OF status
  ON action_center.tasks
  FOR EACH ROW
  EXECUTE FUNCTION action_center.trigger_update_dependent_tasks();

-- Moves 'waiting' tasks to 'open' when all dependencies complete
```

---

## 3. Existing UI Patterns

### Task List Table (task-table.tsx + task-row.tsx)

The existing task list uses a table format with consistent column layout:

```tsx
// Table header columns
<div className="grid grid-cols-[100px_1fr_120px_120px_100px] gap-4">
  <div>Priority</div>
  <div>Task</div>
  <div>Due</div>
  <div>Department</div>
  <div>Source</div>
</div>
```

**Key patterns:**
- Card container with border-bottom between rows
- Link wrapping entire row for navigation
- Priority shown as colored dot + text
- Blocked badge shown inline with title
- Empty states for "no results" and "all caught up"

### SOP List Pattern (sop-row.tsx)

Similar row-based pattern with:
- Icon on left in rounded container
- Primary text + metadata row
- Badge on right for usage stats
- Hover state: `hover:bg-muted/50`

### Workflow Context Component (workflow-context.tsx)

Already exists for showing workflow info on task detail page:

```tsx
// Shows when task belongs to a workflow
<Card>
  <CardHeader>
    <CardTitle>Part of Workflow</CardTitle>
  </CardHeader>
  <CardContent>
    {/* Workflow name + status badge */}
    {/* Progress bar with "X of Y complete" */}
    {/* Collapsible task list with status icons */}
  </CardContent>
</Card>
```

**Reusable patterns:**
- Status config map for variant colors
- Progress percentage calculation
- Status icon mapping (CheckCircle, Clock, Circle)
- Status color mapping (emerald, amber, muted)

### Task Detail Layout (task-detail-content.tsx)

Two-column layout:
- Left: Main content (description, instructions, workflow context, dependencies)
- Right: Metadata sidebar

**Dependency display (currently minimal):**
```tsx
{(task.blocked_by_count > 0 || task.blocking_count > 0) && (
  <Card>
    <CardHeader><CardTitle>Dependencies</CardTitle></CardHeader>
    <CardContent>
      {/* "Blocked by X task(s)" with warning icon */}
      {/* "Blocking X task(s)" with info icon */}
    </CardContent>
  </Card>
)}
```

### Dismiss Task Dialog (dismiss-task-dialog.tsx)

Pattern for modal dialogs:
- Fixed overlay with backdrop blur
- Card-based modal content
- Reason selection (required) + notes (optional)
- Cancel + destructive action buttons
- Error state display
- Loading state with isPending

---

## 4. Gap Analysis

### UI Pages Needed

| Page | Exists | Notes |
|------|--------|-------|
| Workflow list page | No | Route: `/dashboard/action-center/workflows` |
| Workflow detail page | No | Route: `/dashboard/action-center/workflows/[id]` |

### Components Needed

| Component | Exists | Notes |
|-----------|--------|-------|
| WorkflowTable | No | Similar to TaskTable - list view |
| WorkflowRow | No | Similar to TaskRow - single row |
| WorkflowFilters | No | Status + department filters |
| WorkflowDetailContent | No | Header + task list with dependencies |
| WorkflowProgress | Partial | Logic exists in workflow-context.tsx |
| TaskDependencyList | No | Show blocked by / blocking tasks with links |
| AddTaskToWorkflowModal | No | Select task to add to workflow |
| DismissWithDependentsDialog | No | Handle cascade when dismissing blocking task |

### API Additions Needed

| Endpoint/Function | Exists | Notes |
|-------------------|--------|-------|
| Get tasks blocked by a task | No | Need query for dependency visualization |
| Get tasks that block a task | No | Need query for dependency visualization |
| Create decision task | No | Need for dismiss cascade |
| Bulk update dependencies | No | Optional - for drag-drop reordering |

### Missing Patterns

1. **Decision Task Creation**
   - Task type 'decision' exists in schema
   - No dedicated creation function for cascade scenarios
   - Need to create task with:
     - `task_type: 'decision'`
     - `source: 'workflow'` or `source: 'ai'`
     - `parent_task_id: dismissedTaskId`
     - `related_entity_type: 'task'`
     - `related_entity_id: dismissedTaskId`

2. **Dependency Visualization**
   - `depends_on` is stored as UUID array
   - Need to fetch actual task details for blocked by / blocking lists
   - Consider denormalizing or adding RPC function

3. **Soft Block Enforcement**
   - PRD specifies soft block with warning
   - No current enforcement - user can complete blocked tasks
   - Need UI to show warning but allow override

---

## 5. Technical Decisions

### Recommended Approach

#### Workflow List Page

**Decision:** Use same table pattern as task list

**Columns:**
- Status icon (color-coded circle)
- Name (with description on hover or second line)
- Progress ("3/5 complete" or mini progress bar)
- Due date (target_completion_date)
- Department

**Filters:**
- Status multi-select (not_started, in_progress, blocked, completed)
- Department dropdown

#### Workflow Detail Page

**Decision:** Header with progress + task list below

**Header:**
- Workflow name + description
- Status badge
- Progress ring/bar with "X of Y complete"
- Target completion date
- Edit/settings button (future)

**Task List:**
- Order by: dependency depth, then priority, then due date
- Indentation for dependent tasks (show what they depend on)
- Blocked tasks: muted opacity + warning badge
- Each task row links to task detail

#### Blocked Task Treatment

**Decision:** Soft enforcement with visual warning

**Visual:**
- Muted text color (text-muted-foreground)
- Warning badge: "Blocked by N tasks"
- On hover/expand: Show list of blocking tasks as links

**Enforcement:**
- Allow Complete/Dismiss actions on blocked tasks
- Show confirmation dialog: "This task is blocked by N incomplete tasks. Complete anyway?"
- Log activity entry for "completed despite blocks"

#### Dependency Section Enhancements

**Decision:** Show both directions

**Blocked By:**
- List of tasks that must complete first
- Each item: task title + status badge + link
- If all complete, show checkmark

**Blocking:**
- List of tasks waiting on this one
- Each item: task title + status badge + link
- Useful context for prioritization

#### Dismiss with Dependents

**Decision:** Create decision task with modal preview

**Flow:**
1. User clicks Dismiss on task with blocking_count > 0
2. Modal shows:
   - "This task is blocking X other tasks"
   - List of affected tasks
   - Options:
     - "Dismiss and unblock dependents" (marks dependents as no longer blocked)
     - "Dismiss and create decision task" (creates task to handle cascade)
     - "Cancel"
3. If decision task chosen:
   - Create task with type 'decision'
   - Title: "Handle dismissed dependency: [original title]"
   - Description: Lists affected tasks
   - Options in task: reassign dependencies / dismiss all / keep unblocked

**Decision Task Fields:**
```typescript
{
  title: `Handle dismissed dependency: ${dismissedTask.title}`,
  description: `The task "${dismissedTask.title}" was dismissed. This affects ${N} dependent tasks...`,
  task_type: 'decision',
  source: 'workflow',
  priority: dismissedTask.priority,
  department: dismissedTask.department,
  workflow_id: dismissedTask.workflow_id,
  parent_task_id: dismissedTask.id,
  related_entity_type: 'task',
  related_entity_id: dismissedTask.id,
}
```

---

## 6. Key Files Reference

### API Layer
- `/dashboard/src/lib/api/workflow-types.ts` - Type definitions
- `/dashboard/src/lib/api/action-center-workflow-queries.ts` - Read operations
- `/dashboard/src/lib/api/action-center-workflow-mutations.ts` - Write operations
- `/dashboard/src/lib/api/workflow-validation.ts` - Validation functions
- `/dashboard/src/app/api/workflows/` - API routes

### Database
- `/supabase/migrations/20260122_action_center_schema.sql` - Core tables
- `/supabase/migrations/20260122_action_center_views.sql` - tasks_extended view
- `/supabase/migrations/20260122_action_center_triggers.sql` - Status computation

### UI Components
- `/dashboard/src/app/dashboard/action-center/components/task-table.tsx` - Table pattern
- `/dashboard/src/app/dashboard/action-center/components/task-row.tsx` - Row pattern
- `/dashboard/src/app/dashboard/action-center/components/workflow-context.tsx` - Existing workflow display
- `/dashboard/src/app/dashboard/action-center/components/dismiss-task-dialog.tsx` - Dialog pattern
- `/dashboard/src/app/dashboard/action-center/tasks/[id]/task-detail-content.tsx` - Detail layout

---

## 7. Implementation Priority

### Critical Path (Core Requirements)

1. **Workflow list page** (WF-01)
   - Route structure
   - WorkflowTable + WorkflowRow components
   - Filters for status and department

2. **Workflow detail page** (WF-02, WF-03, WF-04)
   - WorkflowDetailContent with header
   - Task list with dependency ordering
   - Progress indicator
   - Blocked task highlighting

3. **Add task to workflow** (WF-05)
   - UI action from workflow detail
   - Uses existing POST /api/workflows/:id/tasks

4. **Dependency visualization** (DEP-02, DEP-04, DEP-05)
   - Enhanced dependency section on task detail
   - Show blocking/blocked by with links

5. **Dismiss with dependents** (DEP-06)
   - Enhanced dismiss dialog
   - Decision task creation

### Secondary (Nice to Have)

- Workflow creation from UI (currently API-only)
- Drag-drop task ordering within workflow
- Dependency graph visualization
- Bulk dependency management

---

*Research complete - ready for phase planning*
