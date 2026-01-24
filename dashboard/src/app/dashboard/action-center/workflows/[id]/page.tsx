import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { WorkflowDetailSkeleton } from './workflow-detail-skeleton';
import { getWorkflowDetail } from '@/lib/api/action-center-workflow-queries';
import type { WorkflowDetail } from '@/lib/api/workflow-types';

/**
 * Generate metadata for the workflow detail page
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workflow = await getWorkflowDetail(id);
  if (!workflow) {
    return { title: 'Workflow Not Found' };
  }
  return { title: `${workflow.name} | Workflows` };
}

// Revalidate every 60 seconds for ISR
export const revalidate = 60;

/**
 * WorkflowDetailLoader
 * Async server component that fetches workflow detail including tasks.
 * Returns notFound() if workflow doesn't exist.
 */
async function WorkflowDetailLoader({ id }: { id: string }) {
  const workflow = await getWorkflowDetail(id);

  if (!workflow) {
    notFound();
  }

  return <WorkflowDetailContent workflow={workflow} />;
}

/**
 * WorkflowDetailContent
 * Placeholder component for the workflow detail display.
 * Will be expanded in a later plan (07-06).
 */
function WorkflowDetailContent({ workflow }: { workflow: WorkflowDetail }) {
  return (
    <div className="space-y-6">
      {/* Back link */}
      <a
        href="/dashboard/action-center/workflows"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mr-1"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
        Back to Workflows
      </a>

      {/* Header placeholder */}
      <header>
        <h1 className="text-2xl font-bold">{workflow.name}</h1>
        {workflow.description && (
          <p className="text-muted-foreground mt-1">{workflow.description}</p>
        )}
        <div className="flex items-center gap-3 mt-3">
          <span className="text-sm bg-muted px-2 py-1 rounded">
            {workflow.status}
          </span>
          <span className="text-sm text-muted-foreground">
            {workflow.progress_percentage}% complete ({workflow.completed_tasks}/
            {workflow.total_tasks} tasks)
          </span>
        </div>
      </header>

      {/* Tasks placeholder - will be replaced with WorkflowTaskList component */}
      <section>
        <h2 className="text-lg font-semibold mb-4">Tasks</h2>
        <div className="border rounded-lg divide-y">
          {workflow.tasks.length === 0 ? (
            <div className="p-4 text-center text-muted-foreground">
              No tasks in this workflow yet.
            </div>
          ) : (
            workflow.tasks.map((task) => (
              <div key={task.id} className="p-4 flex items-center gap-4">
                <div
                  className={`w-3 h-3 rounded-full ${
                    task.status === 'done'
                      ? 'bg-green-500'
                      : task.status === 'in_progress'
                      ? 'bg-blue-500'
                      : task.status === 'waiting'
                      ? 'bg-yellow-500'
                      : 'bg-gray-300'
                  }`}
                />
                <div className="flex-1">
                  <a
                    href={`/dashboard/action-center/tasks/${task.id}`}
                    className="font-medium hover:underline"
                  >
                    {task.title}
                  </a>
                </div>
                <span className="text-sm text-muted-foreground capitalize">
                  {task.status.replace('_', ' ')}
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}

/**
 * WorkflowDetailPage
 * Server component with Suspense boundary for the workflow detail route.
 * Route: /dashboard/action-center/workflows/[id]
 */
export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const decodedId = decodeURIComponent(id);

  return (
    <div className="container mx-auto p-6">
      <Suspense fallback={<WorkflowDetailSkeleton />}>
        <WorkflowDetailLoader id={decodedId} />
      </Suspense>
    </div>
  );
}
