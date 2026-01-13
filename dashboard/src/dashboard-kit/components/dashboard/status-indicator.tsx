'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import type { HealthStatus } from '../../types';

interface StatusIndicatorProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  pulse?: boolean;
  label?: string;
  className?: string;
}

const sizeClasses = {
  sm: 'h-2 w-2',
  md: 'h-2.5 w-2.5',
  lg: 'h-3 w-3',
};

const statusColors = {
  healthy: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-red-500',
};

const statusLabels = {
  healthy: 'Healthy',
  warning: 'Warning',
  critical: 'Critical',
};

export function StatusIndicator({
  status,
  size = 'md',
  pulse = false,
  label,
  className,
}: StatusIndicatorProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="relative flex">
        <span
          className={cn(
            'rounded-full',
            sizeClasses[size],
            statusColors[status],
            pulse && status === 'critical' && 'animate-ping absolute inline-flex h-full w-full opacity-75'
          )}
        />
        <span
          className={cn(
            'relative inline-flex rounded-full',
            sizeClasses[size],
            statusColors[status]
          )}
        />
      </span>
      {label !== undefined && (
        <span className="text-sm text-muted-foreground">
          {label || statusLabels[status]}
        </span>
      )}
    </div>
  );
}

// Status badge with dot
interface StatusBadgeProps {
  status: HealthStatus | 'info' | 'pending';
  children?: React.ReactNode;
  className?: string;
}

const badgeStatusColors = {
  healthy: {
    bg: 'bg-emerald-100 dark:bg-emerald-900/30',
    text: 'text-emerald-800 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  warning: {
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    text: 'text-amber-800 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  critical: {
    bg: 'bg-red-100 dark:bg-red-900/30',
    text: 'text-red-800 dark:text-red-400',
    dot: 'bg-red-500',
  },
  info: {
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    text: 'text-blue-800 dark:text-blue-400',
    dot: 'bg-blue-500',
  },
  pending: {
    bg: 'bg-gray-100 dark:bg-gray-800',
    text: 'text-gray-700 dark:text-gray-300',
    dot: 'bg-gray-400',
  },
};

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  const colors = badgeStatusColors[status];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
        colors.bg,
        colors.text,
        className
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', colors.dot)} />
      {children}
    </span>
  );
}

export default StatusIndicator;
