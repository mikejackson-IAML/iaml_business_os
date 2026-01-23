'use client';

import Link from 'next/link';
import { TaskExtended } from '@/lib/api/task-types';
import { ChevronRight, AlertCircle, Clock, Workflow, Bot, User } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';

interface TaskRowProps {
  task: TaskExtended;
}

const priorityConfig = {
  critical: { color: 'bg-red-500', text: 'Critical' },
  high: { color: 'bg-orange-500', text: 'High' },
  normal: { color: 'bg-gray-400', text: 'Normal' },
  low: { color: 'bg-blue-500', text: 'Low' },
};

const sourceIcons = {
  alert: AlertCircle,
  workflow: Workflow,
  ai: Bot,
  manual: User,
  rule: Workflow,
};

export function TaskRow({ task }: TaskRowProps) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal;
  const SourceIcon = sourceIcons[task.source as keyof typeof sourceIcons] || User;

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

  return (
    <div className="border-b border-border last:border-0">
      {/* Main row - navigates to task detail */}
      <Link
        href={`/dashboard/action-center/tasks/${task.id}`}
        className="w-full grid grid-cols-[100px_1fr_120px_120px_100px] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left items-center"
      >
        {/* Priority */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${priority.color}`} />
          <span className="text-sm">{priority.text}</span>
        </div>

        {/* Title */}
        <div className="flex items-center gap-2">
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{task.title}</span>
          {task.is_blocked && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-warning/20 text-warning">
              Blocked
            </span>
          )}
        </div>

        {/* Due Date */}
        <div className="text-sm flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          {formatDueDate(task.due_date)}
        </div>

        {/* Department */}
        <div className="text-sm text-muted-foreground truncate">
          {task.department || '—'}
        </div>

        {/* Source */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <SourceIcon className="h-3.5 w-3.5" />
          <span className="capitalize">{task.source || 'Manual'}</span>
        </div>
      </Link>
    </div>
  );
}
