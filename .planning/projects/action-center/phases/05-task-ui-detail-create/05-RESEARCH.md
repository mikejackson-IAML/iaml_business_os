# Phase 5: Task UI - Detail & Create - Research

**Completed:** 2026-01-23
**Purpose:** Answer "What do I need to know to PLAN this phase well?"

---

## 1. Component Inventory

### Dashboard-kit UI Components Available

| Component | Location | Notes |
|-----------|----------|-------|
| Button | `@/dashboard-kit/components/ui/button` | Variants: default, destructive, outline, secondary, ghost, link, success, warning, danger |
| Badge | `@/dashboard-kit/components/ui/badge` | Variants: default, secondary, destructive, outline, healthy, warning, critical, info |
| Card | `@/dashboard-kit/components/ui/card` | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| Input | `@/dashboard-kit/components/ui/input` | Standard input component |
| Tabs | `@/dashboard-kit/components/ui/tabs` | Tabs, TabsList, TabsTrigger, TabsContent (Radix-based) |
| Skeleton | `@/dashboard-kit/components/ui/skeleton` | Various skeleton variants for loading states |
| Tooltip | `@/dashboard-kit/components/ui/tooltip` | TooltipProvider, Tooltip, TooltipTrigger, TooltipContent |
| Progress | `@/dashboard-kit/components/ui/progress` | Progress bar component |

### Dashboard-kit Dashboard Components Available

| Component | Location | Notes |
|-----------|----------|-------|
| MetricCard | `@/dashboard-kit/components/dashboard/metric-card` | For displaying stats |
| ActivityFeed | `@/dashboard-kit/components/dashboard/activity-feed` | Timeline-style activity display |
| StatusIndicator | `@/dashboard-kit/components/dashboard/status-indicator` | Status badges |

### Components NOT in Dashboard-kit (Need to be Built or Use Native)

| Component | Current Pattern | Recommendation |
|-----------|-----------------|----------------|
| Dialog/Modal | Custom implementation using fixed positioning + Card | Follow `launch-modal.tsx` or `assign-instructor-modal.tsx` pattern |
| Select/Dropdown | Custom `FilterDropdown` in task-filters.tsx | Build custom select or use native `<select>` |
| Textarea | Not present | Use native `<textarea>` with same styling as Input |
| Label | Not present | Use `<label>` with consistent styling |

### Phase 4 Components to Reuse/Extend

| Component | File | Reuse For |
|-----------|------|-----------|
| TaskExtended type | `@/lib/api/task-types.ts` | Type definitions |
| Priority config (colors) | `task-row.tsx` | Priority indicators |
| Status config (colors) | `task-row-expanded.tsx` | Status badges |
| Source icons | `task-row.tsx` | Source indicators |
| Due date formatting | `task-row.tsx` | Date display logic |

---

## 2. API Integration Patterns

### Existing Task API Endpoints

| Endpoint | Method | Purpose | Implementation |
|----------|--------|---------|----------------|
| `/api/tasks/:id` | GET | Get task detail with comments & activity | `getTaskById`, `getTaskComments`, `getTaskActivity` |
| `/api/tasks/:id` | PATCH | Update task fields | `updateTask` |
| `/api/tasks/:id/complete` | POST | Mark task done with optional note | `completeTask` |
| `/api/tasks/:id/dismiss` | POST | Dismiss task with required reason | `dismissTask` |
| `/api/tasks/:id/comments` | POST | Add comment | `addTaskComment` |
| `/api/tasks` | POST | Create new task | `createTask` |

### Data Fetching Pattern (Server Components)

From `action-center-data-loader.tsx` and `workflow-detail/page.tsx`:

```typescript
// Pattern: Async server component fetches data, passes to client component
async function DataLoader({ id }: { id: string }) {
  const [task, comments, activity] = await Promise.all([
    getTaskById(id),
    getTaskComments(id),
    getTaskActivity(id, 10),
  ]);

  if (!task) notFound();

  return <TaskDetailContent task={task} comments={comments} activity={activity} />;
}
```

### Server Actions Pattern

From `faculty-scheduler/actions.ts`:

```typescript
// Pattern: Server actions with consistent return type
'use server';
import { revalidatePath } from 'next/cache';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

export async function completeTask(id: string, note: string | null): Promise<ActionResult> {
  // ... mutation logic
  revalidatePath('/dashboard/action-center');
  return { success: true };
}
```

### API Types Already Defined

