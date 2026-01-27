// Lead Intelligence - AI Types
// Type definitions for AI search parsing and summary generation

import type { ContactListParams } from './lead-intelligence-contacts-types';

/** Result from AI search query parsing */
export interface AISearchResult {
  filters: Partial<ContactListParams>;
  error?: string;
  suggestion?: string;
}

/** Request body for parse-search endpoint */
export interface AISearchRequest {
  query: string;
}

/** A section within an AI-generated contact summary */
export interface AISummarySection {
  title: string;
  content: string;
}

/** Full AI-generated contact summary */
export interface AISummary {
  headline: string;
  sections: AISummarySection[];
}

/** Response from generate-summary endpoint */
export interface AISummaryResponse {
  summary: AISummary;
  generated_at: string;
  cached: boolean;
}

/** Filter pill for frontend rendering of AI-parsed filters */
export interface FilterPill {
  key: string;
  label: string;
  value: string;
  displayValue: string;
}
