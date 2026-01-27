// Lead Intelligence - Data Health Queries
// Read operations for data health metrics view

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDataHealthTable() {
  return getServerClient().from('data_health_metrics') as any;
}

export async function getDataHealthMetrics() {
  const { data, error } = await getDataHealthTable()
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to fetch data health metrics: ${error.message}`);
  }

  return data;
}
