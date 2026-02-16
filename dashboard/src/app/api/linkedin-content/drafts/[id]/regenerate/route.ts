// LinkedIn Content Engine - Draft Regeneration API
// POST /api/linkedin-content/drafts/:id/regenerate
// Trigger selective regeneration via n8n webhook

import { NextRequest, NextResponse } from 'next/server';
import { triggerRegeneration } from '@/lib/api/linkedin-content-mutations';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VALID_SCOPES = ['hooks', 'body', 'full'] as const;
type ValidScope = (typeof VALID_SCOPES)[number];

export async function POST(request: NextRequest, context: RouteContext) {
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

    const { instructions, scope } = body;

    if (!instructions || typeof instructions !== 'string' || instructions.trim().length === 0) {
      return NextResponse.json(
        {
          error: 'Instructions are required for regeneration',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    const resolvedScope: ValidScope = scope && VALID_SCOPES.includes(scope as ValidScope)
      ? (scope as ValidScope)
      : 'full';

    const result = await triggerRegeneration(id, instructions.trim(), resolvedScope);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Draft regeneration API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
