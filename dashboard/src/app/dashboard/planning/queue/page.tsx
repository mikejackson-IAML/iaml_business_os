import { Suspense } from 'react';
import { QueueSkeleton } from './queue-skeleton';
import { QueueContent } from './queue-content';
import { getReadyToBuildQueue, getProjectCountsByStatus } from '@/lib/api/planning-queries';

export const dynamic = 'force-dynamic';

async function QueueData() {
  const [projects, statusCounts] = await Promise.all([
    getReadyToBuildQueue(),
    getProjectCountsByStatus(),
  ]);

  return <QueueContent projects={projects} statusCounts={statusCounts} />;
}

export default function QueuePage() {
  return (
    <Suspense fallback={<QueueSkeleton />}>
      <QueueData />
    </Suspense>
  );
}
