import { Suspense } from 'react';
import { WebIntelSkeleton } from './web-intel-skeleton';
import { WebIntelContent } from './web-intel-content';
import { getWebIntelDashboardData } from '@/lib/api/web-intel-queries';

export const metadata = {
  title: 'Web Intelligence | IAML Business OS',
  description: 'Traffic analytics, keyword rankings, technical SEO, and content performance',
};

// Revalidate every hour (data updates less frequently than leads)
export const revalidate = 3600;

async function WebIntelDataLoader() {
  const data = await getWebIntelDashboardData();
  return <WebIntelContent data={data} />;
}

export default function WebIntelDashboardPage() {
  return (
    <Suspense fallback={<WebIntelSkeleton />}>
      <WebIntelDataLoader />
    </Suspense>
  );
}
