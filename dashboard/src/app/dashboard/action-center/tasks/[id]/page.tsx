import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { TaskDetailSkeleton } from './task-detail-skeleton';
import { TaskDetailContent } from './task-detail-content';
import {
  getTaskById,
  getTaskComments,
  getTaskActivity,
} from '@/lib/api/task-queries';

export const metadata = {
  title: 'Task Detail | Action Center',
  description: 'View and manage task details',
};

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

/**
 * TaskDetailLoader
 * Async server component that fetches task, comments, and activity in parallel.
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

  return (
    <TaskDetailContent
      task={task}
      comments={comments}
      activity={activity}
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
