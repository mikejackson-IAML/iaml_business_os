// LinkedIn Content Engine - Calendar Slot Assignment API
// PATCH /api/linkedin-content/drafts/:id/calendar
// Assign a calendar slot to a draft post

import { NextRequest, NextResponse } from 'next/server';
import { assignCalendarSlot } from '@/lib/api/linkedin-content-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid draft ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { calendar_slot_id } = body;

    if (!calendar_slot_id || typeof calendar_slot_id !== 'string') {
      return NextResponse.json(
        {
          error: 'calendar_slot_id is required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    if (!UUID_REGEX.test(calendar_slot_id)) {
      return NextResponse.json(
        { error: 'Invalid calendar_slot_id format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const updated = await assignCalendarSlot(id, calendar_slot_id);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Calendar slot assignment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
