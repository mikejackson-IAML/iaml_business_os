'use server';

import { revalidatePath } from 'next/cache';
import {
  completeTask,
  dismissTask,
  updateTask,
  addTaskComment,
  createTask,
} from '@/lib/api/task-mutations';
import type { CreateTaskRequest, TaskStatus } from '@/lib/api/task-types';

/**
 * Consistent return type for all server actions
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Complete a task with optional completion note
 */
export async function completeTaskAction(
  id: string,
  note: string | null
): Promise<ActionResult> {
  try {
    await completeTask(id, note);
    revalidatePath('/dashboard/action-center');
    return { success: true };
  } catch (error) {
    console.error('Error completing task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete task',
    };
  }
}

/**
 * Dismiss a task with reason and optional notes
 */
export async function dismissTaskAction(
  id: string,
  reason: string,
  notes: string | null
): Promise<ActionResult> {
  // Validate reason is not empty
  if (!reason || reason.trim().length === 0) {
    return { success: false, error: 'Reason is required' };
  }

  // Combine reason and notes into dismissed_reason string
  const dismissedReason = notes && notes.trim().length > 0
    ? `${reason.trim()}: ${notes.trim()}`
    : reason.trim();

  try {
    await dismissTask(id, dismissedReason);
    revalidatePath('/dashboard/action-center');
    return { success: true };
  } catch (error) {
    console.error('Error dismissing task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to dismiss task',
    };
  }
}

/**
 * Update task status
 */
export async function updateTaskStatusAction(
  id: string,
  status: TaskStatus
): Promise<ActionResult> {
  try {
    await updateTask(id, { status });
    revalidatePath('/dashboard/action-center');
    return { success: true };
  } catch (error) {
    console.error('Error updating task status:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update task status',
    };
  }
}

/**
 * Add a comment to a task
 */
export async function addCommentAction(
  taskId: string,
  content: string
): Promise<ActionResult> {
  // Validate content is not empty
  if (!content || content.trim().length === 0) {
    return { success: false, error: 'Comment content is required' };
  }

  try {
    const comment = await addTaskComment(taskId, content.trim(), null, 'User');
    revalidatePath('/dashboard/action-center');
    revalidatePath(`/dashboard/action-center/tasks/${taskId}`);
    return { success: true, data: { commentId: comment.id } };
  } catch (error) {
    console.error('Error adding comment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add comment',
    };
  }
}

/**
 * Create a new task
 */
export async function createTaskAction(
  data: CreateTaskRequest
): Promise<ActionResult> {
  // Validate title is not empty
  if (!data.title || data.title.trim().length === 0) {
    return { success: false, error: 'Task title is required' };
  }

  try {
    const task = await createTask({
      ...data,
      title: data.title.trim(),
    });
    revalidatePath('/dashboard/action-center');
    return { success: true, data: { taskId: task.id } };
  } catch (error) {
    console.error('Error creating task:', error);
    // Handle specific error codes
    if (error instanceof Error && error.message === 'DUPLICATE_DEDUPE_KEY') {
      return { success: false, error: 'A task with this reference already exists' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create task',
    };
  }
}

/**
 * Approve/reject a task requiring approval
 * Records the approval outcome and marks the task as done
 */
export async function approveTaskAction(
  id: string,
  outcome: 'approved' | 'modified' | 'rejected',
  modifications: string | null
): Promise<ActionResult> {
  try {
    // Rejected tasks are also marked done (decision has been made)
    await updateTask(id, {
      approval_outcome: outcome,
      approval_modifications: modifications,
      status: 'done',
    });
    revalidatePath('/dashboard/action-center');
    return { success: true };
  } catch (error) {
    console.error('Error approving task:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to record approval',
    };
  }
}
