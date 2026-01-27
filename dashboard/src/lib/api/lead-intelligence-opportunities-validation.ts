// Lead Intelligence - Opportunities Validation
// Request validation helpers for opportunity endpoints

import type { CreateOpportunityInput, UpdateOpportunityInput, ValidationResult } from './lead-intelligence-opportunities-types';
import { IN_HOUSE_STAGES, INDIVIDUAL_STAGES } from './lead-intelligence-opportunities-types';

const VALID_TYPES = ['in_house', 'individual'];

function getStagesForType(type: string): readonly string[] {
  return type === 'in_house' ? IN_HOUSE_STAGES : INDIVIDUAL_STAGES;
}

export function validateStageAdvancement(type: string, newStage: string): { valid: boolean; error?: string } {
  if (!VALID_TYPES.includes(type)) {
    return { valid: false, error: `Invalid opportunity type: ${type}` };
  }
  const stages = getStagesForType(type);
  if (!(stages as readonly string[]).includes(newStage)) {
    return { valid: false, error: `Invalid stage '${newStage}' for type '${type}'. Valid stages: ${stages.join(', ')}` };
  }
  return { valid: true };
}

export function validateOpportunity(body: unknown): ValidationResult<CreateOpportunityInput> {
  if (!body || typeof body !== 'object') {
    return { success: false, errors: ['Request body must be a JSON object'] };
  }

  const b = body as Record<string, unknown>;
  const errors: string[] = [];

  // Required: title
  if (!b.title || typeof b.title !== 'string') {
    errors.push('title is required and must be a string');
  }

  // Required: type
  if (!b.type || typeof b.type !== 'string') {
    errors.push('type is required and must be a string');
  } else if (!VALID_TYPES.includes(b.type)) {
    errors.push(`type must be one of: ${VALID_TYPES.join(', ')}`);
  }

  // Optional: stage (validate against type pipeline)
  if (b.stage !== undefined) {
    if (typeof b.stage !== 'string') {
      errors.push('stage must be a string');
    } else if (b.type && typeof b.type === 'string' && VALID_TYPES.includes(b.type)) {
      const stageCheck = validateStageAdvancement(b.type, b.stage);
      if (!stageCheck.valid) {
        errors.push(stageCheck.error!);
      }
    }
  }

  // Optional: value (non-negative)
  if (b.value !== undefined) {
    if (typeof b.value !== 'number' || b.value < 0) {
      errors.push('value must be a non-negative number');
    }
  }

  // Optional strings
  for (const field of ['company_id', 'contact_id', 'notes']) {
    if (b[field] !== undefined && typeof b[field] !== 'string') {
      errors.push(`${field} must be a string`);
    }
  }

  if (errors.length > 0) {
    return { success: false, errors };
  }

  const data: CreateOpportunityInput = {
    title: b.title as string,
    type: b.type as 'in_house' | 'individual',
  };
  if (b.stage) data.stage = b.stage as string;
  if (b.company_id) data.company_id = b.company_id as string;
  if (b.contact_id) data.contact_id = b.contact_id as string;
  if (b.value !== undefined) data.value = b.value as number;
  if (b.notes) data.notes = b.notes as string;

  return { success: true, data };
}

export function validateUpdateOpportunity(body: unknown): ValidationResult<UpdateOpportunityInput> {
  if (!body || typeof body !== 'object') {
    return { success: false, errors: ['Request body must be a JSON object'] };
  }

  const b = body as Record<string, unknown>;
  const errors: string[] = [];
  const data: UpdateOpportunityInput = {};

  if (b.title !== undefined) {
    if (typeof b.title !== 'string') errors.push('title must be a string');
    else data.title = b.title;
  }
  if (b.stage !== undefined) {
    if (typeof b.stage !== 'string') errors.push('stage must be a string');
    else data.stage = b.stage;
  }
  if (b.value !== undefined) {
    if (typeof b.value !== 'number' || b.value < 0) errors.push('value must be a non-negative number');
    else data.value = b.value;
  }
  if (b.company_id !== undefined) {
    if (typeof b.company_id !== 'string') errors.push('company_id must be a string');
    else data.company_id = b.company_id;
  }
  if (b.contact_id !== undefined) {
    if (typeof b.contact_id !== 'string') errors.push('contact_id must be a string');
    else data.contact_id = b.contact_id;
  }
  if (b.notes !== undefined) {
    if (typeof b.notes !== 'string') errors.push('notes must be a string');
    else data.notes = b.notes;
  }

  if (errors.length > 0) return { success: false, errors };
  if (Object.keys(data).length === 0) return { success: false, errors: ['At least one field must be provided for update'] };

  return { success: true, data };
}

export function createValidationError(errors: string[]): { error: string; code: string; details: string[] } {
  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors,
  };
}
