'use server';

import { revalidatePath } from 'next/cache';
import {
  acknowledgeAlert,
  acknowledgeAlerts,
  completeRecommendation,
  snoozeRecommendation,
} from '@/lib/api/web-intel-mutations';

export interface ActionResult {
  success: boolean;
  error?: string;
  data?: Record<string, unknown>;
}

/**
 * Server action to acknowledge a single alert
 */
export async function acknowledgeAlertAction(id: string): Promise<ActionResult> {
  try {
    await acknowledgeAlert(id);
    revalidatePath('/dashboard/web-intel');
    return { success: true };
  } catch (error) {
    console.error('Failed to acknowledge alert:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge alert',
    };
  }
}

/**
 * Server action to acknowledge all provided alert IDs
 */
export async function acknowledgeAllAlertsAction(ids: string[]): Promise<ActionResult> {
  try {
    const count = await acknowledgeAlerts(ids);
    revalidatePath('/dashboard/web-intel');
    return {
      success: true,
      data: { count }
    };
  } catch (error) {
    console.error('Failed to acknowledge alerts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to acknowledge alerts',
    };
  }
}

/**
 * Server action to mark a recommendation as completed
 */
export async function completeRecommendationAction(id: string): Promise<ActionResult> {
  try {
    await completeRecommendation(id);
    revalidatePath('/dashboard/web-intel');
    return { success: true };
  } catch (error) {
    console.error('Failed to complete recommendation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to complete recommendation',
    };
  }
}

/**
 * Server action to snooze a recommendation
 * @param id - Recommendation ID
 * @param days - Number of days to snooze (1, 7, or 30)
 */
export async function snoozeRecommendationAction(id: string, days: number): Promise<ActionResult> {
  try {
    await snoozeRecommendation(id, days);
    revalidatePath('/dashboard/web-intel');
    return { success: true };
  } catch (error) {
    console.error('Failed to snooze recommendation:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to snooze recommendation',
    };
  }
}
