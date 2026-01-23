// Task API - Complete task endpoint
// POST /api/tasks/:id/complete

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { getTaskById } from '@/lib/api/task-queries';
import { completeTask } from '@/lib/api/task-mutations';
import { validateCompleteTask } from '@/lib/api/task-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/:id/complete
 * Mark a task as done
 *
 * Request body (optional):
 * - completion_note?: string
 */
export async function POST(request: NextRequest, context: RouteContext) {
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

    // Check task is not already completed or dismissed
    if (existingTask.status === 'done') {
      return NextResponse.json(
        { error: 'Task is already completed', code: 'CONFLICT' },
        { status: 409 }
      );
    }
    if (existingTask.status === 'dismissed') {
      return NextResponse.json(
        { error: 'Cannot complete a dismissed task', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    // Parse request body (optional)
    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Validate request
    const validation = validateCompleteTask(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Validation failed', code: 'VALIDATION_ERROR', details: validation.errors },
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Complete task
    const task = await completeTask(id, validation.data?.completion_note || null, userId);

    return NextResponse.json(task);
  } catch (error) {
    console.error('Task complete API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
