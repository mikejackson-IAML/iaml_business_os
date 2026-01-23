// SOP API - Database mutation functions
// Write operations for action_center.sop_templates

import { getServerClient } from '@/lib/supabase/server';
import type {
  SOPTemplate,
  CreateSOPRequest,
  UpdateSOPRequest,
} from './sop-types';
import { getSOPById } from './sop-queries';

// ==================== Create SOP ====================

export async function createSOP(
  data: CreateSOPRequest,
  createdBy: string | null = null
): Promise<SOPTemplate> {
  const supabase = getServerClient();

  const insertData = {
    name: data.name,
    description: data.description || null,
    category: data.category || null,
    department: data.department || null,
    steps: data.steps || [],
    version: 1,
    is_active: true,
    times_used: 0,
    variables: data.variables || {},
    created_by: createdBy,
    updated_by: createdBy,
  };

  const { data: result, error } = await supabase
    .from('sop_templates')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating SOP:', error);
    throw new Error('Failed to create SOP');
  }

  const sop = await getSOPById(result.id);
  if (!sop) {
    throw new Error('SOP created but not found');
  }

  return sop;
}

// ==================== Update SOP ====================

export async function updateSOP(
  id: string,
  data: UpdateSOPRequest,
  updatedBy: string | null = null
): Promise<SOPTemplate> {
  const supabase = getServerClient();

  // Get current SOP to increment version
  const currentSOP = await getSOPById(id);
  if (!currentSOP) {
    throw new Error('SOP_NOT_FOUND');
  }

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {
    updated_by: updatedBy,
    version: currentSOP.version + 1, // Always increment version on update
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.category !== undefined) updateData.category = data.category;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.steps !== undefined) updateData.steps = data.steps;
  if (data.is_active !== undefined) updateData.is_active = data.is_active;
  if (data.variables !== undefined) updateData.variables = data.variables;

  const { error } = await supabase
    .from('sop_templates')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating SOP:', error);
    throw new Error('Failed to update SOP');
  }

  const sop = await getSOPById(id);
  if (!sop) {
    throw new Error('SOP not found after update');
  }

  return sop;
}

// ==================== Increment SOP Usage ====================
// Called when a task is completed that references this SOP

export async function incrementSOPUsage(id: string): Promise<void> {
  const supabase = getServerClient();

  const { error } = await supabase
    .rpc('increment_sop_usage', { sop_id: id });

  // If RPC doesn't exist, fall back to manual update
  if (error && error.code === 'PGRST202') {
    const currentSOP = await getSOPById(id);
    if (currentSOP) {
      await supabase
        .from('sop_templates')
        .update({
          times_used: currentSOP.times_used + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq('id', id);
    }
  } else if (error) {
    console.error('Error incrementing SOP usage:', error);
    // Don't throw - this is a non-critical operation
  }
}
