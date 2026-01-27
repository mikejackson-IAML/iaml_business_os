// Lead Intelligence - Companies Types
// TypeScript interfaces for companies CRUD API

// ==================== Database Entity ====================

export interface Company {
  id: string;
  name: string;
  website: string | null;
  industry: string | null;
  employee_count: number | null;
  revenue_range: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  linkedin_url: string | null;
  enrichment_source: string | null;
  enrichment_data: Record<string, unknown> | null;
  enriched_at: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== Input Types ====================

export interface CreateCompanyInput {
  name: string;
  website?: string | null;
  industry?: string | null;
  employee_count?: number | null;
  revenue_range?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  linkedin_url?: string | null;
  enrichment_source?: string | null;
  enrichment_data?: Record<string, unknown> | null;
  enriched_at?: string | null;
}

export type UpdateCompanyInput = Partial<CreateCompanyInput>;

// ==================== List Params ====================

export interface CompanyListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// ==================== Response Types ====================

export interface CompanyListResponse {
  data: Company[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

// ==================== Error Types ====================

export type ErrorCode = 'VALIDATION_ERROR' | 'NOT_FOUND' | 'INTERNAL_ERROR' | 'UNAUTHORIZED';

export interface ApiError {
  error: string;
  code: ErrorCode;
  details?: Record<string, string[]>;
}
