// Task API - Single task endpoints
// GET /api/tasks/:id - Get task detail
// PATCH /api/tasks/:id - Update task (implemented in 02-05)

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getTaskById, getTaskComments, getTaskActivity } from '@/lib/api/task-queries';
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
