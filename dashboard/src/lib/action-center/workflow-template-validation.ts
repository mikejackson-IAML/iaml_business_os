/**
 * Workflow Template Validation
 *
 * Zod schemas and validation functions for workflow templates.
 * Used by the event webhook and instantiation logic.
 */

import { z } from 'zod';

/**
 * Condition schema
 */
export const conditionSchema = z.object({
  field: z.string().min(1),
  operator: z.enum(['equals', 'not_equals', 'in', 'not_in', 'exists', 'not_exists']),
  value: z.unknown().optional(),
});

/**
 * Task template schema
 */
export const taskTemplateSchema = z.object({
  order: z.number().int().min(0),
  title: z.string().min(1).max(500),
  description: z.string().max(5000).optional(),
  task_type: z.enum(['standard', 'approval', 'decision', 'review']).default('standard'),
  priority: z.enum(['critical', 'high', 'normal', 'low']).default('normal'),
  days_before_due: z.number().int(),
  sop_template_id: z.string().uuid().optional(),
  depends_on_order: z.array(z.number().int().min(0)).optional(),
  assignee_id: z.string().uuid().optional(),
});

/**
 * Variable mapping schema
 */
export const variableMappingSchema = z.record(z.string(), z.string());

/**
 * Workflow template create schema
 */
export const createWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  trigger_event: z.string().min(1).max(100).regex(/^[a-z_]+\.[a-z_]+$/, {
    message: 'Event must be in entity.action format (e.g., program_instance.created)',
  }),
  trigger_conditions: z.array(conditionSchema).default([]),
  task_templates: z.array(taskTemplateSchema).min(1),
  variable_mapping: variableMappingSchema.default({}),
  target_date_field: z.string().min(1),
  target_date_offset_days: z.number().int().default(0),
  department: z.string().min(1),
  is_active: z.boolean().default(true),
});

/**
 * Workflow template update schema (all optional)
 */
export const updateWorkflowTemplateSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(2000).optional().nullable(),
  trigger_event: z.string().min(1).max(100).regex(/^[a-z_]+\.[a-z_]+$/).optional(),
  trigger_conditions: z.array(conditionSchema).optional(),
  task_templates: z.array(taskTemplateSchema).min(1).optional(),
  variable_mapping: variableMappingSchema.optional(),
  target_date_field: z.string().min(1).optional(),
  target_date_offset_days: z.number().int().optional(),
  department: z.string().min(1).optional(),
  is_active: z.boolean().optional(),
});

/**
 * Event payload schema
 */
export const eventPayloadSchema = z.object({
  event_type: z.string().min(1).max(100),
  entity_id: z.string().min(1).max(100),
  payload: z.record(z.unknown()),
  force: z.boolean().optional().default(false),
  timestamp: z.string().datetime().optional(),
});

export type CreateWorkflowTemplateInput = z.infer<typeof createWorkflowTemplateSchema>;
export type UpdateWorkflowTemplateInput = z.infer<typeof updateWorkflowTemplateSchema>;
export type EventPayloadInput = z.infer<typeof eventPayloadSchema>;

/**
 * Validate that task dependencies reference valid orders
 */
export function validateTaskDependencies(templates: z.infer<typeof taskTemplateSchema>[]): string[] {
  const errors: string[] = [];
  const validOrders = new Set(templates.map(t => t.order));

  for (const template of templates) {
    if (template.depends_on_order) {
      for (const depOrder of template.depends_on_order) {
        if (!validOrders.has(depOrder)) {
          errors.push(`Task ${template.order} depends on non-existent task order ${depOrder}`);
        }
        if (depOrder >= template.order) {
          errors.push(`Task ${template.order} depends on task ${depOrder} which is not before it`);
        }
      }
    }
  }

  // Check for duplicate orders
  const orders = templates.map(t => t.order);
  const uniqueOrders = new Set(orders);
  if (uniqueOrders.size !== orders.length) {
    errors.push('Duplicate task order values found');
  }

  return errors;
}

/**
 * Validate that all variables in templates have mappings
 */
export function validateVariableUsage(
  templates: z.infer<typeof taskTemplateSchema>[],
  mapping: Record<string, string>
): string[] {
  const errors: string[] = [];
  const varPattern = /\$\{([^}]+)\}/g;

  for (const template of templates) {
    // Check title
    let match;
    while ((match = varPattern.exec(template.title)) !== null) {
      if (!mapping[match[1]]) {
        errors.push(`Variable ${match[1]} in task ${template.order} title has no mapping`);
      }
    }

    // Check description
    if (template.description) {
      while ((match = varPattern.exec(template.description)) !== null) {
        if (!mapping[match[1]]) {
          errors.push(`Variable ${match[1]} in task ${template.order} description has no mapping`);
        }
      }
    }
  }

  return errors;
}

/**
 * Full workflow template validation
 */
export function validateWorkflowTemplate(
  input: CreateWorkflowTemplateInput
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // Validate task dependencies
  errors.push(...validateTaskDependencies(input.task_templates));

  // Validate variable usage
  errors.push(...validateVariableUsage(input.task_templates, input.variable_mapping));

  return {
    valid: errors.length === 0,
    errors,
  };
}
