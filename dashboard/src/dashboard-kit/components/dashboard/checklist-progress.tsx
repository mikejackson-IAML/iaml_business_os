'use client';

import * as React from 'react';
import { Check, X, Circle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress, ColoredProgress } from '../ui/progress';
import type { HealthStatus } from '../../types';

interface ChecklistItem {
  id: string;
  label: string;
  completed: boolean;
  description?: string;
  required?: boolean;
}

interface ChecklistProgressProps {
  items: ChecklistItem[];
  title?: string;
  showPercentage?: boolean;
  showCount?: boolean;
  colorCoded?: boolean;
  onItemClick?: (item: ChecklistItem) => void;
  className?: string;
}

export function ChecklistProgress({
  items,
  title = 'Progress',
  showPercentage = true,
  showCount = true,
  colorCoded = true,
  onItemClick,
  className,
}: ChecklistProgressProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const totalCount = items.length;
  const percentage = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  let status: HealthStatus = 'healthy';
  if (percentage < 70) {
    status = 'critical';
  } else if (percentage < 90) {
    status = 'warning';
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <div className="flex items-center gap-2 text-sm">
            {showPercentage && (
              <span
                className={cn(
                  'font-medium',
                  status === 'healthy' && 'text-emerald-600 dark:text-emerald-400',
                  status === 'warning' && 'text-amber-600 dark:text-amber-400',
                  status === 'critical' && 'text-red-600 dark:text-red-400'
                )}
              >
                {Math.round(percentage)}%
              </span>
            )}
            {showCount && (
              <span className="text-muted-foreground">
                ({completedCount}/{totalCount})
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Progress bar */}
        <div className="mb-4">
          {colorCoded ? (
            <ColoredProgress
              value={percentage}
              className="h-2"
              thresholds={{ warning: 20, critical: 40 }}
            />
          ) : (
            <Progress value={percentage} className="h-2" />
          )}
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {items.map((item) => (
            <div
              key={item.id}
              className={cn(
                'flex items-center gap-3 p-2 rounded-lg transition-colors',
                onItemClick && 'cursor-pointer hover:bg-muted/50'
              )}
              onClick={() => onItemClick?.(item)}
            >
              <div
                className={cn(
                  'flex h-5 w-5 items-center justify-center rounded-full flex-shrink-0',
                  item.completed
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : item.required
                    ? 'bg-red-100 dark:bg-red-900/30'
                    : 'bg-muted'
                )}
              >
                {item.completed ? (
                  <Check className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                ) : item.required ? (
                  <X className="h-3 w-3 text-red-600 dark:text-red-400" />
                ) : (
                  <Circle className="h-3 w-3 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm',
                    item.completed && 'text-muted-foreground line-through'
                  )}
                >
                  {item.label}
                  {item.required && !item.completed && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </p>
                {item.description && (
                  <p className="text-xs text-muted-foreground truncate">
                    {item.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact inline checklist for smaller spaces
interface MiniChecklistProps {
  items: { label: string; completed: boolean }[];
  className?: string;
}

export function MiniChecklist({ items, className }: MiniChecklistProps) {
  const completedCount = items.filter((item) => item.completed).length;
  const percentage = items.length > 0 ? (completedCount / items.length) * 100 : 0;

  return (
    <div className={cn('space-y-2', className)}>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">
          {completedCount}/{items.length} complete
        </span>
        <span className="font-medium">{Math.round(percentage)}%</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
      <div className="flex flex-wrap gap-1">
        {items.map((item, index) => (
          <div
            key={index}
            className={cn(
              'h-2 w-2 rounded-full',
              item.completed ? 'bg-emerald-500' : 'bg-muted'
            )}
            title={item.label}
          />
        ))}
      </div>
    </div>
  );
}

export default ChecklistProgress;
