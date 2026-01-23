// Workflow API - List and Create endpoints
// GET /api/workflows - List workflows with filters
// POST /api/workflows - Create a new workflow

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { listWorkflows } from '@/lib/api/action-center-workflow-queries';
import { createWorkflow } from '@/lib/api/action-center-workflow-mutations';
import type { WorkflowListParams, WorkflowListResponse, WorkflowStatus } from '@/lib/api/workflow-types';
import { VALID_WORKFLOW_STATUSES, validateCreateWorkflow, createValidationError } from '@/lib/api/workflow-validation';

/**
 * GET /api/workflows
 * List workflows with optional filters and cursor-based pagination
 *
 * Query parameters:
 * - status: comma-separated list of statuses
 * - department: department name
 * - workflow_type: workflow type
 * - search: search string for name/description
 * - cursor: pagination cursor
 * - limit: number of results (default 20, max 100)
 * - sort_by: created_at | name | target_completion_date
 * - sort_order: asc | desc
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const params: WorkflowListParams = {};

    // Parse comma-separated status array
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statuses = statusParam.split(',').filter(s => VALID_WORKFLOW_STATUSES.includes(s as WorkflowStatus));
      if (statuses.length > 0) params.status = statuses as WorkflowStatus[];
    }

    // Parse single values
    const department = searchParams.get('department');
    if (department) params.department = department;

    const workflowType = searchParams.get('workflow_type');
    if (workflowType) params.workflow_type = workflowType;

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
    if (sortBy && ['created_at', 'name', 'target_completion_date'].includes(sortBy)) {
      params.sort_by = sortBy as 'created_at' | 'name' | 'target_completion_date';
    }

    const sortOrder = searchParams.get('sort_order');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      params.sort_order = sortOrder as 'asc' | 'desc';
    }

    // Execute query
    const result = await listWorkflows(params);

    const response: WorkflowListResponse = {
      data: result.workflows,
      meta: {
        cursor: result.cursor,
        has_more: result.has_more,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Workflow list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new workflow
 *
 * Request body:
 * - name: string (required)
 * - description?: string
 * - workflow_type?: string
 * - department?: string
 * - related_entity_type?: string
 * - related_entity_id?: string (UUID)
 * - target_completion_date?: string (ISO date)
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
    const validation = validateCreateWorkflow(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Create workflow
    const workflow = await createWorkflow(validation.data!, userId);

    return NextResponse.json(workflow, { status: 201 });
  } catch (error) {
    console.error('Workflow create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
