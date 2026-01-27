-- RPC function to log errors to web_intel.collection_log
-- Used by Web Intel - Error Handler workflow via HTTP Request

CREATE OR REPLACE FUNCTION public.log_collection_error(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_status TEXT DEFAULT 'failed',
  p_error_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_completed_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.collection_log (
    workflow_id,
    workflow_name,
    status,
    error_message,
    details,
    completed_at
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    p_status,
    p_error_message,
    p_details,
    p_completed_at
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'workflow_id', p_workflow_id,
    'workflow_name', p_workflow_name,
    'status', p_status
  );
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.log_collection_error TO service_role;

COMMENT ON FUNCTION public.log_collection_error IS 'Logs errors from Web Intel workflows to collection_log table';
