-- Create public wrapper RPC for content inventory upsert
-- This bypasses the schema permission issue by using a function in public schema
-- Migration: 2026-02-01

-- First ensure the web_intel schema exists and has proper permissions
GRANT USAGE ON SCHEMA web_intel TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA web_intel TO service_role;

CREATE OR REPLACE FUNCTION public.upsert_content_inventory(
  p_url TEXT,
  p_path TEXT,
  p_content_type TEXT DEFAULT 'page',
  p_discovered_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE(id UUID, url TEXT, path TEXT, content_type TEXT)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO web_intel.content_inventory (url, page_path, path, content_type, discovered_at)
  VALUES (p_url, p_path, p_path, p_content_type, p_discovered_at)
  ON CONFLICT (url) DO UPDATE SET
    path = EXCLUDED.path,
    page_path = EXCLUDED.page_path,
    content_type = EXCLUDED.content_type,
    updated_at = NOW()
  RETURNING
    web_intel.content_inventory.id,
    web_intel.content_inventory.url,
    web_intel.content_inventory.path,
    web_intel.content_inventory.content_type;
END;
$$;

-- Grant execute to service_role
GRANT EXECUTE ON FUNCTION public.upsert_content_inventory TO service_role;

COMMENT ON FUNCTION public.upsert_content_inventory IS 'Upsert a content inventory record - used by n8n workflows';

-- Also create a similar function for collection_log if it doesn't exist
CREATE OR REPLACE FUNCTION public.log_collection_run(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_status TEXT,
  p_records_processed INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_error_node TEXT DEFAULT NULL
)
RETURNS TABLE(id UUID)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  INSERT INTO web_intel.collection_log (
    workflow_id,
    workflow_name,
    status,
    records_processed,
    error_message,
    error_node,
    completed_at
  )
  VALUES (
    p_workflow_id,
    p_workflow_name,
    p_status,
    p_records_processed,
    p_error_message,
    p_error_node,
    NOW()
  )
  RETURNING web_intel.collection_log.id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_collection_run TO service_role;

COMMENT ON FUNCTION public.log_collection_run IS 'Log a workflow collection run - used by n8n workflows';
