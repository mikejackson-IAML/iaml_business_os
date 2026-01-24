'use server';

import { revalidatePath } from 'next/cache';
import { createSOP, updateSOP } from '@/lib/api/sop-mutations';
import { getSOPById, listSOPs, getUserMasteryForSOP, getTasksUsingSOP } from '@/lib/api/sop-queries';
import type { CreateSOPRequest, UpdateSOPRequest, SOPListParams } from '@/lib/api/sop-types';
import type { ActionResult } from './actions';

/**
 * Create a new SOP template
 */
export async function createSOPAction(
  data: CreateSOPRequest
): Promise<ActionResult> {
  // Validate name is not empty
  if (!data.name || data.name.trim().length === 0) {
    return { success: false, error: 'SOP name is required' };
  }

  try {
    const sop = await createSOP({
      ...data,
      name: data.name.trim(),
    });
    revalidatePath('/dashboard/action-center/sops');
    return { success: true, data: { sopId: sop.id } };
  } catch (error) {
    console.error('Error creating SOP:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create SOP',
    };
  }
}

/**
 * Update an existing SOP template
 */
export async function updateSOPAction(
  id: string,
  data: UpdateSOPRequest
): Promise<ActionResult> {
  try {
    await updateSOP(id, data);
    revalidatePath('/dashboard/action-center/sops');
    revalidatePath(`/dashboard/action-center/sops/${id}`);
    return { success: true };
  } catch (error) {
    console.error('Error updating SOP:', error);
    // Handle specific error codes
    if (error instanceof Error && error.message === 'SOP_NOT_FOUND') {
      return { success: false, error: 'SOP not found' };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update SOP',
    };
  }
}

/**
 * Get a single SOP by ID
 */
export async function getSOPAction(id: string) {
  return getSOPById(id);
}

/**
 * Get list of SOPs with optional filters
 */
export async function getSOPsAction(params: SOPListParams = {}) {
  return listSOPs(params);
}

/**
 * Get current user's mastery level for an SOP
 * Returns default novice level if user not authenticated or lookup fails
 */
export async function getUserMasteryAction(sopId: string) {
  // For single-user (CEO) app, we use a fixed user ID
  // In multi-user scenario, this would come from auth session
  const userId = 'ceo-user';
  return getUserMasteryForSOP(userId, sopId);
}

/**
 * Get tasks that reference a specific SOP
 */
export async function getTasksUsingSOPAction(sopId: string) {
  return getTasksUsingSOP(sopId);
}
