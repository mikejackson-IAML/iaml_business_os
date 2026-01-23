// Task Rule API - Validation utilities
// Request validation helpers for task rule endpoints

import type {
  RuleType,
  ScheduleType,
  ScheduleConfig,
  TaskTemplate,
  CreateTaskRuleRequest,
  UpdateTaskRuleRequest,
} from './task-rule-types';
import type { ErrorCode, ApiError } from './task-types';

// ==================== Valid Values ====================

export const VALID_RULE_TYPES: RuleType[] = ['recurring', 'event', 'condition'];
export const VALID_SCHEDULE_TYPES: ScheduleType[] = ['daily', 'weekly', 'monthly', 'cron'];
export const VALID_TASK_TYPES = ['standard', 'approval', 'decision', 'review'] as const;
export const VALID_PRIORITIES = ['critical', 'high', 'normal', 'low'] as const;

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

function isValidTime(value: string): boolean {
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  return timeRegex.test(value);
}

function validateScheduleConfig(config: unknown, scheduleType: ScheduleType): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config || typeof config !== 'object') {
    errors.push('schedule_config must be an object');
    return { valid: false, errors };
  }

  const c = config as Record<string, unknown>;

  // All schedule types need a time (except cron which has it embedded)
  if (scheduleType !== 'cron') {
    if (!c.time || typeof c.time !== 'string' || !isValidTime(c.time)) {
      errors.push('schedule_config.time must be a valid time string (HH:MM)');
    }
  }

  if (scheduleType === 'weekly') {
    if (typeof c.day_of_week !== 'number' || c.day_of_week < 1 || c.day_of_week > 7) {
      errors.push('schedule_config.day_of_week must be a number from 1 (Monday) to 7 (Sunday)');
    }
  }

  if (scheduleType === 'monthly') {
    if (typeof c.day_of_month !== 'number' || c.day_of_month < 1 || c.day_of_month > 31) {
      errors.push('schedule_config.day_of_month must be a number from 1 to 31');
    }
  }

  if (scheduleType === 'cron') {
    if (!c.cron || typeof c.cron !== 'string' || c.cron.trim().length === 0) {
      errors.push('schedule_config.cron must be a valid cron expression');
    }
  }

  return { valid: errors.length === 0, errors };
}

