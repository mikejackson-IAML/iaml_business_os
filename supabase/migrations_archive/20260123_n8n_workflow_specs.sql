-- n8n Workflow Specs: Documentation for testing workflows
-- Migration: Add workflow_specs table to n8n_brain schema
-- Date: 2026-01-23

-- ============================================
-- WORKFLOW SPECS TABLE
-- Stores testing documentation for each workflow
-- ============================================
CREATE TABLE IF NOT EXISTS n8n_brain.workflow_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to workflow
  workflow_id TEXT UNIQUE NOT NULL,           -- n8n workflow ID
  workflow_name TEXT NOT NULL,

  -- Documentation
  description TEXT NOT NULL,                  -- What this workflow does (plain English)
  purpose TEXT,                               -- Why it exists / business value

  -- Trigger information
  trigger_type TEXT NOT NULL,                 -- 'webhook', 'schedule', 'manual', 'event'
  trigger_config JSONB DEFAULT '{}',          -- Schedule cron, webhook path, etc.

  -- Test configuration
  test_payload JSONB,                         -- Sample payload for webhook triggers
  test_instructions TEXT,                     -- How to manually test if needed

  -- Expected behavior
  expected_behavior TEXT NOT NULL,            -- What should happen when it runs
  success_criteria JSONB NOT NULL DEFAULT '[]', -- Array of checkable criteria
  /*
    Example success_criteria:
    [
      {"type": "execution_success", "description": "Workflow completes without errors"},
      {"type": "database_check", "query": "SELECT count(*) FROM table WHERE...", "expected": ">0"},
      {"type": "output_check", "node": "Final Node", "field": "status", "expected": "success"},
      {"type": "side_effect", "description": "Record appears in GHL", "manual": true}
    ]
  */

  -- Dependencies
  dependencies JSONB DEFAULT '[]',            -- Other workflows or services needed
  /*
    Example:
    [
      {"type": "workflow", "id": "abc123", "name": "Auth Token Refresh"},
      {"type": "service", "name": "Airtable", "required": true},
      {"type": "credential", "name": "ghl-api"}
    ]
  */

  -- Input/Output documentation
  input_schema JSONB,                         -- Expected input structure
  output_schema JSONB,                        -- Expected output structure

  -- Error handling
  known_errors JSONB DEFAULT '[]',            -- Known error scenarios and how to handle
  /*
    Example:
    [
      {"error": "Rate limit exceeded", "action": "Wait 60s and retry"},
      {"error": "Invalid token", "action": "Run token refresh workflow first"}
    ]
  */

  -- Testing history
  last_tested_at TIMESTAMPTZ,
  last_test_result TEXT,                      -- 'pass', 'fail', 'partial'
  last_test_notes TEXT,
  test_count INTEGER DEFAULT 0,

  -- Metadata
  category TEXT,                              -- 'lead_intel', 'operations', 'web_intel', etc.
  owner TEXT,                                 -- Who's responsible for this workflow
  priority TEXT DEFAULT 'normal',             -- 'critical', 'high', 'normal', 'low'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_specs_workflow_id ON n8n_brain.workflow_specs(workflow_id);
CREATE INDEX IF NOT EXISTS idx_workflow_specs_category ON n8n_brain.workflow_specs(category);
CREATE INDEX IF NOT EXISTS idx_workflow_specs_priority ON n8n_brain.workflow_specs(priority);
CREATE INDEX IF NOT EXISTS idx_workflow_specs_last_tested ON n8n_brain.workflow_specs(last_tested_at);

