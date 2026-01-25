/**
 * Template Utilities for Action Center
 *
 * Core utility functions for workflow templates and task rules:
 * - Condition evaluation (JSON path checks with operators)
 * - Variable substitution (replace ${var} in strings)
 * - Due date calculation (reference date + offset)
 * - Dedupe key generation
 */

import { addDays, parseISO, isValid } from 'date-fns';

// ============================================
// CONDITION EVALUATION
// ============================================

/**
 * Condition operator type
 */
export type ConditionOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists' | 'not_exists';

/**
 * Single condition definition
 */
export interface Condition {
  field: string;      // "payload.program_type" or "program_type"
  operator: ConditionOperator;
  value?: unknown;    // Not needed for exists/not_exists
}

/**
 * Get value from object using dot-notation path
 * @example getValueByPath({ payload: { type: 'x' } }, 'payload.type') => 'x'
 */
export function getValueByPath(obj: Record<string, unknown>, path: string): unknown {
  const parts = path.split('.');
  let current: unknown = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    if (typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }

  return current;
}

/**
 * Evaluate a single condition against a payload
 */
export function evaluateCondition(condition: Condition, payload: Record<string, unknown>): boolean {
  const value = getValueByPath(payload, condition.field);

  switch (condition.operator) {
    case 'exists':
      return value !== undefined && value !== null;

    case 'not_exists':
      return value === undefined || value === null;

    case 'equals':
      return value === condition.value;

    case 'not_equals':
      return value !== condition.value;

    case 'in':
      if (!Array.isArray(condition.value)) return false;
      return condition.value.includes(value);

    case 'not_in':
      if (!Array.isArray(condition.value)) return true;
      return !condition.value.includes(value);

    default:
      console.warn(`Unknown operator: ${condition.operator}`);
      return false;
  }
}

/**
 * Evaluate all conditions (AND logic - all must pass)
 */
export function evaluateConditions(conditions: Condition[], payload: Record<string, unknown>): boolean {
  if (!conditions || conditions.length === 0) {
    return true; // No conditions = always passes
  }

  return conditions.every(condition => evaluateCondition(condition, payload));
}

// ============================================
// VARIABLE SUBSTITUTION
// ============================================

/**
 * Variable mapping: local variable name -> payload path
 * @example { "program_name": "payload.program.name", "date": "payload.start_date" }
 */
export type VariableMapping = Record<string, string>;

/**
 * Substitute variables in a string using ${varName} syntax
 * @param text - String with ${variable} placeholders
 * @param mapping - Map of variable names to payload paths
 * @param payload - Data to extract values from
 * @returns Substituted string, or original if variable not found
 */
export function substituteVariables(
  text: string,
  mapping: VariableMapping,
  payload: Record<string, unknown>
): string {
  if (!text) return text;

  return text.replace(/\$\{([^}]+)\}/g, (match, varName) => {
    const path = mapping[varName];
    if (!path) {
      console.warn(`Variable ${varName} not found in mapping`);
      return match; // Keep original if no mapping
    }

    const value = getValueByPath(payload, path);
    if (value === undefined || value === null) {
      console.warn(`Path ${path} for variable ${varName} returned null/undefined`);
      return match; // Keep original if value not found
    }

    return String(value);
  });
}

/**
 * Check if all required variables can be resolved
 * Returns list of unresolvable variables
 */
export function validateVariables(
  text: string,
  mapping: VariableMapping,
  payload: Record<string, unknown>
): string[] {
  const unresolved: string[] = [];
  const varPattern = /\$\{([^}]+)\}/g;
  let match;

  while ((match = varPattern.exec(text)) !== null) {
    const varName = match[1];
    const path = mapping[varName];

    if (!path) {
      unresolved.push(varName);
      continue;
    }

    const value = getValueByPath(payload, path);
    if (value === undefined || value === null) {
      unresolved.push(varName);
    }
  }

  return unresolved;
}

