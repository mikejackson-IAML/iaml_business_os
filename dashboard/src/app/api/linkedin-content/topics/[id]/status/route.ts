// LinkedIn Content Engine - Topic Status Update API
// PATCH /api/linkedin-content/topics/:id/status
// Dashboard route - no API key auth (uses Supabase RLS)

import { NextRequest, NextResponse } from 'next/server';
import { updateTopicStatus } from '@/lib/api/linkedin-content-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_STATUSES = ['approved', 'rejected', 'pending'] as const;
type ValidStatus = (typeof VALID_STATUSES)[number];

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Validate UUID format
    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid topic ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Parse request body
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

    // Validate status value
    if (!status || !VALID_STATUSES.includes(status as ValidStatus)) {
      return NextResponse.json(
        {
          error: 'Invalid status. Must be: approved, rejected, or pending',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // Update topic status via mutation function
    const updated = await updateTopicStatus(id, status as ValidStatus);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Topic status API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
