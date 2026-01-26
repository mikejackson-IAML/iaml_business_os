'use client';

import Link from 'next/link';
import { TaskExtended } from '@/lib/api/task-types';
import { ChevronRight, AlertCircle, Clock, Workflow, Bot, User } from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ConfidenceBadge } from './confidence-badge';
import { AISuggestionActions } from './ai-suggestion-actions';

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

// Calculate days until AI suggestion expires (7 days from ai_suggested_at)
const getDaysUntilExpiry = (suggestedAt: string | null): number | null => {
  if (!suggestedAt) return null;
  const suggested = new Date(suggestedAt);
  const expiryDate = new Date(suggested.getTime() + 7 * 24 * 60 * 60 * 1000);
  const now = new Date();
  return Math.ceil((expiryDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
};

export function TaskRow({ task }: TaskRowProps) {
  const priority = priorityConfig[task.priority as keyof typeof priorityConfig] || priorityConfig.normal;
  const SourceIcon = sourceIcons[task.source as keyof typeof sourceIcons] || User;

  // Check if this is an AI suggestion that can be actioned
  const isAISuggestion = task.source === 'ai' && task.status === 'open';

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
      <div className="w-full grid grid-cols-[100px_1fr_120px_120px_100px_auto] gap-4 px-6 py-4 hover:bg-muted/50 transition-colors text-left items-center">
        {/* Priority */}
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${priority.color}`} />
          <span className="text-sm">{priority.text}</span>
        </div>

        {/* Title - link to detail page */}
        <Link
          href={`/dashboard/action-center/tasks/${task.id}`}
          className="flex items-center gap-2 hover:underline"
        >
          <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="font-medium truncate">{task.title}</span>
          {task.is_blocked && (
            <span className="px-1.5 py-0.5 text-xs rounded bg-warning/20 text-warning">
              Blocked
            </span>
          )}
          {/* AI suggestion expiry warning (2 days or less) */}
          {task.source === 'ai' && task.status === 'open' && task.ai_suggested_at && (
            (() => {
              const daysLeft = getDaysUntilExpiry(task.ai_suggested_at);
              if (daysLeft !== null && daysLeft <= 2) {
                return (
                  <span className="px-1.5 py-0.5 text-xs rounded bg-amber-100 text-amber-700">
                    Expires in {daysLeft}d
                  </span>
                );
              }
              return null;
            })()
          )}
        </Link>

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
          {/* Confidence (AI tasks only) */}
          {task.source === 'ai' && task.ai_confidence !== null && (
            <ConfidenceBadge
              confidence={task.ai_confidence}
              showLabel={false}
              size="sm"
            />
          )}
        </div>

        {/* Quick Actions (for AI suggestions) */}
        <div className="flex items-center justify-end min-w-[60px]">
          {isAISuggestion && (
            <AISuggestionActions task={task} variant="inline" />
          )}
        </div>
      </div>
    </div>
  );
}
