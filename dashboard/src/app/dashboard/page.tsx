import { Suspense } from 'react';
import { getDashboardMetrics, getCampaigns, getRecentActivity } from '@/lib/supabase/queries';
import { getTaskCounts, getLatestWeeklyFocus, getAISuggestionCount } from '@/lib/api/task-queries';
import { DashboardContent } from './dashboard-content';
import { DashboardSkeleton } from './dashboard-skeleton';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardDataLoader />
    </Suspense>
  );
}

async function DashboardDataLoader() {
  // Fetch all dashboard data in parallel
  // Task counts fetch is wrapped to return null on error (graceful degradation)
  const taskCountsPromise = getTaskCounts().catch((error) => {
    console.error('Failed to fetch task counts:', error);
    return null;
  });

  // Weekly focus and AI suggestion count wrapped for graceful degradation
  const weeklyFocusPromise = getLatestWeeklyFocus().catch((error) => {
    console.error('Failed to fetch weekly focus:', error);
    return null;
  });

  const aiSuggestionCountPromise = getAISuggestionCount().catch((error) => {
    console.error('Failed to fetch AI suggestion count:', error);
    return 0;
  });

  const [metrics, campaigns, activities, taskCounts, weeklyFocusTask, aiSuggestionCount] = await Promise.all([
    getDashboardMetrics(),
    getCampaigns(),
    getRecentActivity(10),
    taskCountsPromise,
    weeklyFocusPromise,
    aiSuggestionCountPromise,
  ]);

  return (
    <DashboardContent
      metrics={metrics}
      campaigns={campaigns}
      activities={activities}
      taskCounts={taskCounts}
      weeklyFocusTask={weeklyFocusTask}
      aiSuggestionCount={aiSuggestionCount}
    />
  );
}
