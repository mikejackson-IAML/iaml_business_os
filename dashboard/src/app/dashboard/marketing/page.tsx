import { Suspense } from 'react';
import { MarketingSkeleton } from './marketing-skeleton';
import { MarketingContent } from './marketing-content';
import {
  getCampaigns,
  getRecentActivity,
  getMarketingMetrics,
  getMarketingAlerts,
  getLinkedInAutomationStatus,
} from '@/lib/supabase/queries';

export const metadata = {
  title: 'Marketing Dashboard | IAML Business OS',
  description: 'Email campaigns, LinkedIn automation, and deliverability metrics',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function MarketingDataLoader() {
  // Fetch all data in parallel
  const [metrics, campaigns, alerts, activities, linkedIn] = await Promise.all([
    getMarketingMetrics(),
    getCampaigns('active'),
    getMarketingAlerts(),
    getRecentActivity(15),
    getLinkedInAutomationStatus(),
  ]);

  return (
    <MarketingContent
      metrics={metrics}
      campaigns={campaigns}
      alerts={alerts}
      activities={activities}
      linkedIn={linkedIn}
    />
  );
}

export default function MarketingDashboardPage() {
  return (
    <Suspense fallback={<MarketingSkeleton />}>
      <MarketingDataLoader />
    </Suspense>
  );
}
