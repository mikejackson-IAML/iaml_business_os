'use client';

import { Users, Eye, MousePointerClick, ArrowDownUp } from 'lucide-react';
import { MetricCard } from '@/dashboard-kit/components/dashboard/metric-card';
import type { DailyTraffic } from '@/lib/api/web-intel-queries';
import type { HealthStatus, TrendDirection } from '@/dashboard-kit/types';

interface TrafficMetricsRowProps {
  dailyTraffic: DailyTraffic[];
  days: number;
}

/**
 * Calculate period totals and change percentage
 */
function calculatePeriodMetrics(
  data: DailyTraffic[],
  days: number,
  getValue: (d: DailyTraffic) => number
): { current: number; previous: number; change: number; direction: TrendDirection } {
  // Current period: first `days` entries (most recent)
  const currentPeriod = data.slice(0, days);
  // Previous period: next `days` entries (for comparison)
  const previousPeriod = data.slice(days, days * 2);

  const current = currentPeriod.reduce((sum, d) => sum + getValue(d), 0);
  const previous = previousPeriod.reduce((sum, d) => sum + getValue(d), 0);

  let change = 0;
  if (previous > 0) {
    change = ((current - previous) / previous) * 100;
  }

  const direction: TrendDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return { current, previous, change: Math.round(change * 10) / 10, direction };
}

/**
 * Calculate average for a period
 */
function calculatePeriodAverage(
  data: DailyTraffic[],
  days: number,
  getValue: (d: DailyTraffic) => number | null
): { current: number; change: number; direction: TrendDirection } {
  const currentPeriod = data.slice(0, days);
  const previousPeriod = data.slice(days, days * 2);

  const currentValues = currentPeriod.map(getValue).filter((v): v is number => v !== null);
  const previousValues = previousPeriod.map(getValue).filter((v): v is number => v !== null);

  const current = currentValues.length > 0
    ? currentValues.reduce((sum, v) => sum + v, 0) / currentValues.length
    : 0;
  const previous = previousValues.length > 0
    ? previousValues.reduce((sum, v) => sum + v, 0) / previousValues.length
    : 0;

  let change = 0;
  if (previous > 0) {
    change = ((current - previous) / previous) * 100;
  }

  const direction: TrendDirection = change > 0 ? 'up' : change < 0 ? 'down' : 'neutral';

  return { current: Math.round(current * 10) / 10, change: Math.round(change * 10) / 10, direction };
}

/**
 * Get bounce rate status - lower is better
 * Green: <40%, Yellow: 40-60%, Red: >60%
 */
function getBounceRateStatus(rate: number): HealthStatus {
  if (rate < 40) return 'healthy';
  if (rate < 60) return 'warning';
  return 'critical';
}

/**
 * Get bounce rate trend direction - INVERSE (decrease is good)
 */
function getBounceRateTrendDirection(change: number): TrendDirection {
  // For bounce rate: decrease is positive (show up arrow), increase is negative (show down arrow)
  if (change < 0) return 'up';   // Decreased = good = green up arrow
  if (change > 0) return 'down'; // Increased = bad = red down arrow
  return 'neutral';
}

export function TrafficMetricsRow({ dailyTraffic, days }: TrafficMetricsRowProps) {
  // Need at least 2x days of data for comparison
  const hasComparisonData = dailyTraffic.length >= days * 2;

  // Sessions
  const sessions = calculatePeriodMetrics(dailyTraffic, days, (d) => d.sessions);

  // Users (total)
  const users = calculatePeriodMetrics(dailyTraffic, days, (d) => d.users);

  // New vs Returning users for description
  const currentPeriod = dailyTraffic.slice(0, days);
  const totalNewUsers = currentPeriod.reduce((sum, d) => sum + (d.newUsers || 0), 0);
  const totalReturningUsers = currentPeriod.reduce((sum, d) => sum + (d.returningUsers || 0), 0);
  const userBreakdown = `${totalNewUsers.toLocaleString()} new, ${totalReturningUsers.toLocaleString()} returning`;

  // Pageviews
  const pageviews = calculatePeriodMetrics(dailyTraffic, days, (d) => d.pageviews);

  // Pages per session average
  const pagesPerSession = calculatePeriodAverage(dailyTraffic, days, (d) => d.pagesPerSession);
  const pageviewsDescription = `${pagesPerSession.current} pages/session`;

  // Bounce rate average
  const bounceRate = calculatePeriodAverage(dailyTraffic, days, (d) => d.bounceRate);
  const bounceRateStatus = getBounceRateStatus(bounceRate.current);
  const bounceRateDirection = getBounceRateTrendDirection(bounceRate.change);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        label="Sessions"
        value={sessions.current}
        format="number"
        icon={MousePointerClick}
        delta={hasComparisonData ? sessions.change : undefined}
        deltaDirection={hasComparisonData ? sessions.direction : undefined}
        description={`vs previous ${days}d`}
      />

      <MetricCard
        label="Users"
        value={users.current}
        format="number"
        icon={Users}
        delta={hasComparisonData ? users.change : undefined}
        deltaDirection={hasComparisonData ? users.direction : undefined}
        description={userBreakdown}
      />

      <MetricCard
        label="Pageviews"
        value={pageviews.current}
        format="number"
        icon={Eye}
        delta={hasComparisonData ? pageviews.change : undefined}
        deltaDirection={hasComparisonData ? pageviews.direction : undefined}
        description={pageviewsDescription}
      />

      <MetricCard
        label="Bounce Rate"
        value={bounceRate.current}
        format="percent"
        icon={ArrowDownUp}
        delta={hasComparisonData ? Math.abs(bounceRate.change) : undefined}
        deltaDirection={hasComparisonData ? bounceRateDirection : undefined}
        status={bounceRateStatus}
      />
    </div>
  );
}
