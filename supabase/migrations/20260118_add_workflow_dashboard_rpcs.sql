-- Workflow Dashboard RPC Functions
-- Migration: Add dashboard-accessible functions for workflow health
-- Date: 2026-01-18

-- ============================================
-- FUNCTION: Get recent workflow errors
-- ============================================
CREATE OR REPLACE FUNCTION public.get_recent_workflow_errors(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
  id UUID,
  workflow_id TEXT,
  workflow_name TEXT,
  execution_id TEXT,
  status TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  error_message TEXT,
  error_node TEXT,
  error_node_type TEXT,
  resolved BOOLEAN,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  slack_notified BOOLEAN,
  email_notified BOOLEAN,
  has_known_fix BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wr.id,
    wr.workflow_id,
    wr.workflow_name,
    wr.execution_id,
    wr.status,
    wr.started_at,
    wr.completed_at,
    wr.duration_ms,
    wr.error_message,
    wr.error_node,
    wr.error_node_type,
    wr.resolved,
    wr.resolved_at,
    wr.resolution_notes,
    wr.slack_notified,
    wr.email_notified,
    CASE
      WHEN wr.error_fix_id IS NOT NULL THEN TRUE
      ELSE FALSE
    END as has_known_fix
  FROM n8n_brain.workflow_runs wr
  WHERE wr.status = 'error'
  ORDER BY wr.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
-- ============================================
-- FUNCTION: Get workflow health summary
-- ============================================
CREATE OR REPLACE FUNCTION public.get_workflow_health_summary()
RETURNS TABLE (
  workflow_id TEXT,
  workflow_name TEXT,
  runs_last_7_days BIGINT,
  successes_last_7_days BIGINT,
  errors_last_7_days BIGINT,
  unresolved_errors BIGINT,
  last_success TIMESTAMPTZ,
  last_error TIMESTAMPTZ,
  avg_duration_ms NUMERIC,
  success_rate_7d NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wr.workflow_id,
    wr.workflow_name,
    COUNT(*) FILTER (WHERE wr.started_at > NOW() - INTERVAL '7 days') as runs_last_7_days,
    COUNT(*) FILTER (WHERE wr.status = 'success' AND wr.started_at > NOW() - INTERVAL '7 days') as successes_last_7_days,
    COUNT(*) FILTER (WHERE wr.status = 'error' AND wr.started_at > NOW() - INTERVAL '7 days') as errors_last_7_days,
    COUNT(*) FILTER (WHERE wr.status = 'error' AND wr.resolved = FALSE) as unresolved_errors,
    MAX(wr.started_at) FILTER (WHERE wr.status = 'success') as last_success,
    MAX(wr.started_at) FILTER (WHERE wr.status = 'error') as last_error,
    AVG(wr.duration_ms) FILTER (WHERE wr.status = 'success' AND wr.started_at > NOW() - INTERVAL '7 days') as avg_duration_ms,
    ROUND(
      COUNT(*) FILTER (WHERE wr.status = 'success' AND wr.started_at > NOW() - INTERVAL '7 days')::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE wr.started_at > NOW() - INTERVAL '7 days'), 0) * 100,
      1
    ) as success_rate_7d
  FROM n8n_brain.workflow_runs wr
  GROUP BY wr.workflow_id, wr.workflow_name
  ORDER BY unresolved_errors DESC, errors_last_7_days DESC;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
-- ============================================
-- FUNCTION: Get workflow stats summary
-- ============================================
CREATE OR REPLACE FUNCTION public.get_workflow_stats_summary()
RETURNS TABLE (
  total_workflows BIGINT,
  errors_today BIGINT,
  unresolved_errors BIGINT,
  success_rate_7d NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (SELECT COUNT(DISTINCT wr.workflow_id) FROM n8n_brain.workflow_runs wr) as total_workflows,
    (SELECT COUNT(*) FROM n8n_brain.workflow_runs wr
     WHERE wr.status = 'error'
     AND wr.started_at >= CURRENT_DATE) as errors_today,
    (SELECT COUNT(*) FROM n8n_brain.workflow_runs wr
     WHERE wr.status = 'error'
     AND wr.resolved = FALSE) as unresolved_errors,
    (SELECT ROUND(
      COUNT(*) FILTER (WHERE wr.status = 'success')::NUMERIC /
      NULLIF(COUNT(*) FILTER (WHERE wr.status != 'running'), 0) * 100,
      1
    ) FROM n8n_brain.workflow_runs wr
    WHERE wr.started_at > NOW() - INTERVAL '7 days') as success_rate_7d;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;
-- ============================================
-- FUNCTION: Resolve error from dashboard
-- ============================================
CREATE OR REPLACE FUNCTION public.resolve_workflow_error_dashboard(
  p_run_id UUID,
  p_resolved_by TEXT,
  p_resolution_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE n8n_brain.workflow_runs
  SET
    resolved = TRUE,
    resolved_at = NOW(),
    resolved_by = p_resolved_by,
    resolution_notes = p_resolution_notes
  WHERE id = p_run_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_recent_workflow_errors(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_workflow_health_summary() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_workflow_stats_summary() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.resolve_workflow_error_dashboard(UUID, TEXT, TEXT) TO authenticated;
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION public.get_recent_workflow_errors IS 'Dashboard RPC: Get recent workflow errors for display';
COMMENT ON FUNCTION public.get_workflow_health_summary IS 'Dashboard RPC: Get workflow health summary per workflow';
COMMENT ON FUNCTION public.get_workflow_stats_summary IS 'Dashboard RPC: Get aggregate workflow stats';
COMMENT ON FUNCTION public.resolve_workflow_error_dashboard IS 'Dashboard RPC: Mark an error as resolved';
