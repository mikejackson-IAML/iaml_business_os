// Lead Intelligence - Companies Mutations
// Write operations for lead_intelligence.companies

import { getServerClient } from '@/lib/supabase/server';
import type { Company, CreateCompanyInput, UpdateCompanyInput } from './lead-intelligence-companies-types';

// ==================== Create Company ====================

export async function createCompany(input: CreateCompanyInput): Promise<Company> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('companies')
    .insert(input as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating company:', error);
    throw error;
  }

  return data as Company;
}

// ==================== Update Company ====================

export async function updateCompany(id: string, input: UpdateCompanyInput): Promise<Company> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('companies')
    .update(input as never)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating company:', error);
    throw error;
  }

  return data as Company;
}

// ==================== Delete Company ====================

export async function deleteCompany(id: string): Promise<boolean> {
  const supabase = getServerClient();

  const { error } = await supabase
    .from('companies')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting company:', error);
    throw error;
  }

  return true;
}
