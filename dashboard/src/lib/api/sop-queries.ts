// SOP API - Database query functions
// Read operations for action_center.sop_templates

import { getServerClient } from '@/lib/supabase/server';
import type {
  SOPTemplate,
  SOPTemplateExtended,
  SOPListParams,
} from './sop-types';

// ==================== List SOPs ====================

export interface ListSOPsResult {
  sops: SOPTemplateExtended[];
  cursor: string | null;
  has_more: boolean;
}

export async function listSOPs(params: SOPListParams): Promise<ListSOPsResult> {
  const supabase = getServerClient();
  const limit = Math.min(params.limit || 20, 100);

  let query = supabase
    .from('sop_templates')
    .select('*');

  // Apply filters
  if (params.category) {
    query = query.eq('category', params.category);
  }

  if (params.department) {
    query = query.eq('department', params.department);
  }

  if (params.is_active !== undefined) {
    query = query.eq('is_active', params.is_active);
  }

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  // Apply cursor pagination
  if (params.cursor) {
    query = query.gt('id', params.cursor);
  }

  // Default sort: name ASC
  const sortBy = params.sort_by || 'name';
  const sortOrder = params.sort_order || 'asc';
  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .order('id', { ascending: true })
    .limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching SOPs:', error);
    throw new Error('Failed to fetch SOPs');
  }

  // Transform to SOPTemplateExtended with computed fields
  const sops: SOPTemplateExtended[] = (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    steps_count: Array.isArray(row.steps) ? (row.steps as unknown[]).length : 0,
  })) as SOPTemplateExtended[];

  const has_more = sops.length > limit;

  // Remove the extra row if present
  if (has_more) {
    sops.pop();
  }

  // Build cursor from last item
  let cursor: string | null = null;
  if (sops.length > 0 && has_more) {
    const lastSOP = sops[sops.length - 1];
    cursor = lastSOP.id;
  }

  return { sops, cursor, has_more };
}

// ==================== Get SOP by ID ====================

export async function getSOPById(id: string): Promise<SOPTemplate | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('sop_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching SOP:', error);
    throw new Error('Failed to fetch SOP');
  }

  return data as SOPTemplate;
}

// ==================== Get SOP Extended by ID ====================

export async function getSOPExtendedById(id: string): Promise<SOPTemplateExtended | null> {
  const sop = await getSOPById(id);
  if (!sop) {
    return null;
  }

  return {
    ...sop,
    steps_count: sop.steps.length,
  };
}
