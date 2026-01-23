// Task API - Task activity endpoint
// GET /api/tasks/:id/activity - Get full activity log

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getTaskById, getTaskActivity } from '@/lib/api/task-queries';
import type { TaskActivity } from '@/lib/api/task-types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface ActivityResponse {
  data: TaskActivity[];
  meta: {
    total: number;
    limit: number;
    offset: number;
  };
}

/**
 * GET /api/tasks/:id/activity
 * Get full activity log for a task
 *
 * Query parameters:
 * - limit: number (default 50, max 500)
 * - offset: number (default 0)
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

    // Check task exists
    const existingTask = await getTaskById(id);
    if (!existingTask) {
      return NextResponse.json(
        { error: 'Task not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Parse pagination parameters
    const searchParams = request.nextUrl.searchParams;

    let limit = 50;
    const limitParam = searchParams.get('limit');
    if (limitParam) {
      const parsedLimit = parseInt(limitParam, 10);
      if (!isNaN(parsedLimit) && parsedLimit > 0) {
        limit = Math.min(parsedLimit, 500);
      }
    }

    let offset = 0;
    const offsetParam = searchParams.get('offset');
    if (offsetParam) {
      const parsedOffset = parseInt(offsetParam, 10);
      if (!isNaN(parsedOffset) && parsedOffset >= 0) {
        offset = parsedOffset;
      }
    }

    // Fetch activity with offset/limit
    // Note: getTaskActivity already orders by created_at DESC
    // We need to fetch extra to handle offset and determine if there's more
    const allActivity = await getTaskActivity(id, limit + offset + 1);

    // Apply offset and limit
    const activity = allActivity.slice(offset, offset + limit);
    const hasMore = allActivity.length > offset + limit;

    const response: ActivityResponse = {
      data: activity,
      meta: {
        // If we don't have more, we can calculate exact total
        // Otherwise, return -1 to indicate unknown total
        total: hasMore ? -1 : offset + activity.length,
        limit,
        offset,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Task activity API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