// ============================================
// DUE DATE CALCULATION
// ============================================

/**
 * Due date configuration
 */
export interface DueDateConfig {
  reference: string;      // Payload path to reference date, e.g., "payload.program_date"
  offset_days: number;    // Days to add (negative = before, positive = after)
}

/**
 * Calculate due date from reference field + offset
 * @param config - Due date configuration
 * @param payload - Data containing the reference date
 * @returns ISO date string or null if reference not found/invalid
 */
export function calculateDueDate(
  config: DueDateConfig,
  payload: Record<string, unknown>
): string | null {
  const referenceValue = getValueByPath(payload, config.reference);

  if (!referenceValue) {
    console.warn(`Reference date field ${config.reference} not found in payload`);
    return null;
  }

  // Parse the reference date
  let referenceDate: Date;

  if (referenceValue instanceof Date) {
    referenceDate = referenceValue;
  } else if (typeof referenceValue === 'string') {
    referenceDate = parseISO(referenceValue);
  } else {
    console.warn(`Reference date value is not a date or string: ${typeof referenceValue}`);
    return null;
  }

  if (!isValid(referenceDate)) {
    console.warn(`Invalid reference date: ${referenceValue}`);
    return null;
  }

  // Add offset (calendar days)
  const dueDate = addDays(referenceDate, config.offset_days);

  return dueDate.toISOString();
}

/**
 * Calculate task due date relative to workflow target date
 * @param workflowTargetDate - The workflow's target completion date
 * @param daysBefore - Days before target (positive = before, negative = after)
 * @returns ISO date string
 */
export function calculateTaskDueDate(
  workflowTargetDate: string | Date,
  daysBefore: number
): string {
  const targetDate = typeof workflowTargetDate === 'string'
    ? parseISO(workflowTargetDate)
    : workflowTargetDate;

  if (!isValid(targetDate)) {
    throw new Error(`Invalid workflow target date: ${workflowTargetDate}`);
  }

  // daysBefore is positive for "before target", so we subtract
  const dueDate = addDays(targetDate, -daysBefore);

  return dueDate.toISOString();
}

// ============================================
// DEDUPE KEY GENERATION
// ============================================

/**
 * Generate dedupe key from template
 * Supports placeholders: {template_id}, {rule_id}, {entity_id}, {date}, {task_order}
 */
export function generateDedupeKey(
  template: string,
  values: Record<string, string | number>
): string {
  let key = template;

  for (const [placeholder, value] of Object.entries(values)) {
    key = key.replace(`{${placeholder}}`, String(value));
  }

  // Replace {date} with current date if not provided
  if (key.includes('{date}')) {
    key = key.replace('{date}', new Date().toISOString().split('T')[0]);
  }

  return key;
}

/**
 * Default dedupe key for workflow templates
 */
export function workflowTemplateDedupeKey(
  templateId: string,
  entityId: string,
  taskOrder: number
): string {
  return `wt:${templateId}:${entityId}:${taskOrder}`;
}

/**
 * Default dedupe key for task rules
 */
export function taskRuleDedupeKey(
  ruleId: string,
  entityId?: string,
  date?: string
): string {
  const parts = ['tr', ruleId];
  if (entityId) parts.push(entityId);
  if (date) parts.push(date);
  return parts.join(':');
}

// ============================================
// TYPE GUARDS
// ============================================

/**
 * Type guard for Condition array
 */
export function isConditionArray(value: unknown): value is Condition[] {
  if (!Array.isArray(value)) return false;
  return value.every(item =>
    typeof item === 'object' &&
    item !== null &&
    'field' in item &&
    'operator' in item
  );
}

/**
 * Type guard for VariableMapping
 */
export function isVariableMapping(value: unknown): value is VariableMapping {
  if (typeof value !== 'object' || value === null) return false;
  return Object.values(value).every(v => typeof v === 'string');
}
