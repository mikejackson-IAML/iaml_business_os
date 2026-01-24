'use client';

import { SparkAreaChart } from '@tremor/react';
import { cn } from '@/dashboard-kit/lib/utils';

interface RankingSparklineProps {
  data: Array<{ date: string; position: number | null }>;
  className?: string;
}

export function RankingSparkline({ data, className }: RankingSparklineProps) {
  // Invert positions so "up is good" (position 1 at top)
  // Position 1 becomes 100, position 100 becomes 1
  const chartData = data.map((d) => ({
    date: d.date,
    value: d.position !== null ? 101 - d.position : null,
  }));

  // Check if we have any valid data
  const hasValidData = chartData.some((d) => d.value !== null);

  if (!hasValidData) {
    return <div className={cn('h-8 w-24 bg-muted rounded', className)} />;
  }

  return (
    <SparkAreaChart
      data={chartData}
      categories={['value']}
      index="date"
      colors={['blue']}
      className={cn('h-8 w-24', className)}
      connectNulls={true}
    />
  );
}
