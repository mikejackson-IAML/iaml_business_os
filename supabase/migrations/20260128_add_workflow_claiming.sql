-- Add claiming columns for parallel workflow testing
-- Migration: 20260127_add_workflow_claiming
-- Purpose: Enable multiple Claude sessions to claim workflows without conflicts

-- Add claiming columns
ALTER TABLE n8n_brain.workflow_registry
ADD COLUMN IF NOT EXISTS claimed_by TEXT,
ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ;

-- Index for finding unclaimed workflows quickly
CREATE INDEX IF NOT EXISTS idx_workflow_registry_claimed
ON n8n_brain.workflow_registry(claimed_by, claimed_at);

-- Function to claim a workflow atomically
CREATE OR REPLACE FUNCTION n8n_brain.claim_next_workflow(
  p_claimed_by TEXT,
  p_timeout_minutes INTEGER DEFAULT 60
)
RETURNS TABLE (
  workflow_id TEXT,
  workflow_name TEXT,
  workflow_url TEXT,
  test_status TEXT,
  category TEXT
) AS $$
DECLARE
  v_workflow_id TEXT;
BEGIN
  -- First, release any stale claims (older than timeout)
  UPDATE n8n_brain.workflow_registry
  SET claimed_by = NULL, claimed_at = NULL
  WHERE claimed_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL;

  -- Atomically claim the highest priority unclaimed workflow
  UPDATE n8n_brain.workflow_registry wr
  SET
    claimed_by = p_claimed_by,
    claimed_at = NOW(),
    test_status = 'in_progress'
  WHERE wr.workflow_id = (
    SELECT w.workflow_id
    FROM n8n_brain.workflow_registry w
    WHERE w.test_status IN ('untested', 'broken', 'needs_review')
      AND (w.claimed_by IS NULL OR w.claimed_at < NOW() - (p_timeout_minutes || ' minutes')::INTERVAL)
    ORDER BY
      CASE w.test_status
        WHEN 'broken' THEN 1
        WHEN 'needs_review' THEN 2
        WHEN 'untested' THEN 3
      END,
      w.is_active DESC,
      w.updated_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING wr.workflow_id INTO v_workflow_id;

  -- Return the claimed workflow details
  RETURN QUERY
  SELECT
    w.workflow_id,
    w.workflow_name,
    w.workflow_url,
    w.test_status,
    w.category
  FROM n8n_brain.workflow_registry w
  WHERE w.workflow_id = v_workflow_id;
END;
$$ LANGUAGE plpgsql;

-- Function to release a claim
CREATE OR REPLACE FUNCTION n8n_brain.release_workflow_claim(
  p_workflow_id TEXT,
  p_claimed_by TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_released BOOLEAN;
BEGIN
  UPDATE n8n_brain.workflow_registry
  SET
    claimed_by = NULL,
    claimed_at = NULL,
    test_status = CASE
      WHEN test_status = 'in_progress' THEN 'untested'
      ELSE test_status
    END
  WHERE workflow_id = p_workflow_id
    AND claimed_by = p_claimed_by;

  GET DIAGNOSTICS v_released = ROW_COUNT;
  RETURN v_released > 0;
END;
$$ LANGUAGE plpgsql;

-- Function to get queue status
CREATE OR REPLACE FUNCTION n8n_brain.get_workflow_queue_status()
RETURNS TABLE (
  total_needing_work BIGINT,
  broken_count BIGINT,
  needs_review_count BIGINT,
  untested_count BIGINT,
  in_progress_count BIGINT,
  claimed_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*) FILTER (WHERE test_status IN ('untested', 'broken', 'needs_review', 'in_progress')) as total_needing_work,
    COUNT(*) FILTER (WHERE test_status = 'broken') as broken_count,
    COUNT(*) FILTER (WHERE test_status = 'needs_review') as needs_review_count,
    COUNT(*) FILTER (WHERE test_status = 'untested') as untested_count,
    COUNT(*) FILTER (WHERE test_status = 'in_progress') as in_progress_count,
    COUNT(*) FILTER (WHERE claimed_by IS NOT NULL AND claimed_at > NOW() - INTERVAL '60 minutes') as claimed_count
  FROM n8n_brain.workflow_registry;
END;
$$ LANGUAGE plpgsql;

-- View: Currently claimed workflows
CREATE OR REPLACE VIEW n8n_brain.claimed_workflows AS
SELECT
  workflow_id,
  workflow_name,
  test_status,
  claimed_by,
  claimed_at,
  NOW() - claimed_at as claim_duration
FROM n8n_brain.workflow_registry
WHERE claimed_by IS NOT NULL
  AND claimed_at > NOW() - INTERVAL '60 minutes'
ORDER BY claimed_at DESC;

COMMENT ON FUNCTION n8n_brain.claim_next_workflow IS 'Atomically claims the highest priority unclaimed workflow for testing';
COMMENT ON FUNCTION n8n_brain.release_workflow_claim IS 'Releases a workflow claim, allowing others to claim it';
COMMENT ON FUNCTION n8n_brain.get_workflow_queue_status IS 'Returns summary counts of workflow queue status';
COMMENT ON VIEW n8n_brain.claimed_workflows IS 'Shows currently claimed workflows and who has them';
