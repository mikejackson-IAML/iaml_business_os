// Apollo Enrichment API Integration
// Handles person and company enrichment via Apollo.io API
// Rate limit: 600 requests/hour

import { getServerClient } from '@/lib/supabase/server';

// ============================================
// Types
// ============================================

export interface ApolloPersonMatch {
  id: string;
  first_name: string;
  last_name: string;
  name: string;
  title: string;
  headline: string;
  email: string;
  email_status: 'verified' | 'unverified' | 'guessed' | 'unavailable';
  linkedin_url: string | null;
  photo_url: string | null;
  phone_numbers?: Array<{
    raw_number: string;
    sanitized_number: string;
    type: string;
  }>;
  organization?: ApolloOrganization;
}

export interface ApolloOrganization {
  id: string;
  name: string;
  website_url: string | null;
  linkedin_url: string | null;
  industry: string | null;
  estimated_num_employees: number | null;
  annual_revenue: number | null;
  total_funding: number | null;
  founded_year: number | null;
  keywords: string[];
  technologies: string[];
}

export interface EnrichmentResult {
  success: boolean;
  person: ApolloPersonMatch | null;
  organization: ApolloOrganization | null;
  error?: string;
  creditsUsed?: number;
}

// ============================================
// Apollo API Functions
// ============================================

const APOLLO_API_BASE = 'https://api.apollo.io/api/v1';

/**
 * Enrich a contact using Apollo's people/match endpoint
 * @param email - Email address to enrich
 * @param firstName - Optional first name for better matching
 * @param lastName - Optional last name for better matching
 * @param domain - Optional company domain for better matching
 */
export async function enrichContactWithApollo(
  email: string,
  firstName?: string,
  lastName?: string,
  domain?: string
): Promise<EnrichmentResult> {
  const apiKey = process.env.APOLLO_API_KEY;

  if (!apiKey) {
    return {
      success: false,
      person: null,
      organization: null,
      error: 'Apollo API key not configured',
    };
  }

  try {
    const response = await fetch(`${APOLLO_API_BASE}/people/match`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': apiKey,
        'Cache-Control': 'no-cache',
      },
      body: JSON.stringify({
        email,
        first_name: firstName,
        last_name: lastName,
        domain,
        reveal_personal_emails: false,
        reveal_phone_number: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return {
          success: false,
          person: null,
          organization: null,
          error: 'Rate limit exceeded. Try again later.',
        };
      }
      return {
        success: false,
        person: null,
        organization: null,
        error: `Apollo API error: ${response.status}`,
      };
    }

    const data = await response.json();

    if (!data.person) {
      return {
        success: true,
        person: null,
        organization: null,
        error: 'No match found',
      };
    }

    return {
      success: true,
      person: data.person as ApolloPersonMatch,
      organization: data.person.organization as ApolloOrganization | null,
      creditsUsed: 1,
    };
  } catch (error) {
    console.error('Apollo enrichment error:', error);
    return {
      success: false,
      person: null,
      organization: null,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================
// Database Storage Functions
// ============================================

/**
 * Save enrichment results to contacts and companies tables
 */
export async function saveEnrichmentResults(
  email: string,
  result: EnrichmentResult
): Promise<{ contactId: string | null; companyId: string | null }> {
  if (!result.success || !result.person) {
    return { contactId: null, companyId: null };
  }

  const supabase = getServerClient();
  let companyId: string | null = null;

  // Save company first if we have organization data
  if (result.organization) {
    const { data: companyData, error: companyError } = await supabase
      .from('companies')
      .upsert(
        {
          name: result.organization.name,
          domain: result.organization.website_url?.replace(/^https?:\/\//, '').replace(/\/$/, ''),
          industry: result.organization.industry,
          employee_count: result.organization.estimated_num_employees,
          linkedin_url: result.organization.linkedin_url,
          apollo_org_id: result.organization.id,
          apollo_enriched_at: new Date().toISOString(),
          technologies: result.organization.technologies || [],
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'domain',
          ignoreDuplicates: false,
        }
      )
      .select('id')
      .single();

    if (!companyError && companyData) {
      companyId = companyData.id;
    }
  }

  // Save contact
  const phone = result.person.phone_numbers?.[0]?.sanitized_number || null;

  const { data: contactData, error: contactError } = await supabase
    .from('contacts')
    .upsert(
      {
        email: email.toLowerCase(),
        first_name: result.person.first_name,
        last_name: result.person.last_name,
        title: result.person.title,
        company: result.organization?.name || null,
        company_id: companyId,
        phone,
        linkedin_url: result.person.linkedin_url,
        photo_url: result.person.photo_url,
        email_status: result.person.email_status,
        apollo_person_id: result.person.id,
        apollo_enriched_at: new Date().toISOString(),
        apollo_enrichment_data: {
          headline: result.person.headline,
          email_status: result.person.email_status,
          organization_id: result.organization?.id,
          enriched_at: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'email',
        ignoreDuplicates: false,
      }
    )
    .select('id')
    .single();

  return {
    contactId: contactError ? null : contactData?.id || null,
    companyId,
  };
}

/**
 * Check if a contact has been enriched recently
 * @param email - Email to check
 * @param maxAgeHours - Max age of enrichment in hours (default 24)
 */
export async function isRecentlyEnriched(
  email: string,
  maxAgeHours: number = 24
): Promise<boolean> {
  const supabase = getServerClient();

  const cutoff = new Date();
  cutoff.setHours(cutoff.getHours() - maxAgeHours);

  const { data } = await supabase
    .from('contacts')
    .select('apollo_enriched_at')
    .eq('email', email.toLowerCase())
    .gt('apollo_enriched_at', cutoff.toISOString())
    .single();

  return !!data;
}
