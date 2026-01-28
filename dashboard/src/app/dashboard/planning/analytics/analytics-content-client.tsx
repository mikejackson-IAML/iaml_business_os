'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MetricCard } from './components/metric-card';
import { PeriodSelector, type AnalyticsPeriod } from './components/period-selector';
import { FunnelVisualization } from './components/funnel-visualization';
import { EmptyAnalytics } from './components/empty-analytics';
import type { AnalyticsMetrics, FunnelDataItem } from '@/lib/api/planning-queries';

interface AnalyticsContentClientProps {
  initialMetrics: AnalyticsMetrics;
  funnelData: FunnelDataItem[];
}

export function AnalyticsContentClient({
  initialMetrics,
  funnelData,
}: AnalyticsContentClientProps) {
  const [period, setPeriod] = useState<AnalyticsPeriod>('month');
  const [metrics, setMetrics] = useState<AnalyticsMetrics>(initialMetrics);
  const [isPending, startTransition] = useTransition();

  // Calculate conversion rate
  const conversionRate =
    metrics.capturedCount > 0
      ? Math.round((metrics.shippedCount / metrics.capturedCount) * 100)
      : 0;

  // Check if completely empty (no activity at all)
  const isEmpty = metrics.shippedCount === 0 && metrics.capturedCount === 0;

  async function handlePeriodChange(newPeriod: AnalyticsPeriod) {
    setPeriod(newPeriod);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/planning/analytics?period=${newPeriod}`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      }
    });
  }

  // Build trend data for metric cards
  const shippedTrend = metrics.trendData.map((d) => ({
    date: d.date,
    value: d.shipped,
  }));

  const capturedTrend = metrics.trendData.map((d) => ({
    date: d.date,
    value: d.captured,
  }));

  // Velocity trend - use shipped as proxy since velocity is per-project
  const velocityTrend = metrics.trendData.map((d) => ({
    date: d.date,
    value: d.shipped,
  }));

  return (
    <div className={`p-6 lg:p-8 ${isPending ? 'opacity-70' : ''}`}>
      {/* Header */}
      <header className="mb-8">
        <Link
          href="/dashboard/planning"
          className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back to Pipeline</span>
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <span className="badge-live">ANALYTICS</span>
          <h1 className="text-display-sm text-foreground">Analytics</h1>
        </div>
        <p className="text-muted-foreground">
          Track your idea-to-shipped pipeline metrics
        </p>
      </header>

      {isEmpty ? (
        <EmptyAnalytics />
      ) : (
        <div className="space-y-6">
          {/* Period Selector */}
          <div className="flex justify-end">
            <PeriodSelector value={period} onChange={handlePeriodChange} />
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              title="Ideas Shipped"
              value={metrics.shippedCount}
              trend={shippedTrend}
              trendColor="emerald"
            />
            <MetricCard
              title="Avg Velocity"
              value={
                metrics.avgVelocityDays != null
                  ? metrics.avgVelocityDays.toFixed(1)
                  : '-'
              }
              subtitle="days"
              trend={velocityTrend}
              trendColor="blue"
            />
            <MetricCard
              title="Ideas Captured"
              value={metrics.capturedCount}
              trend={capturedTrend}
              trendColor="amber"
            />
            <MetricCard
              title="Conversion Rate"
              value={`${conversionRate}%`}
              subtitle="captured to shipped"
            />
          </div>

          {/* Funnel Visualization */}
          <FunnelVisualization data={funnelData} />
        </div>
      )}
    </div>
  );
}
