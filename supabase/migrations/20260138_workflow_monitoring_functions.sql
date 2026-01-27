-- Workflow Monitoring Functions for REST API Access
-- Migration: 20260137
-- Creates public schema functions callable via Supabase REST API

-- ============================================
-- FUNCTION: log_workflow_start
-- Called at beginning of workflow execution
-- ============================================
CREATE OR REPLACE FUNCTION public.log_workflow_start(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_execution_id TEXT DEFAULT NULL
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
    started_at
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    p_execution_id,
    'running',
    NOW()
  )
  RETURNING id INTO v_run_id;

  RETURN v_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: log_workflow_success
-- Called at end of successful workflow execution
-- ============================================
CREATE OR REPLACE FUNCTION public.log_workflow_success(
  p_run_id UUID
)
RETURNS VOID AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
BEGIN
  SELECT started_at INTO v_started_at
  FROM n8n_brain.workflow_runs
  WHERE id = p_run_id;

  UPDATE n8n_brain.workflow_runs
  SET
    status = 'success',
    completed_at = NOW(),
    duration_ms = EXTRACT(MILLISECONDS FROM (NOW() - v_started_at))::INTEGER
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: log_workflow_error
-- Called when workflow encounters an error
-- ============================================
CREATE OR REPLACE FUNCTION public.log_workflow_error(
  p_run_id UUID,
  p_error_message TEXT,
  p_error_node TEXT DEFAULT NULL,
  p_error_node_type TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_fix_id UUID;
BEGIN
  SELECT started_at INTO v_started_at
  FROM n8n_brain.workflow_runs
  WHERE id = p_run_id;

  -- Check for known fix
  SELECT id INTO v_fix_id
  FROM n8n_brain.error_fixes
  WHERE error_message ILIKE '%' || LEFT(p_error_message, 50) || '%'
    AND (node_type IS NULL OR node_type = p_error_node_type)
  ORDER BY times_succeeded DESC
  LIMIT 1;

  UPDATE n8n_brain.workflow_runs
  SET
    status = 'error',
    completed_at = NOW(),
    duration_ms = EXTRACT(MILLISECONDS FROM (NOW() - v_started_at))::INTEGER,
    error_message = p_error_message,
    error_node = p_error_node,
    error_node_type = p_error_node_type,
    error_details = p_error_details,
    error_fix_id = v_fix_id
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: mark_workflow_notified
-- Called after sending Slack/email notifications
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_workflow_notified(
  p_run_id UUID,
  p_slack_notified BOOLEAN DEFAULT FALSE,
  p_email_notified BOOLEAN DEFAULT FALSE
)
RETURNS VOID AS $$
BEGIN
  UPDATE n8n_brain.workflow_runs
  SET
    slack_notified = COALESCE(p_slack_notified, slack_notified),
    email_notified = COALESCE(p_email_notified, email_notified)
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS for REST API access
-- ============================================
GRANT EXECUTE ON FUNCTION public.log_workflow_start(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_workflow_success(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_workflow_error(UUID, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_workflow_notified(UUID, BOOLEAN, BOOLEAN) TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.log_workflow_start IS 'Start tracking a workflow execution - returns run_id';
COMMENT ON FUNCTION public.log_workflow_success IS 'Mark workflow execution as successful';
COMMENT ON FUNCTION public.log_workflow_error IS 'Log workflow error with details';
COMMENT ON FUNCTION public.mark_workflow_notified IS 'Mark that notifications have been sent';
