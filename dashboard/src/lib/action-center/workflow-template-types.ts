/**
 * Workflow Template Types
 *
 * TypeScript types and interfaces for workflow templates used in the Action Center.
 * These types define how workflows are templated and instantiated from events.
 */

/**
 * Condition operator type
 */
export type ConditionOperator = 'equals' | 'not_equals' | 'in' | 'not_in' | 'exists' | 'not_exists';

/**
 * Single condition definition for trigger matching
 */
export interface Condition {
  field: string;      // "payload.program_type" or "program_type"
  operator: ConditionOperator;
  value?: unknown;    // Not needed for exists/not_exists
}

/**
 * Variable mapping: local variable name -> payload path
 * @example { "program_name": "payload.program.name", "date": "payload.start_date" }
 */
export type VariableMapping = Record<string, string>;

/**
 * Due date configuration for workflow target date calculation
 */
export interface DueDateConfig {
  reference: string;      // Payload path to reference date, e.g., "payload.program_date"
  offset_days: number;    // Days to add (negative = before, positive = after)
}

/**
 * Task template within a workflow template
 * Defines a task to be created when the workflow is instantiated
 */
export interface TaskTemplate {
  order: number;                    // 0-indexed position in workflow
  title: string;                    // May contain ${variables}
  description?: string;             // May contain ${variables}
  task_type: 'standard' | 'approval' | 'decision' | 'review';
  priority: 'critical' | 'high' | 'normal' | 'low';
  days_before_due: number;          // Days before workflow target date (positive = before)
  sop_template_id?: string;         // Reference to SOP for instructions
  depends_on_order?: number[];      // Orders of tasks this depends on
  assignee_id?: string;             // Optional specific assignee
}

/**
 * Workflow template definition
 */
export interface WorkflowTemplate {
  id: string;
  name: string;
  description?: string;

  // Trigger configuration
  trigger_event: string;            // e.g., "program_instance.created"
  trigger_conditions: Condition[];  // All must match (AND logic)

  // Task generation
  task_templates: TaskTemplate[];
  variable_mapping: VariableMapping;

  // Due date calculation
  target_date_field: string;        // Payload path, e.g., "payload.program_date"
  target_date_offset_days: number;  // Offset from reference

  // Assignment
  department: string;

  // Status
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

/**
 * Event payload structure
 */
export interface EventPayload {
  event_type: string;
  entity_id: string;
  payload: Record<string, unknown>;
  force?: boolean;                  // Bypass deduplication
  timestamp?: string;
}

/**
 * Result of workflow template instantiation
 */
export interface InstantiationResult {
  success: boolean;
  workflow_id?: string;
  task_ids?: string[];
  skipped_reason?: 'duplicate' | 'condition_failed' | 'error';
  error?: string;
}
