import { Suspense } from 'react';
import { QueueSkeleton } from './queue-skeleton';
import { QueueContent } from './queue-content';
import { getReadyToBuildQueue, getProjectCountsByStatus, getActiveGoals } from '@/lib/api/planning-queries';

export const dynamic = 'force-dynamic';

async function QueueData() {
  const [projects, statusCounts, activeGoals] = await Promise.all([
    getReadyToBuildQueue(),
    getProjectCountsByStatus(),
    getActiveGoals(),
  ]);

  // Find the most recent goal update time
  const goalsLastUpdated = activeGoals.length > 0
    ? Math.max(...activeGoals.map((g) => new Date(g.updated_at).getTime()))
    : null;

  return (
    <QueueContent
      projects={projects}
      statusCounts={statusCounts}
      goalsLastUpdated={goalsLastUpdated}
    />
  );
}

export default function QueuePage() {
  return (
    <Suspense fallback={<QueueSkeleton />}>
      <QueueData />
    </Suspense>
  );
}
