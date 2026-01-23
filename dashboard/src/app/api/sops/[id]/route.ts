// SOP API - Get and Update endpoints
// GET /api/sops/:id - Get SOP template detail
// PATCH /api/sops/:id - Update SOP template

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { getSOPById } from '@/lib/api/sop-queries';
import { updateSOP } from '@/lib/api/sop-mutations';
import { validateUpdateSOP, createValidationError } from '@/lib/api/sop-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/sops/:id
 * Get SOP template detail
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid SOP ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const sop = await getSOPById(id);

    if (!sop) {
      return NextResponse.json(
        { error: 'SOP not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(sop);
  } catch (error) {
    console.error('SOP get API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/sops/:id
 * Update SOP template
 *
 * Request body:
 * - name?: string
 * - description?: string
 * - category?: string
 * - department?: string
 * - steps?: array of step objects (full replacement)
 * - is_active?: boolean
 * - variables?: object mapping variable names to {description, example}
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid SOP ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateUpdateSOP(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Update SOP
    const sop = await updateSOP(id, validation.data!, userId);

    return NextResponse.json(sop);
  } catch (error) {
    if (error instanceof Error && error.message === 'SOP_NOT_FOUND') {
      return NextResponse.json(
        { error: 'SOP not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    console.error('SOP update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
