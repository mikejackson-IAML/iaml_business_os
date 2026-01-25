-- Register Daily Digest Sender workflow in n8n_brain.workflow_registry
-- Run this after importing the workflow to n8n

-- Replace {{WORKFLOW_ID}} with the actual n8n workflow ID after import
SELECT n8n_brain.register_workflow(
  '{{WORKFLOW_ID}}'::TEXT,                           -- workflow_id (from n8n)
  'Daily Digest Sender'::TEXT,                       -- workflow_name
  'operations'::TEXT,                                -- category
  'Action Center'::TEXT,                             -- department
  'schedule'::TEXT,                                  -- trigger_type
  'Hourly 6-9am CT Weekdays'::TEXT,                  -- schedule
  'Sends daily email summaries of critical, overdue, and due-today tasks to each user at their preferred time'::TEXT,  -- description
  ARRAY['dashboard', 'resend', 'slack']::TEXT[],     -- services
  TRUE,                                              -- has_error_handling
  TRUE,                                              -- has_slack_alerts
  FALSE                                              -- has_dashboard_logging (uses API-side logging)
);

-- Mark workflow as tested after verifying
-- UPDATE n8n_brain.workflow_registry
-- SET test_status = 'verified', tested_at = NOW(), tested_by = 'mike'
-- WHERE workflow_name = 'Daily Digest Sender';
