import { Suspense } from 'react';
import { LeadsSkeleton } from './leads-skeleton';
import { LeadsContent } from './leads-content';
import { getLeadIntelligenceDashboardData } from '@/lib/api/lead-intelligence-queries';

export const metadata = {
  title: 'Lead Intelligence | IAML Business OS',
  description: 'Email capacity, domain health, lead pipeline, and platform status',
};

// Revalidate every 5 minutes
export const revalidate = 300;

async function LeadsDataLoader() {
  const data = await getLeadIntelligenceDashboardData();

  return <LeadsContent data={data} />;
}

export default function LeadIntelligenceDashboardPage() {
  return (
    <Suspense fallback={<LeadsSkeleton />}>
      <LeadsDataLoader />
    </Suspense>
  );
}
