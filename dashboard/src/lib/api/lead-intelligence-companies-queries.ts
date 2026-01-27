// Lead Intelligence - Companies Queries
// Read operations for lead_intelligence.companies

import { getServerClient } from '@/lib/supabase/server';
import type { Company, CompanyListParams } from './lead-intelligence-companies-types';

// ==================== List Companies ====================

export interface ListCompaniesResult {
  companies: Company[];
  total: number;
}

const VALID_SORT_COLUMNS = ['name', 'industry', 'employee_count', 'city', 'state', 'created_at', 'updated_at'];

export async function getCompanies(params: CompanyListParams): Promise<ListCompaniesResult> {
  const supabase = getServerClient();
  const page = Math.max(params.page || 1, 1);
  const limit = Math.min(Math.max(params.limit || 20, 1), 100);
  const offset = (page - 1) * limit;

  const sortColumn = params.sort && VALID_SORT_COLUMNS.includes(params.sort) ? params.sort : 'created_at';
  const ascending = params.order === 'asc';

  const { data, error, count } = await supabase
    .from('companies')
    .select('*', { count: 'exact' })
    .order(sortColumn, { ascending })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Error fetching companies:', error);
    throw error;
  }

  return {
    companies: (data || []) as Company[],
    total: count || 0,
  };
}

// ==================== Get Company By ID ====================

export async function getCompanyById(id: string): Promise<Company | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching company:', error);
    throw error;
  }

  return data as Company;
}
