import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { WorkflowDetailSkeleton } from './workflow-detail-skeleton';
import { WorkflowDetailContent } from './workflow-detail-content';
import { getWorkflowDetail } from '@/lib/api/action-center-workflow-queries';

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
