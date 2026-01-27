// Lead Intelligence - Contacts Queries
// Read operations for contact data

import { getServerClient } from '@/lib/supabase/server';
import type { Contact, ContactListParams, ContactListResponse } from './lead-intelligence-contacts-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getContactsTable() {
  return getServerClient().from('contacts') as any;
}

// Map company_size bucket string to employee_count range
// Allowed sort columns — prevents invalid column names from reaching Supabase
const ALLOWED_SORT_COLUMNS = new Set([
  'created_at',
  'updated_at',
  'last_name',
  'first_name',
  'title',
  'status',
  'last_activity_at',
  'engagement_score',
  'email',
  'city',
  'state',
]);

const COMPANY_SIZE_BUCKETS: Record<string, [number, number | null]> = {
  '1-10': [1, 10],
  '11-50': [11, 50],
  '51-200': [51, 200],
  '201-500': [201, 500],
  '500+': [501, null],
};

export async function getContacts(params: ContactListParams): Promise<ContactListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const sort = (params.sort && ALLOWED_SORT_COLUMNS.has(params.sort)) ? params.sort : 'created_at';
  const order = params.order ?? 'desc';
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  // If program_id filter, get matching contact IDs first
  let programContactIds: string[] | null = null;
  if (params.program_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: attendanceData } = await (getServerClient().from('attendance_records') as any)
      .select('contact_id')
      .eq('program_id', params.program_id);
    programContactIds = (attendanceData ?? []).map((r: { contact_id: string }) => r.contact_id);
    if (programContactIds!.length === 0) {
      return { data: [], meta: { page, limit, total: 0, total_pages: 0 } };
    }
  }

  let query = getContactsTable()
    .select('*, companies(id, name)', { count: 'exact' });

  // Simple eq filters
  if (params.status) query = query.eq('status', params.status);
  if (params.state) query = query.eq('state', params.state);
  if (params.company_id) query = query.eq('company_id', params.company_id);
  if (params.department) query = query.eq('department', params.department);
  if (params.seniority_level) query = query.eq('seniority_level', params.seniority_level);
  if (params.email_status) query = query.eq('email_status', params.email_status);

  // Boolean
  if (params.is_vip !== undefined) query = query.eq('is_vip', params.is_vip);

  // Range filters
  if (params.engagement_score_min !== undefined) query = query.gte('engagement_score', params.engagement_score_min);
  if (params.engagement_score_max !== undefined) query = query.lte('engagement_score', params.engagement_score_max);
  if (params.created_after) query = query.gte('created_at', params.created_after);
  if (params.created_before) query = query.lte('created_at', params.created_before);

  // Text search (ilike)
  if (params.title) query = query.ilike('title', `%${params.title}%`);
  if (params.search) {
    query = query.or(`first_name.ilike.%${params.search}%,last_name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
  }

  // Company size filter — uses the joined companies table
  if (params.company_size && COMPANY_SIZE_BUCKETS[params.company_size]) {
    const [min, max] = COMPANY_SIZE_BUCKETS[params.company_size];
    query = query.gte('companies.employee_count', min);
    if (max !== null) query = query.lte('companies.employee_count', max);
  }

  // Program filter (pre-fetched contact IDs)
  if (programContactIds) {
    query = query.in('id', programContactIds);
  }

  const { data, error, count } = await query
    .order(sort, { ascending: order === 'asc' })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch contacts: ${error.message}`);
  }

  const total = count ?? 0;

  return {
    data: (data ?? []) as Contact[],
    meta: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

export async function getContactById(id: string): Promise<Contact | null> {
  const { data, error } = await getContactsTable()
    .select('*, companies(id, name)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch contact: ${error.message}`);
  }

  return data as Contact;
}
