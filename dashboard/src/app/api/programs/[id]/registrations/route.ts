import { NextRequest, NextResponse } from 'next/server';
import {
  getRegistrationsForProgram,
  getRegistrationsWithAttendance,
} from '@/lib/api/programs-queries';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/programs/[id]/registrations
 * Returns registrations for a program
 * Query params:
 * - includeAttendance: boolean - include attendance_by_block field
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id: programId } = await context.params;
  const { searchParams } = new URL(request.url);
  const includeAttendance = searchParams.get('includeAttendance') === 'true';

  try {
    const registrations = includeAttendance
      ? await getRegistrationsWithAttendance(programId)
      : await getRegistrationsForProgram(programId);

    return NextResponse.json({
      success: true,
      data: registrations,
    });
  } catch (error) {
    console.error('Error fetching registrations:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch registrations' },
      { status: 500 }
    );
  }
}
