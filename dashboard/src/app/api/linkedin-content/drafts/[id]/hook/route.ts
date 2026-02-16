// LinkedIn Content Engine - Hook Variation Selection API
// PATCH /api/linkedin-content/drafts/:id/hook
// Select a hook variation (A, B, or C) for a draft post

import { NextRequest, NextResponse } from 'next/server';
import { selectHookVariation } from '@/lib/api/linkedin-content-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_VARIATIONS = ['A', 'B', 'C'] as const;
type ValidVariation = (typeof VALID_VARIATIONS)[number];

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

    const { variation, hook_variations } = body;

    if (!variation || !VALID_VARIATIONS.includes(variation as ValidVariation)) {
      return NextResponse.json(
        {
          error: 'Invalid variation. Must be: A, B, or C',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    if (!hook_variations || !Array.isArray(hook_variations) || hook_variations.length === 0) {
      return NextResponse.json(
        {
          error: 'hook_variations array is required',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const updated = await selectHookVariation(
      id,
      variation as ValidVariation,
      hook_variations as { text: string; category: string; variation: string }[]
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Hook variation API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
