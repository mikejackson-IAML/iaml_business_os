'use client';

import { useState, useTransition } from 'react';
import { CheckCircle, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/dashboard-kit/lib/utils';
import { completeRecommendationAction, snoozeRecommendationAction } from '../actions';

interface RecommendationCardProps {
  id: string;
  title: string;
  description: string;
  category: string | null;
  priority: 'high' | 'medium' | 'low';
  createdAt: Date;
  onComplete?: (id: string) => void;
  onSnooze?: (id: string) => void;
  className?: string;
}

const priorityColors = {
  high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  medium: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400',
  low: 'bg-gray-100 text-gray-800 dark:bg-gray-700/30 dark:text-gray-400',
};

export function RecommendationCard({
  id,
  title,
  description,
  category,
  priority,
  createdAt,
  onComplete,
  onSnooze,
  className,
}: RecommendationCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDismissing, setIsDismissing] = useState(false);

  const handleComplete = () => {
    setIsDismissing(true);
    startTransition(async () => {
      const result = await completeRecommendationAction(id);
      if (result.success) {
        onComplete?.(id);
      } else {
        console.error('Failed to complete recommendation:', result.error);
        setIsDismissing(false);
      }
    });
  };

  const handleSnooze = (days: number) => {
    setIsDismissing(true);
    startTransition(async () => {
      const result = await snoozeRecommendationAction(id, days);
      if (result.success) {
        onSnooze?.(id);
      } else {
        console.error('Failed to snooze recommendation:', result.error);
        setIsDismissing(false);
      }
    });
  };

  return (
    <div
      className={cn(
        'relative p-4 rounded-lg bg-card border transition-all',
        isDismissing && 'opacity-50 scale-95',
        className
      )}
    >
      {/* Header with title and priority badge */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="font-medium text-sm text-foreground flex-1">{title}</h4>
        <span
          className={cn(
            'px-2 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0',
            priorityColors[priority]
          )}
        >
          {priority}
        </span>
      </div>

      {/* Description */}
      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{description}</p>

      {/* Category and timestamp */}
      <div className="flex items-center gap-2 mb-3">
        {category && (
          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-xs">
            {category}
          </span>
        )}
        <span className="text-xs text-muted-foreground/70">{formatRelativeTime(createdAt)}</span>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleComplete}
          disabled={isPending}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 rounded text-sm font-medium transition-colors',
            'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
            'dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50',
            isPending && 'opacity-50 cursor-not-allowed'
          )}
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          Complete
        </button>

        <select
          onChange={(e) => {
            const days = parseInt(e.target.value, 10);
            if (days > 0) {
              handleSnooze(days);
            }
          }}
          disabled={isPending}
          className={cn(
            'text-sm border rounded px-2 py-1.5 bg-background',
            'text-muted-foreground hover:text-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            isPending && 'opacity-50 cursor-not-allowed'
          )}
          defaultValue=""
        >
          <option value="" disabled>
            Snooze...
          </option>
          <option value="1">1 day</option>
          <option value="7">7 days</option>
          <option value="30">30 days</option>
        </select>
      </div>
    </div>
  );
}
