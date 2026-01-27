'use client';

import { useDroppable } from '@dnd-kit/core';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import { cn } from '@/dashboard-kit/lib/utils';
import type { Opportunity } from '@/lib/api/lead-intelligence-opportunities-types';
import { OpportunityCard } from './opportunity-card';

const STAGE_COLORS: Record<string, string> = {
  inquiry: 'bg-sky-500',
  strategy_session: 'bg-indigo-500',
  consultation: 'bg-violet-500',
  proposal_sent: 'bg-amber-500',
  planning: 'bg-blue-500',
  won: 'bg-emerald-500',
  lost: 'bg-red-500',
  info_sent: 'bg-indigo-500',
  follow_up: 'bg-amber-500',
  registered: 'bg-emerald-500',
};

interface StageColumnProps {
  stage: string;
  label: string;
  opportunities: Opportunity[];
}

export function StageColumn({ stage, label, opportunities }: StageColumnProps) {
  const { isOver, setNodeRef } = useDroppable({ id: stage });
  const dotColor = STAGE_COLORS[stage] || 'bg-gray-500';

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'min-w-[280px] w-[280px] flex-shrink-0 flex flex-col rounded-lg p-2 transition-colors',
        isOver && 'ring-2 ring-primary/30 bg-primary/5'
      )}
    >
      <div className="flex items-center gap-2 mb-3 px-1">
        <span className={cn('h-2.5 w-2.5 rounded-full', dotColor)} />
        <h3 className="text-sm font-medium text-foreground">{label}</h3>
        <Badge variant="secondary" className="text-xs">
          {opportunities.length}
        </Badge>
      </div>
      <div className="space-y-3 flex-1 min-h-[200px]">
        {opportunities.map((opp) => (
          <OpportunityCard key={opp.id} opportunity={opp} />
        ))}
      </div>
    </div>
  );
}

export { STAGE_COLORS };
