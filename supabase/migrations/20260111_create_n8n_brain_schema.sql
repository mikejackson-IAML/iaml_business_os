-- n8n-brain: Learning Layer for n8n Workflow Building
-- Migration: Create n8n_brain schema and tables
-- Date: 2026-01-11

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS n8n_brain;

-- ============================================
-- PATTERNS TABLE
-- Stores successful workflow patterns for reuse
-- ============================================
CREATE TABLE n8n_brain.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identity
  name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- The actual workflow
  workflow_json JSONB NOT NULL,

  -- Searchability
  tags TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',           -- ['supabase', 'ghl', 'heyreach']
  node_types TEXT[] DEFAULT '{}',         -- ['webhook', 'postgres', 'httpRequest']
  trigger_type TEXT,                      -- 'webhook', 'schedule', 'manual', etc.

  -- Metadata
  source_workflow_id TEXT,                -- ID from n8n if imported
  source_workflow_name TEXT,
  notes TEXT,

  -- Learning metrics
  success_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast pattern lookup
CREATE INDEX idx_patterns_services ON n8n_brain.patterns USING GIN (services);
CREATE INDEX idx_patterns_node_types ON n8n_brain.patterns USING GIN (node_types);
CREATE INDEX idx_patterns_tags ON n8n_brain.patterns USING GIN (tags);
CREATE INDEX idx_patterns_trigger ON n8n_brain.patterns (trigger_type);
CREATE INDEX idx_patterns_success ON n8n_brain.patterns (success_count DESC);

-- ============================================
-- ERROR FIXES TABLE
-- Maps error messages to proven fixes
-- ============================================
CREATE TABLE n8n_brain.error_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Error identification
  error_message TEXT NOT NULL,
  error_code TEXT,
  node_type TEXT,                         -- 'n8n-nodes-base.postgres', etc.
  operation TEXT,                         -- 'executeQuery', 'create', etc.

  -- The fix
  fix_description TEXT NOT NULL,
  fix_example JSONB,                      -- Example of correct config

  -- Effectiveness tracking
  times_applied INTEGER DEFAULT 1,
  times_succeeded INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast error lookup
CREATE INDEX idx_error_fixes_message ON n8n_brain.error_fixes
  USING GIN (to_tsvector('english', error_message));
CREATE INDEX idx_error_fixes_node ON n8n_brain.error_fixes (node_type);
CREATE INDEX idx_error_fixes_operation ON n8n_brain.error_fixes (operation);

