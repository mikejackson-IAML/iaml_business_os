'use client';

import { AreaChart, Card, Title } from '@tremor/react';
import type { TrafficSource } from '@/lib/api/web-intel-queries';

interface TrafficSourcesChartProps {
  trafficSources: TrafficSource[];
}

type SourceCategory = 'organic' | 'direct' | 'referral' | 'social';

interface ChartDataPoint {
  date: string;
  organic: number;
  direct: number;
  referral: number;
  social: number;
}

/**
 * Categorize traffic source based on GA4 source/medium conventions
 */
function categorizeSource(source: string, medium: string): SourceCategory {
  const sourceLower = source.toLowerCase();
  const mediumLower = medium.toLowerCase();

  // Direct traffic
  if (sourceLower === '(direct)' || mediumLower === '(none)') {
    return 'direct';
  }

  // Organic search
  if (mediumLower === 'organic') {
    return 'organic';
  }

  // Social media
  const socialSources = ['facebook', 'twitter', 'linkedin', 'instagram', 'pinterest', 'youtube', 'tiktok', 'reddit'];
  if (mediumLower === 'social' || socialSources.some((s) => sourceLower.includes(s))) {
    return 'social';
  }

  // Everything else is referral
  return 'referral';
}

/**
 * Format date for chart x-axis (e.g., "Jan 15")
 */
function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Aggregate traffic sources by date and category
 */
function aggregateByDateAndCategory(sources: TrafficSource[]): ChartDataPoint[] {
  // Group by date
  const byDate = new Map<string, { organic: number; direct: number; referral: number; social: number }>();

  for (const source of sources) {
    const dateKey = source.collectedDate.toISOString().split('T')[0];
    const category = categorizeSource(source.source, source.medium);

    if (!byDate.has(dateKey)) {
      byDate.set(dateKey, { organic: 0, direct: 0, referral: 0, social: 0 });
    }

    const entry = byDate.get(dateKey)!;
    entry[category] += source.sessions;
  }

  // Convert to array and sort by date
  const result: ChartDataPoint[] = [];
  const sortedDates = Array.from(byDate.keys()).sort();

  for (const dateKey of sortedDates) {
    const values = byDate.get(dateKey)!;
    result.push({
      date: formatDate(new Date(dateKey)),
      ...values,
    });
  }

  return result;
}

export function TrafficSourcesChart({ trafficSources }: TrafficSourcesChartProps) {
  const chartData = aggregateByDateAndCategory(trafficSources);

  if (chartData.length === 0) {
    return (
      <Card className="p-6">
        <Title>Traffic Sources</Title>
        <div className="h-80 flex items-center justify-center text-muted-foreground">
          No traffic source data available for this period.
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <Title>Traffic Sources</Title>
      <AreaChart
        className="h-80 mt-4"
        data={chartData}
        index="date"
        categories={['organic', 'direct', 'referral', 'social']}
        colors={['emerald', 'slate', 'blue', 'violet']}
        valueFormatter={(n) => n.toLocaleString()}
        stack={true}
        showLegend={true}
        showAnimation={true}
        showGridLines={true}
        curveType="monotone"
      />
    </Card>
  );
}
