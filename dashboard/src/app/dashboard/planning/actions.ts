'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';
import type { ProjectStatus } from '@/dashboard-kit/types/departments/planning';

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
 * Create a new project (quick capture)
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

    revalidatePath('/dashboard/planning');
    return { success: true, data: { id: data.id } };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create project',
    };
  }
}
