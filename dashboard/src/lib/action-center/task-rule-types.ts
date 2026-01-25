import { z } from 'zod';

/**
 * Rule types
 */
export type RuleType = 'recurring' | 'event' | 'condition';

/**
 * Task template within a rule (what task to create)
 */
export interface RuleTaskTemplate {
  title: string;              // May contain ${variables}
  description?: string;       // May contain ${variables}
  task_type: 'standard' | 'approval' | 'decision' | 'review';
  priority: 'critical' | 'high' | 'normal' | 'low';
  department: string;
  due_date_offset_days?: number;  // Days from now (for recurring) or from reference (for event)
  due_date_reference?: string;    // Payload path for event rules
  sop_template_id?: string;
  assignee_id?: string;
}

/**
 * Task rule definition
 */
export interface TaskRule {
  id: string;
  name: string;
  description?: string;

  rule_type: RuleType;

  // For recurring rules
  schedule?: string;              // Cron expression

  // For event rules
  trigger_event?: string;         // e.g., "payment.failed"
  trigger_conditions?: Array<{
    field: string;
    operator: string;
    value?: unknown;
  }>;

  // For condition rules
  condition_query?: string;       // SQL query that returns rows to process

  // Task creation
  task_template: RuleTaskTemplate;
  variable_mapping?: Record<string, string>;
  dedupe_key_template?: string;   // e.g., "{rule_id}:{entity_id}" or "{rule_id}:{date}"

  // Status
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Result of rule execution
 */
export interface RuleExecutionResult {
  success: boolean;
  task_id?: string;
  skipped_reason?: 'duplicate' | 'condition_failed' | 'error';
  error?: string;
}

/**
 * Zod schema for task template in rules
 */
export const ruleTaskTemplateSchema = z.object({
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  task_type: z.enum(['standard', 'approval', 'decision', 'review']).default('standard'),
  priority: z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
  department: z.string().min(1),
  due_date_offset_days: z.number().int().optional(),
  due_date_reference: z.string().optional(),
  sop_template_id: z.string().uuid().optional(),
  assignee_id: z.string().uuid().optional(),
});

/**
 * Zod schema for creating a task rule
 */
export const createTaskRuleSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  rule_type: z.enum(['recurring', 'event', 'condition']),
  schedule: z.string().optional(),
  trigger_event: z.string().optional(),
  trigger_conditions: z.array(z.object({
    field: z.string(),
    operator: z.enum(['equals', 'not_equals', 'in', 'not_in', 'exists', 'not_exists']),
    value: z.unknown().optional(),
  })).optional(),
  condition_query: z.string().optional(),
  task_template: ruleTaskTemplateSchema,
  variable_mapping: z.record(z.string()).optional(),
  dedupe_key_template: z.string().optional(),
  is_active: z.boolean().default(true),
}).refine(
  (data) => {
    // Recurring rules need schedule
    if (data.rule_type === 'recurring' && !data.schedule) {
      return false;
    }
    // Event rules need trigger_event
    if (data.rule_type === 'event' && !data.trigger_event) {
      return false;
    }
    // Condition rules need condition_query
    if (data.rule_type === 'condition' && !data.condition_query) {
      return false;
    }
    return true;
  },
  { message: 'Rule type requires corresponding configuration field' }
);

export type CreateTaskRuleInput = z.infer<typeof createTaskRuleSchema>;
