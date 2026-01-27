// Lead Intelligence - Email Activity Queries
// Read operations for contact email activities

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getEmailActivitiesTable() {
  return getServerClient().from('email_activities') as any;
}

export async function getContactEmailActivities(contactId: string) {
  const { data, error } = await getEmailActivitiesTable()
    .select('*')
    .eq('contact_id', contactId)
    .order('activity_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch email activities: ${error.message}`);
  }

  return data ?? [];
}
