import { Suspense } from 'react';
import { WebIntelSkeleton } from './web-intel-skeleton';
import { WebIntelContent } from './web-intel-content';
import { getWebIntelDashboardData } from '@/lib/api/web-intel-queries';
import { parseDateRange, rangeToDays, type DateRange } from './components/date-range-selector';

export const metadata = {
  title: 'Web Intelligence | IAML Business OS',
  description: 'Traffic analytics, keyword rankings, technical SEO, and content performance',
};

// Revalidate every hour (data updates less frequently than leads)
export const revalidate = 3600;

// Force dynamic rendering because we use searchParams
export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ range?: string }>;
}

async function WebIntelDataLoader({ range }: { range: DateRange }) {
  const days = rangeToDays(range);
  const data = await getWebIntelDashboardData(days);
  return <WebIntelContent data={data} range={range} />;
}

export default async function WebIntelDashboardPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const range = parseDateRange(params.range);

  return (
    <Suspense fallback={<WebIntelSkeleton />}>
      <WebIntelDataLoader range={range} />
    </Suspense>
  );
}
