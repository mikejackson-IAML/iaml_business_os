-- Workflow Registry Schema
-- Migration: Add workflow metadata registry to n8n_brain schema
-- Date: 2026-01-18
-- Purpose: Central registry for all n8n workflows with metadata for dashboard display

-- ============================================
-- WORKFLOWS TABLE
-- Metadata registry for all n8n workflows
-- ============================================
CREATE TABLE IF NOT EXISTS n8n_brain.workflows (
  workflow_id TEXT PRIMARY KEY,           -- n8n workflow ID
  workflow_name TEXT NOT NULL,
  description TEXT,                        -- CEO summary (1 sentence)

  -- Organization
  department TEXT,                         -- 'digital', 'marketing', 'programs', 'leads'
  category TEXT,                           -- 'monitoring', 'sync', 'alert', 'integration', 'report'
  tags TEXT[] DEFAULT '{}',

  -- Ownership & Priority
  owner TEXT,                              -- Person responsible
  criticality TEXT DEFAULT 'medium'        -- 'critical', 'high', 'medium', 'low'
    CHECK (criticality IN ('critical', 'high', 'medium', 'low')),
  documentation_url TEXT,                  -- Link to README

  -- Trigger Configuration
  trigger_type TEXT,                       -- 'schedule', 'webhook', 'manual'
  schedule_description TEXT,               -- Human readable: "Every 5 minutes"
  schedule_cron TEXT,                      -- Cron expression if applicable

  -- Dependencies
  services TEXT[] DEFAULT '{}',            -- ['ghl', 'airtable', 'slack', 'supabase']

  -- Status (manually maintained)
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflows_department ON n8n_brain.workflows(department);
CREATE INDEX idx_workflows_category ON n8n_brain.workflows(category);
CREATE INDEX idx_workflows_criticality ON n8n_brain.workflows(criticality);
CREATE INDEX idx_workflows_active ON n8n_brain.workflows(is_active);
CREATE INDEX idx_workflows_services ON n8n_brain.workflows USING GIN (services);

-- Trigger to update updated_at
CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON n8n_brain.workflows
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

-- ============================================
-- FUNCTION: Get workflow registry with stats
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.get_workflow_registry()
RETURNS TABLE (
  workflow_id TEXT,
  workflow_name TEXT,
  description TEXT,
  department TEXT,
  category TEXT,
  tags TEXT[],
  owner TEXT,
  criticality TEXT,
  documentation_url TEXT,
  trigger_type TEXT,
  schedule_description TEXT,
  services TEXT[],
  is_active BOOLEAN,
  notes TEXT,
  runs_7d BIGINT,
  success_rate_7d NUMERIC,
  errors_7d BIGINT,
  unresolved_errors BIGINT,
  last_run TIMESTAMPTZ,
  avg_duration_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.workflow_id,
    w.workflow_name,
    w.description,
    w.department,
    w.category,
    w.tags,
    w.owner,
    w.criticality,
    w.documentation_url,
    w.trigger_type,
    w.schedule_description,
    w.services,
    w.is_active,
    w.notes,
    COALESCE(stats.runs_7d, 0) as runs_7d,
    stats.success_rate_7d,
    COALESCE(stats.errors_7d, 0) as errors_7d,
    COALESCE(stats.unresolved_errors, 0) as unresolved_errors,
    stats.last_run,
    stats.avg_duration_ms
  FROM n8n_brain.workflows w
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE wr.started_at > NOW() - INTERVAL '7 days') as runs_7d,
      ROUND(
        COUNT(*) FILTER (WHERE wr.status = 'success' AND wr.started_at > NOW() - INTERVAL '7 days')::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE wr.started_at > NOW() - INTERVAL '7 days'), 0) * 100,
        1
      ) as success_rate_7d,
      COUNT(*) FILTER (WHERE wr.status = 'error' AND wr.started_at > NOW() - INTERVAL '7 days') as errors_7d,
      COUNT(*) FILTER (WHERE wr.status = 'error' AND wr.resolved = FALSE) as unresolved_errors,
      MAX(wr.started_at) as last_run,
      AVG(wr.duration_ms) FILTER (WHERE wr.status = 'success' AND wr.started_at > NOW() - INTERVAL '7 days') as avg_duration_ms
    FROM n8n_brain.workflow_runs wr
    WHERE wr.workflow_id = w.workflow_id
  ) stats ON TRUE
  ORDER BY
    COALESCE(stats.unresolved_errors, 0) DESC,
    COALESCE(stats.errors_7d, 0) DESC,
    CASE w.criticality
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      WHEN 'low' THEN 4
    END,
    w.workflow_name;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCTION: Get single workflow detail
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.get_workflow_detail(p_workflow_id TEXT)
RETURNS TABLE (
  workflow_id TEXT,
  workflow_name TEXT,
  description TEXT,
  department TEXT,
  category TEXT,
  tags TEXT[],
  owner TEXT,
  criticality TEXT,
  documentation_url TEXT,
  trigger_type TEXT,
  schedule_description TEXT,
  schedule_cron TEXT,
  services TEXT[],
  is_active BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  runs_7d BIGINT,
  success_rate_7d NUMERIC,
  errors_7d BIGINT,
  unresolved_errors BIGINT,
  last_run TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  last_error TIMESTAMPTZ,
  avg_duration_ms NUMERIC,
  total_runs BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.workflow_id,
    w.workflow_name,
    w.description,
    w.department,
    w.category,
    w.tags,
    w.owner,
    w.criticality,
    w.documentation_url,
    w.trigger_type,
    w.schedule_description,
    w.schedule_cron,
    w.services,
    w.is_active,
    w.notes,
    w.created_at,
    COALESCE(stats.runs_7d, 0) as runs_7d,
    stats.success_rate_7d,
    COALESCE(stats.errors_7d, 0) as errors_7d,
    COALESCE(stats.unresolved_errors, 0) as unresolved_errors,
    stats.last_run,
    stats.last_success,
    stats.last_error,
    stats.avg_duration_ms,
    COALESCE(stats.total_runs, 0) as total_runs
  FROM n8n_brain.workflows w
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE wr.started_at > NOW() - INTERVAL '7 days') as runs_7d,
      ROUND(
        COUNT(*) FILTER (WHERE wr.status = 'success' AND wr.started_at > NOW() - INTERVAL '7 days')::NUMERIC /
        NULLIF(COUNT(*) FILTER (WHERE wr.started_at > NOW() - INTERVAL '7 days'), 0) * 100,
        1
      ) as success_rate_7d,
      COUNT(*) FILTER (WHERE wr.status = 'error' AND wr.started_at > NOW() - INTERVAL '7 days') as errors_7d,
      COUNT(*) FILTER (WHERE wr.status = 'error' AND wr.resolved = FALSE) as unresolved_errors,
      MAX(wr.started_at) as last_run,
      MAX(wr.started_at) FILTER (WHERE wr.status = 'success') as last_success,
      MAX(wr.started_at) FILTER (WHERE wr.status = 'error') as last_error,
      AVG(wr.duration_ms) FILTER (WHERE wr.status = 'success' AND wr.started_at > NOW() - INTERVAL '7 days') as avg_duration_ms,
      COUNT(*) as total_runs
    FROM n8n_brain.workflow_runs wr
    WHERE wr.workflow_id = w.workflow_id
  ) stats ON TRUE
  WHERE w.workflow_id = p_workflow_id;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCTION: Get workflow executions
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.get_workflow_executions(
  p_workflow_id TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
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
  has_known_fix BOOLEAN,
  trigger_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wr.id,
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
    CASE WHEN wr.error_fix_id IS NOT NULL THEN TRUE ELSE FALSE END as has_known_fix,
    wr.trigger_type
  FROM n8n_brain.workflow_runs wr
  WHERE wr.workflow_id = p_workflow_id
  ORDER BY wr.started_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCTION: Get workflow error summary
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.get_workflow_error_summary(p_workflow_id TEXT)
RETURNS TABLE (
  error_node TEXT,
  error_node_type TEXT,
  error_count BIGINT,
  last_occurrence TIMESTAMPTZ,
  unresolved_count BIGINT,
  sample_message TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wr.error_node,
    wr.error_node_type,
    COUNT(*) as error_count,
    MAX(wr.started_at) as last_occurrence,
    COUNT(*) FILTER (WHERE wr.resolved = FALSE) as unresolved_count,
    (ARRAY_AGG(wr.error_message ORDER BY wr.started_at DESC))[1] as sample_message
  FROM n8n_brain.workflow_runs wr
  WHERE wr.workflow_id = p_workflow_id
    AND wr.status = 'error'
  GROUP BY wr.error_node, wr.error_node_type
  ORDER BY unresolved_count DESC, error_count DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCTION: Register/update workflow
-- ============================================
CREATE OR REPLACE FUNCTION n8n_brain.register_workflow(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_department TEXT DEFAULT NULL,
  p_category TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_owner TEXT DEFAULT NULL,
  p_criticality TEXT DEFAULT 'medium',
  p_documentation_url TEXT DEFAULT NULL,
  p_trigger_type TEXT DEFAULT NULL,
  p_schedule_description TEXT DEFAULT NULL,
  p_schedule_cron TEXT DEFAULT NULL,
  p_services TEXT[] DEFAULT '{}',
  p_is_active BOOLEAN DEFAULT TRUE,
  p_notes TEXT DEFAULT NULL
)
RETURNS n8n_brain.workflows AS $$
DECLARE
  v_workflow n8n_brain.workflows;
BEGIN
  INSERT INTO n8n_brain.workflows (
    workflow_id,
    workflow_name,
    description,
    department,
    category,
    tags,
    owner,
    criticality,
    documentation_url,
    trigger_type,
    schedule_description,
    schedule_cron,
    services,
    is_active,
    notes
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    p_description,
    p_department,
    p_category,
    p_tags,
    p_owner,
    p_criticality,
    p_documentation_url,
    p_trigger_type,
    p_schedule_description,
    p_schedule_cron,
    p_services,
    p_is_active,
    p_notes
  )
  ON CONFLICT (workflow_id) DO UPDATE SET
    workflow_name = EXCLUDED.workflow_name,
    description = COALESCE(EXCLUDED.description, n8n_brain.workflows.description),
    department = COALESCE(EXCLUDED.department, n8n_brain.workflows.department),
    category = COALESCE(EXCLUDED.category, n8n_brain.workflows.category),
    tags = CASE WHEN EXCLUDED.tags = '{}' THEN n8n_brain.workflows.tags ELSE EXCLUDED.tags END,
    owner = COALESCE(EXCLUDED.owner, n8n_brain.workflows.owner),
    criticality = EXCLUDED.criticality,
    documentation_url = COALESCE(EXCLUDED.documentation_url, n8n_brain.workflows.documentation_url),
    trigger_type = COALESCE(EXCLUDED.trigger_type, n8n_brain.workflows.trigger_type),
    schedule_description = COALESCE(EXCLUDED.schedule_description, n8n_brain.workflows.schedule_description),
    schedule_cron = COALESCE(EXCLUDED.schedule_cron, n8n_brain.workflows.schedule_cron),
    services = CASE WHEN EXCLUDED.services = '{}' THEN n8n_brain.workflows.services ELSE EXCLUDED.services END,
    is_active = EXCLUDED.is_active,
    notes = COALESCE(EXCLUDED.notes, n8n_brain.workflows.notes)
  RETURNING * INTO v_workflow;

  RETURN v_workflow;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PUBLIC RPC FUNCTIONS (for dashboard access)
-- ============================================

-- Get workflow registry (public RPC)
CREATE OR REPLACE FUNCTION public.get_workflow_registry()
RETURNS TABLE (
  workflow_id TEXT,
  workflow_name TEXT,
  description TEXT,
  department TEXT,
  category TEXT,
  tags TEXT[],
  owner TEXT,
  criticality TEXT,
  documentation_url TEXT,
  trigger_type TEXT,
  schedule_description TEXT,
  services TEXT[],
  is_active BOOLEAN,
  notes TEXT,
  runs_7d BIGINT,
  success_rate_7d NUMERIC,
  errors_7d BIGINT,
  unresolved_errors BIGINT,
  last_run TIMESTAMPTZ,
  avg_duration_ms NUMERIC
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM n8n_brain.get_workflow_registry();
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get workflow detail (public RPC)
CREATE OR REPLACE FUNCTION public.get_workflow_detail(p_workflow_id TEXT)
RETURNS TABLE (
  workflow_id TEXT,
  workflow_name TEXT,
  description TEXT,
  department TEXT,
  category TEXT,
  tags TEXT[],
  owner TEXT,
  criticality TEXT,
  documentation_url TEXT,
  trigger_type TEXT,
  schedule_description TEXT,
  schedule_cron TEXT,
  services TEXT[],
  is_active BOOLEAN,
  notes TEXT,
  created_at TIMESTAMPTZ,
  runs_7d BIGINT,
  success_rate_7d NUMERIC,
  errors_7d BIGINT,
  unresolved_errors BIGINT,
  last_run TIMESTAMPTZ,
  last_success TIMESTAMPTZ,
  last_error TIMESTAMPTZ,
  avg_duration_ms NUMERIC,
  total_runs BIGINT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM n8n_brain.get_workflow_detail(p_workflow_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get workflow executions (public RPC)
CREATE OR REPLACE FUNCTION public.get_workflow_executions(
  p_workflow_id TEXT,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
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
  has_known_fix BOOLEAN,
  trigger_type TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM n8n_brain.get_workflow_executions(p_workflow_id, p_limit);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Get workflow error summary (public RPC)
CREATE OR REPLACE FUNCTION public.get_workflow_error_summary(p_workflow_id TEXT)
RETURNS TABLE (
  error_node TEXT,
  error_node_type TEXT,
  error_count BIGINT,
  last_occurrence TIMESTAMPTZ,
  unresolved_count BIGINT,
  sample_message TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM n8n_brain.get_workflow_error_summary(p_workflow_id);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_workflow_registry() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_workflow_detail(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_workflow_executions(TEXT, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_workflow_error_summary(TEXT) TO authenticated, anon;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE n8n_brain.workflows IS 'Central registry of all n8n workflows with metadata for dashboard display';
COMMENT ON FUNCTION n8n_brain.get_workflow_registry IS 'Get all registered workflows with execution stats';
COMMENT ON FUNCTION n8n_brain.get_workflow_detail IS 'Get single workflow with full stats';
COMMENT ON FUNCTION n8n_brain.get_workflow_executions IS 'Get recent executions for a workflow';
COMMENT ON FUNCTION n8n_brain.get_workflow_error_summary IS 'Get error breakdown by node/type for a workflow';
COMMENT ON FUNCTION n8n_brain.register_workflow IS 'Add or update a workflow in the registry';
