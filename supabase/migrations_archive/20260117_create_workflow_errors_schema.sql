-- Workflow Error Tracking Schema (n8n-brain integration)
-- Migration: Add workflow execution tracking to n8n_brain schema
-- Date: 2026-01-17
-- Purpose: Universal error tracking for all n8n workflows with learning capabilities

-- ============================================
-- WORKFLOW RUNS TABLE
-- Tracks all workflow executions (success and failure)
-- ============================================
CREATE TABLE IF NOT EXISTS n8n_brain.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workflow identification
  workflow_id TEXT NOT NULL,                    -- n8n workflow ID
  workflow_name TEXT NOT NULL,                  -- Human-readable name
  execution_id TEXT,                            -- n8n execution ID

  -- Execution details
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'error', 'warning')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,

  -- Error details (when status = 'error')
  error_message TEXT,
  error_node TEXT,                              -- Which node failed
  error_node_type TEXT,                         -- Node type (for pattern matching)
  error_type TEXT,                              -- Error classification
  error_details JSONB DEFAULT '{}',             -- Full error context

  -- Learning integration
  error_fix_id UUID REFERENCES n8n_brain.error_fixes(id),  -- Link to known fix
  fix_applied BOOLEAN DEFAULT FALSE,
  fix_worked BOOLEAN,

  -- Retry tracking
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_retry_at TIMESTAMPTZ,

  -- Related records
  related_record_id UUID,                       -- e.g., speed_audit.id
  related_record_type TEXT,                     -- e.g., 'speed_audit'

  -- Notification tracking
  slack_notified BOOLEAN DEFAULT FALSE,
  slack_notified_at TIMESTAMPTZ,
  email_notified BOOLEAN DEFAULT FALSE,
  email_notified_at TIMESTAMPTZ,

  -- Resolution
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT,
  resolution_notes TEXT,

  -- Metadata
  trigger_type TEXT,                            -- 'schedule', 'manual', 'webhook'
  environment TEXT DEFAULT 'production',
  input_data JSONB,                             -- What triggered the workflow
  output_data JSONB,                            -- Final output (if success)

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brain_runs_workflow ON n8n_brain.workflow_runs(workflow_id);
CREATE INDEX idx_brain_runs_status ON n8n_brain.workflow_runs(status);
CREATE INDEX idx_brain_runs_started ON n8n_brain.workflow_runs(started_at DESC);
CREATE INDEX idx_brain_runs_unresolved ON n8n_brain.workflow_runs(resolved, status) WHERE resolved = FALSE AND status = 'error';
CREATE INDEX idx_brain_runs_related ON n8n_brain.workflow_runs(related_record_type, related_record_id);
CREATE INDEX idx_brain_runs_error_node ON n8n_brain.workflow_runs(error_node_type) WHERE status = 'error';

-- ============================================
-- NOTIFICATION TEMPLATES TABLE
-- Reusable notification templates for workflows
-- ============================================
CREATE TABLE IF NOT EXISTS n8n_brain.notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Template identity
  name TEXT NOT NULL UNIQUE,
  description TEXT,

  -- Template type
  channel TEXT NOT NULL CHECK (channel IN ('slack', 'email', 'both')),
  trigger_on TEXT NOT NULL CHECK (trigger_on IN ('error', 'success', 'warning', 'all')),

  -- Slack template
  slack_webhook_url TEXT,
  slack_channel TEXT,
  slack_template JSONB,                         -- Slack Block Kit template

  -- Email template
  email_to TEXT[],
  email_subject_template TEXT,
  email_body_template TEXT,

  -- Conditions
  min_severity TEXT DEFAULT 'low',              -- 'low', 'medium', 'high', 'critical'
  workflows TEXT[],                             -- NULL = all workflows

  enabled BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- VIEW: Recent Errors (for dashboard)
-- ============================================
CREATE OR REPLACE VIEW n8n_brain.workflow_errors_recent AS
SELECT
  id,
  workflow_id,
  workflow_name,
  execution_id,
  error_message,
  error_node,
  error_node_type,
  started_at,
  completed_at,
  duration_ms,
  retry_count,
  resolved,
  resolved_at,
  resolution_notes,
  slack_notified,
  email_notified,
  error_fix_id,
  CASE
    WHEN error_fix_id IS NOT NULL THEN TRUE
    ELSE FALSE
  END as has_known_fix
FROM n8n_brain.workflow_runs
WHERE status = 'error'
ORDER BY started_at DESC
LIMIT 50;

-- ============================================
-- VIEW: Workflow Health Summary
-- ============================================
CREATE OR REPLACE VIEW n8n_brain.workflow_health_summary AS
SELECT
  workflow_id,
  workflow_name,
  COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '7 days') as runs_last_7_days,
  COUNT(*) FILTER (WHERE status = 'success' AND started_at > NOW() - INTERVAL '7 days') as successes_last_7_days,
  COUNT(*) FILTER (WHERE status = 'error' AND started_at > NOW() - INTERVAL '7 days') as errors_last_7_days,
  COUNT(*) FILTER (WHERE status = 'error' AND resolved = FALSE) as unresolved_errors,
  MAX(started_at) FILTER (WHERE status = 'success') as last_success,
  MAX(started_at) FILTER (WHERE status = 'error') as last_error,
  AVG(duration_ms) FILTER (WHERE status = 'success' AND started_at > NOW() - INTERVAL '7 days') as avg_duration_ms,
  ROUND(
    COUNT(*) FILTER (WHERE status = 'success' AND started_at > NOW() - INTERVAL '7 days')::NUMERIC /
    NULLIF(COUNT(*) FILTER (WHERE started_at > NOW() - INTERVAL '7 days'), 0) * 100,
    1
  ) as success_rate_7d
