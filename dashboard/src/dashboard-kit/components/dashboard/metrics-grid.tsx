'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { MetricCard, CompactMetric } from './metric-card';
import { MetricCardSkeleton } from '../ui/skeleton';
import type { MetricValue, HealthStatus } from '../../types';
import * as LucideIcons from 'lucide-react';

interface MetricsGridProps {
  metrics: MetricValue[];
  columns?: 2 | 3 | 4;
  isLoading?: boolean;
  onMetricClick?: (metric: MetricValue) => void;
  className?: string;
}

const columnClasses = {
  2: 'grid-cols-1 sm:grid-cols-2',
  3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
  4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4',
};

// Helper to get icon from string name
function getIcon(iconName?: string): LucideIcons.LucideIcon | undefined {
  if (!iconName) {
    return undefined;
  }
  // Convert kebab-case to PascalCase
  const pascalCase = iconName
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('');

  const icons = LucideIcons as unknown as Record<string, LucideIcons.LucideIcon>;
  return icons[pascalCase];
}

export function MetricsGrid({
  metrics,
  columns = 4,
  isLoading = false,
  onMetricClick,
  className,
}: MetricsGridProps) {
  if (isLoading) {
    return (
      <div className={cn('grid gap-4', columnClasses[columns], className)}>
        {Array.from({ length: columns }).map((_, i) => (
          <MetricCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn('grid gap-4', columnClasses[columns], className)}>
      {metrics.map((metric) => (
        <MetricCard
          key={metric.id}
          label={metric.label}
          value={metric.value}
          description={metric.description}
          delta={metric.delta}
          deltaDirection={metric.deltaDirection}
          target={metric.target}
          status={metric.status}
          format={metric.format}
          icon={getIcon(metric.icon)}
          onClick={onMetricClick ? () => onMetricClick(metric) : undefined}
        />
      ))}
    </div>
  );
}

// Compact metrics list for sidebars
interface MetricsListProps {
  metrics: MetricValue[];
  isLoading?: boolean;
  className?: string;
}

export function MetricsList({ metrics, isLoading, className }: MetricsListProps) {
  if (isLoading) {
    return (
      <div className={cn('space-y-2', className)}>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2">
            <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('divide-y divide-border', className)}>
      {metrics.map((metric) => (
        <CompactMetric
          key={metric.id}
          label={metric.label}
          value={metric.value}
          delta={metric.delta}
          trend={metric.deltaDirection}
          format={metric.format}
        />
      ))}
    </div>
  );
}

// Summary metrics row
interface MetricsSummaryProps {
  metrics: {
    label: string;
    value: string | number;
    status?: HealthStatus;
  }[];
  className?: string;
}

export function MetricsSummary({ metrics, className }: MetricsSummaryProps) {
  return (
    <div className={cn('flex flex-wrap gap-6', className)}>
      {metrics.map((metric, index) => (
        <div key={index} className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{metric.label}:</span>
          <span className="font-medium">{metric.value}</span>
          {metric.status && (
            <span
              className={cn(
                'h-2 w-2 rounded-full',
                metric.status === 'healthy' && 'bg-emerald-500',
                metric.status === 'warning' && 'bg-amber-500',
                metric.status === 'critical' && 'bg-red-500'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default MetricsGrid;
