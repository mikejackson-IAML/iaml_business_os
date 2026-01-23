// Action Center Workflow API - Database mutation functions
// Write operations for action_center.workflows

import { getServerClient } from '@/lib/supabase/server';
import type {
  WorkflowExtended,
  CreateWorkflowRequest,
  UpdateWorkflowRequest,
} from './workflow-types';
import { getWorkflowById } from './action-center-workflow-queries';

// ==================== Create Workflow ====================

export async function createWorkflow(
  data: CreateWorkflowRequest,
  createdBy: string | null = null
): Promise<WorkflowExtended> {
  const supabase = getServerClient();

  const insertData = {
    name: data.name,
    description: data.description || null,
    workflow_type: data.workflow_type || null,
    department: data.department || null,
    status: 'not_started',
    related_entity_type: data.related_entity_type || null,
    related_entity_id: data.related_entity_id || null,
    target_completion_date: data.target_completion_date || null,
    total_tasks: 0,
    completed_tasks: 0,
    created_by: createdBy,
    updated_by: createdBy,
  };

  const { data: result, error } = await supabase
    .from('workflows')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    console.error('Error creating workflow:', error);
    throw new Error('Failed to create workflow');
  }

  const workflow = await getWorkflowById(result.id);
  if (!workflow) {
    throw new Error('Workflow created but not found');
  }

  return workflow;
}

// ==================== Update Workflow ====================

export async function updateWorkflow(
  id: string,
  data: UpdateWorkflowRequest,
  updatedBy: string | null = null
): Promise<WorkflowExtended> {
  const supabase = getServerClient();

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {
    updated_by: updatedBy,
  };

  if (data.name !== undefined) updateData.name = data.name;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.workflow_type !== undefined) updateData.workflow_type = data.workflow_type;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.target_completion_date !== undefined) updateData.target_completion_date = data.target_completion_date;

  const { error } = await supabase
    .from('workflows')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating workflow:', error);
    throw new Error('Failed to update workflow');
  }

  const workflow = await getWorkflowById(id);
  if (!workflow) {
    throw new Error('Workflow not found after update');
  }

  return workflow;
}

// ==================== Add Task to Workflow ====================

export async function addTaskToWorkflow(
  workflowId: string,
  taskId: string,
  updatedBy: string | null = null
): Promise<void> {
  const supabase = getServerClient();

  // First verify the workflow exists
  const workflow = await getWorkflowById(workflowId);
  if (!workflow) {
    throw new Error('WORKFLOW_NOT_FOUND');
  }

  // Update the task to belong to this workflow
  const { error: taskError } = await supabase
    .from('tasks')
    .update({
      workflow_id: workflowId,
      updated_by: updatedBy,
    })
    .eq('id', taskId);

  if (taskError) {
    console.error('Error adding task to workflow:', taskError);
    throw new Error('Failed to add task to workflow');
  }

  // Update workflow task counts
  // Re-count all tasks in the workflow
  const { count: totalCount, error: countError } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('workflow_id', workflowId);

  if (countError) {
    console.error('Error counting workflow tasks:', countError);
    // Don't throw - task was added successfully
    return;
  }

  const { count: completedCount } = await supabase
    .from('tasks')
    .select('*', { count: 'exact', head: true })
    .eq('workflow_id', workflowId)
    .eq('status', 'done');

  // Update workflow progress
  await supabase
    .from('workflows')
    .update({
      total_tasks: totalCount || 0,
      completed_tasks: completedCount || 0,
      updated_by: updatedBy,
    })
    .eq('id', workflowId);
}

// ==================== Update Workflow Status ====================
// Recompute workflow status based on task states

export async function recomputeWorkflowStatus(workflowId: string): Promise<void> {
  const supabase = getServerClient();

  // Get all tasks in the workflow
  const { data: tasks, error } = await supabase
    .from('tasks')
    .select('status, depends_on')
    .eq('workflow_id', workflowId);

  if (error || !tasks) {
    console.error('Error fetching tasks for status recompute:', error);
    return;
  }

  let newStatus: 'not_started' | 'in_progress' | 'blocked' | 'completed';

  if (tasks.length === 0) {
    newStatus = 'not_started';
  } else {
    const statuses = tasks.map(t => t.status);
    const hasBlocked = tasks.some(t =>
      (t.depends_on as string[] || []).length > 0 &&
      !['done', 'dismissed'].includes(t.status)
    );

    if (statuses.every(s => s === 'done' || s === 'dismissed')) {
      newStatus = 'completed';
    } else if (hasBlocked) {
      newStatus = 'blocked';
    } else if (statuses.some(s => s === 'in_progress' || s === 'waiting')) {
      newStatus = 'in_progress';
    } else if (statuses.every(s => s === 'open')) {
      newStatus = 'not_started';
    } else {
      newStatus = 'in_progress';
    }
  }

  // Count completed
  const completedCount = tasks.filter(t => t.status === 'done').length;

  // Get current workflow to check if we need to set timestamps
  const { data: currentWorkflow } = await supabase
    .from('workflows')
    .select('started_at')
    .eq('id', workflowId)
    .single();

  // Build update object
  const updateObj: Record<string, unknown> = {
    status: newStatus,
    total_tasks: tasks.length,
    completed_tasks: completedCount,
  };

  // Set started_at if transitioning from not_started
  if (newStatus !== 'not_started' && !currentWorkflow?.started_at) {
    updateObj.started_at = new Date().toISOString();
  }

  // Set completed_at if status is completed
  if (newStatus === 'completed') {
    updateObj.completed_at = new Date().toISOString();
  } else {
    updateObj.completed_at = null;
  }

  // Update workflow
  await supabase
    .from('workflows')
    .update(updateObj)
    .eq('id', workflowId);
}
