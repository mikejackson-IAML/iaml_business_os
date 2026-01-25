// Task API - Database mutation functions
// Write operations for action_center.tasks

import { getServerClient } from '@/lib/supabase/server';
import type {
  TaskExtended,
  CreateTaskRequest,
  UpdateTaskRequest,
  TaskComment,
} from './task-types';
import { getTaskById } from './task-queries';

// ==================== Create Task ====================

export async function createTask(
  data: CreateTaskRequest,
  createdBy: string | null = null
): Promise<TaskExtended> {
  const supabase = getServerClient();

  // Build insert object
  const insertData = {
    title: data.title,
    description: data.description || null,
    task_type: data.task_type || 'standard',
    source: data.source || 'manual',  // Default to manual if not specified
    status: 'open',
    priority: data.priority || 'normal',
    due_date: data.due_date || null,
    due_time: data.due_time || null,
    department: data.department || null,
    assignee_id: data.assignee_id || null,
    workflow_id: data.workflow_id || null,
    parent_task_id: data.parent_task_id || null,
    sop_template_id: data.sop_template_id || null,
    depends_on: data.depends_on || [],
    related_entity_type: data.related_entity_type || null,
    related_entity_id: data.related_entity_id || null,
    related_entity_url: data.related_entity_url || null,
    dedupe_key: data.dedupe_key || null,
    // AI suggestion fields
    ai_confidence: data.ai_confidence ?? null,
    ai_suggested_at: data.ai_suggested_at ?? (data.source === 'ai' ? new Date().toISOString() : null),
    created_by: createdBy,
    updated_by: createdBy,
  };

  const { data: result, error } = await supabase
    .from('tasks')
    .insert(insertData)
    .select('id')
    .single();

  if (error) {
    // Check for duplicate dedupe_key
    if (error.code === '23505' && error.message.includes('dedupe_key')) {
      throw new Error('DUPLICATE_DEDUPE_KEY');
    }
    console.error('Error creating task:', error);
    throw new Error('Failed to create task');
  }

  // Fetch the created task with computed fields
  const task = await getTaskById(result.id);
  if (!task) {
    throw new Error('Task created but not found');
  }

  return task;
}

// ==================== Update Task ====================

export async function updateTask(
  id: string,
  data: UpdateTaskRequest,
  updatedBy: string | null = null
): Promise<TaskExtended> {
  const supabase = getServerClient();

  // Build update object (only include provided fields)
  const updateData: Record<string, unknown> = {
    updated_by: updatedBy,
  };

  if (data.title !== undefined) updateData.title = data.title;
  if (data.description !== undefined) updateData.description = data.description;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.priority !== undefined) updateData.priority = data.priority;
  if (data.due_date !== undefined) updateData.due_date = data.due_date;
  if (data.due_time !== undefined) updateData.due_time = data.due_time;
  if (data.department !== undefined) updateData.department = data.department;
  if (data.assignee_id !== undefined) updateData.assignee_id = data.assignee_id;
  if (data.workflow_id !== undefined) updateData.workflow_id = data.workflow_id;
  if (data.approval_outcome !== undefined) updateData.approval_outcome = data.approval_outcome;
  if (data.approval_modifications !== undefined) updateData.approval_modifications = data.approval_modifications;

  const { error } = await supabase
    .from('tasks')
    .update(updateData)
    .eq('id', id);

  if (error) {
    console.error('Error updating task:', error);
    throw new Error('Failed to update task');
  }

  // Fetch the updated task with computed fields
  const task = await getTaskById(id);
  if (!task) {
    throw new Error('Task not found after update');
  }

  return task;
}

// ==================== Complete Task ====================

export async function completeTask(
  id: string,
  completionNote: string | null = null,
  completedBy: string | null = null
): Promise<TaskExtended> {
  const supabase = getServerClient();

  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      completion_note: completionNote,
      completed_at: new Date().toISOString(),
      updated_by: completedBy,
    })
    .eq('id', id);

  if (error) {
    console.error('Error completing task:', error);
    throw new Error('Failed to complete task');
  }

  const task = await getTaskById(id);
  if (!task) {
    throw new Error('Task not found after completion');
  }

  return task;
}

// ==================== Dismiss Task ====================

export async function dismissTask(
  id: string,
  dismissedReason: string,
  dismissedBy: string | null = null
): Promise<TaskExtended> {
  const supabase = getServerClient();

  const { error } = await supabase
    .from('tasks')
    .update({
      status: 'dismissed',
      dismissed_reason: dismissedReason,
      dismissed_at: new Date().toISOString(),
      updated_by: dismissedBy,
    })
    .eq('id', id);

  if (error) {
    console.error('Error dismissing task:', error);
    throw new Error('Failed to dismiss task');
  }

  const task = await getTaskById(id);
  if (!task) {
    throw new Error('Task not found after dismissal');
  }

  return task;
}

// ==================== Add Comment ====================

export async function addTaskComment(
  taskId: string,
  content: string,
  authorId: string | null = null,
  authorName: string | null = null
): Promise<TaskComment> {
  const supabase = getServerClient();

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      content,
      author_id: authorId,
      author_name: authorName || 'System',
      comment_type: 'comment',
    })
    .select('*')
    .single();

  if (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment');
  }

  return data as TaskComment;
}
