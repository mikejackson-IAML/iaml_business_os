'use client';

import { cn } from '@/lib/utils';
import {
  IN_HOUSE_STAGES,
  INDIVIDUAL_STAGES,
  IN_HOUSE_STAGE_LABELS,
  INDIVIDUAL_STAGE_LABELS,
} from '@/lib/api/lead-intelligence-opportunities-types';

interface StageVisualizationProps {
  type: 'in_house' | 'individual';
  currentStage: string;
  onStageChange: (stage: string) => void;
  disabled?: boolean;
}

export function StageVisualization({ type, currentStage, onStageChange, disabled }: StageVisualizationProps) {
  const stages: string[] = type === 'in_house' ? [...IN_HOUSE_STAGES] : [...INDIVIDUAL_STAGES];
  const labels = type === 'in_house' ? IN_HOUSE_STAGE_LABELS : INDIVIDUAL_STAGE_LABELS;
  const currentIndex = stages.indexOf(currentStage);

  return (
    <div className="flex items-center gap-0 overflow-x-auto py-2">
      {stages.map((stage, index) => {
        const isCurrent = stage === currentStage;
        const isCompleted = currentIndex >= 0 && index < currentIndex;
        const isWon = stage === 'won' && isCurrent;
        const isLost = stage === 'lost' && isCurrent;
        const isRegistered = stage === 'registered' && isCurrent;

        return (
          <div key={stage} className="flex items-center">
            {index > 0 && (
              <div
                className={cn(
                  'h-0.5 w-6 sm:w-10',
                  isCompleted || isCurrent ? 'bg-primary' : 'bg-border'
                )}
              />
            )}
            <button
              type="button"
              disabled={disabled}
              onClick={() => onStageChange(stage)}
              className={cn(
                'flex flex-col items-center gap-1 group',
                disabled && 'cursor-not-allowed opacity-60'
              )}
            >
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors',
                  isCurrent && !isWon && !isLost && !isRegistered &&
                    'bg-primary text-primary-foreground border-primary',
                  isCompleted &&
                    'bg-primary/20 text-primary border-primary/40',
                  isWon || isRegistered
                    ? 'bg-green-500 text-white border-green-500'
                    : '',
                  isLost
                    ? 'bg-red-500 text-white border-red-500'
                    : '',
                  !isCurrent && !isCompleted &&
                    'bg-background text-muted-foreground border-border group-hover:border-primary/50'
                )}
              >
                {index + 1}
              </div>
              <span
                className={cn(
                  'text-[10px] sm:text-xs whitespace-nowrap max-w-[60px] sm:max-w-[80px] text-center truncate',
                  isCurrent ? 'font-semibold text-foreground' : 'text-muted-foreground'
                )}
              >
                {labels[stage] ?? stage}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
