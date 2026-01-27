// Lead Intelligence - Contact Follow-ups API
// GET /api/lead-intelligence/contacts/:id/follow-ups

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getContactFollowUps } from '@/lib/api/lead-intelligence-followups-queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const data = await getContactFollowUps(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Contact follow-ups API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
