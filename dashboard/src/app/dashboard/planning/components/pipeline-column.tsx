'use client';

import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';
import type {
  ProjectStatus,
  PlanningProjectSummary,
} from '@/dashboard-kit/types/departments/planning';
import { getStatusLabel } from '@/dashboard-kit/types/departments/planning';
import { ProjectCard } from './project-card';

const statusDotColor: Record<ProjectStatus, string> = {
  idea: 'bg-purple-500',
  planning: 'bg-amber-500',
  ready_to_build: 'bg-green-500',
  building: 'bg-blue-500',
  shipped: 'bg-emerald-500',
  archived: 'bg-gray-500',
};

interface PipelineColumnProps {
  status: ProjectStatus;
  projects: PlanningProjectSummary[];
}

export function PipelineColumn({ status, projects }: PipelineColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[280px] w-[280px] flex-shrink-0 flex flex-col rounded-lg p-2 transition-colors',
        isOver && 'ring-2 ring-primary/30 bg-primary/5'
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn('h-2.5 w-2.5 rounded-full', statusDotColor[status])} />
        <h3 className="text-sm font-medium text-foreground">
          {getStatusLabel(status)}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {projects.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1 min-h-[200px]">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} />
        ))}
      </div>
    </div>
  );
}
