import { Suspense } from 'react';
import { getDashboardMetrics, getCampaigns, getRecentActivity } from '@/lib/supabase/queries';
import { getTaskCounts } from '@/lib/api/task-queries';
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

  const [metrics, campaigns, activities, taskCounts] = await Promise.all([
    getDashboardMetrics(),
    getCampaigns(),
    getRecentActivity(10),
    taskCountsPromise,
  ]);

  return (
    <DashboardContent
      metrics={metrics}
      campaigns={campaigns}
      activities={activities}
      taskCounts={taskCounts}
    />
  );
}
