// Lead Intelligence - Activity Log Queries
// Read operations for entity activity logs

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getActivityTable() {
  return getServerClient().from('activity_log') as any;
}

export async function getContactActivity(contactId: string) {
  const { data, error } = await getActivityTable()
    .select('*')
    .eq('entity_type', 'contact')
    .eq('entity_id', contactId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    throw new Error(`Failed to fetch activity log: ${error.message}`);
  }

  return data ?? [];
}