-- ============================================
-- CREDENTIALS TABLE
-- Maps service names to credential IDs (NO SECRETS)
-- ============================================
CREATE TABLE n8n_brain.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Mapping (service_name is the key we use to look up)
  service_name TEXT UNIQUE NOT NULL,      -- 'supabase', 'ghl', 'gemini'
  credential_id TEXT NOT NULL,            -- 'EgmvZHbvINHsh6PR'
  credential_name TEXT,                   -- 'Supabase Postgres'
  credential_type TEXT,                   -- 'postgres', 'httpHeaderAuth'

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONFIDENCE LOG TABLE
-- Tracks autonomous action outcomes for calibration
-- ============================================
CREATE TABLE n8n_brain.confidence_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was attempted
  task_description TEXT NOT NULL,
  services_involved TEXT[],
  node_types_involved TEXT[],

  -- Confidence at time of action
  confidence_score INTEGER,
  confidence_factors JSONB,
  recommendation TEXT,                    -- 'ask_first', 'do_and_verify', 'autonomous'

  -- What happened
  action_taken TEXT,                      -- 'created_workflow', 'fixed_error', etc.
  outcome TEXT NOT NULL,                  -- 'success', 'failure', 'partial'
  outcome_notes TEXT,

  -- For learning
  pattern_id UUID REFERENCES n8n_brain.patterns(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for confidence analysis
CREATE INDEX idx_confidence_outcome ON n8n_brain.confidence_log (outcome);
CREATE INDEX idx_confidence_services ON n8n_brain.confidence_log USING GIN (services_involved);
CREATE INDEX idx_confidence_created ON n8n_brain.confidence_log (created_at DESC);

-- ============================================
-- PREFERENCES TABLE
-- User preferences for workflow building
-- ============================================
CREATE TABLE n8n_brain.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  category TEXT NOT NULL,                 -- 'naming', 'error_handling', 'style'
  key TEXT NOT NULL,
  value JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(category, key)
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate success rate for error fixes
CREATE OR REPLACE FUNCTION n8n_brain.get_fix_success_rate(fix_id UUID)
RETURNS NUMERIC AS $$
  SELECT
    CASE WHEN times_applied > 0
    THEN (times_succeeded::NUMERIC / times_applied)
    ELSE 0 END
  FROM n8n_brain.error_fixes
  WHERE id = fix_id;
$$ LANGUAGE SQL STABLE;

-- Function to find similar patterns by services
CREATE OR REPLACE FUNCTION n8n_brain.find_patterns_by_services(
  p_services TEXT[],
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  services TEXT[],
  node_types TEXT[],
  trigger_type TEXT,
  success_count INTEGER,
  overlap_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.services,
    p.node_types,
    p.trigger_type,
    p.success_count,
    (SELECT COUNT(*)::INTEGER FROM unnest(p.services) s WHERE s = ANY(p_services)) as overlap_count
  FROM n8n_brain.patterns p
  WHERE p.services && p_services  -- Array overlap operator
  ORDER BY overlap_count DESC, p.success_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to search error fixes by message
CREATE OR REPLACE FUNCTION n8n_brain.search_error_fixes(
  p_error_message TEXT,
  p_node_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  error_message TEXT,
  node_type TEXT,
  fix_description TEXT,
  fix_example JSONB,
  times_applied INTEGER,
  times_succeeded INTEGER,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ef.id,
    ef.error_message,
    ef.node_type,
    ef.fix_description,
    ef.fix_example,
    ef.times_applied,
    ef.times_succeeded,
    ts_rank(to_tsvector('english', ef.error_message), plainto_tsquery('english', p_error_message)) as relevance
  FROM n8n_brain.error_fixes ef
  WHERE
    to_tsvector('english', ef.error_message) @@ plainto_tsquery('english', p_error_message)
    AND (p_node_type IS NULL OR ef.node_type = p_node_type)
  ORDER BY relevance DESC, ef.times_succeeded DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION n8n_brain.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER patterns_updated_at
  BEFORE UPDATE ON n8n_brain.patterns
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

CREATE TRIGGER error_fixes_updated_at
  BEFORE UPDATE ON n8n_brain.error_fixes
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

CREATE TRIGGER credentials_updated_at
  BEFORE UPDATE ON n8n_brain.credentials
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON n8n_brain.preferences
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

-- ============================================
-- WORKFLOW REGISTRY TABLE
-- Tracks all n8n workflows and their test status
-- ============================================
CREATE TABLE IF NOT EXISTS n8n_brain.workflow_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workflow identification
  workflow_id TEXT UNIQUE NOT NULL,           -- n8n workflow ID (e.g., 'HnZQopXL7xjZnX3O')
  workflow_name TEXT NOT NULL,                -- Human-readable name
  workflow_url TEXT,                          -- Full URL to workflow in n8n

  -- Classification
  category TEXT,                              -- 'lead_intelligence', 'operations', 'marketing', etc.
  department TEXT,                            -- Which department owns this
  trigger_type TEXT,                          -- 'schedule', 'webhook', 'manual'
  schedule TEXT,                              -- If scheduled, when (e.g., 'Daily 6am')

  -- Testing status
  test_status TEXT DEFAULT 'untested' CHECK (test_status IN (
    'untested',           -- Never tested
    'in_progress',        -- Currently being tested
    'tested',             -- Tested but not verified in production
    'verified',           -- Verified working in production
    'needs_review',       -- Was working, needs re-testing
    'broken'              -- Known to be broken
  )),
  tested_at TIMESTAMPTZ,
  tested_by TEXT,
  test_notes TEXT,

  -- Production status
  is_active BOOLEAN DEFAULT FALSE,            -- Currently active in n8n
  last_successful_run TIMESTAMPTZ,
  last_failed_run TIMESTAMPTZ,

  -- Error handling
  has_error_handling BOOLEAN DEFAULT FALSE,   -- Has standard error handling pattern
  has_slack_alerts BOOLEAN DEFAULT FALSE,     -- Sends Slack alerts on error
  has_dashboard_logging BOOLEAN DEFAULT FALSE, -- Logs to n8n_brain.workflow_runs

  -- Documentation
  has_readme BOOLEAN DEFAULT FALSE,           -- Has README in business-os/workflows/
  readme_path TEXT,                           -- Path to README file

  -- Dependencies
  services TEXT[],                            -- Services used (e.g., ['smartlead', 'supabase'])
  credentials TEXT[],                         -- Credential names used
  depends_on TEXT[],                          -- Other workflow IDs this depends on

  -- Metadata
  description TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for workflow registry
CREATE INDEX IF NOT EXISTS idx_workflow_registry_status ON n8n_brain.workflow_registry(test_status);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_category ON n8n_brain.workflow_registry(category);
CREATE INDEX IF NOT EXISTS idx_workflow_registry_active ON n8n_brain.workflow_registry(is_active);

-- ============================================
-- VIEW: Workflow Test Summary
-- Dashboard view of workflow testing progress
-- ============================================
CREATE OR REPLACE VIEW n8n_brain.workflow_test_summary AS
SELECT
  test_status,
  COUNT(*) as count,
  ARRAY_AGG(workflow_name ORDER BY workflow_name) as workflows
FROM n8n_brain.workflow_registry
GROUP BY test_status
ORDER BY
  CASE test_status
    WHEN 'broken' THEN 1
    WHEN 'needs_review' THEN 2
    WHEN 'untested' THEN 3
    WHEN 'in_progress' THEN 4
    WHEN 'tested' THEN 5
    WHEN 'verified' THEN 6
  END;

-- ============================================
-- VIEW: Workflows Needing Attention
-- Workflows that need testing or are broken
-- ============================================
CREATE OR REPLACE VIEW n8n_brain.workflows_needing_attention AS
SELECT
  workflow_id,
  workflow_name,
  workflow_url,
  category,
  test_status,
  is_active,
  has_error_handling,
  has_dashboard_logging,
  test_notes,
  CASE
    WHEN test_status = 'broken' THEN 'CRITICAL: Broken'
    WHEN test_status = 'needs_review' THEN 'HIGH: Needs Review'
    WHEN is_active AND test_status = 'untested' THEN 'HIGH: Active but Untested'
    WHEN test_status = 'untested' THEN 'MEDIUM: Untested'
    WHEN is_active AND NOT has_error_handling THEN 'MEDIUM: Missing Error Handling'
    WHEN is_active AND NOT has_dashboard_logging THEN 'LOW: Missing Dashboard Logging'
    ELSE 'OK'
  END as priority
FROM n8n_brain.workflow_registry
WHERE test_status IN ('untested', 'broken', 'needs_review', 'in_progress')
   OR (is_active AND (NOT has_error_handling OR NOT has_dashboard_logging))
ORDER BY
  CASE
    WHEN test_status = 'broken' THEN 1
    WHEN test_status = 'needs_review' THEN 2
    WHEN is_active AND test_status = 'untested' THEN 3
    WHEN test_status = 'untested' THEN 4
    ELSE 5
  END;

-- ============================================
-- FUNCTION: Register or update workflow
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.register_workflow(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_category TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_trigger_type TEXT DEFAULT NULL,
  p_schedule TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_services TEXT[] DEFAULT '{}',
  p_has_error_handling BOOLEAN DEFAULT FALSE,
  p_has_slack_alerts BOOLEAN DEFAULT FALSE,
  p_has_dashboard_logging BOOLEAN DEFAULT FALSE
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO n8n_brain.workflow_registry (
    workflow_id,
    workflow_name,
    workflow_url,
    category,
    department,
    trigger_type,
    schedule,
    description,
    services,
    has_error_handling,
    has_slack_alerts,
    has_dashboard_logging
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    'https://n8n.realtyamp.ai/workflow/' || p_workflow_id,
    p_category,
    p_department,
    p_trigger_type,
    p_schedule,
    p_description,
    p_services,
    p_has_error_handling,
    p_has_slack_alerts,
    p_has_dashboard_logging
  )
  ON CONFLICT (workflow_id) DO UPDATE SET
    workflow_name = EXCLUDED.workflow_name,
    workflow_url = EXCLUDED.workflow_url,
    category = COALESCE(EXCLUDED.category, n8n_brain.workflow_registry.category),
    department = COALESCE(EXCLUDED.department, n8n_brain.workflow_registry.department),
    trigger_type = COALESCE(EXCLUDED.trigger_type, n8n_brain.workflow_registry.trigger_type),
    schedule = COALESCE(EXCLUDED.schedule, n8n_brain.workflow_registry.schedule),
    description = COALESCE(EXCLUDED.description, n8n_brain.workflow_registry.description),
    services = COALESCE(EXCLUDED.services, n8n_brain.workflow_registry.services),
    has_error_handling = EXCLUDED.has_error_handling,
    has_slack_alerts = EXCLUDED.has_slack_alerts,
    has_dashboard_logging = EXCLUDED.has_dashboard_logging,
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Mark workflow as tested
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.mark_workflow_tested(
  p_workflow_id TEXT,
  p_test_status TEXT DEFAULT 'verified',
  p_tested_by TEXT DEFAULT 'claude',
  p_test_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE n8n_brain.workflow_registry
  SET
    test_status = p_test_status,
    tested_at = NOW(),
    tested_by = p_tested_by,
    test_notes = COALESCE(p_test_notes, test_notes),
    updated_at = NOW()
  WHERE workflow_id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger for workflow_registry updated_at
CREATE TRIGGER workflow_registry_updated_at
  BEFORE UPDATE ON n8n_brain.workflow_registry
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA n8n_brain IS 'Learning layer for n8n workflow building - stores patterns, error fixes, credentials, confidence data, and workflow registry';
COMMENT ON TABLE n8n_brain.patterns IS 'Successful workflow patterns that can be reused as templates';
COMMENT ON TABLE n8n_brain.error_fixes IS 'Error message to fix mappings learned from debugging';
COMMENT ON TABLE n8n_brain.credentials IS 'Service name to n8n credential ID mappings (no secrets stored)';
COMMENT ON TABLE n8n_brain.confidence_log IS 'Log of autonomous actions and outcomes for confidence calibration';
COMMENT ON TABLE n8n_brain.preferences IS 'User preferences for naming conventions, error handling, and style';
COMMENT ON TABLE n8n_brain.workflow_registry IS 'Registry of all n8n workflows with testing status and metadata';
COMMENT ON VIEW n8n_brain.workflow_test_summary IS 'Summary of workflow testing progress by status';
COMMENT ON VIEW n8n_brain.workflows_needing_attention IS 'Workflows that need testing, review, or fixes';
COMMENT ON FUNCTION n8n_brain.register_workflow IS 'Register or update a workflow in the registry';
COMMENT ON FUNCTION n8n_brain.mark_workflow_tested IS 'Update the testing status of a workflow';