From `task-types.ts`:
- `TaskExtended` - Full task with computed fields
- `TaskComment` - Comment structure
- `TaskActivity` - Activity log entry
- `CreateTaskRequest` - Create payload
- `CompleteTaskRequest` - Complete payload
- `DismissTaskRequest` - Dismiss payload (requires `dismissed_reason`)
- `AddCommentRequest` - Comment payload

**Note:** Approval fields exist (`recommendation`, `recommendation_reasoning`, `approval_outcome`, `approval_modifications`) but no approval-specific mutation API exists yet.

---

## 3. UI Patterns

### Detail Page Pattern

From `workflow-detail.tsx`:

**Layout:**
- Full page with background pattern
- Header with breadcrumb, title, status badge
- Action buttons in header (right side)
- Info cards grid (2x4 responsive)
- Tabs for different content sections
- Card-based content areas

**Key elements:**
- `ArrowLeft` icon for back navigation
- StatusBadge component for visual status
- Manual tab implementation (not using Radix Tabs)
- Two-column responsive grid for metadata

### Modal Pattern

From `assign-instructor-modal.tsx` and `launch-modal.tsx`:

```typescript
// Pattern: Conditional render + fixed positioning
if (!isOpen) return null;

return (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    {/* Backdrop */}
    <div className="absolute inset-0 bg-black/50" onClick={onClose} />

    {/* Modal */}
    <Card className="relative w-full max-w-lg mx-4 max-h-[80vh] overflow-hidden bg-background">
      <CardHeader className="flex flex-row items-center justify-between border-b border-border">
        <CardTitle>Title</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="overflow-y-auto p-4">
        {/* Content */}
      </CardContent>
    </Card>
  </div>
);
```

### Form Pattern

From `assign-instructor-modal.tsx`:
- Uses `useState` for form state
- Uses `useTransition` for pending state during submission
- Shows loading states and error messages
- Button disabled during `isPending`
- Native input elements with Tailwind styling

### Filter Dropdown Pattern

From `task-filters.tsx`:
- Custom dropdown with checkbox-style multi-select
- Click-outside to close
- Active filter chip display

---

## 4. Technical Decisions & Recommendations

### Detail Page Structure

**Recommended:** Create `/dashboard/action-center/tasks/[id]/page.tsx`

```
action-center/
  tasks/
    [id]/
      page.tsx              # Server component with Suspense
      task-detail-content.tsx  # Client component
      task-detail-skeleton.tsx # Loading state
```

### Two-Column Layout

```typescript
// Left: 2/3 width - content area
// Right: 1/3 width - metadata sidebar
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-2">
    {/* Task content, description, comments/activity tabs */}
  </div>
  <div>
    {/* Metadata sidebar: status, priority, dates, assignee, workflow */}
  </div>
</div>
```

### Tabs Implementation

**Option A:** Use Radix Tabs from dashboard-kit
```typescript
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/dashboard-kit/components/ui/tabs';
```

**Option B:** Manual tabs like workflow-detail.tsx (more control over styling)

**Recommendation:** Use Radix Tabs - already available and properly accessible.

### Modal Implementation

**Recommendation:** Build `CreateTaskModal` following `assign-instructor-modal.tsx` pattern:
- Fixed positioning overlay
- Card-based modal body
- Form state with useState
- Server action for submission
- Error display
- Close on backdrop click

### Approval Tasks

**Fields available in TaskExtended:**
- `task_type: 'approval'`
- `recommendation: string | null`
- `recommendation_reasoning: string | null`
- `approval_outcome: 'approved' | 'modified' | 'rejected' | null`
- `approval_modifications: string | null`

**Missing:** API endpoint for recording approval outcome. Will need:
- POST `/api/tasks/:id/approve` - for approve action
- Or extend PATCH `/api/tasks/:id` to handle approval fields

**UI Recommendation:**
1. Show recommendation box when `task_type === 'approval'` and `recommendation` exists
2. Replace Complete/Dismiss with Approve/Modify/Reject buttons for approval tasks
3. Modify opens modal for capturing modifications
4. Reject requires reason (like dismiss)

### Create Task Modal Fields

Based on `CreateTaskRequest`:

| Field | Required | Input Type |
|-------|----------|------------|
| title | Yes | text input |
| description | No | textarea |
| task_type | No (default: standard) | select |
| priority | No (default: normal) | select |
| due_date | No | date picker |
| due_time | No | time input |
| department | No | select |
| assignee_id | No | select (future) |
| workflow_id | No | select (future) |
| depends_on | No | multi-select (future) |

