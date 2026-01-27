// Lead Intelligence - Contacts List + Create API
// GET /api/lead-intelligence/contacts - List contacts with pagination
// POST /api/lead-intelligence/contacts - Create a new contact

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getContacts } from '@/lib/api/lead-intelligence-contacts-queries';
import { createContact } from '@/lib/api/lead-intelligence-contacts-mutations';
import { validateCreateContact, createValidationError } from '@/lib/api/lead-intelligence-contacts-validation';
import type { ContactListParams } from '@/lib/api/lead-intelligence-contacts-types';

export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;

    const params: ContactListParams = {};

    const pageParam = searchParams.get('page');
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) params.page = page;
    }

    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0 && limit <= 100) params.limit = limit;
    }

    const sort = searchParams.get('sort');
    if (sort) params.sort = sort;

    const order = searchParams.get('order');
    if (order === 'asc' || order === 'desc') params.order = order;

    const result = await getContacts(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Contacts list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const validation = validateCreateContact(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    const contact = await createContact(validation.data!);
    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Contact create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
