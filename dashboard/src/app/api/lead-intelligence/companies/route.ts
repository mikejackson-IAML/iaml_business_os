// Lead Intelligence - Companies API
// GET /api/lead-intelligence/companies - List companies (paginated)
// POST /api/lead-intelligence/companies - Create a company

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getCompanies } from '@/lib/api/lead-intelligence-companies-queries';
import { createCompany } from '@/lib/api/lead-intelligence-companies-mutations';
import { validateCreateCompany, createValidationError } from '@/lib/api/lead-intelligence-companies-validation';
import type { CompanyListParams, CompanyListResponse } from '@/lib/api/lead-intelligence-companies-types';

/**
 * GET /api/lead-intelligence/companies
 * List companies with pagination and sorting
 *
 * Query parameters:
 * - page: page number (default 1)
 * - limit: results per page (default 20, max 100)
 * - sort: column to sort by (name, industry, employee_count, city, state, created_at, updated_at)
 * - order: asc or desc (default desc)
 */
export async function GET(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;

    const params: CompanyListParams = {};

    const pageParam = searchParams.get('page');
    if (pageParam) {
      const page = parseInt(pageParam, 10);
      if (!isNaN(page) && page > 0) params.page = page;
    }

    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const limit = parseInt(limitParam, 10);
      if (!isNaN(limit) && limit > 0) params.limit = limit;
    }

    const sort = searchParams.get('sort');
    if (sort) params.sort = sort;

    const order = searchParams.get('order');
    if (order === 'asc' || order === 'desc') params.order = order;

    const result = await getCompanies(params);

    const page = params.page || 1;
    const limit = Math.min(Math.max(params.limit || 20, 1), 100);

    const response: CompanyListResponse = {
      data: result.companies,
      meta: {
        page,
        limit,
        total: result.total,
        total_pages: Math.ceil(result.total / limit),
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Companies list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/lead-intelligence/companies
 * Create a new company
 *
 * Request body:
 * - name: string (required)
 * - website?: string (valid URL)
 * - industry?: string
 * - employee_count?: number (positive integer)
 * - revenue_range?: string
 * - city?: string
 * - state?: string
 * - country?: string
 * - linkedin_url?: string (valid URL)
 * - enrichment_source?: string
 * - enrichment_data?: object
 * - enriched_at?: string (ISO date)
 */
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

    const validation = validateCreateCompany(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    const company = await createCompany(validation.data!);

    return NextResponse.json(company, { status: 201 });
  } catch (error) {
    console.error('Company create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
