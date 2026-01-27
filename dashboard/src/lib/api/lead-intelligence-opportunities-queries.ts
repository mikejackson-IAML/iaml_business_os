// Lead Intelligence - Opportunities Queries
// Read operations for opportunity data

import { getServerClient } from '@/lib/supabase/server';
import type { Opportunity, OpportunityContact, OpportunityAttachment, OpportunityListParams, OpportunityListResponse } from './lead-intelligence-opportunities-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOpportunitiesTable() {
  return getServerClient().from('opportunities') as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOpportunityContactsTable() {
  return getServerClient().from('opportunity_contacts') as any;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getOpportunityAttachmentsTable() {
  return getServerClient().from('opportunity_attachments') as any;
}

const ALLOWED_SORT_COLUMNS = new Set([
  'created_at',
  'updated_at',
  'title',
  'type',
  'stage',
  'value',
]);

export async function getOpportunities(params: OpportunityListParams): Promise<OpportunityListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const sort = (params.sort && ALLOWED_SORT_COLUMNS.has(params.sort)) ? params.sort : 'created_at';
  const order = params.order ?? 'desc';
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  let query = getOpportunitiesTable()
    .select('*, companies(id, name), contacts!opportunities_contact_id_fkey(id, first_name, last_name)', { count: 'exact' });

  if (params.type) query = query.eq('type', params.type);
  if (params.stage) query = query.eq('stage', params.stage);
  if (params.company_id) query = query.eq('company_id', params.company_id);
  if (params.search) {
    query = query.ilike('title', `%${params.search}%`);
  }

  const { data, error, count } = await query
    .order(sort, { ascending: order === 'asc' })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch opportunities: ${error.message}`);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as Opportunity[],
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getOpportunityById(id: string): Promise<Opportunity | null> {
  const { data, error } = await getOpportunitiesTable()
    .select('*, companies(id, name), contacts!opportunities_contact_id_fkey(id, first_name, last_name)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch opportunity: ${error.message}`);
  }

  return data as Opportunity;
}

export async function getOpportunityContacts(opportunityId: string): Promise<OpportunityContact[]> {
  const { data, error } = await getOpportunityContactsTable()
    .select('*, contacts(id, first_name, last_name, email, title)')
    .eq('opportunity_id', opportunityId)
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch opportunity contacts: ${error.message}`);
  }

  return (data ?? []) as OpportunityContact[];
}

export async function getOpportunityAttachments(opportunityId: string): Promise<OpportunityAttachment[]> {
  const { data, error } = await getOpportunityAttachmentsTable()
    .select('*')
    .eq('opportunity_id', opportunityId)
    .order('uploaded_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch opportunity attachments: ${error.message}`);
  }

  return (data ?? []) as OpportunityAttachment[];
}
