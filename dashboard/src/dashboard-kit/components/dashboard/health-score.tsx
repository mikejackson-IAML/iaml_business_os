'use client';

import * as React from 'react';
import { cn } from '../../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { StatusIndicator, StatusBadge } from './status-indicator';
import { Progress, ColoredProgress } from '../ui/progress';
import type { HealthStatus, TrendDirection } from '../../types';
import { TrendingUp, TrendingDown, Minus, ChevronDown, ChevronUp } from 'lucide-react';

interface HealthScoreProps {
  score: number;
  status: HealthStatus;
  label?: string;
  description?: string;
  trend?: TrendDirection;
  trendValue?: number;
  trendPeriod?: string;
  breakdown?: {
    label: string;
    score: number;
    status: HealthStatus;
    weight?: number;
  }[];
  showBreakdown?: boolean;
  className?: string;
}

const statusGradients = {
  healthy: 'from-emerald-500 to-emerald-600',
  warning: 'from-amber-500 to-amber-600',
  critical: 'from-red-500 to-red-600',
};

export function HealthScore({
  score,
  status,
  label = 'Health Score',
  description,
  trend,
  trendValue,
  trendPeriod = '7 days',
  breakdown,
  showBreakdown = false,
  className,
}: HealthScoreProps) {
  const [isExpanded, setIsExpanded] = React.useState(showBreakdown);

  const TrendIcon = trend === 'up'
    ? TrendingUp
    : trend === 'down'
    ? TrendingDown
    : Minus;

  const trendColorClass = trend === 'up'
    ? 'text-emerald-600 dark:text-emerald-400'
    : trend === 'down'
    ? 'text-red-600 dark:text-red-400'
    : 'text-muted-foreground';

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header gradient bar */}
      <div className={cn('h-1 bg-gradient-to-r', statusGradients[status])} />

      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-medium">{label}</CardTitle>
          <StatusBadge status={status}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </StatusBadge>
        </div>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </CardHeader>

      <CardContent>
        {/* Main score display */}
        <div className="flex items-end gap-4 mb-4">
          <div className="text-5xl font-bold tracking-tight">
            {score}
          </div>
          <div className="flex flex-col pb-1">
            <span className="text-sm text-muted-foreground">/ 100</span>
            {trend && trendValue !== undefined && (
              <span className={cn('flex items-center gap-1 text-xs font-medium', trendColorClass)}>
                <TrendIcon className="h-3 w-3" />
                {trendValue > 0 ? '+' : ''}{trendValue} vs {trendPeriod}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <ColoredProgress
          value={score}
          className="h-2 mb-4"
          thresholds={{ warning: 20, critical: 40 }}
        />

        {/* Breakdown toggle */}
        {breakdown && breakdown.length > 0 && (
          <>
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors w-full"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {isExpanded ? 'Hide' : 'Show'} breakdown
            </button>

            {/* Breakdown items */}
            {isExpanded && (
              <div className="mt-4 space-y-3">
                {breakdown.map((item) => (
                  <div key={item.label} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{item.score}</span>
                        <StatusIndicator status={item.status} size="sm" />
                      </div>
                    </div>
                    <Progress value={item.score} className="h-1" />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

// Mini health score for compact views
interface MiniHealthScoreProps {
  score: number;
  status: HealthStatus;
  label?: string;
  className?: string;
}

export function MiniHealthScore({ score, status, label, className }: MiniHealthScoreProps) {
  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="relative">
        <svg className="h-12 w-12 transform -rotate-90">
          <circle
            className="text-muted stroke-current"
            strokeWidth="3"
            fill="transparent"
            r="20"
            cx="24"
            cy="24"
          />
          <circle
            className={cn(
              'stroke-current transition-all duration-500',
              status === 'healthy' && 'text-emerald-500',
              status === 'warning' && 'text-amber-500',
              status === 'critical' && 'text-red-500'
            )}
            strokeWidth="3"
            strokeLinecap="round"
            fill="transparent"
            r="20"
            cx="24"
            cy="24"
            strokeDasharray={`${(score / 100) * 125.6} 125.6`}
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center text-sm font-semibold">
          {score}
        </span>
      </div>
      {label && (
        <span className="text-sm text-muted-foreground">{label}</span>
      )}
    </div>
  );
}

export default HealthScore;