**Phase 5 scope:** Focus on essential fields (title, description, task_type, priority, due_date, department).
Leave assignee, workflow, and dependencies for later phases.

---

## 5. Identified Gaps

### API Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No approval outcome endpoint | Cannot record approve/modify/reject | Add PATCH `/api/tasks/:id` support for approval fields OR add `/api/tasks/:id/approve` |
| No dependency fetching | Cannot show "blocked by" details | Add query function to get dependency task titles |

### Component Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| No Textarea component | Need for description, notes | Create or use native with Input styling |
| No Select component | Need for dropdowns | Create custom select component |
| No DatePicker component | Need for due date | Use native `<input type="date">` initially |

### Data Gaps

| Gap | Impact | Recommendation |
|-----|--------|----------------|
| Dismiss reasons not enumerated | Can't show dropdown | Define enum: `['no_longer_relevant', 'duplicate', 'will_not_do', 'other']` |
| Workflow tasks not in API response | Can't show workflow context | Add query to get sibling tasks in workflow |

---

## 6. File Structure Recommendation

```
dashboard/src/app/dashboard/action-center/
  page.tsx                    # List page (exists)
  action-center-content.tsx   # List content (exists)

  tasks/
    [id]/
      page.tsx                # Detail page (new)
      task-detail-content.tsx # Detail client component (new)
      task-detail-skeleton.tsx # Loading skeleton (new)

  components/
    task-row.tsx              # (exists)
    task-row-expanded.tsx     # (exists)
    task-table.tsx            # (exists)
    task-filters.tsx          # (exists)
    view-tabs.tsx             # (exists)
    create-task-modal.tsx     # Create modal (new)
    complete-task-dialog.tsx  # Complete action dialog (new)
    dismiss-task-dialog.tsx   # Dismiss action dialog (new)
    approval-actions.tsx      # Approval task actions (new)
    task-comments.tsx         # Comments tab content (new)
    task-activity.tsx         # Activity tab content (new)
    task-metadata-sidebar.tsx # Right sidebar (new)
    workflow-context.tsx      # Workflow progress/tasks (new)

  actions.ts                  # Server actions (new)
```

---

## 7. Implementation Order Recommendation

Based on dependencies and complexity:

1. **Server Actions** (`actions.ts`)
   - completeTask, dismissTask, createTask, addComment
   - Approval actions (approve, modify, reject)

2. **Detail Page Shell** (`tasks/[id]/page.tsx`)
   - Route setup with dynamic params
   - Suspense + skeleton

3. **Task Detail Content** (`task-detail-content.tsx`)
   - Two-column layout
   - Header with back nav and action buttons
   - Basic task info display

4. **Metadata Sidebar** (`task-metadata-sidebar.tsx`)
   - Status dropdown
   - Priority display/edit
   - Due date display
   - Department
   - Workflow link (if applicable)

5. **Comments Tab** (`task-comments.tsx`)
   - Comment list
   - Add comment form

6. **Activity Tab** (`task-activity.tsx`)
   - Activity timeline
   - Reuse/adapt ActivityFeed component

7. **Action Dialogs**
   - Complete dialog (optional note)
   - Dismiss dialog (required reason dropdown + optional text)

8. **Approval UI** (`approval-actions.tsx`)
   - Recommendation display box
   - Approve/Modify/Reject buttons
   - Modify modal

9. **Create Task Modal** (`create-task-modal.tsx`)
   - Form with all fields
   - Validation
   - Submit via server action

10. **Workflow Context** (`workflow-context.tsx`)
    - Progress bar
    - Collapsible task list

---

## 8. Open Questions for Planner

1. **Approval API Strategy:** Should we extend PATCH `/api/tasks/:id` to handle approval fields, or create a dedicated `/api/tasks/:id/approve` endpoint?

2. **Dismiss Reasons:** Should dismiss reasons be:
   - Free text only (current API)
   - Dropdown + optional text (as per CONTEXT.md)
   - Enum stored in DB

3. **Dependency Display:** How detailed should "blocked by" be?
   - Just count (current)
   - List of task titles with links
   - Full dependency graph

4. **Create Task Trigger:** Modal from list page vs dedicated page?
   - CONTEXT.md says "Claude's Discretion"
   - Modal recommended for speed of creating multiple tasks

5. **Quick Create Features:** Should Phase 5 include:
   - Keyboard shortcut (Cmd+N)
   - Inline add row

---

*Research completed: 2026-01-23*
*Ready for planning*
