// Lead Intelligence - Opportunity Contacts API
// GET /api/lead-intelligence/opportunities/:id/contacts - List contacts
// POST /api/lead-intelligence/opportunities/:id/contacts - Add contact
// DELETE /api/lead-intelligence/opportunities/:id/contacts - Remove contact

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getOpportunityContacts } from '@/lib/api/lead-intelligence-opportunities-queries';
import { addOpportunityContact, removeOpportunityContact } from '@/lib/api/lead-intelligence-opportunities-mutations';
import { CONTACT_ROLES } from '@/lib/api/lead-intelligence-opportunities-types';

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

    const contacts = await getOpportunityContacts(id);
    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Opportunity contacts list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

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
    if (!b.contact_id || typeof b.contact_id !== 'string') {
      return NextResponse.json(
        { error: 'contact_id is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    if (!b.role || typeof b.role !== 'string') {
      return NextResponse.json(
        { error: 'role is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }
    if (!(CONTACT_ROLES as readonly string[]).includes(b.role)) {
      return NextResponse.json(
        { error: `role must be one of: ${CONTACT_ROLES.join(', ')}`, code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const contact = await addOpportunityContact(id, b.contact_id, b.role);
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Opportunity contact add API error:', error);
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
    if (!b.contact_id || typeof b.contact_id !== 'string') {
      return NextResponse.json(
        { error: 'contact_id is required and must be a string', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    await removeOpportunityContact(id, b.contact_id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Opportunity contact remove API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
