// Task Rule API - Database mutation functions
// Write operations for action_center.task_rules

import { getServerClient } from '@/lib/supabase/server';
import type { TaskRule, CreateTaskRuleRequest, UpdateTaskRuleRequest } from './task-rule-types';
import { getTaskRuleById } from './task-rule-queries';

// ==================== Create Task Rule ====================

export async function createTaskRule(
  data: CreateTaskRuleRequest,
  createdBy: string | null = null
): Promise<TaskRule> {
  const supabase = getServerClient();

  const insertData = {
    name: data.name,
    description: data.description || null,
    rule_type: data.rule_type,
    schedule_type: data.schedule_type || null,
    schedule_config: data.schedule_config || null,
    trigger_event: data.trigger_event || null,
    trigger_conditions: data.trigger_conditions || null,
    condition_query: data.condition_query || null,
    task_template: data.task_template,
    due_date_field: data.due_date_field || null,
    due_date_offset_days: data.due_date_offset_days ?? 0,
    dedupe_key_template: data.dedupe_key_template || null,
    is_enabled: data.is_enabled ?? false, // Default to disabled
    run_count: 0,
    created_by: createdBy,
    updated_by: createdBy,
  };

  const { data: result, error } = await supabase
    .from('task_rules')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating task rule:', error);
    throw new Error('Failed to create task rule');
  }

  const rule = await getTaskRuleById(result.id);
  if (!rule) {
    throw new Error('Task rule created but not found');
  }

  return rule;
}

// ==================== Update Task Rule ====================

export async function updateTaskRule(
  id: string,
  data: UpdateTaskRuleRequest,
  updatedBy: string | null = null
): Promise<TaskRule> {
  const supabase = getServerClient();

  // Verify rule exists
  const currentRule = await getTaskRuleById(id);
  if (!currentRule) {
    throw new Error('RULE_NOT_FOUND');
  }

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {
    updated_by: updatedBy,
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.schedule_type !== undefined) updateData.schedule_type = data.schedule_type;
  if (data.schedule_config !== undefined) updateData.schedule_config = data.schedule_config;
  if (data.trigger_event !== undefined) updateData.trigger_event = data.trigger_event;
  if (data.trigger_conditions !== undefined) updateData.trigger_conditions = data.trigger_conditions;
  if (data.condition_query !== undefined) updateData.condition_query = data.condition_query;
  if (data.task_template !== undefined) updateData.task_template = data.task_template;
  if (data.due_date_field !== undefined) updateData.due_date_field = data.due_date_field;
  if (data.due_date_offset_days !== undefined) updateData.due_date_offset_days = data.due_date_offset_days;
  if (data.dedupe_key_template !== undefined) updateData.dedupe_key_template = data.dedupe_key_template;
  if (data.is_enabled !== undefined) updateData.is_enabled = data.is_enabled;

  const { error } = await supabase
    .from('task_rules')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating task rule:', error);
    throw new Error('Failed to update task rule');
  }

  const rule = await getTaskRuleById(id);
  if (!rule) {
    throw new Error('Task rule not found after update');
  }

  return rule;
}

// ==================== Record Rule Run ====================
// Called after a rule executes to track its history

export async function recordRuleRun(
  id: string,
  result: 'success' | 'error' | 'no_matches',
  details?: string
): Promise<void> {
  const supabase = getServerClient();

  const currentRule = await getTaskRuleById(id);
  if (!currentRule) {
    return; // Rule doesn't exist, nothing to update
  }

  const { error } = await supabase
    .from('task_rules')
    .update({
      last_run_at: new Date().toISOString(),
      last_run_result: details ? `${result}: ${details}` : result,
      run_count: currentRule.run_count + 1,
    })
    .eq('id', id);

  if (error) {
    console.error('Error recording rule run:', error);
    // Don't throw - this is a non-critical operation
  }
}

// ==================== Enable/Disable Rule ====================
// Convenience functions for toggling rule state

export async function enableRule(id: string, updatedBy: string | null = null): Promise<TaskRule> {
  return updateTaskRule(id, { is_enabled: true }, updatedBy);
}

export async function disableRule(id: string, updatedBy: string | null = null): Promise<TaskRule> {
  return updateTaskRule(id, { is_enabled: false }, updatedBy);
}
