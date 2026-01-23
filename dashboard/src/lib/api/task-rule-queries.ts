// Task Rule API - Database query functions
// Read operations for action_center.task_rules

import { getServerClient } from '@/lib/supabase/server';
import type { TaskRule, TaskRuleListParams } from './task-rule-types';

// ==================== List Task Rules ====================

export interface ListTaskRulesResult {
  rules: TaskRule[];
  cursor: string | null;
  has_more: boolean;
}

export async function listTaskRules(params: TaskRuleListParams): Promise<ListTaskRulesResult> {
  const supabase = getServerClient();
  const limit = Math.min(params.limit || 20, 100);

  let query = supabase
    .from('task_rules')
    .select('*');

  // Apply filters
  if (params.rule_type) {
    query = query.eq('rule_type', params.rule_type);
  }

  if (params.is_enabled !== undefined) {
    query = query.eq('is_enabled', params.is_enabled);
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
    .order(sortBy, { ascending: sortOrder === 'asc', nullsFirst: false })
    .order('id', { ascending: true })
    .limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching task rules:', error);
    throw new Error('Failed to fetch task rules');
  }

  const rules = (data || []) as TaskRule[];
  const has_more = rules.length > limit;

  // Remove the extra row if present
  if (has_more) {
    rules.pop();
  }

  // Build cursor from last item
  let cursor: string | null = null;
  if (rules.length > 0 && has_more) {
    const lastRule = rules[rules.length - 1];
    cursor = lastRule.id;
  }

  return { rules, cursor, has_more };
}

// ==================== Get Task Rule by ID ====================

export async function getTaskRuleById(id: string): Promise<TaskRule | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('task_rules')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching task rule:', error);
    throw new Error('Failed to fetch task rule');
  }

  return data as TaskRule;
}

// ==================== Get Enabled Rules by Type ====================
// Used by n8n workflows to fetch rules to execute

export async function getEnabledRulesByType(
  ruleType: 'recurring' | 'event' | 'condition'
): Promise<TaskRule[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('task_rules')
    .select('*')
    .eq('rule_type', ruleType)
    .eq('is_enabled', true);

  if (error) {
    console.error('Error fetching enabled rules:', error);
    throw new Error('Failed to fetch enabled rules');
  }

  return (data || []) as TaskRule[];
}

// ==================== Get Rules by Trigger Event ====================
// Used when an event fires to find matching rules

export async function getRulesByTriggerEvent(triggerEvent: string): Promise<TaskRule[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('task_rules')
    .select('*')
    .eq('rule_type', 'event')
    .eq('trigger_event', triggerEvent)
    .eq('is_enabled', true);

  if (error) {
    console.error('Error fetching rules by trigger:', error);
    throw new Error('Failed to fetch rules by trigger');
  }

  return (data || []) as TaskRule[];
}
