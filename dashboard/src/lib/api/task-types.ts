// Task API - Type definitions
// Types for action_center.tasks and related entities

// ==================== Enums ====================

export type TaskType = 'standard' | 'approval' | 'decision' | 'review';
export type TaskSource = 'manual' | 'alert' | 'workflow' | 'ai' | 'rule';
export type TaskStatus = 'open' | 'in_progress' | 'waiting' | 'done' | 'dismissed';
export type TaskPriority = 'critical' | 'high' | 'normal' | 'low';
export type DueCategory = 'no_date' | 'overdue' | 'today' | 'this_week' | 'later';

// ==================== Core Entities ====================

export interface Task {
  id: string;
  title: string;
  description: string | null;
  task_type: TaskType;
  source: TaskSource;
  status: TaskStatus;
  dismissed_reason: string | null;
  completion_note: string | null;
  completed_at: string | null;
  dismissed_at: string | null;
  priority: TaskPriority;
  due_date: string | null;
  due_time: string | null;
  department: string | null;
  assignee_id: string | null;
  workflow_id: string | null;
  parent_task_id: string | null;
  sop_template_id: string | null;
  depends_on: string[];
  related_entity_type: string | null;
  related_entity_id: string | null;
  related_entity_url: string | null;
  recommendation: string | null;
  recommendation_reasoning: string | null;
  approval_outcome: 'approved' | 'modified' | 'rejected' | null;
  approval_modifications: string | null;
  ai_confidence: number | null;
  ai_suggested_at: string | null;
  dedupe_key: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

// Extended task from tasks_extended view
export interface TaskExtended extends Task {
  is_overdue: boolean;
  due_category: DueCategory;
  is_blocked: boolean;
  blocked_by_count: number;
  blocking_count: number;
  workflow_name: string | null;
  workflow_status: string | null;
  sop_name: string | null;
  sop_category: string | null;
  assignee_name: string | null;
  assignee_email: string | null;
}

export interface TaskComment {
  id: string;
  task_id: string;
  content: string;
  author_id: string | null;
  author_name: string | null;
  comment_type: 'comment' | 'status_change' | 'system';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface TaskActivity {
  id: string;
  task_id: string;
  activity_type: string;
  actor_id: string | null;
  actor_name: string | null;
  actor_type: 'user' | 'system' | 'ai' | 'workflow';
  old_value: string | null;
  new_value: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// ==================== API Request/Response Types ====================

export interface TaskListFilters {
  status?: TaskStatus[];
  priority?: TaskPriority[];
  assignee_id?: string;
  department?: string;
  task_type?: TaskType[];
  source?: TaskSource[];
  due_category?: DueCategory[];
  workflow_id?: string;
  is_blocked?: boolean;
  search?: string;
}

export interface TaskListParams extends TaskListFilters {
  cursor?: string;
  limit?: number;
  sort_by?: 'priority' | 'due_date' | 'created_at';
  sort_order?: 'asc' | 'desc';
}

export interface TaskListResponse {
  data: TaskExtended[];
  meta: {
    cursor: string | null;
    has_more: boolean;
    total_count?: number;
  };
}

export interface TaskDetailResponse extends TaskExtended {
  comments: TaskComment[];
  recent_activity: TaskActivity[];
}

export interface CreateTaskRequest {
  title: string;
  description?: string;
  task_type?: TaskType;
  priority?: TaskPriority;
  due_date?: string;
  due_time?: string;
  department?: string;
  assignee_id?: string;
  workflow_id?: string;
  parent_task_id?: string;
  sop_template_id?: string;
  depends_on?: string[];
  related_entity_type?: string;
  related_entity_id?: string;
  related_entity_url?: string;
  dedupe_key?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  due_date?: string | null;
  due_time?: string | null;
  department?: string;
  assignee_id?: string | null;
  workflow_id?: string | null;
  approval_outcome?: 'approved' | 'modified' | 'rejected';
  approval_modifications?: string | null;
}

export interface CompleteTaskRequest {
  completion_note?: string;
}

export interface DismissTaskRequest {
  dismissed_reason: string;
}

export interface AddCommentRequest {
  content: string;
}

// ==================== Error Types ====================

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'CONFLICT'
  | 'INTERNAL_ERROR';

export interface ApiError {
  error: string;
  code: ErrorCode;
  details?: Record<string, string[]>;
}
