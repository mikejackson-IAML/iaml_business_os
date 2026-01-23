// Task Rule API - Get and Update endpoints
// GET /api/task-rules/:id - Get task rule detail
// PATCH /api/task-rules/:id - Update task rule (including enable/disable)

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { getTaskRuleById } from '@/lib/api/task-rule-queries';
import { updateTaskRule } from '@/lib/api/task-rule-mutations';
import { validateUpdateTaskRule, createValidationError } from '@/lib/api/task-rule-validation';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/task-rules/:id
 * Get task rule detail
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
        { error: 'Invalid task rule ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const rule = await getTaskRuleById(id);

    if (!rule) {
      return NextResponse.json(
        { error: 'Task rule not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json(rule);
  } catch (error) {
    console.error('Task rule get API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/task-rules/:id
 * Update task rule
 *
 * Request body (all fields optional):
 * - name?: string
 * - description?: string
 * - schedule_type?: 'daily' | 'weekly' | 'monthly' | 'cron'
 * - schedule_config?: object
 * - trigger_event?: string
 * - trigger_conditions?: object
 * - condition_query?: string
 * - task_template?: object
 * - due_date_field?: string
 * - due_date_offset_days?: number
 * - dedupe_key_template?: string
 * - is_enabled?: boolean (use this to enable/disable rules)
 *
 * Note: rule_type cannot be changed after creation
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
        { error: 'Invalid task rule ID format', code: 'VALIDATION_ERROR' },
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
    const validation = validateUpdateTaskRule(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Update task rule
    const rule = await updateTaskRule(id, validation.data!, userId);

    return NextResponse.json(rule);
  } catch (error) {
    if (error instanceof Error && error.message === 'RULE_NOT_FOUND') {
      return NextResponse.json(
        { error: 'Task rule not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    console.error('Task rule update API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
