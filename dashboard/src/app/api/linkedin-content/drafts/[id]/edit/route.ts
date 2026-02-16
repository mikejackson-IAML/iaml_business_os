// LinkedIn Content Engine - Draft Text Edit API
// PATCH /api/linkedin-content/drafts/:id/edit
// Update post text, first comment, or hook text

import { NextRequest, NextResponse } from 'next/server';
import { updateDraftText } from '@/lib/api/linkedin-content-mutations';

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

    const { full_text, first_comment_text, hook_text } = body;

    // At least one field is required
    if (full_text === undefined && first_comment_text === undefined && hook_text === undefined) {
      return NextResponse.json(
        {
          error: 'At least one field required: full_text, first_comment_text, or hook_text',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const updates: { full_text?: string; first_comment_text?: string; hook_text?: string } = {};
    if (full_text !== undefined) updates.full_text = String(full_text);
    if (first_comment_text !== undefined) updates.first_comment_text = String(first_comment_text);
    if (hook_text !== undefined) updates.hook_text = String(hook_text);

    const updated = await updateDraftText(id, updates);

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Draft edit API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
