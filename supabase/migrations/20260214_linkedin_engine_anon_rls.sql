-- Fix RLS policies for linkedin_engine schema
-- n8n workflows use the anon key via httpHeaderAuth credential,
-- which needs INSERT/UPDATE/SELECT on workflow_runs, workflow_errors,
-- and research_signals tables.

-- Grant schema usage to anon
GRANT USAGE ON SCHEMA linkedin_engine TO anon;

-- Grant table permissions to anon for n8n workflow tables
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.workflow_runs TO anon;
GRANT SELECT, INSERT ON linkedin_engine.research_signals TO anon;

-- Create workflow_errors table if it doesn't exist (may have been created outside migrations)
CREATE TABLE IF NOT EXISTS linkedin_engine.workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  error_message TEXT,
  error_node TEXT,
  error_details JSONB,
  execution_id TEXT,
  n8n_execution_id TEXT,
  occurred_at TIMESTAMPTZ DEFAULT NOW(),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

GRANT SELECT, INSERT ON linkedin_engine.workflow_errors TO anon;

-- Enable RLS on workflow_errors (if not already)
ALTER TABLE linkedin_engine.workflow_errors ENABLE ROW LEVEL SECURITY;

-- Add anon RLS policies
DO $$
DECLARE
  _tables TEXT[] := ARRAY['workflow_runs', 'research_signals', 'workflow_errors'];
  _t TEXT;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Anon full access for n8n" ON linkedin_engine.%I', _t);
    EXECUTE format('CREATE POLICY "Anon full access for n8n" ON linkedin_engine.%I FOR ALL TO anon USING (true) WITH CHECK (true)', _t);
  END LOOP;
END $$;
