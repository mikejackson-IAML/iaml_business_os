import { listTasks } from '@/lib/api/task-queries';
import ActionCenterContent from './action-center-content';

export default async function ActionCenterDataLoader() {
  // Fetch initial tasks - all open/in_progress/waiting for client-side filtering
  const result = await listTasks({
    status: ['open', 'in_progress', 'waiting'],
    limit: 500, // Reasonable limit for client-side filtering
  });

  // Get unique departments from tasks for filter options
  const departments = [...new Set(
    result.tasks
      .map(t => t.department)
      .filter(Boolean)
  )] as string[];

  return (
    <ActionCenterContent
      initialTasks={result.tasks}
      departments={departments}
    />
  );
}
