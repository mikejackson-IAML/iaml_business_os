-- Fix workflow logging functions to return JSON objects
-- Migration: 20260139
-- The functions were returning raw UUIDs which n8n couldn't parse properly

-- Drop existing functions first (return type can't be changed in place)
DROP FUNCTION IF EXISTS public.log_workflow_start(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.log_workflow_success(UUID);
DROP FUNCTION IF EXISTS public.log_workflow_error(UUID, TEXT, TEXT, TEXT, JSONB);
DROP FUNCTION IF EXISTS public.mark_workflow_notified(UUID, BOOLEAN, BOOLEAN);

-- ============================================
-- FUNCTION: log_workflow_start (FIXED)
-- Returns JSON object instead of raw UUID
-- ============================================
CREATE OR REPLACE FUNCTION public.log_workflow_start(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_execution_id TEXT DEFAULT NULL
)
RETURNS JSON AS $$
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

  RETURN json_build_object('run_id', v_run_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: log_workflow_success (FIXED)
-- Returns JSON confirmation
-- ============================================
CREATE OR REPLACE FUNCTION public.log_workflow_success(
  p_run_id UUID
)
RETURNS JSON AS $$
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

  RETURN json_build_object('success', true, 'run_id', p_run_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: log_workflow_error (FIXED)
-- Returns JSON confirmation
-- ============================================
CREATE OR REPLACE FUNCTION public.log_workflow_error(
  p_run_id UUID,
  p_error_message TEXT,
  p_error_node TEXT DEFAULT NULL,
  p_error_node_type TEXT DEFAULT NULL,
  p_error_details JSONB DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_started_at TIMESTAMPTZ;
  v_fix_id UUID;
BEGIN
  IF p_run_id IS NOT NULL THEN
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
  END IF;

  RETURN json_build_object('logged', true, 'has_known_fix', v_fix_id IS NOT NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: mark_workflow_notified (FIXED)
-- Returns JSON confirmation
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_workflow_notified(
  p_run_id UUID,
  p_slack_notified BOOLEAN DEFAULT FALSE,
  p_email_notified BOOLEAN DEFAULT FALSE
)
RETURNS JSON AS $$
BEGIN
  UPDATE n8n_brain.workflow_runs
  SET
    slack_notified = COALESCE(p_slack_notified, slack_notified),
    email_notified = COALESCE(p_email_notified, email_notified)
  WHERE id = p_run_id;

  RETURN json_build_object('updated', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-grant permissions (function signatures changed)
GRANT EXECUTE ON FUNCTION public.log_workflow_start(TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_workflow_success(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_workflow_error(UUID, TEXT, TEXT, TEXT, JSONB) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_workflow_notified(UUID, BOOLEAN, BOOLEAN) TO anon, authenticated, service_role;
