import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { WorkflowDetailContent } from './workflow-detail';
import {
  getWorkflowById,
  getWorkflowExecutions,
  getWorkflowErrorSummary,
} from '@/lib/api/workflow-queries';
import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/dashboard-kit/components/ui/card';
import { FallingPattern } from '@/components/ui/falling-pattern';

export const metadata = {
  title: 'Workflow Details | IAML Business OS',
  description: 'Detailed workflow execution history and error tracking',
};

// Revalidate every 2 minutes
export const revalidate = 120;

function WorkflowDetailSkeleton() {
  return (
    <div className="relative min-h-screen">
      <FallingPattern
        color="hsl(var(--accent-primary))"
        backgroundColor="hsl(var(--background))"
        duration={150}
        blurIntensity="1em"
        density={0.5}
        className="fixed inset-0 -z-10 opacity-50"
      />
      <div className="relative z-10 p-6 lg:p-8">
        <header className="mb-8">
          <Skeleton className="h-5 w-32 mb-4" />
          <div className="flex items-center gap-3 mb-2">
            <Skeleton className="h-10 w-64" />
            <Skeleton className="h-8 w-24 rounded-full" />
          </div>
          <Skeleton className="h-5 w-96 mb-4" />
          <div className="flex gap-2">
            <Skeleton className="h-6 w-20 rounded" />
            <Skeleton className="h-6 w-24 rounded" />
          </div>
        </header>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-8 w-16 mb-1" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex gap-4 py-4 border-b border-border last:border-0">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-5 flex-1" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

async function WorkflowDetailLoader({ workflowId }: { workflowId: string }) {
  const [workflow, executions, errorSummary] = await Promise.all([
    getWorkflowById(workflowId),
    getWorkflowExecutions(workflowId, 50),
    getWorkflowErrorSummary(workflowId),
  ]);

  if (!workflow) {
    notFound();
  }

  return (
    <WorkflowDetailContent
      workflow={workflow}
      executions={executions}
      errorSummary={errorSummary}
    />
  );
}

export default async function WorkflowDetailPage({
  params,
}: {
  params: Promise<{ workflowId: string }>;
}) {
  const { workflowId } = await params;
  const decodedWorkflowId = decodeURIComponent(workflowId);

  return (
    <Suspense fallback={<WorkflowDetailSkeleton />}>
      <WorkflowDetailLoader workflowId={decodedWorkflowId} />
    </Suspense>
  );
}
