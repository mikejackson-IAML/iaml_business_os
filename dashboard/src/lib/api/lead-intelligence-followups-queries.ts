// Lead Intelligence - Follow-up Queries
// Read operations for contact follow-up tasks

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getFollowUpsTable() {
  return getServerClient().from('follow_up_tasks') as any;
}

export async function getContactFollowUps(contactId: string) {
  const { data, error } = await getFollowUpsTable()
    .select('*')
    .eq('contact_id', contactId)
    .order('due_date', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch follow-ups: ${error.message}`);
  }

  return data ?? [];
}
