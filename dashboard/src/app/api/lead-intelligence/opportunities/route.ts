// Lead Intelligence - Opportunities List + Create API
// GET /api/lead-intelligence/opportunities - List opportunities with pagination
// POST /api/lead-intelligence/opportunities - Create a new opportunity

import { NextRequest, NextResponse } from 'next/server';
import { getOpportunities } from '@/lib/api/lead-intelligence-opportunities-queries';
import { createOpportunity } from '@/lib/api/lead-intelligence-opportunities-mutations';
import { validateOpportunity, createValidationError } from '@/lib/api/lead-intelligence-opportunities-validation';
import type { OpportunityListParams } from '@/lib/api/lead-intelligence-opportunities-types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const params: OpportunityListParams = {};

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

    const type = searchParams.get('type');
    if (type) params.type = type;

    const stage = searchParams.get('stage');
    if (stage) params.stage = stage;

    const companyId = searchParams.get('company_id');
    if (companyId) params.company_id = companyId;

    const search = searchParams.get('search');
    if (search) params.search = search;

    const result = await getOpportunities(params);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Opportunities list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const validation = validateOpportunity(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    const opportunity = await createOpportunity(validation.data!);
    return NextResponse.json(opportunity, { status: 201 });
  } catch (error) {
    console.error('Opportunity create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
