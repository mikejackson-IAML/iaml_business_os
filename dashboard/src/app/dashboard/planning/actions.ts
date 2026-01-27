'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import type { ProjectStatus, PhaseType } from '@/dashboard-kit/types/departments/planning';
import {
  completePhase,
  skipIncubation,
  navigateToPhase,
  ensureAllPhasesExist,
} from '@/lib/planning/phase-transitions';

/**
 * Consistent return type for all server actions
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Update a project's status (used by drag-and-drop in the pipeline board)
 */
export async function updateProjectStatusAction(
  projectId: string,
  newStatus: ProjectStatus
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;

    revalidatePath('/dashboard/planning');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update status',
    };
  }
}

/**
 * Create a new project (quick capture).
 * Also creates all 6 phase records upfront.
 */
export async function createProjectAction(
  title: string,
  oneLiner?: string
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { data, error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .insert({
        title,
        one_liner: oneLiner || null,
        status: 'idea',
        current_phase: 'capture',
      })
      .select('id')
      .single();

    if (error) throw error;

    // Create all 6 phase records upfront
    await ensureAllPhasesExist(data.id);

    revalidatePath('/dashboard/planning');
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}

/**
 * Complete a phase and advance to the next one.
 */
export async function completePhaseAction(
  projectId: string,
  phaseType: PhaseType
): Promise<ActionResult> {
  try {
    const result = await completePhase(projectId, phaseType);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath('/dashboard/planning');
    revalidatePath(`/dashboard/planning/${projectId}`);
    return {
      success: true,
      data: {
        nextPhase: result.nextPhase,
        incubationEndsAt: result.incubationEndsAt,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete phase',
    };
  }
}

/**
 * Skip incubation for a project.
 */
export async function skipIncubationAction(
  projectId: string
): Promise<ActionResult> {
  try {
    const result = await skipIncubation(projectId);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath('/dashboard/planning');
    revalidatePath(`/dashboard/planning/${projectId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to skip incubation',
    };
  }
}

/**
 * Navigate to a specific phase.
 */
export async function navigateToPhaseAction(
  projectId: string,
  targetPhase: PhaseType
): Promise<ActionResult> {
  try {
    const result = await navigateToPhase(projectId, targetPhase);
    if (!result.success) {
      return { success: false, error: result.error };
    }

    revalidatePath('/dashboard/planning');
    revalidatePath(`/dashboard/planning/${projectId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to navigate to phase',
    };
  }
}

/**
 * Force-complete a phase without readiness check requirement.
 */
export async function forceCompletePhaseAction(
  projectId: string,
  phaseType: PhaseType
): Promise<ActionResult> {
  // Same as completePhase -- no readiness gate enforcement at the action level
  // The readiness check is a conversation-level concern, not a DB constraint
  return completePhaseAction(projectId, phaseType);
}

/**
 * Save an incubation note as a memory with type 'insight'.
 */
export async function saveIncubationNoteAction(
  projectId: string,
  note: string
): Promise<ActionResult> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .schema('planning_studio')
      .from('memories')
      .insert({
        project_id: projectId,
        memory_type: 'insight',
        content: note,
        metadata: { source: 'incubation_note' },
      });

    if (error) throw error;

    revalidatePath(`/dashboard/planning/${projectId}`);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save incubation note',
    };
  }
}
