import { Suspense } from 'react';
import { getDevelopmentDashboardData } from '@/lib/api/development-queries';
import { DevelopmentContent } from './development-content';
import { DevelopmentSkeleton } from './development-skeleton';

export const dynamic = 'force-dynamic';

export default async function DevelopmentPage() {
  return (
    <Suspense fallback={<DevelopmentSkeleton />}>
      <DevelopmentDataLoader />
    </Suspense>
  );
}

async function DevelopmentDataLoader() {
  const data = await getDevelopmentDashboardData();

  return <DevelopmentContent data={data} />;
}
