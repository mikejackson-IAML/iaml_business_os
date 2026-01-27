-- Update workflow registry status for fixed workflows
-- Migration: 20260141

-- Mark CLE Approval Monitor as verified
SELECT n8n_brain.mark_workflow_tested(
  '8TBH2O0GuYghWTaZ',
  'verified',
  'claude-testing-agent',
  'Fixed IF node branches. Added canary error handling. All database operations use Supabase REST API.'
);

-- Mark Sales Navigator Profile Scraper as verified
SELECT n8n_brain.mark_workflow_tested(
  'XzuvwpNfgysxtFLq',
  'verified',
  'claude-testing-agent',
  'Converted 5 Postgres nodes to REST API. Created migration 20260140 with RPC functions. Execution 155936 verified successful.'
);
