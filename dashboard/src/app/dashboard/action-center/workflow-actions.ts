'use server';

import { revalidatePath } from 'next/cache';
import {
  listWorkflows,
  getWorkflowDetail,
} from '@/lib/api/action-center-workflow-queries';
import { addTaskToWorkflow } from '@/lib/api/action-center-workflow-mutations';
import { createTask } from '@/lib/api/task-mutations';
import type { WorkflowListParams, WorkflowExtended, WorkflowDetail } from '@/lib/api/workflow-types';
import type { ActionResult } from './actions';

// ==================== Types ====================

/**
 * Request type for creating a decision task
 * Used when a workflow step requires a decision to be made
 */
export interface CreateDecisionTaskRequest {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'normal' | 'low';
  department: string;
  workflow_id: string | null;
  parent_task_id: string;
  related_entity_type: 'task';
  related_entity_id: string;
}

// ==================== Workflow List/Detail Actions ====================

/**
 * Result type for workflow list action
 */
export interface WorkflowListResult {
  success: boolean;
  error?: string;
  data?: {
    workflows: WorkflowExtended[];
    cursor: string | null;
    has_more: boolean;
  };
}

/**
 * Result type for workflow detail action
 */
export interface WorkflowDetailResult {
  success: boolean;
  error?: string;
  data?: {
    workflow: WorkflowDetail;
  };
}

/**
 * Get paginated list of workflows with optional filters
 */
export async function getWorkflowsAction(
  params: WorkflowListParams
): Promise<WorkflowListResult> {
  try {
    const result = await listWorkflows(params);
    return {
      success: true,
      data: {
        workflows: result.workflows,
        cursor: result.cursor,
        has_more: result.has_more,
      },
    };
  } catch (error) {
    console.error('Error fetching workflows:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch workflows',
    };
  }
}

/**
 * Get workflow detail including all tasks
 */
export async function getWorkflowDetailAction(
  id: string
): Promise<WorkflowDetailResult> {
  if (!id || id.trim().length === 0) {
    return { success: false, error: 'Workflow ID is required' };
  }

  try {
    const workflow = await getWorkflowDetail(id);
    if (!workflow) {
      return { success: false, error: 'Workflow not found' };
    }
    return {
      success: true,
      data: { workflow },
    };
  } catch (error) {
    console.error('Error fetching workflow detail:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch workflow details',
    };
  }
}

// ==================== Workflow Mutation Actions ====================

/**
 * Add an existing task to a workflow
 */
export async function addTaskToWorkflowAction(
  workflowId: string,
  taskId: string
): Promise<ActionResult> {
  if (!workflowId || workflowId.trim().length === 0) {
    return { success: false, error: 'Workflow ID is required' };
  }

  if (!taskId || taskId.trim().length === 0) {
    return { success: false, error: 'Task ID is required' };
  }

  try {
    await addTaskToWorkflow(workflowId, taskId);

    // Revalidate action center paths
    revalidatePath('/dashboard/action-center');
    revalidatePath(`/dashboard/action-center/workflows/${workflowId}`);
    revalidatePath(`/dashboard/action-center/tasks/${taskId}`);

    return { success: true };
  } catch (error) {
    console.error('Error adding task to workflow:', error);

    // Handle specific error codes
    if (error instanceof Error) {
      if (error.message === 'WORKFLOW_NOT_FOUND') {
        return { success: false, error: 'The specified workflow does not exist' };
      }
      return { success: false, error: error.message };
    }

    return { success: false, error: 'Failed to add task to workflow' };
  }
}

/**
 * Create a decision task linked to a parent task
 * Used when a workflow step requires a decision to be made
 */
export async function createDecisionTaskAction(
  data: CreateDecisionTaskRequest
): Promise<ActionResult> {
  // Validate required fields
  if (!data.title || data.title.trim().length === 0) {
    return { success: false, error: 'Task title is required' };
  }

  if (!data.parent_task_id || data.parent_task_id.trim().length === 0) {
    return { success: false, error: 'Parent task ID is required' };
  }

  if (!data.related_entity_id || data.related_entity_id.trim().length === 0) {
    return { success: false, error: 'Related entity ID is required' };
  }

  try {
    const task = await createTask({
      title: data.title.trim(),
      description: data.description?.trim() || undefined,
      task_type: 'decision',
      source: 'workflow',
      priority: data.priority || 'normal',
      department: data.department || undefined,
      workflow_id: data.workflow_id || undefined,
      parent_task_id: data.parent_task_id,
      related_entity_type: data.related_entity_type,
      related_entity_id: data.related_entity_id,
    });

    // Revalidate action center paths
    revalidatePath('/dashboard/action-center');
    if (data.workflow_id) {
      revalidatePath(`/dashboard/action-center/workflows/${data.workflow_id}`);
    }
    revalidatePath(`/dashboard/action-center/tasks/${data.parent_task_id}`);

    return { success: true, data: { taskId: task.id } };
  } catch (error) {
    console.error('Error creating decision task:', error);

    // Handle specific error codes
    if (error instanceof Error && error.message === 'DUPLICATE_DEDUPE_KEY') {
      return { success: false, error: 'A similar decision task already exists' };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create decision task',
    };
  }
}

// ==================== Dependency Query Actions ====================

import { getTaskDependencies, type TaskDependencies } from '@/lib/api/task-queries';

/**
 * Server action to get task dependencies for client-side use
 * Returns both blockedBy (tasks this task depends on) and blocking (tasks waiting on this task)
 */
export async function getTaskDependenciesAction(
  taskId: string
): Promise<TaskDependencies> {
  return getTaskDependencies(taskId);
}
