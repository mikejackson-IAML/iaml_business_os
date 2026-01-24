'use server';

import { revalidatePath } from 'next/cache';
import { getServerClient } from '@/lib/supabase/server';

/**
 * Consistent return type for all server actions
 */
export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Skip to a specific tier for a program
 * Advances the program directly to tier_1 or tier_2
 */
export async function skipTier(
  programId: string,
  targetTier: 'tier_1' | 'tier_2'
): Promise<ActionResult> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('skip_tier', {
    p_program_id: programId,
    p_target_tier: targetTier,
  });

  if (error) {
    console.error('Error skipping tier:', error);
    return { success: false, error: error.message };
  }

  const result = data?.[0];
  if (!result?.success) {
    return { success: false, error: result?.error_message || 'Unknown error' };
  }

  revalidatePath('/dashboard/faculty-scheduler');
  return {
    success: true,
    data: { previousTier: result.previous_tier, newTier: result.new_tier },
  };
}

/**
 * Manually assign an instructor to a program block
 * Creates a confirmed claim bypassing the normal claim flow
 */
export async function assignInstructor(
  blockId: string,
  instructorId: string
): Promise<ActionResult> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('assign_instructor', {
    p_block_id: blockId,
    p_instructor_id: instructorId,
  });

  if (error) {
    console.error('Error assigning instructor:', error);
    return { success: false, error: error.message };
  }

  const result = data?.[0];
  if (!result?.success) {
    return { success: false, error: result?.error_message || 'Unknown error' };
  }

  revalidatePath('/dashboard/faculty-scheduler');
  return { success: true, data: { claimId: result.claim_id } };
}

/**
 * Send a reminder nudge to instructors who haven't responded
 * Triggers the reminder workflow via n8n webhook
 */
export async function sendNudge(programId: string): Promise<ActionResult> {
  const supabase = getServerClient();

  // Get instructors needing reminder for this specific program
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: instructors, error: fetchError } = await (supabase as any).rpc(
    'get_instructors_needing_reminder',
    {
      p_scheduled_program_id: programId,
    }
  );

  if (fetchError) {
    console.error('Error fetching instructors for nudge:', fetchError);
    return { success: false, error: fetchError.message };
  }

  if (!instructors || instructors.length === 0) {
    return {
      success: false,
      error: 'No instructors to nudge or reminder already sent',
    };
  }

  // Trigger n8n webhook for reminder
  const webhookUrl =
    process.env.N8N_REMINDER_WEBHOOK_URL ||
    'https://n8n.realtyamp.ai/webhook/faculty-scheduler-reminder';

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programId,
        instructorCount: instructors.length,
        triggeredBy: 'dashboard',
        triggeredAt: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`Webhook returned ${response.status}`);
    }
  } catch (err) {
    console.error('Error triggering nudge webhook:', err);
    return { success: false, error: 'Failed to trigger reminder workflow' };
  }

  revalidatePath('/dashboard/faculty-scheduler');
  return { success: true, data: { instructorCount: instructors.length } };
}

/**
 * Override/cancel an existing claim
 * Cancels the claim and triggers re-release notification
 */
export async function overrideClaim(
  claimId: string,
  reason: string
): Promise<ActionResult> {
  if (!reason || reason.trim().length < 3) {
    return {
      success: false,
      error: 'Reason is required (minimum 3 characters)',
    };
  }

  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('override_claim', {
    p_claim_id: claimId,
    p_reason: reason.trim(),
  });

  if (error) {
    console.error('Error overriding claim:', error);
    return { success: false, error: error.message };
  }

  const result = data?.[0];
  if (!result?.success) {
    return { success: false, error: result?.error_message || 'Unknown error' };
  }

  // Trigger re-release notification via existing webhook
  const webhookUrl =
    process.env.N8N_RERELEASE_WEBHOOK_URL ||
    'https://n8n.realtyamp.ai/webhook/faculty-scheduler-rerelease';
  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        programId: result.program_id,
        blockId: result.block_id,
        triggeredBy: 'dashboard_override',
        triggeredAt: new Date().toISOString(),
      }),
    });
  } catch (err) {
    console.error('Error triggering re-release webhook:', err);
    // Don't fail the override, just log - the claim was cancelled successfully
  }

  revalidatePath('/dashboard/faculty-scheduler');
  return {
    success: true,
    data: { blockId: result.block_id, programId: result.program_id },
  };
}

/**
 * Release all draft programs to tier_0
 * Bulk operation to start the scheduling process
 */
export async function releaseAllPrograms(): Promise<ActionResult> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc('release_all', {});

  if (error) {
    console.error('Error releasing programs:', error);
    return { success: false, error: error.message };
  }

  const result = data?.[0];

  revalidatePath('/dashboard/faculty-scheduler');
  return {
    success: true,
    data: {
      programsReleased: result?.programs_released || 0,
      programIds: result?.program_ids || [],
    },
  };
}

/**
 * Dismiss an alert from the dashboard.
 * Soft-deletes the alert so it won't reappear for the same event.
 */
export async function dismissAlert(alertId: string): Promise<ActionResult> {
  const supabase = getServerClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc('faculty_scheduler.dismiss_alert', {
    p_alert_id: alertId,
    p_dismissed_by: 'dashboard',
  });

  if (error) {
    console.error('Error dismissing alert:', error);
    return { success: false, error: error.message };
  }

  revalidatePath('/dashboard/faculty-scheduler');
  return { success: true };
}
