-- Update Branch C Scheduler to reflect error handling addition
-- Run this in Supabase SQL Editor

UPDATE n8n_brain.workflow_registry
SET
  has_error_handling = true,
  test_notes = 'Verified all branches. Added canary error handling 2026-01-27.',
  updated_at = NOW()
WHERE workflow_id = 'R9AgG9ZK4m8vXqNT';

-- Verify the update
SELECT
  workflow_name,
  test_status,
  has_error_handling,
  test_notes
FROM n8n_brain.workflow_registry
WHERE workflow_id = 'R9AgG9ZK4m8vXqNT';
