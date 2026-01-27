// Lead Intelligence - Contact Email Activities API
// GET /api/lead-intelligence/contacts/:id/email-activities

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getContactEmailActivities } from '@/lib/api/lead-intelligence-email-queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const data = await getContactEmailActivities(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Contact email activities API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
