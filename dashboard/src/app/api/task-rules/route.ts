// Task Rule API - List and Create endpoints
// GET /api/task-rules - List task rules with filters
// POST /api/task-rules - Create a new task rule

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { listTaskRules } from '@/lib/api/task-rule-queries';
import { createTaskRule } from '@/lib/api/task-rule-mutations';
import type { TaskRuleListParams, TaskRuleListResponse, RuleType } from '@/lib/api/task-rule-types';
import { VALID_RULE_TYPES, validateCreateTaskRule, createValidationError } from '@/lib/api/task-rule-validation';

/**
 * GET /api/task-rules
 * List task rules with optional filters and cursor-based pagination
 *
 * Query parameters:
 * - rule_type: recurring | event | condition
 * - is_enabled: true/false
 * - search: search string for name/description
 * - cursor: pagination cursor
 * - limit: number of results (default 20, max 100)
 * - sort_by: created_at | name | last_run_at
 * - sort_order: asc | desc
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const params: TaskRuleListParams = {};

    const ruleType = searchParams.get('rule_type');
    if (ruleType && VALID_RULE_TYPES.includes(ruleType as RuleType)) {
      params.rule_type = ruleType as RuleType;
    }

    const isEnabled = searchParams.get('is_enabled');
    if (isEnabled !== null) params.is_enabled = isEnabled === 'true';

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
    if (sortBy && ['created_at', 'name', 'last_run_at'].includes(sortBy)) {
      params.sort_by = sortBy as 'created_at' | 'name' | 'last_run_at';
    }

    const sortOrder = searchParams.get('sort_order');
    if (sortOrder && ['asc', 'desc'].includes(sortOrder)) {
      params.sort_order = sortOrder as 'asc' | 'desc';
    }

    // Execute query
    const result = await listTaskRules(params);

    const response: TaskRuleListResponse = {
      data: result.rules,
      meta: {
        cursor: result.cursor,
        has_more: result.has_more,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Task rule list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/task-rules
 * Create a new task rule
 *
 * Request body:
 * - name: string (required)
 * - description?: string
 * - rule_type: 'recurring' | 'event' | 'condition' (required)
 * - schedule_type?: 'daily' | 'weekly' | 'monthly' | 'cron' (required for recurring)
 * - schedule_config?: object (required for recurring)
 * - trigger_event?: string (required for event)
 * - trigger_conditions?: object
 * - condition_query?: string (required for condition)
 * - task_template: object (required) - {title, description?, task_type?, priority?, ...}
 * - due_date_field?: string
 * - due_date_offset_days?: number
 * - dedupe_key_template?: string
 * - is_enabled?: boolean (defaults to false)
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
    const validation = validateCreateTaskRule(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Create task rule
    const rule = await createTaskRule(validation.data!, userId);

    return NextResponse.json(rule, { status: 201 });
  } catch (error) {
    console.error('Task rule create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
