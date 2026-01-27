// Lead Intelligence - Contact Detail API
// GET /api/lead-intelligence/contacts/:id - Get contact
// PUT /api/lead-intelligence/contacts/:id - Update contact
// DELETE /api/lead-intelligence/contacts/:id - Delete contact

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getContactById } from '@/lib/api/lead-intelligence-contacts-queries';
import { updateContact, deleteContact } from '@/lib/api/lead-intelligence-contacts-mutations';
import { validateUpdateContact, createValidationError } from '@/lib/api/lead-intelligence-contacts-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function GET(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const contact = await getContactById(id);
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Contact detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format', code: 'VALIDATION_ERROR' },
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

    const validation = validateUpdateContact(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    const contact = await updateContact(id, validation.data!);
    if (!contact) {
      return NextResponse.json(
        { error: 'Contact not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error('Contact update API error:', error);
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
        { error: 'Invalid contact ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    await deleteContact(id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Contact delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
