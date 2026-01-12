/**
 * Supabase client for n8n-brain
 * Connects to the n8n_brain schema in Supabase
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error(
    "Error: SUPABASE_URL and SUPABASE_SERVICE_KEY environment variables are required"
  );
  process.exit(1);
}

// Create Supabase client with service role key for full access
export const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  db: {
    schema: "n8n_brain",
  },
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Helper to run raw SQL (for helper functions)
export async function runSQL(query, params = []) {
  const { data, error } = await supabase.rpc("exec_sql", {
    query,
    params,
  });
  if (error) throw error;
  return data;
}

export default supabase;
