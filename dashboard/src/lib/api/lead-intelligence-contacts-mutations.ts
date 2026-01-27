// Lead Intelligence - Contacts Mutations
// Write operations for contact data

import { getServerClient } from '@/lib/supabase/server';
import type { Contact, CreateContactInput, UpdateContactInput } from './lead-intelligence-contacts-types';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getContactsTable() {
  return getServerClient().from('contacts') as any;
}

export async function createContact(input: CreateContactInput): Promise<Contact> {
  const { data, error } = await getContactsTable()
    .insert(input)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create contact: ${error.message}`);
  }

  return data as Contact;
}

export async function updateContact(id: string, input: UpdateContactInput): Promise<Contact | null> {
  const { data, error } = await getContactsTable()
    .update(input)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to update contact: ${error.message}`);
  }

  return data as Contact;
}

export async function deleteContact(id: string): Promise<boolean> {
  const { error } = await getContactsTable()
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete contact: ${error.message}`);
  }

  return true;
}
