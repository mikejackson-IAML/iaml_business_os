// Lead Intelligence - Contact Activity API
// GET /api/lead-intelligence/contacts/:id/activity

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getContactActivity } from '@/lib/api/lead-intelligence-activity-queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const data = await getContactActivity(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Contact activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
