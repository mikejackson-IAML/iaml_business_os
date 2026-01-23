// Task API - Single task endpoints
// GET /api/tasks/:id - Get task detail
// PATCH /api/tasks/:id - Update task

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { getTaskById, getTaskComments, getTaskActivity } from '@/lib/api/task-queries';
import { updateTask } from '@/lib/api/task-mutations';
import { validateUpdateTask, createValidationError } from '@/lib/api/task-validation';
import type { TaskDetailResponse } from '@/lib/api/task-types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/tasks/:id
 * Get full task detail with comments and recent activity
 *
 * Query parameters:
 * - include_all_activity: if 'true', includes all activity instead of last 10
 */
export async function GET(request: NextRequest, context: RouteContext) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid task ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Fetch task
    const task = await getTaskById(id);

    if (!task) {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Fetch comments and activity in parallel
    const includeAllActivity = request.nextUrl.searchParams.get('include_all_activity') === 'true';
    const activityLimit = includeAllActivity ? 500 : 10;

    const [comments, activity] = await Promise.all([
      getTaskComments(id),
      getTaskActivity(id, activityLimit),
    ]);

    // Build response
    const response: TaskDetailResponse = {
      ...task,
      comments,
      recent_activity: activity,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Task detail API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/:id
 * Update task fields
 *
 * Request body (all optional):
 * - title?: string
 * - description?: string
 * - status?: 'open' | 'in_progress' | 'waiting' (not 'done' or 'dismissed')
 * - priority?: 'critical' | 'high' | 'normal' | 'low'
 * - due_date?: string | null (ISO date)
 * - due_time?: string | null (HH:MM)
 * - department?: string
 * - assignee_id?: string | null (UUID)
 * - workflow_id?: string | null (UUID)
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return NextResponse.json(
        { error: 'Invalid task ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check task exists
    const existingTask = await getTaskById(id);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Cannot update completed or dismissed tasks
    if (existingTask.status === 'done' || existingTask.status === 'dismissed') {
      return NextResponse.json(
        { error: `Cannot update a task that is ${existingTask.status}`, code: 'CONFLICT' },
        { status: 409 }
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
    const validation = validateUpdateTask(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Check if there are any fields to update
    const updateData = validation.data!;
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No fields to update', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Update task
    const task = await updateTask(id, updateData, userId);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
