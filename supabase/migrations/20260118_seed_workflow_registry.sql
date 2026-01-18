-- Seed Workflow Registry
-- Migration: Populate initial workflow registry with known workflows
-- Date: 2026-01-18

-- ============================================
-- SEED INITIAL WORKFLOWS
-- ============================================

-- Weekly Speed Audit (already has runs in workflow_runs)
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'weekly-speed-audit',
  'Weekly Speed Audit - iaml.com',
  'Runs PageSpeed Insights on key pages weekly to track performance improvements and flag regressions.',
  'digital',
  'monitoring',
  ARRAY['performance', 'lighthouse', 'core-web-vitals'],
  'Mike',
  'medium',
  'schedule',
  'Weekly on Mondays at 6 AM CT',
  '0 6 * * 1',
  ARRAY['supabase', 'pagespeed'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- Uptime Monitor
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'uptime-monitor',
  'Uptime Monitor',
  'Checks site availability every 5 minutes and alerts via Slack if iaml.com is down.',
  'digital',
  'monitoring',
  ARRAY['uptime', 'availability', 'alerting'],
  'Mike',
  'critical',
  'schedule',
  'Every 5 minutes',
  '*/5 * * * *',
  ARRAY['slack', 'http'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- Domain Health Sync
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'domain-health-sync',
  'Domain Health Sync',
  'Syncs email domain health metrics from ZapMail to track deliverability and DNS status.',
  'marketing',
  'sync',
  ARRAY['email', 'deliverability', 'dns', 'zapmail'],
  'Mike',
  'high',
  'schedule',
  'Daily at 6 AM CT',
  '0 6 * * *',
  ARRAY['zapmail', 'supabase'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- Smartlead Inbox Sync
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'smartlead-inbox-sync',
  'Smartlead Inbox Sync',
  'Syncs email campaign performance and inbox placement data from Smartlead.',
  'marketing',
  'sync',
  ARRAY['email', 'campaigns', 'smartlead'],
  'Mike',
  'medium',
  'schedule',
  'Every 15 minutes',
  '*/15 * * * *',
  ARRAY['smartlead', 'supabase'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- Airtable Registrations Sync
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'airtable-registrations-sync',
  'Airtable Registrations Sync',
  'Syncs program registrations from Airtable to GHL so sales can follow up quickly.',
  'programs',
  'sync',
  ARRAY['registrations', 'airtable', 'ghl', 'sales'],
  'Mike',
  'high',
  'schedule',
  'Every 5 minutes',
  '*/5 * * * *',
  ARRAY['airtable', 'ghl', 'supabase'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- SSL Certificate Monitor
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'ssl-certificate-monitor',
  'SSL Certificate Monitor',
  'Monitors SSL certificate expiration dates and alerts 30 days before expiry.',
  'digital',
  'monitoring',
  ARRAY['ssl', 'security', 'certificates'],
  'Mike',
  'high',
  'schedule',
  'Daily at 9 AM CT',
  '0 9 * * *',
  ARRAY['http', 'slack'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- HeyReach LinkedIn Sync
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'heyreach-linkedin-sync',
  'HeyReach LinkedIn Sync',
  'Syncs LinkedIn outreach activity and responses from HeyReach campaigns.',
  'marketing',
  'sync',
  ARRAY['linkedin', 'outreach', 'heyreach'],
  'Mike',
  'medium',
  'webhook',
  'On HeyReach webhook events',
  NULL,
  ARRAY['heyreach', 'supabase', 'ghl'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- GHL Contact Sync
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'ghl-contact-sync',
  'GHL Contact Sync',
  'Syncs contact updates and tag changes from GHL to maintain centralized contact records.',
  'leads',
  'sync',
  ARRAY['contacts', 'ghl', 'crm'],
  'Mike',
  'medium',
  'webhook',
  'On GHL contact events',
  NULL,
  ARRAY['ghl', 'supabase'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- Daily Metrics Report
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'daily-metrics-report',
  'Daily Metrics Report',
  'Generates and sends daily business metrics summary via Slack.',
  'digital',
  'report',
  ARRAY['metrics', 'reporting', 'daily'],
  'Mike',
  'low',
  'schedule',
  'Daily at 8 AM CT',
  '0 8 * * *',
  ARRAY['supabase', 'slack'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- Workflow Error Notifier
INSERT INTO n8n_brain.workflows (
  workflow_id,
  workflow_name,
  description,
  department,
  category,
  tags,
  owner,
  criticality,
  trigger_type,
  schedule_description,
  schedule_cron,
  services,
  is_active
) VALUES (
  'workflow-error-notifier',
  'Workflow Error Notifier',
  'Monitors all workflows for errors and sends immediate alerts to Slack and email.',
  'digital',
  'alert',
  ARRAY['errors', 'alerting', 'monitoring'],
  'Mike',
  'critical',
  'schedule',
  'Every minute',
  '* * * * *',
  ARRAY['supabase', 'slack', 'email'],
  true
) ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE n8n_brain.workflows IS 'Initial seed data for workflow registry - 10 core workflows';
