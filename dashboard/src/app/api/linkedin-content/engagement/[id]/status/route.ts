// LinkedIn Content Engine - Digest Item Status Update API
// PATCH /api/linkedin-content/engagement/:id/status
// Mark digest items as completed or skipped

import { NextRequest, NextResponse } from 'next/server';
import { updateDigestItemStatus } from '@/lib/api/linkedin-content-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ['completed', 'skipped'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid digest item ID format', code: 'VALIDATION_ERROR' },
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

    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status as ValidStatus)) {
      return NextResponse.json(
        {
          error: 'Invalid status. Must be: completed or skipped',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const updated = await updateDigestItemStatus(id, status as ValidStatus);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Digest item status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
