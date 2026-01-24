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
