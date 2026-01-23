// Task API - List and Create endpoints
// GET /api/tasks - List tasks with filters
// POST /api/tasks - Create a new task (implemented in 02-03)

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey, getCurrentUserId } from '@/lib/api/task-auth';
import { listTasks } from '@/lib/api/task-queries';
import { createTask } from '@/lib/api/task-mutations';
import type { TaskListParams, TaskListResponse, TaskStatus, TaskPriority, TaskType, TaskSource, DueCategory } from '@/lib/api/task-types';
import { VALID_STATUSES, VALID_PRIORITIES, VALID_TASK_TYPES, VALID_SOURCES, VALID_DUE_CATEGORIES, validateCreateTask, createValidationError } from '@/lib/api/task-validation';

/**
 * GET /api/tasks
 * List tasks with optional filters and cursor-based pagination
 *
 * Query parameters:
 * - status: comma-separated list of statuses
 * - priority: comma-separated list of priorities
 * - assignee_id: UUID of assignee
 * - department: department name
 * - task_type: comma-separated list of task types
 * - source: comma-separated list of sources
 * - due_category: comma-separated list (overdue, today, this_week, later, no_date)
 * - workflow_id: UUID of workflow
 * - is_blocked: true/false
 * - search: search string for title/description
 * - cursor: pagination cursor
 * - limit: number of results (default 20, max 100)
 */
export async function GET(request: NextRequest) {
  // Validate API key
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const searchParams = request.nextUrl.searchParams;

    // Parse filter parameters
    const params: TaskListParams = {};

    // Parse comma-separated arrays
    const statusParam = searchParams.get('status');
    if (statusParam) {
      const statuses = statusParam.split(',').filter(s => VALID_STATUSES.includes(s as TaskStatus));
      if (statuses.length > 0) params.status = statuses as TaskStatus[];
    }

    const priorityParam = searchParams.get('priority');
    if (priorityParam) {
      const priorities = priorityParam.split(',').filter(p => VALID_PRIORITIES.includes(p as TaskPriority));
      if (priorities.length > 0) params.priority = priorities as TaskPriority[];
    }

    const typeParam = searchParams.get('task_type');
    if (typeParam) {
      const types = typeParam.split(',').filter(t => VALID_TASK_TYPES.includes(t as TaskType));
      if (types.length > 0) params.task_type = types as TaskType[];
    }

    const sourceParam = searchParams.get('source');
    if (sourceParam) {
      const sources = sourceParam.split(',').filter(s => VALID_SOURCES.includes(s as TaskSource));
      if (sources.length > 0) params.source = sources as TaskSource[];
    }

    const dueCategoryParam = searchParams.get('due_category');
    if (dueCategoryParam) {
      const categories = dueCategoryParam.split(',').filter(c => VALID_DUE_CATEGORIES.includes(c as DueCategory));
      if (categories.length > 0) params.due_category = categories as DueCategory[];
    }

    // Parse single values
    const assigneeId = searchParams.get('assignee_id');
    if (assigneeId) params.assignee_id = assigneeId;

    const department = searchParams.get('department');
    if (department) params.department = department;

    const workflowId = searchParams.get('workflow_id');
    if (workflowId) params.workflow_id = workflowId;

    const isBlocked = searchParams.get('is_blocked');
    if (isBlocked !== null) params.is_blocked = isBlocked === 'true';

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

    // Execute query
    const result = await listTasks(params);

    const response: TaskListResponse = {
      data: result.tasks,
      meta: {
        cursor: result.cursor,
        has_more: result.has_more,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Task list API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 * Create a new task
 *
 * Request body:
 * - title: string (required)
 * - description?: string
 * - task_type?: 'standard' | 'approval' | 'decision' | 'review'
 * - priority?: 'critical' | 'high' | 'normal' | 'low'
 * - due_date?: string (ISO date)
 * - due_time?: string (HH:MM)
 * - department?: string
 * - assignee_id?: string (UUID)
 * - workflow_id?: string (UUID)
 * - depends_on?: string[] (array of task UUIDs)
 * - dedupe_key?: string (for duplicate prevention)
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
    const validation = validateCreateTask(body);
    if (!validation.success) {
      return NextResponse.json(
        createValidationError(validation.errors!),
        { status: 400 }
      );
    }

    // Get current user ID
    const userId = getCurrentUserId(request);

    // Create task
    const task = await createTask(validation.data!, userId);

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === 'DUPLICATE_DEDUPE_KEY') {
      return NextResponse.json(
        { error: 'A task with this dedupe_key already exists', code: 'CONFLICT' },
        { status: 409 }
      );
    }

    console.error('Task create API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
