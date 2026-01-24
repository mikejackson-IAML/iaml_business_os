'use server';

import { revalidatePath } from 'next/cache';
import { acknowledgeAlert, acknowledgeAlerts } from '@/lib/api/web-intel-mutations';

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
