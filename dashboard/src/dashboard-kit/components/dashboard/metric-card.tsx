'use client';

import * as React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Card, CardContent } from '../ui/card';
import { StatusIndicator } from './status-indicator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import type { HealthStatus, TrendDirection, MetricFormat } from '../../types';
import { formatNumber, formatCurrency, formatPercent } from '../../lib/utils';

interface MetricCardProps {
  label: string;
  value: string | number;
  description?: string;
  delta?: string | number;
  deltaDirection?: TrendDirection;
  trend?: TrendDirection;
  target?: number;
  status?: HealthStatus;
  format?: MetricFormat;
  icon?: LucideIcon;
  className?: string;
  onClick?: () => void;
}

function formatValue(value: string | number, format?: MetricFormat): string {
  if (typeof value === 'string') {
    return value;
  }

  switch (format) {
    case 'currency':
      return formatCurrency(value);
    case 'percent':
      return formatPercent(value);
    case 'number':
      return formatNumber(value);
    default:
      return String(value);
  }
}

export function MetricCard({
  label,
  value,
  description,
  delta,
  deltaDirection,
  trend,
  target,
  status,
  format,
  icon: Icon,
  className,
  onClick,
}: MetricCardProps) {
  const formattedValue = formatValue(value, format);
  const direction = deltaDirection || trend;

  const TrendIcon = direction === 'up'
    ? TrendingUp
    : direction === 'down'
    ? TrendingDown
    : Minus;

  const trendColorClass = direction === 'up'
    ? 'text-emerald-600 dark:text-emerald-400'
    : direction === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  return (
    <Card
      className={cn(
        'transition-all hover:shadow-md',
        onClick && 'cursor-pointer hover:border-primary/50',
        className
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-muted-foreground truncate">
                {label}
              </span>
              {status && <StatusIndicator status={status} size="sm" />}
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-semibold tracking-tight truncate">
                {formattedValue}
              </span>
              {target && (
                <span className="text-xs text-muted-foreground">
                  / {formatValue(target, format)}
                </span>
              )}
            </div>

            {(delta !== undefined || description) && (
              <div className="flex items-center gap-2 mt-1">
                {delta !== undefined && (
                  <span className={cn('flex items-center gap-0.5 text-xs font-medium', trendColorClass)}>
                    <TrendIcon className="h-3 w-3" />
                    {typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}%` : delta}
                  </span>
                )}
                {description && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className="text-xs text-muted-foreground truncate">
                          {description}
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>{description}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
            )}
          </div>

          {Icon && (
            <div className="flex-shrink-0 ml-3">
              <div className="p-2 rounded-lg bg-muted">
                <Icon className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Compact version for sidebars
interface CompactMetricProps {
  label: string;
  value: string | number;
  delta?: string | number;
  trend?: TrendDirection;
  format?: MetricFormat;
  className?: string;
}

export function CompactMetric({
  label,
  value,
  delta,
  trend,
  format,
  className,
}: CompactMetricProps) {
  const formattedValue = formatValue(value, format);

  const trendColorClass = trend === 'up'
    ? 'text-emerald-600 dark:text-emerald-400'
    : trend === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  return (
    <div className={cn('flex items-center justify-between py-2', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">{formattedValue}</span>
        {delta !== undefined && (
          <span className={cn('text-xs', trendColorClass)}>
            {typeof delta === 'number' ? `${delta > 0 ? '+' : ''}${delta}%` : delta}
          </span>
        )}
      </div>
    </div>
  );
}

export default MetricCard;