-- ============================================
-- VIEW: Workflows Needing Testing
-- Prioritized list of workflows to test
-- ============================================
CREATE OR REPLACE VIEW n8n_brain.workflows_to_test AS
SELECT
  ws.workflow_id,
  ws.workflow_name,
  ws.description,
  ws.trigger_type,
  ws.category,
  ws.priority,
  ws.last_tested_at,
  ws.last_test_result,
  ws.test_count,
  wr.is_active,
  wr.test_status as registry_status,
  CASE
    -- Never tested = highest priority
    WHEN ws.last_tested_at IS NULL THEN 1
    -- Failed last time = high priority
    WHEN ws.last_test_result = 'fail' THEN 2
    -- Critical priority
    WHEN ws.priority = 'critical' THEN 3
    -- Active but not recently tested (>7 days)
    WHEN wr.is_active AND ws.last_tested_at < NOW() - INTERVAL '7 days' THEN 4
    -- High priority
    WHEN ws.priority = 'high' THEN 5
    -- Everything else
    ELSE 6
  END as test_priority_rank
FROM n8n_brain.workflow_specs ws
LEFT JOIN n8n_brain.workflow_registry wr ON wr.workflow_id = ws.workflow_id
WHERE
  -- Exclude recently tested (within 24h) unless failed
  ws.last_tested_at IS NULL
  OR ws.last_test_result = 'fail'
  OR ws.last_tested_at < NOW() - INTERVAL '24 hours'
ORDER BY test_priority_rank, ws.last_tested_at NULLS FIRST;

-- ============================================
-- VIEW: Testing Dashboard
-- Overview of testing status
-- ============================================
CREATE OR REPLACE VIEW n8n_brain.workflow_testing_dashboard AS
SELECT
  COUNT(*) FILTER (WHERE last_tested_at IS NULL) as never_tested,
  COUNT(*) FILTER (WHERE last_test_result = 'fail') as failing,
  COUNT(*) FILTER (WHERE last_test_result = 'pass' AND last_tested_at > NOW() - INTERVAL '7 days') as passing_recent,
  COUNT(*) FILTER (WHERE last_test_result = 'pass' AND last_tested_at <= NOW() - INTERVAL '7 days') as passing_stale,
  COUNT(*) FILTER (WHERE priority = 'critical' AND (last_tested_at IS NULL OR last_test_result = 'fail')) as critical_needing_attention,
  COUNT(*) as total_documented
FROM n8n_brain.workflow_specs;

