// Lead Intelligence - Contacts Validation
// Request validation helpers for contact endpoints

import type { CreateContactInput, UpdateContactInput, ValidationResult } from './lead-intelligence-contacts-types';

const VALID_STATUSES = ['lead', 'customer', 'prospect', 'inactive', 'do_not_contact'];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateContactFields(body: Record<string, unknown>, requireFields: boolean): { errors: string[]; data: Record<string, unknown> } {
  const errors: string[] = [];
  const data: Record<string, unknown> = {};

  if (requireFields) {
    if (!body.first_name || typeof body.first_name !== 'string') {
      errors.push('first_name is required and must be a string');
    }
    if (!body.last_name || typeof body.last_name !== 'string') {
      errors.push('last_name is required and must be a string');
    }
    if (!body.email || typeof body.email !== 'string') {
      errors.push('email is required and must be a string');
    } else if (!EMAIL_REGEX.test(body.email)) {
      errors.push('email must be a valid email address');
    }
  }

  // String fields
  const stringFields = [
    'first_name', 'last_name', 'email', 'phone', 'linkedin_url', 'title',
    'department', 'seniority_level', 'company_id', 'city', 'state', 'country',
    'status', 'classification', 'lead_source', 'email_status',
    'profile_image_url', 'linkedin_member_id', 'linkedin_headline',
  ];

  for (const field of stringFields) {
    if (body[field] !== undefined) {
      if (typeof body[field] !== 'string') {
        errors.push(`${field} must be a string`);
      } else {
        data[field] = body[field];
      }
    }
  }

  // Email format (for update where email is optional but if provided must be valid)
  if (!requireFields && body.email && typeof body.email === 'string' && !EMAIL_REGEX.test(body.email)) {
    errors.push('email must be a valid email address');
  }

  // Status validation
  if (body.status && typeof body.status === 'string' && !VALID_STATUSES.includes(body.status)) {
    errors.push(`status must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // engagement_score
  if (body.engagement_score !== undefined) {
    if (typeof body.engagement_score !== 'number' || body.engagement_score < 0 || body.engagement_score > 100) {
      errors.push('engagement_score must be a number between 0 and 100');
    } else {
      data.engagement_score = body.engagement_score;
    }
  }

  // is_vip
  if (body.is_vip !== undefined) {
    if (typeof body.is_vip !== 'boolean') {
      errors.push('is_vip must be a boolean');
    } else {
      data.is_vip = body.is_vip;
    }
  }

  return { errors, data };
}

export function validateCreateContact(body: unknown): ValidationResult<CreateContactInput> {
  if (!body || typeof body !== 'object') {
    return { success: false, errors: ['Request body must be a JSON object'] };
  }

  const { errors, data } = validateContactFields(body as Record<string, unknown>, true);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  return { success: true, data: data as unknown as CreateContactInput };
}

export function validateUpdateContact(body: unknown): ValidationResult<UpdateContactInput> {
  if (!body || typeof body !== 'object') {
    return { success: false, errors: ['Request body must be a JSON object'] };
  }

  const { errors, data } = validateContactFields(body as Record<string, unknown>, false);

  if (errors.length > 0) {
    return { success: false, errors };
  }

  if (Object.keys(data).length === 0) {
    return { success: false, errors: ['At least one field must be provided for update'] };
  }

  return { success: true, data: data as unknown as UpdateContactInput };
}

export function createValidationError(errors: string[]): { error: string; code: string; details: string[] } {
  return {
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details: errors,
  };
}
