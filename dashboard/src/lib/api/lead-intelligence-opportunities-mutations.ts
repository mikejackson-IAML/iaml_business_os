// Lead Intelligence - Opportunities Mutations
// Write operations for opportunity data

import { getServerClient } from '@/lib/supabase/server';
import type { Opportunity, CreateOpportunityInput, UpdateOpportunityInput, OpportunityContact, OpportunityAttachment } from './lead-intelligence-opportunities-types';

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

export async function createOpportunity(input: CreateOpportunityInput): Promise<Opportunity> {
  const payload = {
    ...input,
    stage: input.stage ?? 'inquiry',
  };

  const { data, error } = await getOpportunitiesTable()
    .insert(payload as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create opportunity: ${error.message}`);
  }

  return data as Opportunity;
}

export async function updateOpportunity(id: string, input: UpdateOpportunityInput): Promise<Opportunity | null> {
  const payload = {
    ...input,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await getOpportunitiesTable()
    .update(payload as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to update opportunity: ${error.message}`);
  }

  return data as Opportunity;
}

export async function deleteOpportunity(id: string): Promise<boolean> {
  const { error } = await getOpportunitiesTable()
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete opportunity: ${error.message}`);
  }

  return true;
}

export async function advanceStage(id: string, _type: string, newStage: string): Promise<Opportunity | null> {
  const { data, error } = await getOpportunitiesTable()
    .update({ stage: newStage, updated_at: new Date().toISOString() } as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to advance stage: ${error.message}`);
  }

  return data as Opportunity;
}

export async function addOpportunityContact(opportunityId: string, contactId: string, role: string): Promise<OpportunityContact> {
  const { data, error } = await getOpportunityContactsTable()
    .insert({ opportunity_id: opportunityId, contact_id: contactId, role } as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add opportunity contact: ${error.message}`);
  }

  return data as OpportunityContact;
}

export async function removeOpportunityContact(opportunityId: string, contactId: string): Promise<boolean> {
  const { error } = await getOpportunityContactsTable()
    .delete()
    .eq('opportunity_id', opportunityId)
    .eq('contact_id', contactId);

  if (error) {
    throw new Error(`Failed to remove opportunity contact: ${error.message}`);
  }

  return true;
}

export async function createAttachment(data: {
  opportunity_id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  file_size: number | null;
}): Promise<OpportunityAttachment> {
  const { data: attachment, error } = await getOpportunityAttachmentsTable()
    .insert(data as never)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create attachment: ${error.message}`);
  }

  return attachment as OpportunityAttachment;
}

export async function deleteAttachment(id: string): Promise<boolean> {
  const { error } = await getOpportunityAttachmentsTable()
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete attachment: ${error.message}`);
  }

  return true;
}