-- ============================================
-- FUNCTION: Save or update workflow spec
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.save_workflow_spec(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_description TEXT,
  p_trigger_type TEXT,
  p_expected_behavior TEXT,
  p_success_criteria JSONB DEFAULT '[]',
  p_purpose TEXT DEFAULT NULL,
  p_trigger_config JSONB DEFAULT '{}',
  p_test_payload JSONB DEFAULT NULL,
  p_test_instructions TEXT DEFAULT NULL,
  p_dependencies JSONB DEFAULT '[]',
  p_input_schema JSONB DEFAULT NULL,
  p_output_schema JSONB DEFAULT NULL,
  p_known_errors JSONB DEFAULT '[]',
  p_category TEXT DEFAULT NULL,
  p_owner TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT 'normal'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO n8n_brain.workflow_specs (
    workflow_id, workflow_name, description, purpose,
    trigger_type, trigger_config, test_payload, test_instructions,
    expected_behavior, success_criteria, dependencies,
    input_schema, output_schema, known_errors,
    category, owner, priority
  ) VALUES (
    p_workflow_id, p_workflow_name, p_description, p_purpose,
    p_trigger_type, p_trigger_config, p_test_payload, p_test_instructions,
    p_expected_behavior, p_success_criteria, p_dependencies,
    p_input_schema, p_output_schema, p_known_errors,
    p_category, p_owner, p_priority
  )
  ON CONFLICT (workflow_id) DO UPDATE SET
    workflow_name = EXCLUDED.workflow_name,
    description = COALESCE(EXCLUDED.description, n8n_brain.workflow_specs.description),
    purpose = COALESCE(EXCLUDED.purpose, n8n_brain.workflow_specs.purpose),
    trigger_type = COALESCE(EXCLUDED.trigger_type, n8n_brain.workflow_specs.trigger_type),
    trigger_config = COALESCE(EXCLUDED.trigger_config, n8n_brain.workflow_specs.trigger_config),
    test_payload = COALESCE(EXCLUDED.test_payload, n8n_brain.workflow_specs.test_payload),
    test_instructions = COALESCE(EXCLUDED.test_instructions, n8n_brain.workflow_specs.test_instructions),
    expected_behavior = COALESCE(EXCLUDED.expected_behavior, n8n_brain.workflow_specs.expected_behavior),
    success_criteria = COALESCE(EXCLUDED.success_criteria, n8n_brain.workflow_specs.success_criteria),
    dependencies = COALESCE(EXCLUDED.dependencies, n8n_brain.workflow_specs.dependencies),
    input_schema = COALESCE(EXCLUDED.input_schema, n8n_brain.workflow_specs.input_schema),
    output_schema = COALESCE(EXCLUDED.output_schema, n8n_brain.workflow_specs.output_schema),
    known_errors = COALESCE(EXCLUDED.known_errors, n8n_brain.workflow_specs.known_errors),
    category = COALESCE(EXCLUDED.category, n8n_brain.workflow_specs.category),
    owner = COALESCE(EXCLUDED.owner, n8n_brain.workflow_specs.owner),
    priority = COALESCE(EXCLUDED.priority, n8n_brain.workflow_specs.priority),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Record test result
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.record_test_result(
  p_workflow_id TEXT,
  p_result TEXT,  -- 'pass', 'fail', 'partial'
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE n8n_brain.workflow_specs
  SET
    last_tested_at = NOW(),
    last_test_result = p_result,
    last_test_notes = p_notes,
    test_count = test_count + 1,
    updated_at = NOW()
  WHERE workflow_id = p_workflow_id;

  -- Also update the registry if it exists
  UPDATE n8n_brain.workflow_registry
  SET
    test_status = CASE
      WHEN p_result = 'pass' THEN 'verified'
      WHEN p_result = 'fail' THEN 'broken'
      ELSE 'tested'
    END,
    tested_at = NOW(),
    test_notes = p_notes,
    updated_at = NOW()
  WHERE workflow_id = p_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Get workflows to test
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.get_workflows_to_test(
  p_limit INTEGER DEFAULT 5,
  p_category TEXT DEFAULT NULL,
  p_priority TEXT DEFAULT NULL
)
RETURNS TABLE (
  workflow_id TEXT,
  workflow_name TEXT,
  description TEXT,
  trigger_type TEXT,
  category TEXT,
  priority TEXT,
  last_tested_at TIMESTAMPTZ,
  last_test_result TEXT,
  test_priority_rank INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wt.workflow_id,
    wt.workflow_name,
    wt.description,
    wt.trigger_type,
    wt.category,
    wt.priority,
    wt.last_tested_at,
    wt.last_test_result,
    wt.test_priority_rank
  FROM n8n_brain.workflows_to_test wt
  WHERE
    (p_category IS NULL OR wt.category = p_category)
    AND (p_priority IS NULL OR wt.priority = p_priority)
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER workflow_specs_updated_at
  BEFORE UPDATE ON n8n_brain.workflow_specs
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

-- Comments
COMMENT ON TABLE n8n_brain.workflow_specs IS 'Testing documentation and specs for n8n workflows';
COMMENT ON VIEW n8n_brain.workflows_to_test IS 'Prioritized list of workflows that need testing';
COMMENT ON VIEW n8n_brain.workflow_testing_dashboard IS 'Overview metrics for workflow testing status';
COMMENT ON FUNCTION n8n_brain.save_workflow_spec IS 'Create or update a workflow testing specification';
COMMENT ON FUNCTION n8n_brain.record_test_result IS 'Record the result of a workflow test';
COMMENT ON FUNCTION n8n_brain.get_workflows_to_test IS 'Get prioritized list of workflows to test';
