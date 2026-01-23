// Workflow API - Type definitions
// Types for action_center.workflows and related operations

// ==================== Enums ====================

export type WorkflowStatus = 'not_started' | 'in_progress' | 'blocked' | 'completed';

// ==================== Core Entities ====================

export interface Workflow {
  id: string;
  name: string;
  description: string | null;
  workflow_type: string | null;
  department: string | null;
  status: WorkflowStatus;
  related_entity_type: string | null;
  related_entity_id: string | null;
  template_id: string | null;
  total_tasks: number;
  completed_tasks: number;
  started_at: string | null;
  completed_at: string | null;
  target_completion_date: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Extended workflow with computed fields for list/detail views
export interface WorkflowExtended extends Workflow {
  progress_percentage: number;
  template_name: string | null;
}

// Workflow detail includes tasks
import type { TaskExtended } from './task-types';

export interface WorkflowDetail extends WorkflowExtended {
  tasks: TaskExtended[];
  task_count_by_status: {
    open: number;
    in_progress: number;
    waiting: number;
    done: number;
    dismissed: number;
  };
}

// ==================== API Request/Response Types ====================

export interface WorkflowListFilters {
  status?: WorkflowStatus[];
  department?: string;
  workflow_type?: string;
  search?: string;
}

export interface WorkflowListParams extends WorkflowListFilters {
  cursor?: string;
  limit?: number;
  sort_by?: 'created_at' | 'name' | 'target_completion_date';
  sort_order?: 'asc' | 'desc';
}

export interface WorkflowListResponse {
  data: WorkflowExtended[];
  meta: {
    cursor: string | null;
    has_more: boolean;
  };
}

export interface CreateWorkflowRequest {
  name: string;
  description?: string;
  workflow_type?: string;
  department?: string;
  related_entity_type?: string;
  related_entity_id?: string;
  target_completion_date?: string;
}

export interface UpdateWorkflowRequest {
  name?: string;
  description?: string;
  workflow_type?: string;
  department?: string;
  target_completion_date?: string | null;
}

export interface AddTaskToWorkflowRequest {
  task_id: string;
}
