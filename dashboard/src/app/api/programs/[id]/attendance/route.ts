import { NextRequest, NextResponse } from 'next/server';
import {
  updateAttendance,
  bulkUpdateAttendance,
  markAllAttended
} from '@/lib/api/programs-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * PATCH /api/programs/[id]/attendance
 * Updates attendance for registrations
 *
 * Body options:
 * - Single: { registrationId, blockId, attended }
 * - Bulk single reg: { registrationId, blockIds, attended }
 * - Mark all: { markAll: true, blockIds }
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id: programId } = await context.params;

  try {
    const body = await request.json();

    // Mark all attended for program
    if (body.markAll && body.blockIds) {
      const result = await markAllAttended(programId, body.blockIds);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({
        success: true,
        message: `Marked ${result.count} attendance records`
      });
    }

    // Bulk update for single registration
    if (body.registrationId && body.blockIds && body.attended !== undefined) {
      const result = await bulkUpdateAttendance(
        body.registrationId,
        body.blockIds,
        body.attended
      );
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Single checkbox update
    if (body.registrationId && body.blockId && body.attended !== undefined) {
      const result = await updateAttendance(
        body.registrationId,
        body.blockId,
        body.attended
      );
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid request body' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error updating attendance:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update attendance' },
      { status: 500 }
    );
  }
}
