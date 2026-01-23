// SOP API - List and Create endpoints
// GET /api/sops - List SOP templates with filters
// POST /api/sops - Create a new SOP template

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { listSOPs } from '@/lib/api/sop-queries';
import { createSOP } from '@/lib/api/sop-mutations';
import type { SOPListParams, SOPListResponse } from '@/lib/api/sop-types';
import { validateCreateSOP, createValidationError } from '@/lib/api/sop-validation';

/**
 * GET /api/sops
 * List SOP templates with optional filters and cursor-based pagination
 *
 * Query parameters:
 * - category: filter by category
 * - department: filter by department
 * - is_active: filter by active status (true/false)
 * - search: search string for name/description
 * - cursor: pagination cursor
 * - limit: number of results (default 20, max 100)
 * - sort_by: created_at | name | times_used
 * - sort_order: asc | desc
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const params: SOPListParams = {};

    const category = searchParams.get('category');
    if (category) params.category = category;

    const department = searchParams.get('department');
    if (department) params.department = department;

    const isActive = searchParams.get('is_active');
    if (isActive !== null) params.is_active = isActive === 'true';

    const search = searchParams.get('search');
    if (search) params.search = search;

    // Parse pagination
    const cursor = searchParams.get('cursor');
    if (cursor) params.cursor = cursor;

    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) params.limit = limit;
    }

    // Parse sorting
    const sortBy = searchParams.get('sort_by');
    if (sortBy && ['created_at', 'name', 'times_used'].includes(sortBy)) {
      params.sort_by = sortBy as 'created_at' | 'name' | 'times_used';
    }

    const sortOrder = searchParams.get('sort_order');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      params.sort_order = sortOrder as 'asc' | 'desc';
    }

    // Execute query
    const result = await listSOPs(params);

    const response: SOPListResponse = {
      data: result.sops,
      meta: {
        cursor: result.cursor,
        has_more: result.has_more,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('SOP list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/sops
 * Create a new SOP template
 *
 * Request body:
 * - name: string (required)
 * - description?: string
 * - category?: string
 * - department?: string
 * - steps?: array of step objects
 * - variables?: object mapping variable names to {description, example}
 */
export async function POST(request: NextRequest) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
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
    const validation = validateCreateSOP(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Create SOP
    const sop = await createSOP(validation.data!, userId);

    return NextResponse.json(sop, { status: 201 });
  } catch (error) {
    console.error('SOP create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
