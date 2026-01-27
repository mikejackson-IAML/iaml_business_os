// Lead Intelligence - Company Detail API
// GET /api/lead-intelligence/companies/:id - Get company
// PUT /api/lead-intelligence/companies/:id - Update company
// DELETE /api/lead-intelligence/companies/:id - Delete company

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getCompanyById } from '@/lib/api/lead-intelligence-companies-queries';
import { updateCompany, deleteCompany } from '@/lib/api/lead-intelligence-companies-mutations';
import { validateUpdateCompany, createValidationError } from '@/lib/api/lead-intelligence-companies-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * GET /api/lead-intelligence/companies/:id
 * Get a single company by ID
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const company = await getCompanyById(id);

    if (!company) {
      return NextResponse.json(
        { error: 'Company not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(company);
  } catch (error) {
    console.error('Company detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/lead-intelligence/companies/:id
 * Update a company
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const existing = await getCompanyById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Company not found', code: 'NOT_FOUND' },
        { status: 404 }
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

    const validation = validateUpdateCompany(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    const updateData = validation.data!;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const company = await updateCompany(id, updateData);

    return NextResponse.json(company);
  } catch (error) {
    console.error('Company update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/lead-intelligence/companies/:id
 * Delete a company
 */
export async function DELETE(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid company ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const existing = await getCompanyById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Company not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    await deleteCompany(id);

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Company delete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
