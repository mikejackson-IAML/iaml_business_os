// Task API - Validation utilities
// Request validation helpers for task endpoints

import type {
  TaskType,
  TaskSource,
  TaskStatus,
  TaskPriority,
  CreateTaskRequest,
  UpdateTaskRequest,
  CompleteTaskRequest,
  DismissTaskRequest,
  AddCommentRequest,
  ErrorCode,
  ApiError,
} from './task-types';

// ==================== Valid Values ====================

export const VALID_TASK_TYPES: TaskType[] = ['standard', 'approval', 'decision', 'review'];
export const VALID_SOURCES: TaskSource[] = ['manual', 'alert', 'workflow', 'ai', 'rule'];
export const VALID_STATUSES: TaskStatus[] = ['open', 'in_progress', 'waiting', 'done', 'dismissed'];
export const VALID_PRIORITIES: TaskPriority[] = ['critical', 'high', 'normal', 'low'];
export const VALID_DUE_CATEGORIES = ['no_date', 'overdue', 'today', 'this_week', 'later'] as const;

// ==================== Validation Result ====================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

// ==================== Validation Helpers ====================

function isValidUUID(value: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
}

function isValidDate(value: string): boolean {
  const date = new Date(value);
  return !isNaN(date.getTime());
}

function isValidTime(value: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/;
  return timeRegex.test(value);
}

// ==================== Request Validators ====================

export function validateCreateTask(body: unknown): ValidationResult<CreateTaskRequest> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  // Required: title
  if (!data.title || typeof data.title !== 'string' || data.title.trim().length === 0) {
    errors.title = ['Title is required and must be a non-empty string'];
  } else if (data.title.length > 500) {
    errors.title = ['Title must be 500 characters or less'];
  }

  // Optional: description
  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.description = ['Description must be a string'];
  }

  // Optional: task_type
  if (data.task_type !== undefined && !VALID_TASK_TYPES.includes(data.task_type as TaskType)) {
    errors.task_type = [`Task type must be one of: ${VALID_TASK_TYPES.join(', ')}`];
  }

  // Optional: priority
  if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority as TaskPriority)) {
    errors.priority = [`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`];
  }

  // Optional: due_date
  if (data.due_date !== undefined && data.due_date !== null) {
    if (typeof data.due_date !== 'string' || !isValidDate(data.due_date)) {
      errors.due_date = ['Due date must be a valid ISO date string (YYYY-MM-DD)'];
    }
  }

  // Optional: due_time
  if (data.due_time !== undefined && data.due_time !== null) {
    if (typeof data.due_time !== 'string' || !isValidTime(data.due_time)) {
      errors.due_time = ['Due time must be a valid time string (HH:MM or HH:MM:SS)'];
    }
  }

  // Optional: assignee_id
  if (data.assignee_id !== undefined && data.assignee_id !== null) {
    if (typeof data.assignee_id !== 'string' || !isValidUUID(data.assignee_id)) {
      errors.assignee_id = ['Assignee ID must be a valid UUID'];
    }
  }

  // Optional: workflow_id
  if (data.workflow_id !== undefined && data.workflow_id !== null) {
    if (typeof data.workflow_id !== 'string' || !isValidUUID(data.workflow_id)) {
      errors.workflow_id = ['Workflow ID must be a valid UUID'];
    }
  }

  // Optional: depends_on
  if (data.depends_on !== undefined) {
    if (!Array.isArray(data.depends_on)) {
      errors.depends_on = ['depends_on must be an array of task UUIDs'];
    } else {
      const invalidIds = data.depends_on.filter((id: unknown) => typeof id !== 'string' || !isValidUUID(id));
      if (invalidIds.length > 0) {
        errors.depends_on = ['All dependency IDs must be valid UUIDs'];
      }
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title: (data.title as string).trim(),
      description: data.description as string | undefined,
      task_type: data.task_type as TaskType | undefined,
      priority: data.priority as TaskPriority | undefined,
      due_date: data.due_date as string | undefined,
      due_time: data.due_time as string | undefined,
      department: data.department as string | undefined,
      assignee_id: data.assignee_id as string | undefined,
      workflow_id: data.workflow_id as string | undefined,
      parent_task_id: data.parent_task_id as string | undefined,
      sop_template_id: data.sop_template_id as string | undefined,
      depends_on: data.depends_on as string[] | undefined,
      related_entity_type: data.related_entity_type as string | undefined,
      related_entity_id: data.related_entity_id as string | undefined,
      related_entity_url: data.related_entity_url as string | undefined,
      dedupe_key: data.dedupe_key as string | undefined,
    },
  };
}

export function validateUpdateTask(body: unknown): ValidationResult<UpdateTaskRequest> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  // Optional: title
  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || data.title.trim().length === 0) {
      errors.title = ['Title must be a non-empty string'];
    } else if (data.title.length > 500) {
      errors.title = ['Title must be 500 characters or less'];
    }
  }

  // Optional: status
  if (data.status !== undefined && !VALID_STATUSES.includes(data.status as TaskStatus)) {
    errors.status = [`Status must be one of: ${VALID_STATUSES.join(', ')}`];
  }

  // Cannot set status to 'dismissed' via PATCH (use dismiss endpoint)
  if (data.status === 'dismissed') {
    errors.status = ['Use POST /api/tasks/:id/dismiss to dismiss a task'];
  }

  // Optional: priority
  if (data.priority !== undefined && !VALID_PRIORITIES.includes(data.priority as TaskPriority)) {
    errors.priority = [`Priority must be one of: ${VALID_PRIORITIES.join(', ')}`];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      title: data.title as string | undefined,
      description: data.description as string | undefined,
      status: data.status as TaskStatus | undefined,
      priority: data.priority as TaskPriority | undefined,
      due_date: data.due_date as string | null | undefined,
      due_time: data.due_time as string | null | undefined,
      department: data.department as string | undefined,
      assignee_id: data.assignee_id as string | null | undefined,
      workflow_id: data.workflow_id as string | null | undefined,
    },
  };
}

export function validateDismissTask(body: unknown): ValidationResult<DismissTaskRequest> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  if (!data.dismissed_reason || typeof data.dismissed_reason !== 'string' || data.dismissed_reason.trim().length === 0) {
    errors.dismissed_reason = ['Dismissed reason is required'];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      dismissed_reason: (data.dismissed_reason as string).trim(),
    },
  };
}

export function validateCompleteTask(body: unknown): ValidationResult<CompleteTaskRequest> {
  if (!body || typeof body !== 'object') {
    return { success: true, data: {} };
  }

  const data = body as Record<string, unknown>;

  return {
    success: true,
    data: {
      completion_note: data.completion_note as string | undefined,
    },
  };
}

export function validateAddComment(body: unknown): ValidationResult<AddCommentRequest> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  if (!data.content || typeof data.content !== 'string' || data.content.trim().length === 0) {
    errors.content = ['Comment content is required'];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      content: (data.content as string).trim(),
    },
  };
}

// ==================== Response Helpers ====================

export function createErrorResponse(
  message: string,
  code: ErrorCode,
  details?: Record<string, string[]>
): ApiError {
  return { error: message, code, details };
}

export function createValidationError(errors: Record<string, string[]>): ApiError {
  const firstError = Object.values(errors)[0]?.[0] || 'Validation failed';
  return createErrorResponse(firstError, 'VALIDATION_ERROR', errors);
}
