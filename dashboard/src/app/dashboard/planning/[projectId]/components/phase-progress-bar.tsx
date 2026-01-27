'use client';

import {
  Lightbulb,
  Search,
  FileText,
  Code,
  CheckCircle,
  Package,
  CheckCircle2,
  Moon,
  Circle,
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/dashboard-kit/components/ui/tooltip';
import type {
  PlanningPhase,
  PlanningProject,
  PhaseType,
  PhaseStatus,
} from '@/dashboard-kit/types/departments/planning';
import {
  PHASE_ORDER,
  getPhaseLabel,
  getPhaseIcon,
  getApproximateIncubationTime,
} from '@/dashboard-kit/types/departments/planning';

interface PhaseProgressBarProps {
  phases: PlanningPhase[];
  currentPhase: PhaseType;
  project: PlanningProject;
  onPhaseClick?: (phase: PhaseType) => void;
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  lightbulb: Lightbulb,
  search: Search,
  'file-text': FileText,
  code: Code,
  'check-circle': CheckCircle,
  package: Package,
};

function getPhaseRecord(phases: PlanningPhase[], phaseType: PhaseType): PlanningPhase | undefined {
  return phases.find((p) => p.phase_type === phaseType);
}

function getPhaseStatus(
  phases: PlanningPhase[],
  phaseType: PhaseType,
  currentPhase: PhaseType
): PhaseStatus {
  const record = getPhaseRecord(phases, phaseType);
  if (record) return record.status;
  // If no record exists, infer from position relative to current phase
  const phaseIdx = PHASE_ORDER.indexOf(phaseType);
  const currentIdx = PHASE_ORDER.indexOf(currentPhase);
  if (phaseIdx < currentIdx) return 'complete';
  if (phaseIdx === currentIdx) return 'in_progress';
  return 'not_started';
}

function formatDuration(startDate: string, endDate?: string): string {
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
  return 'Less than an hour';
}

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  return 'Just now';
}

function getTooltipContent(record: PlanningPhase | undefined, status: PhaseStatus): string {
  if (!record?.started_at) return 'Not started';
  if (status === 'complete' && record.completed_at) {
    return `Completed ${formatRelativeDate(record.completed_at)} (${formatDuration(record.started_at, record.completed_at)})`;
  }
  if (status === 'incubating') {
    return `Incubating - started ${formatDuration(record.started_at)} ago`;
  }
  return `In progress - ${formatDuration(record.started_at)}`;
}

export function PhaseProgressBar({
  phases,
  currentPhase,
  project,
  onPhaseClick,
}: PhaseProgressBarProps) {
  const incubationText = getApproximateIncubationTime(project);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="flex items-center w-full">
        {PHASE_ORDER.map((phaseType, index) => {
          const status = getPhaseStatus(phases, phaseType, currentPhase);
          const record = getPhaseRecord(phases, phaseType);
          const iconName = getPhaseIcon(phaseType);
          const Icon = ICON_MAP[iconName] || Circle;
          const isCompleted = status === 'complete';
          const isCurrent = status === 'in_progress';
          const isIncubating = status === 'incubating';
          const isClickable = isCompleted && onPhaseClick;

          return (
            <div key={phaseType} className="flex items-center flex-1 last:flex-initial">
              {/* Phase circle + label */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className={`flex flex-col items-center gap-1.5 min-w-[64px] ${
                      isClickable ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    onClick={() => isClickable && onPhaseClick(phaseType)}
                    disabled={!isClickable}
                  >
                    {/* Circle indicator */}
                    <div className="relative">
                      {isCompleted && (
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      )}
                      {isCurrent && (
                        <>
                          <div className="absolute inset-0 h-8 w-8 rounded-full bg-blue-400/30 animate-ping" />
                          <div className="relative flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                            <Icon className="h-4 w-4" />
                          </div>
                        </>
                      )}
                      {isIncubating && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
                          <Moon className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                      )}
                      {!isCompleted && !isCurrent && !isIncubating && (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-muted-foreground/30">
                          <Icon className="h-4 w-4 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    {/* Label */}
                    <span
                      className={`text-xs font-medium ${
                        isCompleted
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isCurrent
                            ? 'text-blue-600 dark:text-blue-400'
                            : isIncubating
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-muted-foreground/50'
                      }`}
                    >
                      {getPhaseLabel(phaseType)}
                    </span>

                    {/* Incubation countdown */}
                    {isIncubating && incubationText && (
                      <span className="text-[10px] text-amber-600 dark:text-amber-400">
                        {incubationText}
                      </span>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{getTooltipContent(record, status)}</p>
                </TooltipContent>
              </Tooltip>

              {/* Connector line */}
              {index < PHASE_ORDER.length - 1 && (
                <div
                  className={`h-0.5 flex-1 mx-1 ${
                    isCompleted
                      ? 'bg-emerald-500'
                      : isCurrent || isIncubating
                        ? 'bg-gradient-to-r from-blue-500/60 to-muted-foreground/20'
                        : 'bg-muted-foreground/20'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </TooltipProvider>
  );
}
