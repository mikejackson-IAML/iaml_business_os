// Lead Intelligence - Contact Attendance API
// GET /api/lead-intelligence/contacts/:id/attendance

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getContactAttendance } from '@/lib/api/lead-intelligence-attendance-queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const data = await getContactAttendance(id);
    return NextResponse.json(data);
  } catch (error) {
    console.error('Contact attendance API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
