// Lead Intelligence - Enrichment Merge Utility
// Fill-blanks-only merge strategy with conflict detection

import type { Contact } from '../lead-intelligence-contacts-types';
import type { Company } from '../lead-intelligence-companies-types';

export interface EnrichmentConflict {
  field: string;
  existing: string | number;
  enriched: string | number;
}

export interface MergeResult<T> {
  updates: Partial<T>;
  conflicts: EnrichmentConflict[];
}

const CONTACT_ENRICHMENT_FIELDS = [
  'title',
  'department',
  'phone',
  'linkedin_url',
  'seniority_level',
] as const;

const COMPANY_ENRICHMENT_FIELDS = [
  'industry',
  'employee_count',
  'revenue_range',
  'website',
] as const;

type ContactEnrichmentField = (typeof CONTACT_ENRICHMENT_FIELDS)[number];
type CompanyEnrichmentField = (typeof COMPANY_ENRICHMENT_FIELDS)[number];

function isBlank(value: unknown): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  return false;
}

/**
 * Merge enrichment data into existing contact using fill-blanks-only strategy.
 * - Blank fields: filled with enriched value
 * - Non-blank fields with same value: skipped
 * - Non-blank fields with different value: added to conflicts array
 */
export function mergeContactEnrichment(
  existing: Contact,
  enrichedData: Record<string, unknown>
): MergeResult<Contact> {
  const updates: Partial<Contact> = {};
  const conflicts: EnrichmentConflict[] = [];

  for (const field of CONTACT_ENRICHMENT_FIELDS) {
    const enrichedValue = enrichedData[field];
    if (isBlank(enrichedValue)) continue;

    const existingValue = existing[field as ContactEnrichmentField];

    if (isBlank(existingValue)) {
      // Fill blank
      (updates as Record<string, unknown>)[field] = enrichedValue;
    } else if (String(existingValue) !== String(enrichedValue)) {
      // Conflict: existing differs from enriched
      conflicts.push({
        field,
        existing: existingValue as string | number,
        enriched: enrichedValue as string | number,
      });
    }
    // If same value, skip silently
  }

  return { updates, conflicts };
}

/**
 * Merge enrichment data into existing company using fill-blanks-only strategy.
 */
export function mergeCompanyEnrichment(
  existing: Company,
  enrichedData: Record<string, unknown>
): MergeResult<Company> {
  const updates: Partial<Company> = {};
  const conflicts: EnrichmentConflict[] = [];

  for (const field of COMPANY_ENRICHMENT_FIELDS) {
    const enrichedValue = enrichedData[field];
    if (isBlank(enrichedValue)) continue;

    const existingValue = existing[field as CompanyEnrichmentField];

    if (isBlank(existingValue)) {
      (updates as Record<string, unknown>)[field] = enrichedValue;
    } else if (String(existingValue) !== String(enrichedValue)) {
      conflicts.push({
        field,
        existing: existingValue as string | number,
        enriched: enrichedValue as string | number,
      });
    }
  }

  return { updates, conflicts };
}
