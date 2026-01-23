// Task Rule API - Type definitions
// Types for action_center.task_rules and related operations

// ==================== Enums ====================

export type RuleType = 'recurring' | 'event' | 'condition';
export type ScheduleType = 'daily' | 'weekly' | 'monthly' | 'cron';

// ==================== Config Types ====================

// Schedule configuration for recurring rules
export interface ScheduleConfig {
  // For daily: { time: '09:00' }
  // For weekly: { day_of_week: 1, time: '09:00' } (1=Monday, 7=Sunday)
  // For monthly: { day_of_month: 1, time: '09:00' }
  // For cron: { cron: '0 9 * * 1' }
  time?: string;
  day_of_week?: number;
  day_of_month?: number;
  cron?: string;
}

// Task template for what task to create
export interface TaskTemplate {
  title: string;
  description?: string;
  task_type?: 'standard' | 'approval' | 'decision' | 'review';
  priority?: 'critical' | 'high' | 'normal' | 'low';
  department?: string;
  assignee_id?: string;
  sop_template_id?: string;
  related_entity_type?: string;
}

// ==================== Core Entities ====================

export interface TaskRule {
  id: string;
  name: string;
  description: string | null;
  rule_type: RuleType;
  schedule_type: ScheduleType | null;
  schedule_config: ScheduleConfig | null;
  trigger_event: string | null;
  trigger_conditions: Record<string, unknown> | null;
  condition_query: string | null;
  task_template: TaskTemplate;
  due_date_field: string | null;
  due_date_offset_days: number;
  dedupe_key_template: string | null;
  is_enabled: boolean;
  last_run_at: string | null;
  last_run_result: string | null;
  run_count: number;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// ==================== API Request/Response Types ====================

export interface TaskRuleListFilters {
  rule_type?: RuleType;
  is_enabled?: boolean;
  search?: string;
}

export interface TaskRuleListParams extends TaskRuleListFilters {
  cursor?: string;
  limit?: number;
  sort_by?: 'created_at' | 'name' | 'last_run_at';
  sort_order?: 'asc' | 'desc';
}

export interface TaskRuleListResponse {
  data: TaskRule[];
  meta: {
    cursor: string | null;
    has_more: boolean;
  };
}

export interface CreateTaskRuleRequest {
  name: string;
  description?: string;
  rule_type: RuleType;
  schedule_type?: ScheduleType;
  schedule_config?: ScheduleConfig;
  trigger_event?: string;
  trigger_conditions?: Record<string, unknown>;
  condition_query?: string;
  task_template: TaskTemplate;
  due_date_field?: string;
  due_date_offset_days?: number;
  dedupe_key_template?: string;
  is_enabled?: boolean;
}

export interface UpdateTaskRuleRequest {
  name?: string;
  description?: string;
  schedule_type?: ScheduleType;
  schedule_config?: ScheduleConfig;
  trigger_event?: string;
  trigger_conditions?: Record<string, unknown>;
  condition_query?: string;
  task_template?: TaskTemplate;
  due_date_field?: string;
  due_date_offset_days?: number;
  dedupe_key_template?: string;
  is_enabled?: boolean;
}
