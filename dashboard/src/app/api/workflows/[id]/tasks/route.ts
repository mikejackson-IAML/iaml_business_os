// Workflow API - Add Task to Workflow endpoint
// POST /api/workflows/:id/tasks - Add a task to a workflow

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { addTaskToWorkflow } from '@/lib/api/action-center-workflow-mutations';
import { getTaskById } from '@/lib/api/task-queries';
import { validateAddTaskToWorkflow, createValidationError } from '@/lib/api/workflow-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/workflows/:id/tasks
 * Add a task to this workflow
 *
 * Request body:
 * - task_id: string (required, UUID of task to add)
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id: workflowId } = await params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(workflowId)) {
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
    const validation = validateAddTaskToWorkflow(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    const { task_id: taskId } = validation.data!;

    // Verify the task exists
    const task = await getTaskById(taskId);
    if (!task) {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Add task to workflow
    await addTaskToWorkflow(workflowId, taskId, userId);

    return NextResponse.json(
      { success: true, message: 'Task added to workflow' },
      { status: 200 }
    );
  } catch (error) {
    if (error instanceof Error && error.message === 'WORKFLOW_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Workflow not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    console.error('Add task to workflow API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
