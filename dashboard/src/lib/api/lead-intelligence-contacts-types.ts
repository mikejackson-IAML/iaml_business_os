// Lead Intelligence - Contacts Types
// Type definitions for contact CRUD API

export interface Contact {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  linkedin_url: string | null;
  title: string | null;
  department: string | null;
  seniority_level: string | null;
  company_id: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  status: string | null;
  classification: string | null;
  lead_source: string | null;
  engagement_score: number | null;
  is_vip: boolean | null;
  email_status: string | null;
  email_verified_at: string | null;
  last_activity_at: string | null;
  enrichment_source: string | null;
  enrichment_data: Record<string, unknown> | null;
  enriched_at: string | null;
  profile_image_url: string | null;
  linkedin_member_id: string | null;
  linkedin_headline: string | null;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string } | null;
}

export interface CreateContactInput {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  linkedin_url?: string;
  title?: string;
  department?: string;
  seniority_level?: string;
  company_id?: string;
  city?: string;
  state?: string;
  country?: string;
  status?: string;
  classification?: string;
  lead_source?: string;
  engagement_score?: number;
  is_vip?: boolean;
  email_status?: string;
  profile_image_url?: string;
  linkedin_member_id?: string;
  linkedin_headline?: string;
}

export type UpdateContactInput = Partial<CreateContactInput>;

export interface ContactListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  // Filters
  status?: string;
  state?: string;
  company_id?: string;
  title?: string;
  department?: string;
  seniority_level?: string;
  email_status?: string;
  is_vip?: boolean;
  engagement_score_min?: number;
  engagement_score_max?: number;
  created_after?: string;
  created_before?: string;
  search?: string;
  company_size?: string;
  program_id?: string;
}

export interface ContactListResponse {
  data: Contact[];
  meta: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
}
