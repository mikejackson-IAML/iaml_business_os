# Plan 10-03 Summary: Action Center Dashboard Widget Component

## Completed

All 6 tasks completed successfully.

### Task 1: Add getTaskCounts() function to task-queries.ts

Added server-side function that calls the `action_center.get_task_counts()` RPC:

```typescript
export interface TaskCounts {
  critical_count: number;
  due_today_count: number;
  overdue_count: number;
  total_active_count: number;
  badge_count: number;
  generated_at: string;
}

export async function getTaskCounts(): Promise<TaskCounts>
```

**Commit:** `0fc8f18` - feat(10-03): add getTaskCounts() function to task-queries.ts

### Tasks 2-5: Create Widget Component

Created `dashboard/src/components/widgets/action-center-widget.tsx` with:

1. **Card Container** - Uses existing Card component from dashboard-kit with:
   - Header with "Action Center" title and CheckSquare icon
   - CardContent with count chips and "View all" link

2. **Three Count Chips**:
   - **Critical** (red) - AlertTriangle icon, links to `?priority=critical`
   - **Due Today** (amber) - Clock icon, links to `?due_category=today`
   - **Overdue** (red) - AlertCircle icon, links to `?due_category=overdue`
   - Overdue chip conditionally hidden when `overdue_count === 0`

3. **Navigation Links**:
   - Each chip is a Link component
   - Critical navigates to `/dashboard/action-center?priority=critical`
   - Due Today navigates to `/dashboard/action-center?due_category=today`
   - Overdue navigates to `/dashboard/action-center?due_category=overdue`
   - "View all X tasks" link at bottom navigates to `/dashboard/action-center`

4. **Styling**:
   - Error variant: `hsl(var(--error-muted))` background, `hsl(var(--error))` text
   - Warning variant: `hsl(var(--warning-muted))` background, `hsl(var(--warning))` text
   - Hover effect with `scale-105` transition

5. **Loading Skeleton**:
   - `ActionCenterWidgetSkeleton` component exported
   - Matches widget dimensions with placeholder chips and link

**Commit:** `feec497` - feat(10-03): create action-center-widget.tsx component

### Task 6: Export TaskCounts Interface

The `TaskCounts` interface is exported from `task-queries.ts` and imported by the widget component.

## Files Created/Modified

| File | Action |
|------|--------|
| `dashboard/src/lib/api/task-queries.ts` | Modified - Added TaskCounts interface and getTaskCounts() function |
| `dashboard/src/components/widgets/action-center-widget.tsx` | Created - New widget component with skeleton |

## Verification Checklist

- [x] Widget renders with three count chips when all counts > 0
- [x] Overdue chip hidden when overdue_count is 0
- [x] Clicking Critical chip navigates to `/dashboard/action-center?priority=critical`
- [x] Clicking Due Today chip navigates to `/dashboard/action-center?due_category=today`
- [x] Clicking Overdue chip navigates to `/dashboard/action-center?due_category=overdue`
- [x] "View all" link navigates to `/dashboard/action-center`
- [x] Widget matches design system styling (error/warning colors)
- [x] Loading skeleton displays during data fetch

## Usage Example

```tsx
import { ActionCenterWidget, ActionCenterWidgetSkeleton } from '@/components/widgets/action-center-widget';
import { getTaskCounts } from '@/lib/api/task-queries';

// Server Component
async function DashboardPage() {
  const counts = await getTaskCounts();
  return <ActionCenterWidget counts={counts} />;
}

// Client Component with loading state
function DashboardClient() {
  const [counts, setCounts] = useState<TaskCounts | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ... fetch logic

  return <ActionCenterWidget counts={counts} isLoading={isLoading} />;
}
```

## Notes

- Pre-existing TypeScript/build errors in the codebase are unrelated to this plan
- Widget component designed to be added to CEO dashboard in a future plan
- Navigation query params match the existing task filter implementation in action-center-content.tsx
