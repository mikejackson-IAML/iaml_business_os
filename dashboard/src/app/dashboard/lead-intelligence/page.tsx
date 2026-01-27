import { Suspense } from 'react';
import { LeadIntelligenceSkeleton } from './lead-intelligence-skeleton';
import { LeadIntelligenceContent } from './lead-intelligence-content';
import { getContacts } from '@/lib/api/lead-intelligence-contacts-queries';
import { getDataHealthMetrics } from '@/lib/api/lead-intelligence-data-health-queries';

export const metadata = {
  title: 'Lead Intelligence | IAML Business OS',
  description: 'Contact list with advanced filtering, metrics, and data health',
};

export const revalidate = 300;

async function DataLoader() {
  const [contactsResult, dataHealth] = await Promise.all([
    getContacts({ page: 1, limit: 25 }),
    getDataHealthMetrics().catch(() => null),
  ]);

  const metrics = {
    total_contacts: contactsResult.meta.total,
    total_customers: 0,
    total_companies: 0,
    data_quality_score: dataHealth?.data_quality_score ?? 0,
  };

  return (
    <LeadIntelligenceContent
      initialContacts={contactsResult}
      initialMetrics={metrics}
      initialDataHealth={dataHealth}
    />
  );
}

export default function LeadIntelligencePage() {
  return (
    <Suspense fallback={<LeadIntelligenceSkeleton />}>
      <DataLoader />
    </Suspense>
  );
}
