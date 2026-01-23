// Workflow API - Validation utilities
// Request validation helpers for workflow endpoints

import type {
  WorkflowStatus,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
  AddTaskToWorkflowRequest,
} from './workflow-types';
import type { ErrorCode, ApiError } from './task-types';

// ==================== Valid Values ====================

export const VALID_WORKFLOW_STATUSES: WorkflowStatus[] = ['not_started', 'in_progress', 'blocked', 'completed'];

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

// ==================== Request Validators ====================

export function validateCreateWorkflow(body: unknown): ValidationResult<CreateWorkflowRequest> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  // Required: name
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.name = ['Name is required and must be a non-empty string'];
  } else if (data.name.length > 200) {
    errors.name = ['Name must be 200 characters or less'];
  }

  // Optional: description
  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.description = ['Description must be a string'];
  }

  // Optional: related_entity_id (must be UUID if provided)
  if (data.related_entity_id !== undefined && data.related_entity_id !== null) {
    if (typeof data.related_entity_id !== 'string' || !isValidUUID(data.related_entity_id)) {
      errors.related_entity_id = ['Related entity ID must be a valid UUID'];
    }
  }

  // Optional: target_completion_date
  if (data.target_completion_date !== undefined && data.target_completion_date !== null) {
    if (typeof data.target_completion_date !== 'string' || !isValidDate(data.target_completion_date)) {
      errors.target_completion_date = ['Target completion date must be a valid ISO date string (YYYY-MM-DD)'];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: (data.name as string).trim(),
      description: data.description as string | undefined,
      workflow_type: data.workflow_type as string | undefined,
      department: data.department as string | undefined,
      related_entity_type: data.related_entity_type as string | undefined,
      related_entity_id: data.related_entity_id as string | undefined,
      target_completion_date: data.target_completion_date as string | undefined,
    },
  };
}

export function validateUpdateWorkflow(body: unknown): ValidationResult<UpdateWorkflowRequest> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  // Optional: name
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.name = ['Name must be a non-empty string'];
    } else if (data.name.length > 200) {
      errors.name = ['Name must be 200 characters or less'];
    }
  }

  // Optional: description
  if (data.description !== undefined && data.description !== null && typeof data.description !== 'string') {
    errors.description = ['Description must be a string'];
  }

  // Optional: target_completion_date
  if (data.target_completion_date !== undefined && data.target_completion_date !== null) {
    if (typeof data.target_completion_date !== 'string' || !isValidDate(data.target_completion_date)) {
      errors.target_completion_date = ['Target completion date must be a valid ISO date string (YYYY-MM-DD)'];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      name: data.name as string | undefined,
      description: data.description as string | undefined,
      workflow_type: data.workflow_type as string | undefined,
      department: data.department as string | undefined,
      target_completion_date: data.target_completion_date as string | null | undefined,
    },
  };
}

export function validateAddTaskToWorkflow(body: unknown): ValidationResult<AddTaskToWorkflowRequest> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  // Required: task_id
  if (!data.task_id || typeof data.task_id !== 'string') {
    errors.task_id = ['Task ID is required'];
  } else if (!isValidUUID(data.task_id)) {
    errors.task_id = ['Task ID must be a valid UUID'];
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  return {
    success: true,
    data: {
      task_id: data.task_id as string,
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
