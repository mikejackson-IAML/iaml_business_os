import { Suspense } from 'react';
import { PlanningSkeleton } from './planning-skeleton';
import { PlanningContent } from './planning-content';

export const dynamic = 'force-dynamic';

export default function PlanningPage() {
  return (
    <Suspense fallback={<PlanningSkeleton />}>
      <PlanningContent />
    </Suspense>
  );
}
