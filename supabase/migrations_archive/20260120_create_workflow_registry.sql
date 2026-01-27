-- Workflow Registry
-- Migration: Track n8n workflows with testing status
-- Date: 2026-01-20
-- Purpose: Maintain a registry of all n8n workflows with testing status for quality assurance
--
-- NOTE: This migration has been CONSOLIDATED into the main n8n-brain schema:
--       supabase/migrations/20260111_create_n8n_brain_schema.sql
--       This file is kept for reference but the canonical version is in the main schema.

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

-- Indexes
CREATE INDEX idx_workflow_registry_status ON n8n_brain.workflow_registry(test_status);
CREATE INDEX idx_workflow_registry_category ON n8n_brain.workflow_registry(category);
CREATE INDEX idx_workflow_registry_active ON n8n_brain.workflow_registry(is_active);

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
-- Drop any existing versions first to avoid signature conflicts
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], BOOLEAN, BOOLEAN, BOOLEAN);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[]);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], BOOLEAN);
DROP FUNCTION IF EXISTS n8n_brain.register_workflow(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT[], BOOLEAN, BOOLEAN);

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
-- Drop any existing versions first to avoid signature conflicts
DROP FUNCTION IF EXISTS n8n_brain.mark_workflow_tested(TEXT, TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.mark_workflow_tested(TEXT);
DROP FUNCTION IF EXISTS n8n_brain.mark_workflow_tested(TEXT, TEXT);
DROP FUNCTION IF EXISTS n8n_brain.mark_workflow_tested(TEXT, TEXT, TEXT);

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

-- ============================================
-- TRIGGER: Update timestamps
-- ============================================
CREATE TRIGGER workflow_registry_updated_at
  BEFORE UPDATE ON n8n_brain.workflow_registry
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE n8n_brain.workflow_registry IS 'Registry of all n8n workflows with testing status and metadata';
COMMENT ON VIEW n8n_brain.workflow_test_summary IS 'Summary of workflow testing progress by status';
COMMENT ON VIEW n8n_brain.workflows_needing_attention IS 'Workflows that need testing, review, or fixes';
COMMENT ON FUNCTION n8n_brain.register_workflow IS 'Register or update a workflow in the registry';
COMMENT ON FUNCTION n8n_brain.mark_workflow_tested IS 'Update the testing status of a workflow';
