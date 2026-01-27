// Lead Intelligence - Notes Queries
// Read/write operations for contact and company notes

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getNotesTable() {
  return getServerClient().from('contact_notes') as any;
}

export async function getContactNotes(contactId: string) {
  const { data, error } = await getNotesTable()
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch contact notes: ${error.message}`);
  }

  return data ?? [];
}

export async function createContactNote(contactId: string, noteData: { note_type: string; content: string }) {
  const { data, error } = await getNotesTable()
    .insert({ contact_id: contactId, ...noteData } as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contact note: ${error.message}`);
  }

  return data;
}

export async function getCompanyNotes(companyId: string) {
  const { data, error } = await getNotesTable()
    .select('*')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch company notes: ${error.message}`);
  }

  return data ?? [];
}

export async function createCompanyNote(companyId: string, noteData: { note_type: string; content: string }) {
  const { data, error } = await getNotesTable()
    .insert({ company_id: companyId, ...noteData } as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create company note: ${error.message}`);
  }

  return data;
}
