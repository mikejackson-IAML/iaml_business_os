'use client';

import Link from 'next/link';
import { ChevronRight, Clock } from 'lucide-react';
import { format, isPast, isToday, isTomorrow } from 'date-fns';
import type { WorkflowExtended, WorkflowStatus } from '@/lib/api/workflow-types';

interface WorkflowRowProps {
  workflow: WorkflowExtended;
}

// Status configuration with colors and text
const workflowStatusConfig: Record<WorkflowStatus, { color: string; text: string }> = {
  not_started: { color: 'bg-gray-400', text: 'Not Started' },
  in_progress: { color: 'bg-blue-500', text: 'In Progress' },
  blocked: { color: 'bg-amber-500', text: 'Blocked' },
  completed: { color: 'bg-emerald-500', text: 'Completed' },
};

export function WorkflowRow({ workflow }: WorkflowRowProps) {
  const status = workflowStatusConfig[workflow.status] || workflowStatusConfig.not_started;

  const formatDueDate = (date: string | null) => {
    if (!date) return '—';
    const d = new Date(date);
    if (isPast(d) && !isToday(d)) {
      return <span className="text-error">Overdue</span>;
    }
    if (isToday(d)) {
      return <span className="text-warning">Today</span>;
    }
    if (isTomorrow(d)) {
      return 'Tomorrow';
    }
    return format(d, 'MMM d');
  };

  const formatProgress = (completed: number, total: number) => {
    if (total === 0) return '—';
    return `${completed} of ${total} complete`;
  };

  return (
    <div className="border-b border-border last:border-0">
      <Link
        href={`/dashboard/action-center/workflows/${workflow.id}`}
        className="w-full grid grid-cols-[80px_1fr_140px_120px_120px] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left items-center"
      >
        {/* Status */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${status.color}`} />
          <span className="text-sm sr-only">{status.text}</span>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-0.5 min-w-0">
          <div className="flex items-center gap-2">
            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <span className="font-medium truncate">{workflow.name}</span>
          </div>
          {workflow.description && (
            <p className="text-sm text-muted-foreground truncate pl-6">
              {workflow.description}
            </p>
          )}
        </div>

        {/* Progress */}
        <div className="text-sm">
          {formatProgress(workflow.completed_tasks, workflow.total_tasks)}
        </div>

        {/* Due Date */}
        <div className="text-sm flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {formatDueDate(workflow.target_completion_date)}
        </div>

        {/* Department */}
        <div className="text-sm text-muted-foreground truncate">
          {workflow.department || '—'}
        </div>
      </Link>
    </div>
  );
}

// Export status config for potential reuse
export { workflowStatusConfig };
