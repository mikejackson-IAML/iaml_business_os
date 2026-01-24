'use client';

import Link from 'next/link';
import { CheckCircle2, Clock, Circle, ArrowRight, AlertTriangle } from 'lucide-react';
import { format, isPast, isToday } from 'date-fns';
import { Badge } from '@/dashboard-kit/components/ui/badge';
import type { TaskExtended, TaskStatus, TaskPriority } from '@/lib/api/task-types';
import { cn } from '@/lib/utils';

interface WorkflowTaskRowProps {
  task: TaskExtended;
  depth?: 0 | 1 | 2;
  blockedByName?: string;
}

// Priority indicator colors
const priorityColors: Record<TaskPriority, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  normal: 'bg-blue-500',
  low: 'bg-gray-400',
};

// Status icon configuration
const statusIcons: Record<TaskStatus, { icon: typeof CheckCircle2; className: string }> = {
  done: { icon: CheckCircle2, className: 'text-emerald-500' },
  dismissed: { icon: CheckCircle2, className: 'text-gray-400' },
  in_progress: { icon: Clock, className: 'text-blue-500' },
  waiting: { icon: Clock, className: 'text-amber-500' },
  open: { icon: Circle, className: 'text-gray-400' },
};

/**
 * WorkflowTaskRow - Single task row in workflow task list
 *
 * Features:
 * - Link wrapper to task detail page
 * - Visual indentation based on depth (0, 1, 2)
 * - Status icon matching task status
 * - Priority colored dot indicator
 * - Due date with overdue highlighting
 * - Blocked badge when task is blocked
 * - Blocked-by indicator showing parent task name
 */
export function WorkflowTaskRow({ task, depth = 0, blockedByName }: WorkflowTaskRowProps) {
  const { icon: StatusIcon, className: statusIconClass } = statusIcons[task.status] || statusIcons.open;
  const isBlocked = task.is_blocked;
  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));
  const isDueToday = task.due_date && isToday(new Date(task.due_date));

  // Format due date
  const formattedDueDate = task.due_date
    ? isDueToday
      ? 'Today'
      : format(new Date(task.due_date), 'MMM d')
    : null;

  // Indentation margins for depth levels
  const depthMargins = {
    0: 'ml-0',
    1: 'ml-6',
    2: 'ml-12',
  };

  // Left border indicator for dependencies
  const depthBorders = {
    0: '',
    1: 'border-l-2 border-muted-foreground/20',
    2: 'border-l-2 border-muted-foreground/10',
  };

  return (
    <Link
      href={`/dashboard/action-center/tasks/${task.id}`}
      className={cn(
        'block p-4 hover:bg-muted/50 transition-colors',
        isBlocked && 'opacity-80',
        depthMargins[depth],
        depthBorders[depth],
        depth > 0 && 'pl-4'
      )}
    >
      <div className="flex items-center gap-3">
        {/* Status icon */}
        <StatusIcon className={cn('h-5 w-5 flex-shrink-0', statusIconClass)} />

        {/* Priority dot */}
        <div
          className={cn(
            'w-2.5 h-2.5 rounded-full flex-shrink-0',
            priorityColors[task.priority]
          )}
          title={`${task.priority} priority`}
        />

        {/* Task content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Blocked-by indicator */}
            {depth > 0 && blockedByName && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                <ArrowRight className="h-3 w-3" />
                <span className="truncate max-w-[120px]">{blockedByName}</span>
              </span>
            )}

            {/* Task title */}
            <span
              className={cn(
                'font-medium truncate',
                isBlocked && 'text-muted-foreground',
                task.status === 'done' && 'line-through text-muted-foreground',
                task.status === 'dismissed' && 'line-through text-muted-foreground'
              )}
            >
              {task.title}
            </span>
          </div>
        </div>

        {/* Right side badges/info */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Blocked badge */}
          {isBlocked && task.blocked_by_count > 0 && (
            <Badge variant="warning" className="text-xs flex items-center gap-1">
              <AlertTriangle className="h-3 w-3" />
              Blocked by {task.blocked_by_count}
            </Badge>
          )}

          {/* Due date */}
          {formattedDueDate && (
            <span
              className={cn(
                'text-xs',
                isOverdue && task.status !== 'done' && task.status !== 'dismissed'
                  ? 'text-red-500 font-medium'
                  : isDueToday && task.status !== 'done' && task.status !== 'dismissed'
                  ? 'text-amber-500 font-medium'
                  : 'text-muted-foreground'
              )}
            >
              {formattedDueDate}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
