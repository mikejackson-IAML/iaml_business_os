-- Register Alert-to-Task Workflow in n8n-brain
-- Run this after importing the workflow to n8n and obtaining the workflow ID
--
-- Usage: Replace 'WORKFLOW_ID' with the actual n8n workflow ID after import
-- Example: 'HnZQopXL7xjZnX3O'

SELECT n8n_brain.register_workflow(
  'WORKFLOW_ID_HERE',  -- Replace with actual ID from n8n after import
  'Alert-to-Task',
  'automation',
  'Operations',
  'webhook',
  NULL,  -- No schedule, webhook-triggered
  'Converts system alerts to Action Center tasks with AI transformation and deduplication',
  ARRAY['supabase', 'anthropic', 'action_center'],
  TRUE,   -- has_error_handling
  TRUE,   -- has_slack_alerts
  FALSE   -- has_dashboard_logging (not yet implemented)
);

-- After successful testing, mark as verified:
-- SELECT n8n_brain.mark_workflow_tested(
--   'WORKFLOW_ID_HERE',
--   'verified',
--   'your_name',
--   'Tested with critical, warning, and info alerts. Deduplication working. AI transformation working with fallback.'
-- );
