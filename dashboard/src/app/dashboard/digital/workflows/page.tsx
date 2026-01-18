import { Suspense } from 'react';
import { WorkflowsSkeleton } from './workflows-skeleton';
import { WorkflowsContent } from './workflows-content';
import { getWorkflowRegistry, getWorkflowStats } from '@/lib/api/workflow-queries';

export const metadata = {
  title: 'Workflow Health | IAML Business OS',
  description: 'Monitor and manage all n8n workflow automations',
};

// Revalidate every 2 minutes
export const revalidate = 120;

async function WorkflowsDataLoader() {
  const [workflows, baseStats] = await Promise.all([
    getWorkflowRegistry(),
    getWorkflowStats(),
  ]);

  // Calculate additional stats from workflows
  const activeWorkflows = workflows.filter((w) => w.is_active).length;

  const stats = {
    totalWorkflows: workflows.length,
    activeWorkflows,
    totalErrorsToday: baseStats.totalErrorsToday,
    unresolvedErrors: baseStats.unresolvedErrors,
    overallSuccessRate: baseStats.overallSuccessRate,
  };

  return <WorkflowsContent workflows={workflows} stats={stats} />;
}

export default function WorkflowsPage() {
  return (
    <Suspense fallback={<WorkflowsSkeleton />}>
      <WorkflowsDataLoader />
    </Suspense>
  );
}
