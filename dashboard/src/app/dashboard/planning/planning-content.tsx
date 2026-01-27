'use client';

import type { PlanningDashboardData } from '@/dashboard-kit/types/departments/planning';
import { PipelineBoard } from './components/pipeline-board';

interface PlanningContentProps {
  data: PlanningDashboardData;
}

export function PlanningContent({ data }: PlanningContentProps) {
  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="badge-live">PLAN</span>
          <h1 className="text-display-sm text-foreground">Planning Studio</h1>
        </div>
        <p className="text-muted-foreground">
          AI-guided idea-to-production pipeline
        </p>
      </header>

      {/* Pipeline Board */}
      <PipelineBoard data={data} />
    </div>
  );
}
