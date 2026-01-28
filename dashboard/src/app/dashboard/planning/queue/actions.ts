'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabase/server';

/**
 * Toggle the pinned status of a project in the build queue.
 */
export async function togglePinAction(
  projectId: string,
  pinned: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createServerClient();
    const { error } = await supabase
      .schema('planning_studio')
      .from('projects')
      .update({ pinned, updated_at: new Date().toISOString() })
      .eq('id', projectId);

    if (error) throw error;

    revalidatePath('/dashboard/planning/queue');
    revalidatePath('/dashboard/planning');
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to toggle pin',
    };
  }
}
