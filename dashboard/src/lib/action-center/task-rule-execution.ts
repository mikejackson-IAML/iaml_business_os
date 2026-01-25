import { SupabaseClient } from '@supabase/supabase-js';
import { addDays } from 'date-fns';
import {
  substituteVariables,
  calculateDueDate,
  taskRuleDedupeKey,
  generateDedupeKey,
} from './template-utils';
import { TaskRule, RuleExecutionResult } from './task-rule-types';

/**
 * Check if a task with this dedupe key exists
 */
async function checkDuplicate(
  supabase: SupabaseClient,
  dedupeKey: string
): Promise<boolean> {
  const { data } = await supabase
    .from('tasks')
    .select('id')
    .eq('dedupe_key', dedupeKey)
    .limit(1)
    .single();

  return !!data;
}

/**
 * Execute a task rule to create a task
 *
 * @param supabase - Supabase client
 * @param rule - The task rule to execute
 * @param entityId - Entity ID (for event rules) or null (for recurring/condition)
 * @param payload - Data for variable substitution
 * @param force - Bypass deduplication
 */
export async function executeTaskRule(
  supabase: SupabaseClient,
  rule: TaskRule,
  entityId: string | null,
  payload: Record<string, unknown>,
  force: boolean = false
): Promise<RuleExecutionResult> {
  try {
    const template = rule.task_template;
    const variableMapping = rule.variable_mapping || {};

    // Generate dedupe key
    let dedupeKey: string;
    if (rule.dedupe_key_template) {
      dedupeKey = generateDedupeKey(rule.dedupe_key_template, {
        rule_id: rule.id,
        entity_id: entityId || '',
        date: new Date().toISOString().split('T')[0],
      });
    } else {
      dedupeKey = taskRuleDedupeKey(
        rule.id,
        entityId || undefined,
        rule.rule_type === 'recurring' ? new Date().toISOString().split('T')[0] : undefined
      );
    }

    // Check for duplicate
    if (!force) {
      const isDuplicate = await checkDuplicate(supabase, dedupeKey);
      if (isDuplicate) {
        return {
          success: false,
          skipped_reason: 'duplicate',
        };
      }
    }

    // Substitute variables in title and description
    const taskTitle = substituteVariables(template.title, variableMapping, payload);
    const taskDescription = template.description
      ? substituteVariables(template.description, variableMapping, payload)
      : null;

    // Calculate due date
    let dueDate: string;
    if (template.due_date_reference) {
      // Event rule: calculate from payload reference
      const calculated = calculateDueDate(
        {
          reference: template.due_date_reference,
          offset_days: template.due_date_offset_days || 0,
        },
        payload
      );
      dueDate = calculated || addDays(new Date(), 7).toISOString(); // Fallback to 7 days
    } else if (template.due_date_offset_days !== undefined) {
      // Recurring rule: offset from today
      dueDate = addDays(new Date(), template.due_date_offset_days).toISOString();
    } else {
      // Default: 7 days from now
      dueDate = addDays(new Date(), 7).toISOString();
    }

    // Extract entity type from event if available
    const entityType = rule.trigger_event
      ? rule.trigger_event.split('.')[0]
      : null;

    // Create the task
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert({
        title: taskTitle,
        description: taskDescription,
        task_type: template.task_type,
        status: 'open',
        priority: template.priority,
        due_date: dueDate,
        department: template.department,
        sop_template_id: template.sop_template_id || null,
        entity_type: entityType,
        entity_id: entityId,
        source: 'rule',
        source_id: rule.id,
        dedupe_key: dedupeKey,
        assignee_id: template.assignee_id || null,
      })
      .select('id')
      .single();

    if (taskError || !task) {
      return {
        success: false,
        skipped_reason: 'error',
        error: `Failed to create task: ${taskError?.message}`,
      };
    }

    return {
      success: true,
      task_id: task.id,
    };
  } catch (error) {
    console.error('Error in executeTaskRule:', error);
    return {
      success: false,
      skipped_reason: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Execute a recurring rule (called by n8n on schedule)
 */
export async function executeRecurringRule(
  supabase: SupabaseClient,
  rule: TaskRule,
  force: boolean = false
): Promise<RuleExecutionResult> {
  // For recurring rules, payload contains date information
  const payload = {
    date: new Date().toISOString(),
    date_formatted: new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
  };

  return executeTaskRule(supabase, rule, null, payload, force);
}

/**
 * Execute a condition rule for a single row result
 */
export async function executeConditionRule(
  supabase: SupabaseClient,
  rule: TaskRule,
  row: Record<string, unknown>,
  force: boolean = false
): Promise<RuleExecutionResult> {
  // Extract entity_id from row if present
  const entityId = (row.id || row.entity_id || null) as string | null;

  // Row becomes the payload for variable substitution
  const payload = { ...row };

  return executeTaskRule(supabase, rule, entityId, payload, force);
}

/**
 * Dry run - show what task would be created
 */
export interface DryRunRuleResult {
  would_create_task: {
    title: string;
    description: string | null;
    due_date: string;
    priority: string;
    department: string;
    dedupe_key: string;
  };
  validation_errors: string[];
}

export function dryRunTaskRule(
  rule: TaskRule,
  payload: Record<string, unknown>
): DryRunRuleResult {
  const errors: string[] = [];
  const template = rule.task_template;
  const variableMapping = rule.variable_mapping || {};

  const taskTitle = substituteVariables(template.title, variableMapping, payload);
  if (taskTitle.includes('${')) {
    errors.push(`Unresolved variables in title: ${taskTitle}`);
  }

  const taskDescription = template.description
    ? substituteVariables(template.description, variableMapping, payload)
    : null;

  // Calculate due date
  let dueDate: string;
  if (template.due_date_reference) {
    const calculated = calculateDueDate(
      {
        reference: template.due_date_reference,
        offset_days: template.due_date_offset_days || 0,
      },
      payload
    );
    dueDate = calculated || 'UNKNOWN';
    if (!calculated) {
      errors.push(`Could not calculate due date from ${template.due_date_reference}`);
    }
  } else {
    dueDate = addDays(new Date(), template.due_date_offset_days || 7).toISOString();
  }

  // Generate dedupe key
  const dedupeKey = rule.dedupe_key_template
    ? generateDedupeKey(rule.dedupe_key_template, {
        rule_id: rule.id,
        entity_id: (payload.id || payload.entity_id || '') as string,
        date: new Date().toISOString().split('T')[0],
      })
    : taskRuleDedupeKey(rule.id);

  return {
    would_create_task: {
      title: taskTitle,
      description: taskDescription,
      due_date: dueDate,
      priority: template.priority,
      department: template.department,
      dedupe_key: dedupeKey,
    },
    validation_errors: errors,
  };
}
