// Action Center Workflow API - Database query functions
// Read operations for action_center.workflows

import { getServerClient } from '@/lib/supabase/server';
import type {
  WorkflowExtended,
  WorkflowDetail,
  WorkflowListParams,
} from './workflow-types';
import type { TaskExtended } from './task-types';

// ==================== List Workflows ====================

export interface ListWorkflowsResult {
  workflows: WorkflowExtended[];
  cursor: string | null;
  has_more: boolean;
}

export async function listWorkflows(params: WorkflowListParams): Promise<ListWorkflowsResult> {
  const supabase = getServerClient();
  const limit = Math.min(params.limit || 20, 100);

  let query = supabase
    .from('workflows')
    .select('*, workflow_templates(name)');

  // Apply filters
  if (params.status && params.status.length > 0) {
    query = query.in('status', params.status);
  }

  if (params.department) {
    query = query.eq('department', params.department);
  }

  if (params.workflow_type) {
    query = query.eq('workflow_type', params.workflow_type);
  }

  if (params.search) {
    query = query.or(`name.ilike.%${params.search}%,description.ilike.%${params.search}%`);
  }

  // Apply cursor pagination
  if (params.cursor) {
    query = query.gt('id', params.cursor);
  }

  // Default sort: created_at DESC (newest first)
  const sortBy = params.sort_by || 'created_at';
  const sortOrder = params.sort_order || 'desc';
  query = query
    .order(sortBy, { ascending: sortOrder === 'asc' })
    .order('id', { ascending: true })
    .limit(limit + 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching workflows:', error);
    throw new Error('Failed to fetch workflows');
  }

  // Transform to WorkflowExtended with computed fields
  const workflows: WorkflowExtended[] = (data || []).map((row: Record<string, unknown>) => ({
    ...row,
    progress_percentage: row.total_tasks
      ? Math.round(((row.completed_tasks as number) / (row.total_tasks as number)) * 100)
      : 0,
    template_name: (row.workflow_templates as { name: string } | null)?.name || null,
  })) as WorkflowExtended[];

  const has_more = workflows.length > limit;

  // Remove the extra row if present
  if (has_more) {
    workflows.pop();
  }

  // Build cursor from last item
  let cursor: string | null = null;
  if (workflows.length > 0 && has_more) {
    const lastWorkflow = workflows[workflows.length - 1];
    cursor = lastWorkflow.id;
  }

  return { workflows, cursor, has_more };
}

// ==================== Get Workflow by ID ====================

export async function getWorkflowById(id: string): Promise<WorkflowExtended | null> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('workflows')
    .select('*, workflow_templates(name)')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    console.error('Error fetching workflow:', error);
    throw new Error('Failed to fetch workflow');
  }

  const row = data as Record<string, unknown>;
  return {
    ...row,
    progress_percentage: row.total_tasks
      ? Math.round(((row.completed_tasks as number) / (row.total_tasks as number)) * 100)
      : 0,
    template_name: (row.workflow_templates as { name: string } | null)?.name || null,
  } as WorkflowExtended;
}

// ==================== Get Workflow Detail with Tasks ====================

export async function getWorkflowDetail(id: string): Promise<WorkflowDetail | null> {
  const supabase = getServerClient();

  // First get the workflow
  const workflow = await getWorkflowById(id);
  if (!workflow) {
    return null;
  }

  // Then get the tasks for this workflow
  const { data: tasksData, error: tasksError } = await supabase
    .from('tasks_extended')
    .select('*')
    .eq('workflow_id', id)
    .order('priority', { ascending: true })
    .order('due_date', { ascending: true, nullsFirst: false });

  if (tasksError) {
    console.error('Error fetching workflow tasks:', tasksError);
    throw new Error('Failed to fetch workflow tasks');
  }

  const tasks = (tasksData || []) as TaskExtended[];

  // Compute task counts by status
  const task_count_by_status = {
    open: 0,
    in_progress: 0,
    waiting: 0,
    done: 0,
    dismissed: 0,
  };

  for (const task of tasks) {
    if (task.status in task_count_by_status) {
      task_count_by_status[task.status as keyof typeof task_count_by_status]++;
    }
  }

  return {
    ...workflow,
    tasks,
    task_count_by_status,
  };
}
