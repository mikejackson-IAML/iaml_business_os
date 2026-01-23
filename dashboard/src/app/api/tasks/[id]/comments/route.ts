// Task API - Task comments endpoint
// POST /api/tasks/:id/comments - Add a comment

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { getTaskById } from '@/lib/api/task-queries';
import { addTaskComment } from '@/lib/api/task-mutations';
import { validateAddComment, createValidationError } from '@/lib/api/task-validation';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/tasks/:id/comments
 * Add a comment to a task
 *
 * Request body:
 * - content: string (required)
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
    const validation = validateAddComment(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Add comment
    const comment = await addTaskComment(
      id,
      validation.data!.content,
      userId,
      null  // author_name will default to 'System'
    );

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error('Task comment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