function validateTaskTemplate(template: unknown): { valid: boolean; errors: string[]; data?: TaskTemplate } {
  const errors: string[] = [];

  if (!template || typeof template !== 'object') {
    errors.push('task_template must be an object');
    return { valid: false, errors };
  }

  const t = template as Record<string, unknown>;

  // Required: title
  if (!t.title || typeof t.title !== 'string' || t.title.trim().length === 0) {
    errors.push('task_template.title is required');
  } else if ((t.title as string).length > 500) {
    errors.push('task_template.title must be 500 characters or less');
  }

  // Optional: task_type
  if (t.task_type !== undefined && !VALID_TASK_TYPES.includes(t.task_type as typeof VALID_TASK_TYPES[number])) {
    errors.push(`task_template.task_type must be one of: ${VALID_TASK_TYPES.join(', ')}`);
  }

  // Optional: priority
  if (t.priority !== undefined && !VALID_PRIORITIES.includes(t.priority as typeof VALID_PRIORITIES[number])) {
    errors.push(`task_template.priority must be one of: ${VALID_PRIORITIES.join(', ')}`);
  }

  // Optional: assignee_id
  if (t.assignee_id !== undefined && t.assignee_id !== null) {
    if (typeof t.assignee_id !== 'string' || !isValidUUID(t.assignee_id)) {
      errors.push('task_template.assignee_id must be a valid UUID');
    }
  }

  // Optional: sop_template_id
  if (t.sop_template_id !== undefined && t.sop_template_id !== null) {
    if (typeof t.sop_template_id !== 'string' || !isValidUUID(t.sop_template_id)) {
      errors.push('task_template.sop_template_id must be a valid UUID');
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    errors: [],
    data: {
      title: (t.title as string).trim(),
      description: t.description as string | undefined,
      task_type: t.task_type as TaskTemplate['task_type'],
      priority: t.priority as TaskTemplate['priority'],
      department: t.department as string | undefined,
      assignee_id: t.assignee_id as string | undefined,
      sop_template_id: t.sop_template_id as string | undefined,
      related_entity_type: t.related_entity_type as string | undefined,
    },
  };
}

// ==================== Request Validators ====================

export function validateCreateTaskRule(body: unknown): ValidationResult<CreateTaskRuleRequest> {
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

  // Required: rule_type
  if (!data.rule_type || !VALID_RULE_TYPES.includes(data.rule_type as RuleType)) {
    errors.rule_type = [`Rule type is required and must be one of: ${VALID_RULE_TYPES.join(', ')}`];
  }

  const ruleType = data.rule_type as RuleType;

  // Conditional: schedule_type and schedule_config for recurring rules
  if (ruleType === 'recurring') {
    if (!data.schedule_type || !VALID_SCHEDULE_TYPES.includes(data.schedule_type as ScheduleType)) {
      errors.schedule_type = [`For recurring rules, schedule_type is required and must be one of: ${VALID_SCHEDULE_TYPES.join(', ')}`];
    } else if (data.schedule_config) {
      const configResult = validateScheduleConfig(data.schedule_config, data.schedule_type as ScheduleType);
      if (!configResult.valid) {
        errors.schedule_config = configResult.errors;
      }
    } else {
      errors.schedule_config = ['For recurring rules, schedule_config is required'];
    }
  }

  // Conditional: trigger_event for event rules
  if (ruleType === 'event') {
    if (!data.trigger_event || typeof data.trigger_event !== 'string' || data.trigger_event.trim().length === 0) {
      errors.trigger_event = ['For event rules, trigger_event is required'];
    }
  }

  // Conditional: condition_query for condition rules
  if (ruleType === 'condition') {
    if (!data.condition_query || typeof data.condition_query !== 'string' || data.condition_query.trim().length === 0) {
      errors.condition_query = ['For condition rules, condition_query is required'];
    }
  }

  // Required: task_template
  let validatedTemplate: TaskTemplate | undefined;
  if (!data.task_template) {
    errors.task_template = ['task_template is required'];
  } else {
    const templateResult = validateTaskTemplate(data.task_template);
    if (!templateResult.valid) {
      errors.task_template = templateResult.errors;
    } else {
      validatedTemplate = templateResult.data;
    }
  }

  // Optional: due_date_offset_days
  if (data.due_date_offset_days !== undefined && data.due_date_offset_days !== null) {
    if (typeof data.due_date_offset_days !== 'number' || !Number.isInteger(data.due_date_offset_days)) {
      errors.due_date_offset_days = ['due_date_offset_days must be an integer'];
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
      rule_type: ruleType,
      schedule_type: data.schedule_type as ScheduleType | undefined,
      schedule_config: data.schedule_config as ScheduleConfig | undefined,
      trigger_event: data.trigger_event as string | undefined,
      trigger_conditions: data.trigger_conditions as Record<string, unknown> | undefined,
      condition_query: data.condition_query as string | undefined,
      task_template: validatedTemplate!,
      due_date_field: data.due_date_field as string | undefined,
      due_date_offset_days: data.due_date_offset_days as number | undefined,
      dedupe_key_template: data.dedupe_key_template as string | undefined,
      is_enabled: data.is_enabled as boolean | undefined,
    },
  };
}

export function validateUpdateTaskRule(body: unknown): ValidationResult<UpdateTaskRuleRequest> {
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

  // Optional: schedule_type
  if (data.schedule_type !== undefined && !VALID_SCHEDULE_TYPES.includes(data.schedule_type as ScheduleType)) {
    errors.schedule_type = [`Schedule type must be one of: ${VALID_SCHEDULE_TYPES.join(', ')}`];
  }

  // Optional: schedule_config (validated only if schedule_type is also provided)
  if (data.schedule_config !== undefined && data.schedule_type !== undefined) {
    const configResult = validateScheduleConfig(data.schedule_config, data.schedule_type as ScheduleType);
    if (!configResult.valid) {
      errors.schedule_config = configResult.errors;
    }
  }

  // Optional: task_template
  let validatedTemplate: TaskTemplate | undefined;
  if (data.task_template !== undefined) {
    const templateResult = validateTaskTemplate(data.task_template);
    if (!templateResult.valid) {
      errors.task_template = templateResult.errors;
    } else {
      validatedTemplate = templateResult.data;
    }
  }

  // Optional: is_enabled
  if (data.is_enabled !== undefined && typeof data.is_enabled !== 'boolean') {
    errors.is_enabled = ['is_enabled must be a boolean'];
  }

  // Optional: due_date_offset_days
  if (data.due_date_offset_days !== undefined && data.due_date_offset_days !== null) {
    if (typeof data.due_date_offset_days !== 'number' || !Number.isInteger(data.due_date_offset_days)) {
      errors.due_date_offset_days = ['due_date_offset_days must be an integer'];
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
      schedule_type: data.schedule_type as ScheduleType | undefined,
      schedule_config: data.schedule_config as ScheduleConfig | undefined,
      trigger_event: data.trigger_event as string | undefined,
      trigger_conditions: data.trigger_conditions as Record<string, unknown> | undefined,
      condition_query: data.condition_query as string | undefined,
      task_template: validatedTemplate,
      due_date_field: data.due_date_field as string | undefined,
      due_date_offset_days: data.due_date_offset_days as number | undefined,
      dedupe_key_template: data.dedupe_key_template as string | undefined,
      is_enabled: data.is_enabled as boolean | undefined,
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
