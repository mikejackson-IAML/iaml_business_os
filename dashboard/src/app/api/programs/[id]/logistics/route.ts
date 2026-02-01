import { NextRequest, NextResponse } from 'next/server';
import { getProgramLogistics } from '@/lib/api/programs-queries';
import { updateLogisticsField, updateLogisticsFields } from '@/lib/api/programs-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/programs/[id]/logistics
 * Returns logistics data for a program
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const logistics = await getProgramLogistics(id);
    return NextResponse.json({ success: true, data: logistics });
  } catch (error) {
    console.error('Error fetching logistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch logistics' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/programs/[id]/logistics
 * Updates logistics fields
 * Body: { field: string, value: unknown } for single field
 * Body: { fields: Record<string, unknown> } for multiple fields
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  const { id } = await context.params;

  try {
    const body = await request.json();

    // Single field update
    if (body.field && body.value !== undefined) {
      const result = await updateLogisticsField(id, body.field, body.value);
      if (!result.success) {
        return NextResponse.json(
          { success: false, error: result.error },
          { status: 500 }
        );
      }
      return NextResponse.json({ success: true });
    }

    // Multiple fields update
    if (body.fields) {
      const result = await updateLogisticsFields(id, body.fields);
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
    console.error('Error updating logistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update logistics' },
      { status: 500 }
    );
  }
}
