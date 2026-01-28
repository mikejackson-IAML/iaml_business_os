'use client';

import { SparkAreaChart } from '@tremor/react';
import { Card, CardContent } from '@/dashboard-kit/components/ui/card';
import { cn } from '@/dashboard-kit/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: Array<{ date: string; value: number }>;
  trendColor?: 'blue' | 'emerald' | 'amber';
  className?: string;
}

export function MetricCard({
  title,
  value,
  subtitle,
  trend,
  trendColor = 'blue',
  className,
}: MetricCardProps) {
  // Check if we have valid trend data
  const hasValidTrend = trend && trend.length > 0 && trend.some((d) => d.value > 0);

  return (
    <Card className={cn('p-6', className)}>
      <CardContent className="p-0 flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          )}
        </div>

        {hasValidTrend ? (
          <SparkAreaChart
            data={trend!}
            categories={['value']}
            index="date"
            colors={[trendColor]}
            className="h-10 w-28"
          />
        ) : (
          <div className="h-10 w-28 bg-muted rounded" />
        )}
      </CardContent>
    </Card>
  );
}
