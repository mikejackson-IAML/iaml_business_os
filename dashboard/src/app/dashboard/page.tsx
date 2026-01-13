import { Suspense } from 'react';
import { getDashboardMetrics, getCampaigns, getRecentActivity } from '@/lib/supabase/queries';
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
  const [metrics, campaigns, activities] = await Promise.all([
    getDashboardMetrics(),
    getCampaigns(),
    getRecentActivity(10),
  ]);

  return (
    <DashboardContent
      metrics={metrics}
      campaigns={campaigns}
      activities={activities}
    />
  );
}
