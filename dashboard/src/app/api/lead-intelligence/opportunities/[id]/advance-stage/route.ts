// Lead Intelligence - Opportunity Stage Advancement API
// POST /api/lead-intelligence/opportunities/:id/advance-stage

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getOpportunityById } from '@/lib/api/lead-intelligence-opportunities-queries';
import { advanceStage } from '@/lib/api/lead-intelligence-opportunities-mutations';
import { validateStageAdvancement } from '@/lib/api/lead-intelligence-opportunities-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid opportunity ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const b = body as Record<string, unknown>;
    if (!b.stage || typeof b.stage !== 'string') {
      return NextResponse.json(
        { error: 'stage is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Fetch opportunity to get its type
    const opportunity = await getOpportunityById(id);
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Validate stage against pipeline type
    const stageCheck = validateStageAdvancement(opportunity.type, b.stage);
    if (!stageCheck.valid) {
      return NextResponse.json(
        { error: stageCheck.error, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const updated = await advanceStage(id, opportunity.type, b.stage);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('Opportunity advance-stage API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