FROM n8n_brain.workflow_runs
GROUP BY workflow_id, workflow_name;

-- ============================================
-- FUNCTION: Log workflow start
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.log_workflow_start(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_execution_id TEXT DEFAULT NULL,
  p_trigger_type TEXT DEFAULT 'manual',
  p_input_data JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_run_id UUID;
BEGIN
  INSERT INTO n8n_brain.workflow_runs (
    workflow_id,
    workflow_name,
    execution_id,
    status,
    trigger_type,
    input_data
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    p_execution_id,
    'running',
    p_trigger_type,
    p_input_data
  )
  RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Log workflow success
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.log_workflow_success(
  p_run_id UUID,
  p_output_data JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE n8n_brain.workflow_runs
  SET
    status = 'success',
    completed_at = NOW(),
    duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
    output_data = p_output_data
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Log workflow error (with auto-fix lookup)
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.log_workflow_error(
  p_run_id UUID,
  p_error_message TEXT,
  p_error_node TEXT DEFAULT NULL,
  p_error_node_type TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT '{}'
)
RETURNS TABLE (
  run_id UUID,
  known_fix_id UUID,
  fix_description TEXT
) AS $$
DECLARE
  v_fix_id UUID;
  v_fix_desc TEXT;
BEGIN
  -- Look for known fix in error_fixes
  SELECT ef.id, ef.fix_description
  INTO v_fix_id, v_fix_desc
  FROM n8n_brain.error_fixes ef
  WHERE (p_error_node_type IS NULL OR ef.node_type = p_error_node_type)
    AND to_tsvector('english', ef.error_message) @@ plainto_tsquery('english', p_error_message)
  ORDER BY ef.times_succeeded DESC
  LIMIT 1;

  -- Update the run record
  UPDATE n8n_brain.workflow_runs
  SET
    status = 'error',
    completed_at = NOW(),
    duration_ms = EXTRACT(EPOCH FROM (NOW() - started_at)) * 1000,
    error_message = p_error_message,
    error_node = p_error_node,
    error_node_type = p_error_node_type,
    error_details = p_error_details,
    error_fix_id = v_fix_id
  WHERE id = p_run_id;

  RETURN QUERY SELECT p_run_id, v_fix_id, v_fix_desc;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Mark notifications sent
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.mark_notifications_sent(
  p_run_id UUID,
  p_slack BOOLEAN DEFAULT FALSE,
  p_email BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  UPDATE n8n_brain.workflow_runs
  SET
    slack_notified = CASE WHEN p_slack THEN TRUE ELSE slack_notified END,
    slack_notified_at = CASE WHEN p_slack THEN NOW() ELSE slack_notified_at END,
    email_notified = CASE WHEN p_email THEN TRUE ELSE email_notified END,
    email_notified_at = CASE WHEN p_email THEN NOW() ELSE email_notified_at END
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Resolve error
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.resolve_workflow_error(
  p_run_id UUID,
  p_resolved_by TEXT,
  p_resolution_notes TEXT DEFAULT NULL,
  p_fix_worked BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE n8n_brain.workflow_runs
  SET
    resolved = TRUE,
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_resolution_notes,
    fix_worked = p_fix_worked
  WHERE id = p_run_id;

  -- If a fix was applied and worked, increment success count
  IF p_fix_worked = TRUE THEN
    UPDATE n8n_brain.error_fixes
    SET times_succeeded = times_succeeded + 1
    WHERE id = (SELECT error_fix_id FROM n8n_brain.workflow_runs WHERE id = p_run_id);
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: Update timestamps
-- ============================================
CREATE TRIGGER workflow_runs_updated_at
  BEFORE UPDATE ON n8n_brain.workflow_runs
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

CREATE TRIGGER notification_templates_updated_at
  BEFORE UPDATE ON n8n_brain.notification_templates
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

-- ============================================
-- INSERT DEFAULT NOTIFICATION TEMPLATE
-- ============================================
INSERT INTO n8n_brain.notification_templates (
  name,
  description,
  channel,
  trigger_on,
  email_subject_template,
  email_body_template
) VALUES (
  'default-error-notification',
  'Default error notification for all workflows',
  'both',
  'error',
  'Workflow Failed: {{workflow_name}}',
  E'<h2>Workflow Error</h2>\n<p><strong>Workflow:</strong> {{workflow_name}}</p>\n<p><strong>Error:</strong> {{error_message}}</p>\n<p><strong>Failed Node:</strong> {{error_node}}</p>\n<p><strong>Time:</strong> {{started_at}}</p>\n<p><a href="{{dashboard_url}}">View in Dashboard</a></p>'
) ON CONFLICT (name) DO NOTHING;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE n8n_brain.workflow_runs IS 'Universal workflow execution tracking with error learning integration';
COMMENT ON TABLE n8n_brain.notification_templates IS 'Reusable notification templates for workflow alerts';
COMMENT ON FUNCTION n8n_brain.log_workflow_start IS 'Call at workflow start to begin tracking';
COMMENT ON FUNCTION n8n_brain.log_workflow_success IS 'Call on workflow success to complete tracking';
COMMENT ON FUNCTION n8n_brain.log_workflow_error IS 'Call on workflow error - auto-looks up known fixes';
