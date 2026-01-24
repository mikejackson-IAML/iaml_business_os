'use client';

import { MousePointerClick, Eye, Percent, TrendingUp } from 'lucide-react';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import type { SearchPerformance } from '@/lib/api/web-intel-queries';

interface GscMetricsRowProps {
  searchPerformance: SearchPerformance[];
  days: number;
}

/**
 * Aggregate GSC metrics from search performance data
 * Uses weighted average for position (more accurate than simple average)
 */
function aggregateGscMetrics(data: SearchPerformance[]) {
  const totalClicks = data.reduce((sum, d) => sum + d.clicks, 0);
  const totalImpressions = data.reduce((sum, d) => sum + d.impressions, 0);

  const ctr = totalImpressions > 0
    ? (totalClicks / totalImpressions) * 100
    : 0;

  // Weighted average position (weight by impressions for accuracy)
  const weightedPosition = totalImpressions > 0
    ? data.reduce((sum, d) => sum + (d.position ?? 0) * d.impressions, 0) / totalImpressions
    : 0;

  return {
    totalClicks,
    totalImpressions,
    ctr: Math.round(ctr * 100) / 100,
    avgPosition: Math.round(weightedPosition * 10) / 10,
  };
}

export function GscMetricsRow({ searchPerformance, days }: GscMetricsRowProps) {
  const metrics = aggregateGscMetrics(searchPerformance);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Clicks"
        value={metrics.totalClicks}
        format="number"
        icon={MousePointerClick}
        description={`Last ${days} days`}
      />

      <MetricCard
        label="Impressions"
        value={metrics.totalImpressions}
        format="number"
        icon={Eye}
        description={`Last ${days} days`}
      />

      <MetricCard
        label="CTR"
        value={metrics.ctr}
        format="percent"
        icon={Percent}
        description={`Last ${days} days`}
      />

      <MetricCard
        label="Avg Position"
        value={metrics.avgPosition}
        format="number"
        icon={TrendingUp}
        description="Lower is better"
      />
    </div>
  );
}
