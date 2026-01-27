// Lead Intelligence - Opportunities Types
// Type definitions for opportunity CRUD API

export interface Opportunity {
  id: string;
  title: string;
  type: 'in_house' | 'individual';
  stage: string;
  company_id: string | null;
  contact_id: string | null;
  value: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  company?: { id: string; name: string } | null;
  contact?: { id: string; first_name: string; last_name: string } | null;
}

export interface OpportunityContact {
  opportunity_id: string;
  contact_id: string;
  role: string;
  created_at: string;
  contact?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string | null;
    title: string | null;
  } | null;
}

export interface OpportunityAttachment {
  id: string;
  opportunity_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
  uploaded_at: string;
}

export interface CreateOpportunityInput {
  title: string;
  type: 'in_house' | 'individual';
  stage?: string;
  company_id?: string;
  contact_id?: string;
  value?: number;
  notes?: string;
}

export type UpdateOpportunityInput = Partial<Omit<CreateOpportunityInput, 'type'>>;

export interface OpportunityListParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  type?: string;
  stage?: string;
  company_id?: string;
  search?: string;
}

export interface OpportunityListResponse {
  data: Opportunity[];
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

// Stage constants
export const IN_HOUSE_STAGES = [
  'inquiry',
  'strategy_session',
  'consultation',
  'proposal_sent',
  'planning',
  'won',
  'lost',
] as const;

export const INDIVIDUAL_STAGES = [
  'inquiry',
  'info_sent',
  'follow_up',
  'registered',
  'lost',
] as const;

export const IN_HOUSE_STAGE_LABELS: Record<string, string> = {
  inquiry: 'Inquiry',
  strategy_session: 'Strategy Session',
  consultation: 'Consultation',
  proposal_sent: 'Proposal Sent',
  planning: 'Planning',
  won: 'Won',
  lost: 'Lost',
};

export const INDIVIDUAL_STAGE_LABELS: Record<string, string> = {
  inquiry: 'Inquiry',
  info_sent: 'Info Sent',
  follow_up: 'Follow Up',
  registered: 'Registered',
  lost: 'Lost',
};

export const CONTACT_ROLES = [
  'decision_maker',
  'influencer',
  'champion',
  'end_user',
  'billing_contact',
] as const;

export const CONTACT_ROLE_LABELS: Record<string, string> = {
  decision_maker: 'Decision Maker',
  influencer: 'Influencer',
  champion: 'Champion',
  end_user: 'End User',
  billing_contact: 'Billing Contact',
};
