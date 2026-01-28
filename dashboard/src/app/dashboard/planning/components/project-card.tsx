'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Hammer, Check } from 'lucide-react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { Progress } from '@/dashboard-kit/components/ui/progress';
import { cn } from '@/dashboard-kit/lib/utils';
import type { PlanningProjectSummary } from '@/dashboard-kit/types/departments/planning';
import { getPhaseLabel } from '@/dashboard-kit/types/departments/planning';
import { BuildModal } from './build-modal';

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 30)}mo ago`;
}

function getIncubationRemaining(lockedUntil: string): string | null {
  const now = new Date();
  const lockEnd = new Date(lockedUntil);
  if (lockEnd <= now) return null;

  const diffMs = lockEnd.getTime() - now.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

  if (diffHours > 24) {
    const days = Math.floor(diffHours / 24);
    return `${days}d ${diffHours % 24}h`;
  }
  if (diffHours > 0) return `${diffHours}h ${diffMinutes}m`;
  return `${diffMinutes}m`;
}

interface ProjectCardProps {
  project: PlanningProjectSummary;
  isOverlay?: boolean;
}

export function ProjectCard({ project, isOverlay }: ProjectCardProps) {
  const router = useRouter();
  const [buildModalOpen, setBuildModalOpen] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: project.id,
    data: { status: project.status },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  const incubating =
    project.phase_locked_until &&
    new Date(project.phase_locked_until) > new Date();

  const incubationRemaining = incubating
    ? getIncubationRemaining(project.phase_locked_until!)
    : null;

  // Use build progress for building projects, phase progress otherwise
  const progressValue = project.status === 'building'
    ? (project.build_progress_percent || 0)
    : (project.phases_completed / Math.max(project.total_phases, 1)) * 100;

  const isBuilding = project.status === 'building';
  const isShipped = project.status === 'shipped';

  // Handle card body click - open modal for building projects
  function handleCardClick(e: React.MouseEvent) {
    if (isBuilding) {
      e.stopPropagation();
      setBuildModalOpen(true);
    }
  }

  return (
    <>
      <Card
        ref={isOverlay ? undefined : setNodeRef}
        style={isOverlay ? undefined : style}
        className={cn(
          'cursor-grab active:cursor-grabbing hover:border-primary/50 transition-colors',
          isDragging && 'opacity-50',
          incubating && 'opacity-60',
          isOverlay && 'shadow-lg rotate-2',
          isBuilding && 'ring-1 ring-blue-500/30',
          isShipped && 'border-emerald-200 bg-emerald-50/50'
        )}
        {...(isOverlay ? {} : { ...attributes, ...listeners })}
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          {/* Title row */}
          <div className="flex items-center gap-1.5">
            {incubating && <Lock className="h-3.5 w-3.5 text-amber-500 shrink-0" />}
            {isBuilding && <Hammer className="h-3.5 w-3.5 text-blue-500 shrink-0" />}
            <Link
              href={`/dashboard/planning/${project.id}`}
              className="font-medium text-sm truncate hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              {project.title}
            </Link>
          </div>

          {/* One-liner */}
          {project.one_liner && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
              {project.one_liner}
            </p>
          )}

          {/* Phase badge + progress bar */}
          <div className="flex items-center gap-2 mt-3">
            {isShipped ? (
              <Badge className="text-xs bg-emerald-100 text-emerald-700 border-emerald-200">
                <Check className="h-3 w-3 mr-1" />
                Shipped
              </Badge>
            ) : isBuilding ? (
              <Badge variant="outline" className="text-xs shrink-0 bg-blue-50 text-blue-700 border-blue-200">
                {project.build_phase && project.build_total_phases
                  ? `Phase ${project.build_phase}/${project.build_total_phases}`
                  : 'Building'}
              </Badge>
            ) : (
              <Badge variant="outline" className="text-xs shrink-0">
                {getPhaseLabel(project.current_phase)}
              </Badge>
            )}
            {!isShipped && <Progress value={progressValue} className="flex-1 h-1.5" />}
          </div>

          {/* Click hint for building cards */}
          {isBuilding && (
            <p className="text-[10px] text-muted-foreground mt-1">Click to manage build</p>
          )}

          {/* Shipped date */}
          {isShipped && project.shipped_at && (
            <p className="text-xs text-emerald-600 mt-1">
              Shipped {formatRelativeTime(project.shipped_at)}
            </p>
          )}

          {/* Incubation countdown + last activity */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {formatRelativeTime(project.updated_at)}
            </p>
            {incubationRemaining && (
              <Badge variant="secondary" className="text-xs">
                {incubationRemaining}
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Build Modal for building projects */}
      {isBuilding && (
        <BuildModal
          project={{
            id: project.id,
            title: project.title,
            one_liner: project.one_liner,
            status: project.status,
            build_phase: project.build_phase,
            build_total_phases: project.build_total_phases,
            build_progress_percent: project.build_progress_percent ?? 0,
            build_started_at: project.build_started_at,
            updated_at: project.updated_at,
          }}
          open={buildModalOpen}
          onOpenChange={setBuildModalOpen}
          onProjectUpdated={() => {
            router.refresh();
          }}
        />
      )}
    </>
  );
}
