// Mobile Health API Route
// Provides authenticated access to aggregated health data for iOS app

import { NextRequest, NextResponse } from 'next/server';
import { getMobileHealthData } from '@/lib/api/mobile-health';

/**
 * GET /api/mobile/health
 * Returns aggregated department health scores for mobile app consumption
 *
 * Authentication: Requires X-API-Key header matching MOBILE_API_KEY env var
 *
 * Response format:
 * {
 *   timestamp: string,
 *   overallHealth: { score: number, status: 'healthy' | 'warning' | 'critical' },
 *   departments: DepartmentHealth[],
 *   alerts: HealthAlert[],
 *   totalAlertCount: number
 * }
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;

  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  try {
    const healthData = await getMobileHealthData();

    return NextResponse.json(healthData, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
      },
    });
  } catch (error) {
    console.error('Health API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
