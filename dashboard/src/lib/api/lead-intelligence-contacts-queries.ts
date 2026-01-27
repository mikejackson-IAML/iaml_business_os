// Lead Intelligence - Contacts Queries
// Read operations for contact data

import { getServerClient } from '@/lib/supabase/server';
import type { Contact, ContactListParams, ContactListResponse } from './lead-intelligence-contacts-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getContactsTable() {
  return getServerClient().from('contacts') as any;
}

export async function getContacts(params: ContactListParams): Promise<ContactListResponse> {
  const page = params.page ?? 1;
  const limit = params.limit ?? 25;
  const sort = params.sort ?? 'created_at';
  const order = params.order ?? 'desc';
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await getContactsTable()
    .select('*, companies(id, name)', { count: 'exact' })
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
