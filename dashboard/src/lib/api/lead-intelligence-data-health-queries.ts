// Lead Intelligence - Data Health Queries
// Read operations for data health metrics view

import { getServerClient } from '@/lib/supabase/server';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getDataHealthTable() {
  return getServerClient().from('data_health_metrics') as any;
}

export interface DataHealthResult {
  email_valid_pct: number;
  email_invalid_count: number;
  stale_count: number;
  missing_email_count: number;
  missing_phone_count: number;
  missing_title_count: number;
  last_calculated: string;
  data_quality_score: number;
}

export async function getDataHealthMetrics(): Promise<DataHealthResult> {
  const { data, error } = await getDataHealthTable()
    .select('*')
    .single();

  if (error) {
    throw new Error(`Failed to fetch data health metrics: ${error.message}`);
  }

  // The view returns columns with different names than the UI expects.
  // Transform them here to match the DataHealthSection component interface.
  return {
    email_valid_pct: Number(data.email_health_pct) || 0,
    email_invalid_count: Number(data.invalid_emails) || 0,
    stale_count: Number(data.stale_contacts) || 0,
    missing_email_count: Number(data.unknown_emails) || 0,
    missing_phone_count: 0, // not tracked in the current view
    missing_title_count: 0, // not tracked in the current view
    last_calculated: new Date().toISOString(),
    data_quality_score: Number(data.overall_quality_score) || 0,
  };
}
