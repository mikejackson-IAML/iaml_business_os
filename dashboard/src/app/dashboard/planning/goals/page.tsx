import { Suspense } from 'react';
import { GoalsSkeleton } from './goals-skeleton';
import { GoalsContent } from './goals-content';

export const dynamic = 'force-dynamic';

export default function GoalsPage() {
  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent />
    </Suspense>
  );
}
