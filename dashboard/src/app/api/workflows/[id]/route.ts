// Workflow API - Get and Update endpoints
// GET /api/workflows/:id - Get workflow detail with tasks
// PATCH /api/workflows/:id - Update workflow

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { getWorkflowDetail, getWorkflowById } from '@/lib/api/action-center-workflow-queries';
import { updateWorkflow } from '@/lib/api/action-center-workflow-mutations';
import { validateUpdateWorkflow, createValidationError } from '@/lib/api/workflow-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/workflows/:id
 * Get workflow detail including all tasks
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
        { error: 'Invalid workflow ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const workflow = await getWorkflowDetail(id);

    if (!workflow) {
      return NextResponse.json(
        { error: 'Workflow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Workflow get API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/workflows/:id
 * Update workflow properties
 *
 * Request body:
 * - name?: string
 * - description?: string
 * - workflow_type?: string
 * - department?: string
 * - target_completion_date?: string | null
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
        { error: 'Invalid workflow ID format', code: 'VALIDATION_ERROR' },
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
    const validation = validateUpdateWorkflow(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Check if workflow exists
    const existing = await getWorkflowById(id);
    if (!existing) {
      return NextResponse.json(
        { error: 'Workflow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Update workflow
    const workflow = await updateWorkflow(id, validation.data!, userId);

    return NextResponse.json(workflow);
  } catch (error) {
    console.error('Workflow update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
