'use client';

import { useState, useCallback, useMemo } from 'react';
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
import type { Opportunity } from '@/lib/api/lead-intelligence-opportunities-types';
import { StageColumn } from './stage-column';
import { OpportunityCard } from './opportunity-card';

interface OpportunityKanbanProps {
  opportunities: Opportunity[];
  stages: readonly string[];
  stageLabels: Record<string, string>;
}

export function OpportunityKanban({ opportunities, stages, stageLabels }: OpportunityKanbanProps) {
  const [localOpps, setLocalOpps] = useState<Opportunity[]>(opportunities);
  const [activeOpp, setActiveOpp] = useState<Opportunity | null>(null);

  // Sync when opportunities prop changes
  const oppsKey = opportunities.map((o) => o.id + o.stage).join(',');
  const [prevKey, setPrevKey] = useState(oppsKey);
  if (oppsKey !== prevKey) {
    setPrevKey(oppsKey);
    setLocalOpps(opportunities);
  }

  const grouped = useMemo(() => {
    const map: Record<string, Opportunity[]> = {};
    for (const s of stages) map[s] = [];
    for (const opp of localOpps) {
      if (map[opp.stage]) map[opp.stage].push(opp);
    }
    return map;
  }, [localOpps, stages]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const id = event.active.id as string;
      const found = localOpps.find((o) => o.id === id);
      setActiveOpp(found || null);
    },
    [localOpps]
  );

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveOpp(null);
      const { active, over } = event;
      if (!over) return;

      const oppId = active.id as string;
      const newStage = over.id as string;
      const oldStage = (active.data.current as { stage: string })?.stage;
      if (!oldStage || oldStage === newStage) return;

      // Optimistic update
      setLocalOpps((prev) =>
        prev.map((o) => (o.id === oppId ? { ...o, stage: newStage } : o))
      );

      try {
        const res = await fetch(`/api/lead-intelligence/opportunities/${oppId}/advance-stage`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ stage: newStage }),
        });
        if (!res.ok) throw new Error('Failed');
        toast.success(`Moved to ${stageLabels[newStage] || newStage}`);
      } catch {
        // Revert
        setLocalOpps((prev) =>
          prev.map((o) => (o.id === oppId ? { ...o, stage: oldStage } : o))
        );
        toast.error('Failed to update stage');
      }
    },
    [stageLabels]
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={rectIntersection}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-6 overflow-x-auto pb-4">
        {stages.map((stage) => (
          <StageColumn
            key={stage}
            stage={stage}
            label={stageLabels[stage] || stage}
            opportunities={grouped[stage] || []}
          />
        ))}
      </div>

      <DragOverlay>
        {activeOpp ? (
          <div className="w-[280px]">
            <OpportunityCard opportunity={activeOpp} isOverlay />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
