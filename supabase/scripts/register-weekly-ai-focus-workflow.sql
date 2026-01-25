-- Register Weekly AI Focus Generator workflow in n8n_brain.workflow_registry
-- Run this after importing the workflow to n8n

-- Replace {{WORKFLOW_ID}} with the actual n8n workflow ID after import
SELECT n8n_brain.register_workflow(
  '{{WORKFLOW_ID}}'::TEXT,                           -- workflow_id (from n8n)
  'Weekly AI Focus Generator'::TEXT,                 -- workflow_name
  'action_center'::TEXT,                             -- category
  'Operations'::TEXT,                                -- department
  'schedule'::TEXT,                                  -- trigger_type
  'Sunday 7pm CT + Friday 5pm CT'::TEXT,             -- schedule
  'AI-powered weekly planning and task suggestions with pattern detection'::TEXT,  -- description
  ARRAY['dashboard', 'supabase', 'slack', 'claude']::TEXT[],  -- services
  TRUE,                                              -- has_error_handling
  TRUE,                                              -- has_slack_alerts
  TRUE                                               -- has_dashboard_logging (creates tasks in action_center.tasks)
);

-- Mark workflow as tested after verifying
-- UPDATE n8n_brain.workflow_registry
-- SET test_status = 'verified', tested_at = NOW(), tested_by = 'mike'
-- WHERE workflow_name = 'Weekly AI Focus Generator';
