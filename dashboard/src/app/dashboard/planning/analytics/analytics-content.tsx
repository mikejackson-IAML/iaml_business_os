import { getAnalyticsMetrics, getFunnelData } from '@/lib/api/planning-queries';
import { AnalyticsContentClient } from './analytics-content-client';

export async function AnalyticsContent() {
  const [metrics, funnel] = await Promise.all([
    getAnalyticsMetrics('month'), // Default period
    getFunnelData(),
  ]);

  return <AnalyticsContentClient initialMetrics={metrics} funnelData={funnel} />;
}
