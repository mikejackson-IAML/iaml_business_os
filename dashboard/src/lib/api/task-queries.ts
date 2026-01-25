// Task API - Database query functions
// Read operations for action_center.tasks

import { getServerClient } from '@/lib/supabase/server';
import type { TaskExtended, TaskListParams, TaskComment, TaskActivity } from './task-types';

// ==================== List Tasks ====================

export interface ListTasksResult {
  tasks: TaskExtended[];
  cursor: string | null;
  has_more: boolean;
}

export async function listTasks(params: TaskListParams): Promise<ListTasksResult> {
  const supabase = getServerClient();
  const limit = Math.min(params.limit || 20, 100);

  let query = supabase
    .from('tasks_extended')
    .select('*');

  // Apply filters
  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  if (params.priority && params.priority.length > 0) {
    query = query.in('priority', params.priority);
  }

  if (params.assignee_id) {
    query = query.eq('assignee_id', params.assignee_id);
  }

  if (params.department) {
    query = query.eq('department', params.department);
  }

  if (params.task_type && params.task_type.length > 0) {
    query = query.in('task_type', params.task_type);
  }

  if (params.source && params.source.length > 0) {
    query = query.in('source', params.source);
  }

  if (params.due_category && params.due_category.length > 0) {
    query = query.in('due_category', params.due_category);
  }

  if (params.workflow_id) {
    query = query.eq('workflow_id', params.workflow_id);
  }

  if (params.no_workflow === true) {
    query = query.is('workflow_id', null);
  }

  if (params.is_blocked !== undefined) {
    query = query.eq('is_blocked', params.is_blocked);
  }

  if (params.search) {
    // Search in title and description
    query = query.or(`title.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  // Apply cursor pagination
  if (params.cursor) {
    // Cursor is the last task ID - fetch tasks after this ID
    query = query.gt('id', params.cursor);
  }

  // Default sort: priority (critical first), then due_date (soonest first)
  // PostgreSQL sorts alphabetically, so 'critical' < 'high' < 'low' < 'normal'
  // We order by priority ASC to get critical first (alphabetically)
  query = query
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false })
    .order('id', { ascending: true })
    .limit(limit + 1);  // Fetch one extra to check has_more

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching tasks:', error);
    throw new Error('Failed to fetch tasks');
  }

  const tasks = (data || []) as TaskExtended[];
  const has_more = tasks.length > limit;

  // Remove the extra row if present
  if (has_more) {
    tasks.pop();
  }

  // Build cursor from last item
  let cursor: string | null = null;
  if (tasks.length > 0 && has_more) {
    const lastTask = tasks[tasks.length - 1];
    cursor = lastTask.id;
  }

  return { tasks, cursor, has_more };
}

// ==================== Get Task by ID ====================

export async function getTaskById(id: string): Promise<TaskExtended | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('tasks_extended')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching task:', error);
    throw new Error('Failed to fetch task');
  }

  return data as TaskExtended;
}

// ==================== Get Task Comments ====================

export async function getTaskComments(taskId: string): Promise<TaskComment[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching comments:', error);
    throw new Error('Failed to fetch comments');
  }

  return (data || []) as TaskComment[];
}

// ==================== Get Task Activity ====================

export async function getTaskActivity(
  taskId: string,
  limit: number = 10
): Promise<TaskActivity[]> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('task_activity')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching activity:', error);
    throw new Error('Failed to fetch activity');
  }

  return (data || []) as TaskActivity[];
}

// ==================== Dependency Queries ====================

/**
 * Get tasks that this task depends on (blocked by)
 * Returns the actual task objects from the depends_on UUID array
 */
export async function getTasksBlockedBy(taskId: string): Promise<TaskExtended[]> {
  const supabase = getServerClient();

  // First, get the task to find its depends_on array
  const { data: task, error: taskError } = await supabase
    .from('tasks')
    .select('depends_on')
    .eq('id', taskId)
    .single();

  if (taskError) {
    if (taskError.code === 'PGRST116') {
      return []; // Task not found
    }
    console.error('Error fetching task dependencies:', taskError);
    throw new Error('Failed to fetch task dependencies');
  }

  const dependsOn = task?.depends_on || [];
  if (dependsOn.length === 0) {
    return [];
  }

  // Fetch the actual tasks this task depends on
  const { data, error } = await supabase
    .from('tasks_extended')
    .select('*')
    .in('id', dependsOn)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching blocked-by tasks:', error);
    throw new Error('Failed to fetch blocked-by tasks');
  }

  return (data || []) as TaskExtended[];
}

/**
 * Get tasks that are waiting on this task (blocking)
 * Returns incomplete tasks that have this task's ID in their depends_on array
 */
export async function getTasksBlocking(taskId: string): Promise<TaskExtended[]> {
  const supabase = getServerClient();

  // Find tasks where depends_on array contains this taskId
  // and status is not done or dismissed (incomplete tasks only)
  const { data, error } = await supabase
    .from('tasks_extended')
    .select('*')
    .contains('depends_on', [taskId])
    .not('status', 'in', '("done","dismissed")')
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false });

  if (error) {
    console.error('Error fetching blocking tasks:', error);
    throw new Error('Failed to fetch blocking tasks');
  }

  return (data || []) as TaskExtended[];
}

/**
 * Result type for getTaskDependencies
 */
export interface TaskDependencies {
  blockedBy: TaskExtended[];
  blocking: TaskExtended[];
}

/**
 * Get both dependency directions for a task in a single call
 * - blockedBy: tasks this task depends on
 * - blocking: tasks waiting on this task
 */
export async function getTaskDependencies(taskId: string): Promise<TaskDependencies> {
  // Execute both queries in parallel for efficiency
  const [blockedBy, blocking] = await Promise.all([
    getTasksBlockedBy(taskId),
    getTasksBlocking(taskId),
  ]);

  return { blockedBy, blocking };
}

// ==================== Task Counts ====================

/**
 * Task counts returned by the RPC
 */
export interface TaskCounts {
  critical_count: number;
  due_today_count: number;
  overdue_count: number;
  total_active_count: number;
  badge_count: number;
  generated_at: string;
}

/**
 * Get task counts for dashboard widget and nav badge
 * Calls action_center.get_task_counts() RPC
 */
export async function getTaskCounts(): Promise<TaskCounts> {
  const supabase = getServerClient();

  const { data, error } = await supabase.rpc('get_task_counts');

  if (error) {
    console.error('Error fetching task counts:', error);
    throw new Error('Failed to fetch task counts');
  }

  // The RPC returns JSON which Supabase parses automatically
  return data as TaskCounts;
}

// ==================== Weekly Focus Queries ====================

/**
 * Get the latest Weekly Focus Review task created by AI
 * Returns the most recent task where task_type='review', source='ai', and title starts with 'Weekly Focus Review'
 */
export async function getLatestWeeklyFocus(): Promise<TaskExtended | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('tasks_extended')
    .select('*')
    .eq('task_type', 'review')
    .eq('source', 'ai')
    .like('title', 'Weekly Focus Review%')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    console.error('Error fetching weekly focus:', error);
    throw new Error('Failed to fetch weekly focus');
  }

  return data as TaskExtended;
}

/**
 * Get count of open AI-suggested tasks
 * Used to show how many AI suggestions are waiting for review
 */
export async function getAISuggestionCount(): Promise<number> {
  const supabase = getServerClient();

  const { count, error } = await supabase
    .from('tasks')
    .select('id', { count: 'exact', head: true })
    .eq('source', 'ai')
    .eq('status', 'open');

  if (error) {
    console.error('Error fetching AI suggestion count:', error);
    throw new Error('Failed to fetch AI suggestion count');
  }

  return count || 0;
}
