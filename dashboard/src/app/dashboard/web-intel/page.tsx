import { Suspense } from 'react';
import { WebIntelSkeleton } from './web-intel-skeleton';
import { WebIntelContent } from './web-intel-content';
import { getWebIntelDashboardData } from '@/lib/api/web-intel-queries';
import { parseDateRange, rangeToDays, type DateRange } from './components/date-range-selector';
import { parsePriorityFilter } from './components/priority-filter';
import { parseAlertTypeFilter } from './components/alert-type-filter';

export const metadata = {
  title: 'Web Intelligence | IAML Business OS',
  description: 'Traffic analytics, keyword rankings, technical SEO, and content performance',
};

// Revalidate every hour (data updates less frequently than leads)
export const revalidate = 3600;

// Force dynamic rendering because we use searchParams
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ range?: string; priority?: string; alertType?: string }>;
}

async function WebIntelDataLoader({
  range,
  priorityFilter,
  alertTypeFilter,
}: {
  range: DateRange;
  priorityFilter: ReturnType<typeof parsePriorityFilter>;
  alertTypeFilter: ReturnType<typeof parseAlertTypeFilter>;
}) {
  const days = rangeToDays(range);
  const data = await getWebIntelDashboardData(days);
  return <WebIntelContent data={data} range={range} priorityFilter={priorityFilter} alertTypeFilter={alertTypeFilter} />;
}

export default async function WebIntelDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = parseDateRange(params.range);
  const priorityFilter = parsePriorityFilter(params.priority);
  const alertTypeFilter = parseAlertTypeFilter(params.alertType);

  return (
    <Suspense fallback={<WebIntelSkeleton />}>
      <WebIntelDataLoader range={range} priorityFilter={priorityFilter} alertTypeFilter={alertTypeFilter} />
    </Suspense>
  );
}
