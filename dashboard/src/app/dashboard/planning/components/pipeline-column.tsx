'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  Lightbulb,
  MessageSquare,
  Package,
  Hammer,
  CheckCircle,
  Archive,
} from 'lucide-react';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';
import type {
  ProjectStatus,
  PlanningProjectSummary,
} from '@/dashboard-kit/types/departments/planning';
import { getStatusLabel } from '@/dashboard-kit/types/departments/planning';
import { ProjectCard } from './project-card';

function getColumnIcon(status: ProjectStatus) {
  const iconClass = 'h-4 w-4';
  switch (status) {
    case 'idea':
      return <Lightbulb className={cn(iconClass, 'text-purple-500')} />;
    case 'planning':
      return <MessageSquare className={cn(iconClass, 'text-amber-500')} />;
    case 'ready_to_build':
      return <Package className={cn(iconClass, 'text-green-500')} />;
    case 'building':
      return <Hammer className={cn(iconClass, 'text-blue-500')} />;
    case 'shipped':
      return <CheckCircle className={cn(iconClass, 'text-emerald-500')} />;
    case 'archived':
      return <Archive className={cn(iconClass, 'text-gray-500')} />;
    default:
      return null;
  }
}


interface PipelineColumnProps {
  status: ProjectStatus;
  projects: PlanningProjectSummary[];
}

export function PipelineColumn({ status, projects }: PipelineColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      data-testid={`column-${status}`}
      className={cn(
        'min-w-[280px] w-[280px] flex-shrink-0 flex flex-col rounded-lg p-2 transition-colors',
        isOver && 'ring-2 ring-primary/30 bg-primary/5'
      )}
    >
      {/* Column header */}
      <div className="flex items-center gap-2 mb-3 px-1">
        {getColumnIcon(status)}
        <h3 className="text-sm font-medium text-foreground">
          {getStatusLabel(status)}
        </h3>
        <Badge variant="secondary" className="text-xs">
          {projects.length}
        </Badge>
      </div>

      {/* Cards */}
      <div className="space-y-3 flex-1 min-h-[200px]">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground/50 text-center py-8">No projects</p>
        ) : (
          projects.map((project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        )}
      </div>
    </div>
  );
}
