# Plan 10-04: Navigation Badge with Real-time Subscription - COMPLETE

## Summary

Created a real-time badge component for the Action Center navigation link that displays the count of critical + overdue tasks, updating automatically via Supabase realtime subscription.

## Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/hooks/use-task-badge-count.ts` | Custom hook for fetching and subscribing to task counts |
| `dashboard/src/components/nav/action-center-badge.tsx` | Badge component with count display |

## Files Modified

| File | Changes |
|------|---------|
| `dashboard/src/app/dashboard/dashboard-content.tsx` | Added ActionCenterBadge import and rendered it on Action Center link |

## Implementation Details

### useTaskBadgeCount Hook

- Fetches initial count via `action_center.get_task_counts()` RPC
- Subscribes to `action_center.tasks` table changes (INSERT, UPDATE, DELETE)
- Refetches count on any task change event
- Falls back to 1-minute polling if subscription fails
- Cleans up subscription on unmount
- Returns `{ count, isLoading }`

### ActionCenterBadge Component

- Renders count in a small red circle (bg-red-500)
- Shows "9+" when count exceeds 9
- Hidden when count is 0 or loading
- Uses absolute positioning (`-top-1 -right-1`)
- Includes ARIA label for accessibility

### Integration

The badge is rendered inside the Action Center quick link on the main CEO Dashboard header. The link has `relative` positioning to allow the badge's absolute positioning to work correctly.

## Verification Checklist

- [x] Badge displays correct count (critical + overdue via `badge_count` from RPC)
- [x] Badge hidden when count is 0
- [x] Badge shows "9+" when count exceeds 9
- [x] Real-time subscription set up for task changes
- [x] Fallback to polling on subscription error
- [x] Subscription cleans up on unmount
- [x] No memory leaks (proper cleanup of refs and intervals)

## Commits

1. `feat(10-04): create useTaskBadgeCount hook` - Created the custom hook
2. `feat(10-04): create ActionCenterBadge component` - Created the badge component with styling
3. `feat(10-04): add badge to Action Center link` - Integrated badge into dashboard header

## Dependencies

- Requires `action_center.get_task_counts()` RPC function (from 10-01 migration)
- Requires Supabase realtime enabled on `action_center.tasks` table

## Notes

- The subscription uses `postgres_changes` channel type which requires realtime to be enabled
- Polling fallback ensures the badge works even if realtime fails
- The hook creates a single Supabase client instance via ref to avoid recreation on re-renders
