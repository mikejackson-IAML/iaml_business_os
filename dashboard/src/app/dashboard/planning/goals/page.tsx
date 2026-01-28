import { Suspense } from 'react';
import { GoalsSkeleton } from './goals-skeleton';
import { GoalsContent } from './goals-content';
import { getGoals } from '@/lib/api/planning-queries';

export const dynamic = 'force-dynamic';

export default async function GoalsPage() {
  const goals = await getGoals();

  return (
    <Suspense fallback={<GoalsSkeleton />}>
      <GoalsContent goals={goals} />
    </Suspense>
  );
}
