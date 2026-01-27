import { Suspense } from 'react';
import { PlanningSkeleton } from './planning-skeleton';
import { PlanningContent } from './planning-content';
import { getPlanningDashboardData } from '@/lib/api/planning-queries';

export const dynamic = 'force-dynamic';

export default async function PlanningPage() {
  const data = await getPlanningDashboardData();

  return (
    <Suspense fallback={<PlanningSkeleton />}>
      <PlanningContent data={data} />
    </Suspense>
  );
}
