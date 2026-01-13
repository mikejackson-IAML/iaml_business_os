'use client';

import * as React from 'react';
import { Calendar, Clock, AlertTriangle, CheckCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { formatDateShort } from '../../lib/utils';

type DeadlineStatus = 'upcoming' | 'due_soon' | 'overdue' | 'completed';

interface Deadline {
  id: string;
  title: string;
  description?: string;
  dueDate: Date;
  status: DeadlineStatus;
  daysUntil: number;
  category?: string;
  relatedItem?: string;
}

interface DeadlineListProps {
  deadlines: Deadline[];
  title?: string;
  maxItems?: number;
  groupByDate?: boolean;
  isLoading?: boolean;
  onDeadlineClick?: (deadline: Deadline) => void;
  onViewAll?: () => void;
  className?: string;
}

const statusConfig: Record<DeadlineStatus, {
  icon: typeof Clock;
  badgeVariant: 'healthy' | 'warning' | 'critical' | 'secondary';
  label: string;
}> = {
  upcoming: {
    icon: Calendar,
    badgeVariant: 'secondary',
    label: 'Upcoming',
  },
  due_soon: {
    icon: Clock,
    badgeVariant: 'warning',
    label: 'Due Soon',
  },
  overdue: {
    icon: AlertTriangle,
    badgeVariant: 'critical',
    label: 'Overdue',
  },
  completed: {
    icon: CheckCircle,
    badgeVariant: 'healthy',
    label: 'Completed',
  },
};

export function DeadlineList({
  deadlines,
  title = 'Upcoming Deadlines',
  maxItems = 10,
  groupByDate = false,
  isLoading = false,
  onDeadlineClick,
  onViewAll,
  className,
}: DeadlineListProps) {
  const displayedDeadlines = deadlines.slice(0, maxItems);
  const hasMore = deadlines.length > maxItems;

  // Group deadlines by date if requested
  const groupedDeadlines = React.useMemo(() => {
    if (!groupByDate) {
      return null;
    }

    const groups: Record<string, Deadline[]> = {};
    displayedDeadlines.forEach((deadline) => {
      const dateKey = formatDateShort(deadline.dueDate);
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(deadline);
    });

    return Object.entries(groups);
  }, [displayedDeadlines, groupByDate]);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 animate-pulse">
              <div className="h-10 w-10 bg-muted rounded" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 bg-muted rounded" />
                <div className="h-3 w-1/2 bg-muted rounded" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (deadlines.length === 0) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Calendar className="h-8 w-8 text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No upcoming deadlines</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderDeadlineItem = (deadline: Deadline) => {
    const config = statusConfig[deadline.status];
    const Icon = config.icon;

    return (
      <div
        key={deadline.id}
        className={cn(
          'flex items-start gap-3 p-2 rounded-lg transition-colors',
          onDeadlineClick && 'cursor-pointer hover:bg-muted/50'
        )}
        onClick={() => onDeadlineClick?.(deadline)}
      >
        <div
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-lg flex-shrink-0',
            deadline.status === 'overdue'
              ? 'bg-red-100 dark:bg-red-900/30'
              : deadline.status === 'due_soon'
              ? 'bg-amber-100 dark:bg-amber-900/30'
              : 'bg-muted'
          )}
        >
          <Icon
            className={cn(
              'h-5 w-5',
              deadline.status === 'overdue'
                ? 'text-red-600 dark:text-red-400'
                : deadline.status === 'due_soon'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-muted-foreground'
            )}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-sm font-medium">{deadline.title}</p>
              {deadline.description && (
                <p className="text-xs text-muted-foreground truncate">
                  {deadline.description}
                </p>
              )}
              {deadline.relatedItem && (
                <p className="text-xs text-muted-foreground">
                  {deadline.relatedItem}
                </p>
              )}
            </div>
            <Badge variant={config.badgeVariant} className="flex-shrink-0">
              {deadline.daysUntil === 0
                ? 'Today'
                : deadline.daysUntil < 0
                ? `${Math.abs(deadline.daysUntil)}d overdue`
                : `${deadline.daysUntil}d`}
            </Badge>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          {hasMore && onViewAll && (
            <button
              onClick={onViewAll}
              className="text-sm text-primary hover:underline"
            >
              View all
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {groupByDate && groupedDeadlines ? (
          <div className="space-y-4">
            {groupedDeadlines.map(([date, items]) => (
              <div key={date}>
                <div className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                  {date}
                </div>
                <div className="space-y-1">
                  {items.map(renderDeadlineItem)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {displayedDeadlines.map(renderDeadlineItem)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default DeadlineList;
