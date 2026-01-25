'use client';

import { useTaskBadgeCount } from '@/hooks/use-task-badge-count';

/**
 * Badge component displaying the count of critical + overdue tasks.
 * Updates in real-time via Supabase subscription.
 *
 * - Shows count in a small red circle
 * - Shows "9+" when count > 9
 * - Hidden when count is 0 or loading
 * - Uses absolute positioning for overlay on parent
 */
export function ActionCenterBadge() {
  const { count, isLoading } = useTaskBadgeCount();

  // Hide when loading or count is 0
  if (isLoading || count === 0) {
    return null;
  }

  // Display "9+" when count exceeds 9
  const displayCount = count > 9 ? '9+' : count.toString();

  return (
    <span
      className="absolute -top-1 -right-1 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full min-w-[1.25rem] h-5 px-1"
      aria-label={`${count} critical or overdue tasks`}
    >
      {displayCount}
    </span>
  );
}
