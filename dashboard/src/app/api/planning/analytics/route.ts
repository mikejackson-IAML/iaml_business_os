import { NextRequest, NextResponse } from 'next/server';
import { getAnalyticsMetrics, type AnalyticsPeriod } from '@/lib/api/planning-queries';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = (searchParams.get('period') || 'month') as AnalyticsPeriod;

    // Validate period
    if (!['week', 'month', 'quarter', 'all'].includes(period)) {
      return NextResponse.json(
        { error: 'Invalid period. Must be week, month, quarter, or all.' },
        { status: 400 }
      );
    }

    const metrics = await getAnalyticsMetrics(period);
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('[api/planning/analytics] Error fetching analytics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch analytics' },
      { status: 500 }
    );
  }
}
