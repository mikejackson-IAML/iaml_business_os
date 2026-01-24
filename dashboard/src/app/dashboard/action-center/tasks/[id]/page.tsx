import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { TaskDetailSkeleton } from './task-detail-skeleton';
import { TaskDetailContent } from './task-detail-content';
import {
  getTaskById,
  getTaskComments,
  getTaskActivity,
} from '@/lib/api/task-queries';
import { getSOPById, getUserMasteryForSOP } from '@/lib/api/sop-queries';
import type { SOPTemplate } from '@/lib/api/sop-types';

export const metadata = {
  title: 'Task Detail | Action Center',
  description: 'View and manage task details',
};

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

/**
 * TaskDetailLoader
 * Async server component that fetches task, comments, activity, and SOP data in parallel.
 * Returns notFound() if task doesn't exist.
 */
async function TaskDetailLoader({ id }: { id: string }) {
  const [task, comments, activity] = await Promise.all([
    getTaskById(id),
    getTaskComments(id),
    getTaskActivity(id, 10),
  ]);

  if (!task) {
    notFound();
  }

  // Fetch SOP and mastery if task has SOP reference
  let sop: SOPTemplate | null = null;
  let sopMastery = { mastery_level: 0, mastery_tier: 'novice' as const };

  if (task.sop_template_id) {
    // For single-user (CEO) app, we use a fixed user ID
    const userId = 'ceo-user';
    const [sopResult, masteryResult] = await Promise.all([
      getSOPById(task.sop_template_id),
      getUserMasteryForSOP(userId, task.sop_template_id),
    ]);

    if (sopResult) {
      sop = sopResult;
    }
    if (masteryResult) {
      sopMastery = masteryResult;
    }
  }

  return (
    <TaskDetailContent
      task={task}
      comments={comments}
      activity={activity}
      sop={sop}
      sopMastery={sopMastery}
    />
  );
}

/**
 * TaskDetailPage
 * Server component with Suspense boundary for the task detail route.
 * Route: /dashboard/action-center/tasks/[id]
 */
export default async function TaskDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  return (
    <Suspense fallback={<TaskDetailSkeleton />}>
      <TaskDetailLoader id={decodedId} />
    </Suspense>
  );
}
