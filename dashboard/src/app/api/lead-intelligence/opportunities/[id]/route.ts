// Lead Intelligence - Opportunity Detail API
// GET /api/lead-intelligence/opportunities/:id - Get opportunity with contacts + attachments
// PATCH /api/lead-intelligence/opportunities/:id - Update opportunity
// DELETE /api/lead-intelligence/opportunities/:id - Delete opportunity

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getOpportunityById, getOpportunityContacts, getOpportunityAttachments } from '@/lib/api/lead-intelligence-opportunities-queries';
import { updateOpportunity, deleteOpportunity } from '@/lib/api/lead-intelligence-opportunities-mutations';
import { validateUpdateOpportunity, createValidationError } from '@/lib/api/lead-intelligence-opportunities-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid opportunity ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const opportunity = await getOpportunityById(id);
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const [contacts, attachments] = await Promise.all([
      getOpportunityContacts(id),
      getOpportunityAttachments(id),
    ]);

    return NextResponse.json({ ...opportunity, contacts, attachments });
  } catch (error) {
    console.error('Opportunity detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteContext) {
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

    const validation = validateUpdateOpportunity(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    const opportunity = await updateOpportunity(id, validation.data!);
    if (!opportunity) {
      return NextResponse.json(
        { error: 'Opportunity not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(opportunity);
  } catch (error) {
    console.error('Opportunity update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    await deleteOpportunity(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Opportunity delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
