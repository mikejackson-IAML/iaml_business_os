// SOP API - Validation utilities
// Request validation helpers for SOP template endpoints

import type {
  SOPStep,
  CreateSOPRequest,
  UpdateSOPRequest,
} from './sop-types';
import type { ErrorCode, ApiError } from './task-types';

// ==================== Validation Result ====================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

// ==================== Step Validation ====================

function validateSOPStep(step: unknown, index: number): string[] {
  const errors: string[] = [];

  if (!step || typeof step !== 'object') {
    errors.push(`Step ${index + 1}: must be an object`);
    return errors;
  }

  const s = step as Record<string, unknown>;

  // Required: order (must be a number)
  if (typeof s.order !== 'number' || !Number.isInteger(s.order) || s.order < 1) {
    errors.push(`Step ${index + 1}: order must be a positive integer`);
  }

  // Required: title
  if (!s.title || typeof s.title !== 'string' || s.title.trim().length === 0) {
    errors.push(`Step ${index + 1}: title is required and must be a non-empty string`);
  } else if ((s.title as string).length > 200) {
    errors.push(`Step ${index + 1}: title must be 200 characters or less`);
  }

  // Optional: description
  if (s.description !== undefined && s.description !== null && typeof s.description !== 'string') {
    errors.push(`Step ${index + 1}: description must be a string`);
  }

  // Optional: estimated_minutes (must be a positive number)
  if (s.estimated_minutes !== undefined && s.estimated_minutes !== null) {
    if (typeof s.estimated_minutes !== 'number' || s.estimated_minutes < 0) {
      errors.push(`Step ${index + 1}: estimated_minutes must be a non-negative number`);
    }
  }

  // Optional: links (must be array of strings)
  if (s.links !== undefined && s.links !== null) {
    if (!Array.isArray(s.links)) {
      errors.push(`Step ${index + 1}: links must be an array of strings`);
    } else {
      const invalidLinks = s.links.filter((link: unknown) => typeof link !== 'string');
      if (invalidLinks.length > 0) {
        errors.push(`Step ${index + 1}: all links must be strings`);
      }
    }
  }

  // Optional: notes
  if (s.notes !== undefined && s.notes !== null && typeof s.notes !== 'string') {
    errors.push(`Step ${index + 1}: notes must be a string`);
  }

  return errors;
}

function validateStepsArray(steps: unknown): { valid: boolean; errors: string[]; data?: SOPStep[] } {
  if (!Array.isArray(steps)) {
    return { valid: false, errors: ['Steps must be an array'] };
  }

  const allErrors: string[] = [];
  const validatedSteps: SOPStep[] = [];

  for (let i = 0; i < steps.length; i++) {
    const stepErrors = validateSOPStep(steps[i], i);
    if (stepErrors.length > 0) {
      allErrors.push(...stepErrors);
    } else {
      const s = steps[i] as Record<string, unknown>;
      validatedSteps.push({
        order: s.order as number,
        title: (s.title as string).trim(),
        description: (s.description as string | null) || null,
        estimated_minutes: (s.estimated_minutes as number | null) || null,
        links: (s.links as string[]) || [],
        notes: (s.notes as string | null) || null,
      });
    }
  }

  if (allErrors.length > 0) {
    return { valid: false, errors: allErrors };
  }

  // Check for duplicate order numbers
  const orders = validatedSteps.map(s => s.order);
  const uniqueOrders = new Set(orders);
  if (orders.length !== uniqueOrders.size) {
    return { valid: false, errors: ['Steps must have unique order numbers'] };
  }

  return { valid: true, errors: [], data: validatedSteps };
}

function validateVariables(variables: unknown): { valid: boolean; errors: string[]; data?: Record<string, { description: string; example: string }> } {
  if (!variables || typeof variables !== 'object' || Array.isArray(variables)) {
    return { valid: false, errors: ['Variables must be an object'] };
  }

  const v = variables as Record<string, unknown>;
  const errors: string[] = [];
  const validated: Record<string, { description: string; example: string }> = {};

  for (const [key, value] of Object.entries(v)) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      errors.push(`Variable "${key}": must be an object with description and example`);
      continue;
    }

    const varDef = value as Record<string, unknown>;
    if (typeof varDef.description !== 'string' || typeof varDef.example !== 'string') {
      errors.push(`Variable "${key}": must have description and example as strings`);
    } else {
      validated[key] = {
        description: varDef.description,
        example: varDef.example,
      };
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return { valid: true, errors: [], data: validated };
}

// ==================== Request Validators ====================

export function validateCreateSOP(body: unknown): ValidationResult<CreateSOPRequest> {
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

  // Optional: steps (validated separately)
  let validatedSteps: SOPStep[] | undefined;
  if (data.steps !== undefined && data.steps !== null) {
    const stepsResult = validateStepsArray(data.steps);
    if (!stepsResult.valid) {
      errors.steps = stepsResult.errors;
    } else {
      validatedSteps = stepsResult.data;
    }
  }

  // Optional: variables
  let validatedVariables: Record<string, { description: string; example: string }> | undefined;
  if (data.variables !== undefined && data.variables !== null) {
    const variablesResult = validateVariables(data.variables);
    if (!variablesResult.valid) {
      errors.variables = variablesResult.errors;
    } else {
      validatedVariables = variablesResult.data;
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
      category: data.category as string | undefined,
      department: data.department as string | undefined,
      steps: validatedSteps,
      variables: validatedVariables,
    },
  };
}

export function validateUpdateSOP(body: unknown): ValidationResult<UpdateSOPRequest> {
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

  // Optional: steps (validated separately)
  let validatedSteps: SOPStep[] | undefined;
  if (data.steps !== undefined) {
    if (data.steps === null) {
      // Allow null to clear steps
      validatedSteps = [];
    } else {
      const stepsResult = validateStepsArray(data.steps);
      if (!stepsResult.valid) {
        errors.steps = stepsResult.errors;
      } else {
        validatedSteps = stepsResult.data;
      }
    }
  }

  // Optional: is_active
  if (data.is_active !== undefined && typeof data.is_active !== 'boolean') {
    errors.is_active = ['is_active must be a boolean'];
  }

  // Optional: variables
  let validatedVariables: Record<string, { description: string; example: string }> | undefined;
  if (data.variables !== undefined && data.variables !== null) {
    const variablesResult = validateVariables(data.variables);
    if (!variablesResult.valid) {
      errors.variables = variablesResult.errors;
    } else {
      validatedVariables = variablesResult.data;
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
      category: data.category as string | undefined,
      department: data.department as string | undefined,
      steps: validatedSteps,
      is_active: data.is_active as boolean | undefined,
      variables: validatedVariables,
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
