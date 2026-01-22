-- Register Faculty Scheduler workflows in n8n_brain
-- Run this to fix tech debt from v1.0 audit

-- Reminder Notifications workflow
SELECT n8n_brain.register_workflow(
  'pqVg83IQsmbUeoHH'::TEXT,
  'Faculty Scheduler - Reminder Notifications'::TEXT,
  'faculty_scheduler'::TEXT,
  'Operations'::TEXT,
  'schedule'::TEXT,
  'Daily 7am CT'::TEXT,
  'Sends reminder emails to instructors who have been notified but not yet claimed. Runs partway through each tier window.'::TEXT,
  ARRAY['supabase', 'sendgrid']::TEXT[],
  TRUE,  -- has_error_handling
  TRUE,  -- has_slack_alerts
  FALSE  -- has_dashboard_logging
);

-- Cancellation Re-release workflow
SELECT n8n_brain.register_workflow(
  'FCUm05vNbAmi6vdd'::TEXT,
  'Faculty Scheduler - Cancellation Re-release'::TEXT,
  'faculty_scheduler'::TEXT,
  'Operations'::TEXT,
  'webhook'::TEXT,
  'On claim cancellation'::TEXT,
  'Notifies qualified instructors when a previously claimed block becomes available again after cancellation.'::TEXT,
  ARRAY['supabase', 'sendgrid']::TEXT[],
  TRUE,  -- has_error_handling
  TRUE,  -- has_slack_alerts
  FALSE  -- has_dashboard_logging
);

-- Mark both as tested (they were verified during Phase 4)
SELECT n8n_brain.mark_workflow_tested(
  'pqVg83IQsmbUeoHH'::TEXT,
  'verified'::TEXT,
  'audit'::TEXT,
  'Verified during v1.0 milestone audit - E2E flow: Mid-Tier Nudge'::TEXT
);

SELECT n8n_brain.mark_workflow_tested(
  'FCUm05vNbAmi6vdd'::TEXT,
  'verified'::TEXT,
  'audit'::TEXT,
  'Verified during v1.0 milestone audit - E2E flow: Claim Cancellation & Re-Release'::TEXT
);

-- Verify registration
SELECT workflow_id, workflow_name, test_status, tested_at
FROM n8n_brain.workflow_registry
WHERE category = 'faculty_scheduler';
