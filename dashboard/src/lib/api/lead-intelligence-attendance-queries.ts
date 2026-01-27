// Lead Intelligence - Attendance Queries
// Read operations for contact attendance records

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getAttendanceTable() {
  return getServerClient().from('attendance_records') as any;
}

export async function getContactAttendance(contactId: string) {
  const { data, error } = await getAttendanceTable()
    .select('*')
    .eq('contact_id', contactId)
    .order('event_date', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch attendance: ${error.message}`);
  }

  return data ?? [];
}
