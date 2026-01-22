-- Create workflow_errors table for error handling logging
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS n8n_brain.workflow_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,
  execution_id TEXT,
  error_message TEXT,
  error_node TEXT,
  error_node_type TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_workflow_errors_workflow ON n8n_brain.workflow_errors(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_errors_created ON n8n_brain.workflow_errors(created_at DESC);

-- Grant access
GRANT SELECT, INSERT ON n8n_brain.workflow_errors TO authenticated, anon, service_role;

COMMENT ON TABLE n8n_brain.workflow_errors IS 'Logs workflow errors captured by the standard error handling pattern';
