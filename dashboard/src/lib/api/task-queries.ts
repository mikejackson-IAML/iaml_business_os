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
