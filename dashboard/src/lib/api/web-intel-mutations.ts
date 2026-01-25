// Web Intelligence Dashboard Mutations
// Handles write operations to web_intel schema
// Note: web_intel schema is not in generated Supabase types

import { getServerClient } from '@/lib/supabase/server';

/**
 * Acknowledge a single alert
 * Sets acknowledged_at to current timestamp and acknowledged_by to provided user
 */
export async function acknowledgeAlert(
  id: string,
  acknowledgedBy: string = 'user'
): Promise<void> {
  // Cast to any for web_intel schema tables (not in generated types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServerClient() as any;

  const { error } = await supabase
    .from('web_intel.alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to acknowledge alert: ${error.message}`);
  }
}

/**
 * Acknowledge multiple alerts at once
 * Returns the count of alerts acknowledged
 */
export async function acknowledgeAlerts(
  ids: string[],
  acknowledgedBy: string = 'user'
): Promise<number> {
  if (ids.length === 0) return 0;

  // Cast to any for web_intel schema tables (not in generated types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServerClient() as any;

  const { error, count } = await supabase
    .from('web_intel.alerts')
    .update({
      acknowledged_at: new Date().toISOString(),
      acknowledged_by: acknowledgedBy,
    })
    .in('id', ids);

  if (error) {
    throw new Error(`Failed to acknowledge alerts: ${error.message}`);
  }

  return count ?? ids.length;
}

/**
 * Mark a recommendation as completed
 * Sets status to 'completed' and records completion timestamp
 */
export async function completeRecommendation(id: string): Promise<void> {
  // Cast to any for web_intel schema tables (not in generated types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServerClient() as any;

  const { error } = await supabase
    .from('web_intel.recommendations')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to complete recommendation: ${error.message}`);
  }
}

/**
 * Snooze a recommendation
 * Marks as dismissed with snooze duration stored for potential future use.
 * A scheduled workflow could restore 'new' status after the snooze period if needed.
 * @param id - Recommendation ID
 * @param days - Number of days to snooze (1, 7, or 30)
 */
export async function snoozeRecommendation(id: string, days: number): Promise<void> {
  // Cast to any for web_intel schema tables (not in generated types)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getServerClient() as any;

  // Snooze is implemented as dismiss with snooze metadata stored in source_data
  // A scheduled workflow could restore 'new' status after the snooze period
  const { error } = await supabase
    .from('web_intel.recommendations')
    .update({
      status: 'dismissed',
      source_data: { snoozed_for_days: days, snoozed_at: new Date().toISOString() },
    })
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to snooze recommendation: ${error.message}`);
  }
}
