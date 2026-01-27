// Lead Intelligence - Data Health API
// GET /api/lead-intelligence/data-health - Get data health metrics

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getDataHealthMetrics } from '@/lib/api/lead-intelligence-data-health-queries';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const metrics = await getDataHealthMetrics();
    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Data health API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
