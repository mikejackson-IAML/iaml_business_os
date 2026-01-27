-- RPC functions for Workflow Registry Sync workflow
-- Migration: 20260144

-- Check if workflows table exists, create if not
CREATE TABLE IF NOT EXISTS n8n_brain.workflows (
  workflow_id TEXT PRIMARY KEY,
  workflow_name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  trigger_type TEXT,
  tags TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- FUNCTION: upsert_workflow_registry
-- Upsert workflow to registry
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_workflow_registry(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_is_active BOOLEAN DEFAULT false,
  p_trigger_type TEXT DEFAULT NULL,
  p_tags TEXT[] DEFAULT '{}',
  p_services TEXT[] DEFAULT '{}'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_action TEXT;
  v_result RECORD;
BEGIN
  INSERT INTO n8n_brain.workflows (
    workflow_id,
    workflow_name,
    is_active,
    trigger_type,
    tags,
    services
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    p_is_active,
    p_trigger_type,
    p_tags,
    p_services
  )
  ON CONFLICT (workflow_id) DO UPDATE SET
    workflow_name = EXCLUDED.workflow_name,
    is_active = EXCLUDED.is_active,
    trigger_type = COALESCE(EXCLUDED.trigger_type, n8n_brain.workflows.trigger_type),
    tags = CASE
      WHEN array_length(EXCLUDED.tags, 1) > 0 THEN EXCLUDED.tags
      ELSE n8n_brain.workflows.tags
    END,
    services = CASE
      WHEN array_length(EXCLUDED.services, 1) > 0 THEN EXCLUDED.services
      ELSE n8n_brain.workflows.services
    END,
    updated_at = NOW()
  RETURNING workflow_id, workflow_name,
    CASE WHEN xmax = 0 THEN 'inserted' ELSE 'updated' END INTO v_result;

  RETURN json_build_object(
    'workflow_id', v_result.workflow_id,
    'workflow_name', v_result.workflow_name,
    'action', CASE WHEN v_result IS NULL THEN 'none' ELSE 'upserted' END
  );
END;
$$;

-- ============================================
-- FUNCTION: log_workflow_sync
-- Log sync activity
-- ============================================
CREATE OR REPLACE FUNCTION public.log_workflow_sync(
  p_workflows_synced INTEGER,
  p_sync_timestamp TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Just return success - can add logging table later if needed
  RETURN json_build_object(
    'success', true,
    'workflows_synced', p_workflows_synced,
    'synced_at', COALESCE(p_sync_timestamp, NOW()::TEXT)
  );
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.upsert_workflow_registry(TEXT, TEXT, BOOLEAN, TEXT, TEXT[], TEXT[]) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.log_workflow_sync(INTEGER, TEXT) TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON n8n_brain.workflows TO anon, authenticated, service_role;
