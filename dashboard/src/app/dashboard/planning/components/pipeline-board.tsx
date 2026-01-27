'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  rectIntersection,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { toast } from 'sonner';
import type {
  ProjectStatus,
  PlanningProjectSummary,
  PlanningDashboardData,
} from '@/dashboard-kit/types/departments/planning';
import { updateProjectStatusAction } from '../actions';
import { PipelineColumn } from './pipeline-column';
import { ProjectCard } from './project-card';

const VISIBLE_STATUSES: ProjectStatus[] = [
  'idea',
  'planning',
  'ready_to_build',
  'building',
  'shipped',
];

interface PipelineBoardProps {
  data: PlanningDashboardData;
}

export function PipelineBoard({ data }: PipelineBoardProps) {
  const [projectsByStatus, setProjectsByStatus] = useState(data.projectsByStatus);
  const [activeProject, setActiveProject] = useState<PlanningProjectSummary | null>(null);

  // Sync when data prop changes (e.g. after revalidation)
  useEffect(() => {
    setProjectsByStatus(data.projectsByStatus);
  }, [data.projectsByStatus]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const projectId = event.active.id as string;
    // Find the project across all columns
    for (const status of VISIBLE_STATUSES) {
      const found = projectsByStatus[status]?.find((p) => p.id === projectId);
      if (found) {
        setActiveProject(found);
        break;
      }
    }
  }, [projectsByStatus]);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveProject(null);

    const { active, over } = event;
    if (!over) return;

    const projectId = active.id as string;
    const newStatus = over.id as ProjectStatus;
    const oldStatus = (active.data.current as { status: ProjectStatus })?.status;

    if (!oldStatus || oldStatus === newStatus) return;

    // Optimistic update
    setProjectsByStatus((prev) => {
      const next = { ...prev };
      const project = next[oldStatus].find((p) => p.id === projectId);
      if (!project) return prev;

      next[oldStatus] = next[oldStatus].filter((p) => p.id !== projectId);
      next[newStatus] = [...next[newStatus], { ...project, status: newStatus }];
      return next;
    });

    // Server update
    const result = await updateProjectStatusAction(projectId, newStatus);
    if (!result.success) {
      // Revert on failure
      setProjectsByStatus((prev) => {
        const next = { ...prev };
        const project = next[newStatus].find((p) => p.id === projectId);
        if (!project) return prev;

        next[newStatus] = next[newStatus].filter((p) => p.id !== projectId);
        next[oldStatus] = [...next[oldStatus], { ...project, status: oldStatus }];
        return next;
      });
      toast.error('Failed to update status');
    }
  }, []);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {VISIBLE_STATUSES.map((status) => (
          <PipelineColumn
            key={status}
            status={status}
            projects={projectsByStatus[status] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeProject ? (
          <div className="w-[280px]">
            <ProjectCard project={activeProject} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
