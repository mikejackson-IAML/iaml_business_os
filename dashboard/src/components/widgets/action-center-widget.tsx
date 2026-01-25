'use client';

import Link from 'next/link';
import { CheckSquare, AlertTriangle, Clock, AlertCircle, ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/dashboard-kit/components/ui/card';
import { Skeleton } from '@/dashboard-kit/components/ui/skeleton';
import type { TaskCounts } from '@/lib/api/task-queries';

interface ActionCenterWidgetProps {
  counts: TaskCounts | null;
  isLoading?: boolean;
}

/**
 * Action Center dashboard widget
 * Displays task counts (Critical, Due Today, Overdue) with clickable chips
 * that navigate to filtered task views
 */
export function ActionCenterWidget({ counts, isLoading }: ActionCenterWidgetProps) {
  if (isLoading || !counts) {
    return <ActionCenterWidgetSkeleton />;
  }

  const { critical_count, due_today_count, overdue_count, total_active_count } = counts;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-heading-md flex items-center gap-2">
          <CheckSquare className="h-5 w-5" style={{ color: 'hsl(var(--accent-primary))' }} />
          Action Center
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Count chips row */}
        <div className="flex flex-wrap gap-3">
          {/* Critical chip - always shown */}
          <CountChip
            count={critical_count}
            label="Critical"
            icon={AlertTriangle}
            variant="error"
            href="/dashboard/action-center?priority=critical"
          />

          {/* Due Today chip - always shown */}
          <CountChip
            count={due_today_count}
            label="Due Today"
            icon={Clock}
            variant="warning"
            href="/dashboard/action-center?due_category=today"
          />

          {/* Overdue chip - only shown if count > 0 */}
          {overdue_count > 0 && (
            <CountChip
              count={overdue_count}
              label="Overdue"
              icon={AlertCircle}
              variant="error"
              href="/dashboard/action-center?due_category=overdue"
            />
          )}
        </div>

        {/* View all link */}
        <Link
          href="/dashboard/action-center"
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          View all {total_active_count} tasks
          <ArrowRight className="h-3 w-3" />
        </Link>
      </CardContent>
    </Card>
  );
}

interface CountChipProps {
  count: number;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: 'error' | 'warning';
  href: string;
}

/**
 * Individual count chip component
 * Clickable chip that navigates to filtered view
 */
function CountChip({ count, label, icon: Icon, variant, href }: CountChipProps) {
  const bgColor = variant === 'error'
    ? 'hsl(var(--error-muted))'
    : 'hsl(var(--warning-muted))';
  const textColor = variant === 'error'
    ? 'hsl(var(--error))'
    : 'hsl(var(--warning))';

  return (
    <Link
      href={href}
      className="flex items-center gap-2 px-3 py-2 rounded-lg transition-all hover:scale-105"
      style={{
        backgroundColor: bgColor,
        color: textColor,
      }}
    >
      <Icon className="h-4 w-4" />
      <span className="font-semibold">{count}</span>
      <span className="text-sm font-medium">{label}</span>
    </Link>
  );
}

/**
 * Loading skeleton for the widget
 * Matches widget dimensions during data fetch
 */
export function ActionCenterWidgetSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Count chips skeleton */}
        <div className="flex flex-wrap gap-3">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
          <Skeleton className="h-10 w-28 rounded-lg" />
        </div>

        {/* View all link skeleton */}
        <Skeleton className="h-4 w-36" />
      </CardContent>
    </Card>
  );
}
