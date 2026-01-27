// Lead Intelligence - Companies Validation
// Request validation helpers for companies endpoints

import type { CreateCompanyInput, UpdateCompanyInput, ErrorCode, ApiError } from './lead-intelligence-companies-types';

// ==================== Validation Result ====================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: Record<string, string[]>;
}

// ==================== Validation Helpers ====================

function isValidURL(value: string): boolean {
  try {
    new URL(value);
    return true;
  } catch {
    return false;
  }
}

// ==================== Error Helpers ====================

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

// ==================== Request Validators ====================

export function validateCreateCompany(body: unknown): ValidationResult<CreateCompanyInput> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  // Required: name
  if (!data.name || typeof data.name !== 'string' || data.name.trim().length === 0) {
    errors.name = ['Name is required and must be a non-empty string'];
  }

  // Optional: website (must be valid URL if provided)
  if (data.website !== undefined && data.website !== null) {
    if (typeof data.website !== 'string' || !isValidURL(data.website)) {
      errors.website = ['Website must be a valid URL'];
    }
  }

  // Optional: employee_count (must be positive integer if provided)
  if (data.employee_count !== undefined && data.employee_count !== null) {
    if (typeof data.employee_count !== 'number' || !Number.isInteger(data.employee_count) || data.employee_count <= 0) {
      errors.employee_count = ['Employee count must be a positive integer'];
    }
  }

  // Optional: industry
  if (data.industry !== undefined && data.industry !== null && typeof data.industry !== 'string') {
    errors.industry = ['Industry must be a string'];
  }

  // Optional: revenue_range
  if (data.revenue_range !== undefined && data.revenue_range !== null && typeof data.revenue_range !== 'string') {
    errors.revenue_range = ['Revenue range must be a string'];
  }

  // Optional: city
  if (data.city !== undefined && data.city !== null && typeof data.city !== 'string') {
    errors.city = ['City must be a string'];
  }

  // Optional: state
  if (data.state !== undefined && data.state !== null && typeof data.state !== 'string') {
    errors.state = ['State must be a string'];
  }

  // Optional: country
  if (data.country !== undefined && data.country !== null && typeof data.country !== 'string') {
    errors.country = ['Country must be a string'];
  }

  // Optional: linkedin_url (must be valid URL if provided)
  if (data.linkedin_url !== undefined && data.linkedin_url !== null) {
    if (typeof data.linkedin_url !== 'string' || !isValidURL(data.linkedin_url)) {
      errors.linkedin_url = ['LinkedIn URL must be a valid URL'];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const result: CreateCompanyInput = {
    name: (data.name as string).trim(),
  };

  // Copy optional fields
  if (data.website !== undefined) result.website = data.website as string | null;
  if (data.industry !== undefined) result.industry = data.industry as string | null;
  if (data.employee_count !== undefined) result.employee_count = data.employee_count as number | null;
  if (data.revenue_range !== undefined) result.revenue_range = data.revenue_range as string | null;
  if (data.city !== undefined) result.city = data.city as string | null;
  if (data.state !== undefined) result.state = data.state as string | null;
  if (data.country !== undefined) result.country = data.country as string | null;
  if (data.linkedin_url !== undefined) result.linkedin_url = data.linkedin_url as string | null;
  if (data.enrichment_source !== undefined) result.enrichment_source = data.enrichment_source as string | null;
  if (data.enrichment_data !== undefined) result.enrichment_data = data.enrichment_data as Record<string, unknown> | null;
  if (data.enriched_at !== undefined) result.enriched_at = data.enriched_at as string | null;

  return { success: true, data: result };
}

export function validateUpdateCompany(body: unknown): ValidationResult<UpdateCompanyInput> {
  const errors: Record<string, string[]> = {};

  if (!body || typeof body !== 'object') {
    return { success: false, errors: { body: ['Request body must be a valid JSON object'] } };
  }

  const data = body as Record<string, unknown>;

  // Optional: name (must be non-empty if provided)
  if (data.name !== undefined) {
    if (typeof data.name !== 'string' || data.name.trim().length === 0) {
      errors.name = ['Name must be a non-empty string'];
    }
  }

  // Optional: website
  if (data.website !== undefined && data.website !== null) {
    if (typeof data.website !== 'string' || !isValidURL(data.website)) {
      errors.website = ['Website must be a valid URL'];
    }
  }

  // Optional: employee_count
  if (data.employee_count !== undefined && data.employee_count !== null) {
    if (typeof data.employee_count !== 'number' || !Number.isInteger(data.employee_count) || data.employee_count <= 0) {
      errors.employee_count = ['Employee count must be a positive integer'];
    }
  }

  // Optional: industry
  if (data.industry !== undefined && data.industry !== null && typeof data.industry !== 'string') {
    errors.industry = ['Industry must be a string'];
  }

  // Optional: linkedin_url
  if (data.linkedin_url !== undefined && data.linkedin_url !== null) {
    if (typeof data.linkedin_url !== 'string' || !isValidURL(data.linkedin_url)) {
      errors.linkedin_url = ['LinkedIn URL must be a valid URL'];
    }
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  const result: UpdateCompanyInput = {};

  if (data.name !== undefined) result.name = (data.name as string).trim();
  if (data.website !== undefined) result.website = data.website as string | null;
  if (data.industry !== undefined) result.industry = data.industry as string | null;
  if (data.employee_count !== undefined) result.employee_count = data.employee_count as number | null;
  if (data.revenue_range !== undefined) result.revenue_range = data.revenue_range as string | null;
  if (data.city !== undefined) result.city = data.city as string | null;
  if (data.state !== undefined) result.state = data.state as string | null;
  if (data.country !== undefined) result.country = data.country as string | null;
  if (data.linkedin_url !== undefined) result.linkedin_url = data.linkedin_url as string | null;
  if (data.enrichment_source !== undefined) result.enrichment_source = data.enrichment_source as string | null;
  if (data.enrichment_data !== undefined) result.enrichment_data = data.enrichment_data as Record<string, unknown> | null;
  if (data.enriched_at !== undefined) result.enriched_at = data.enriched_at as string | null;

  return { success: true, data: result };
}
