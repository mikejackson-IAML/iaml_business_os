'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/dashboard-kit/components/ui/button';
import type { PlanningDashboardData } from '@/dashboard-kit/types/departments/planning';
import { PipelineBoard } from './components/pipeline-board';
import { CaptureModal } from './components/capture-modal';

interface PlanningContentProps {
  data: PlanningDashboardData;
}

export function PlanningContent({ data }: PlanningContentProps) {
  const [captureOpen, setCaptureOpen] = useState(false);

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="badge-live">PLAN</span>
              <h1 className="text-display-sm text-foreground">Planning Studio</h1>
            </div>
            <p className="text-muted-foreground">
              AI-guided idea-to-production pipeline
            </p>
          </div>
          <Button size="sm" onClick={() => setCaptureOpen(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Capture Idea
          </Button>
        </div>
      </header>

      {/* Pipeline Board */}
      <PipelineBoard data={data} />

      {/* Capture Modal */}
      <CaptureModal isOpen={captureOpen} onClose={() => setCaptureOpen(false)} />
    </div>
  );
}
