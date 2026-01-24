// SOP API - Type definitions
// Types for action_center.sop_templates and related operations

// ==================== Step Types ====================

export interface SOPStep {
  order: number;
  title: string;
  description: string | null;
  estimated_minutes: number | null;
  links: string[];
  notes: string | null;
}

// ==================== Core Entities ====================

export interface SOPTemplate {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  department: string | null;
  steps: SOPStep[];
  version: number;
  is_active: boolean;
  times_used: number;
  last_used_at: string | null;
  variables: Record<string, { description: string; example: string }>;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Extended SOP with computed fields for list views
export interface SOPTemplateExtended extends SOPTemplate {
  steps_count: number;
}

// ==================== API Request/Response Types ====================

export interface SOPListFilters {
  category?: string;
  department?: string;
  is_active?: boolean;
  search?: string;
}

export interface SOPListParams extends SOPListFilters {
  cursor?: string;
  limit?: number;
  sort_by?: 'created_at' | 'name' | 'times_used';
  sort_order?: 'asc' | 'desc';
}

export interface SOPListResponse {
  data: SOPTemplateExtended[];
  meta: {
    cursor: string | null;
    has_more: boolean;
  };
}

export interface CreateSOPRequest {
  name: string;
  description?: string;
  category?: string;
  department?: string;
  steps?: SOPStep[];
  variables?: Record<string, { description: string; example: string }>;
}

export interface UpdateSOPRequest {
  name?: string;
  description?: string;
  category?: string;
  department?: string;
  steps?: SOPStep[];
  is_active?: boolean;
  variables?: Record<string, { description: string; example: string }>;
}

// ==================== Mastery Types ====================

export type MasteryTier = 'novice' | 'developing' | 'proficient' | 'expert';

export interface SOPMastery {
  mastery_level: number;
  mastery_tier: MasteryTier;
}

// ==================== Usage Types ====================

export interface TaskUsingSOP {
  id: string;
  title: string;
  status: string;
}

export interface SOPUsageStats {
  count: number;
  tasks: TaskUsingSOP[];
}
