// Mobile Workflows API Route
// Returns list of available quick actions for iOS app

import { NextRequest, NextResponse } from 'next/server';
import { getAvailableWorkflows } from '@/lib/api/workflow-triggers';

/**
 * GET /api/mobile/workflows
 * Returns list of workflows available as quick actions
 *
 * Authentication: Requires X-API-Key header matching MOBILE_API_KEY env var
 *
 * Response format:
 * {
 *   workflows: QuickAction[]
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
    const workflows = await getAvailableWorkflows();

    return NextResponse.json(
      { workflows },
      {
        headers: {
          'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        },
      }
    );
  } catch (error) {
    console.error('Workflows API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
