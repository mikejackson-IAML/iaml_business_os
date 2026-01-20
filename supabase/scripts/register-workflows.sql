-- Register All n8n Workflows
-- Run this AFTER running the migration: 20260120_create_workflow_registry.sql
-- Date: 2026-01-20

-- ============================================
-- REGISTER DOMAIN HEALTH SYNC (VERIFIED)
-- This workflow has been thoroughly tested
-- ============================================
SELECT n8n_brain.register_workflow(
  'HnZQopXL7xjZnX3O'::TEXT,
  'Domain Health Sync - Daily'::TEXT,
  'lead_intelligence'::TEXT,
  'Lead Intelligence'::TEXT,
  'schedule'::TEXT,
  'Daily 6am'::TEXT,
  'Syncs email domain and inbox health from Smartlead, calculates health scores, logs history, and alerts on issues'::TEXT,
  ARRAY['smartlead', 'mxtoolbox', 'supabase', 'slack']::TEXT[],
  TRUE, TRUE, TRUE
);

SELECT n8n_brain.mark_workflow_tested(
  'HnZQopXL7xjZnX3O'::TEXT,
  'verified'::TEXT,
  'claude'::TEXT,
  'Fully tested 2026-01-20. Fixed paired item data issues, sequential processing, Code nodes for data preservation.'::TEXT
);

-- Update README status
UPDATE n8n_brain.workflow_registry
SET has_readme = TRUE, readme_path = 'business-os/workflows/README-domain-health-sync.md'
WHERE workflow_id = 'HnZQopXL7xjZnX3O';

-- ============================================
-- REGISTER SPEED AUDIT WORKFLOW (VERIFIED)
-- This is the reference pattern workflow
-- ============================================
SELECT n8n_brain.register_workflow(
  'goebbeQY8Rdi8oRj'::TEXT,
  'Weekly Speed Audit - iaml.com'::TEXT,
  'operations'::TEXT,
  'Operations'::TEXT,
  'schedule'::TEXT,
  'Weekly'::TEXT,
  'Reference implementation for standard error handling pattern with dashboard logging'::TEXT,
  ARRAY['pagespeed', 'supabase', 'slack']::TEXT[],
  TRUE, TRUE, TRUE
);

SELECT n8n_brain.mark_workflow_tested('goebbeQY8Rdi8oRj'::TEXT, 'verified'::TEXT, 'claude'::TEXT, 'Reference pattern for error handling'::TEXT);

-- ============================================
-- REGISTER OTHER ACTIVE WORKFLOWS (UNTESTED)
-- ============================================

-- Lead Intelligence workflows
SELECT n8n_brain.register_workflow('8IBiLLAIHgSt2xWs'::TEXT, 'Smartlead Inbox Sync'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Syncs inbox data from Smartlead'::TEXT, ARRAY['smartlead', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('3KqJGyOOHSSaC7pU'::TEXT, 'Smartlead Activity Receiver'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'webhook'::TEXT, NULL::TEXT, 'Receives webhook events from Smartlead'::TEXT, ARRAY['smartlead', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('b2XTKw8oy1lNKIDj'::TEXT, 'Smartlead Inbox Ramp-Up'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Manages inbox warmup progression'::TEXT, ARRAY['smartlead', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('anuQgW2aQxQ3AR8U'::TEXT, 'Supabase to HeyReach Exporter'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'manual'::TEXT, NULL::TEXT, 'Exports contacts to HeyReach for LinkedIn outreach'::TEXT, ARRAY['supabase', 'heyreach']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('G8d0Jyyf7OHSgr99'::TEXT, 'HeyReach Activity Receiver'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'webhook'::TEXT, NULL::TEXT, 'Receives LinkedIn activity from HeyReach'::TEXT, ARRAY['heyreach', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('6PdgkfipCXPU0FHL'::TEXT, 'Lifecycle Manager - Stale Contacts'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Updates contact lifecycle based on activity'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('PAyKdjpKLHfH5L89'::TEXT, 'Email Validator - NeverBounce'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'manual'::TEXT, NULL::TEXT, 'Validates email addresses using NeverBounce'::TEXT, ARRAY['neverbounce', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('HNZPMaeWce2qsICS'::TEXT, 'Deduplication Manager'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Identifies and manages duplicate contacts'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('XGpk3RnAtgky0Svk'::TEXT, 'Domain Capacity Tracker'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Tracks sending capacity by domain'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('XQyMCuoLyimoIqkm'::TEXT, 'Sending Capacity Calculator'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Calculates total sending capacity'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('OSA3j9nLLGRd8o0j'::TEXT, 'Capacity Tracker - Hourly'::TEXT, 'lead_intelligence'::TEXT, 'Lead Intelligence'::TEXT, 'schedule'::TEXT, 'Hourly'::TEXT, 'Tracks capacity utilization hourly'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);

-- Campaign workflows
SELECT n8n_brain.register_workflow('7xEGFk7fgkp3egBj'::TEXT, 'Campaign Analyst - Performance'::TEXT, 'marketing'::TEXT, 'Marketing'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Analyzes campaign performance metrics'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('R9AgG9ZK4m8vXqNT'::TEXT, 'Branch C Scheduler'::TEXT, 'marketing'::TEXT, 'Marketing'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Schedules outreach for Branch C contacts'::TEXT, ARRAY['supabase', 'ghl']::TEXT[], FALSE, FALSE, FALSE);

-- Operations workflows
SELECT n8n_brain.register_workflow('2HAORwXKt7UffvxG'::TEXT, 'Airtable Registrations Sync + GHL'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Syncs registrations from Airtable to GHL'::TEXT, ARRAY['airtable', 'ghl', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('IshJyOdRDNHy7wfz'::TEXT, 'GHL Activity Receiver'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'webhook'::TEXT, NULL::TEXT, 'Receives webhook events from GHL'::TEXT, ARRAY['ghl', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('LaUJMP9pSbE9dw3N'::TEXT, 'Daily Accomplishment Email'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, 'Daily'::TEXT, 'Sends daily accomplishment summary'::TEXT, ARRAY['supabase', 'email']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('0A8OBSOYaqSCJUPm'::TEXT, 'Inventory Manager'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Manages program inventory'::TEXT, ARRAY['airtable', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('ABCZiTL4CyT6eOAl'::TEXT, 'Room Block Monitor'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors hotel room block utilization'::TEXT, ARRAY['airtable', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('GOiy6L7XYjevYDSA'::TEXT, 'Faculty Availability Tracker'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Tracks faculty availability'::TEXT, ARRAY['airtable', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('c4xNLJMC29NkFk06'::TEXT, 'Faculty Gap Alert'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Alerts on faculty scheduling gaps'::TEXT, ARRAY['airtable', 'supabase', 'slack']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('8TBH2O0GuYghWTaZ'::TEXT, 'CLE Approval Monitor'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors CLE approval status'::TEXT, ARRAY['airtable', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('UKhLyZQsrkqTwZ0F'::TEXT, 'Shipping Monitor'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors material shipping status'::TEXT, ARRAY['airtable', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('d9mvXgCOZ3IlvNML'::TEXT, 'Attendance Tracker'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Tracks program attendance'::TEXT, ARRAY['airtable', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('Ew97MGec45jBDdVq'::TEXT, 'Schedule Optimizer - Conflict Detector'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Detects scheduling conflicts'::TEXT, ARRAY['airtable', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('AzelTCjRxj8fGi2d'::TEXT, 'Enrollment Alert Monitor'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors enrollment levels and alerts'::TEXT, ARRAY['airtable', 'supabase', 'slack']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('YLyx0mAJMqCZYTQ5'::TEXT, 'Database Manager - Health Check'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks database health'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('ZYmDHUgDKNbqfjRO'::TEXT, 'Workflow Registry Sync - Business OS'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Syncs workflow registry from n8n'::TEXT, ARRAY['n8n', 'supabase']::TEXT[], FALSE, FALSE, FALSE);

-- Website monitoring workflows (iaml.com)
SELECT n8n_brain.register_workflow('QBS1n2E0IFDyhR7y'::TEXT, 'Uptime Monitor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors website uptime'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('H2H172J1WS9poTfl'::TEXT, 'Page Speed Monitor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors page speed'::TEXT, ARRAY['pagespeed', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('RvHwQeupCo1e3N9c'::TEXT, 'Lighthouse Auditor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Runs Lighthouse audits'::TEXT, ARRAY['lighthouse', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('7tKjCpQEjJLHji1t'::TEXT, 'Core Web Vitals Monitor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors Core Web Vitals'::TEXT, ARRAY['pagespeed', 'supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('7dlwbR7yQGnTOYcn'::TEXT, 'Meta Tag Auditor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Audits meta tags'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('AqUWODfMaJOhS6fb'::TEXT, 'Schema Validator - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Validates structured data schema'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('bGgsBjTfjCV6mv72'::TEXT, 'Indexability Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks page indexability'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('4i92X3Rm27Z1WdTT'::TEXT, 'DNS Record Monitor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors DNS records'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('FfKkT1SHgkZ2EjFD'::TEXT, 'DKIM Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks DKIM configuration'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('8T88WjyL0WOCYcZM'::TEXT, 'Security Headers Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks security headers'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('CLPZDdyckhcLWgN4'::TEXT, 'Accessibility Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks accessibility compliance'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('KK7RbZJ4SOz5brCj'::TEXT, 'Mobile Friendliness Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks mobile friendliness'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('XTMQb4VizrYtz3tn'::TEXT, 'Compression Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks compression settings'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('9TpLXE5PwM5GkJyq'::TEXT, 'Cookie Compliance Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks cookie compliance'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('dCkv7FsgxwKOXlc7'::TEXT, 'Robots.txt Monitor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors robots.txt changes'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('09f0Tp7T3c2uhplj'::TEXT, 'Image Optimization Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks image optimization'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('TfdyBwoJJ05MOFDz'::TEXT, 'Mixed Content Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks for mixed content'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('OEAWLUXCcU3lViqt'::TEXT, 'Favicon Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks favicon configuration'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('92ur6UI4RpaPM262'::TEXT, 'HTML Lang Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks HTML lang attribute'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('DSSJIHWl7XeeCyAu'::TEXT, 'Resource Hints Checker - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Checks resource hints'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);
SELECT n8n_brain.register_workflow('VbSCZR47nzwYUYns'::TEXT, 'Registration Page Monitor - iaml.com'::TEXT, 'website'::TEXT, 'Operations'::TEXT, 'schedule'::TEXT, NULL::TEXT, 'Monitors registration pages'::TEXT, ARRAY['supabase']::TEXT[], FALSE, FALSE, FALSE);

-- Manual trigger workflow
SELECT n8n_brain.register_workflow('3ynFk0HYxFwFA5LS'::TEXT, 'Manual Trigger - Weekly Speed Audit'::TEXT, 'operations'::TEXT, 'Operations'::TEXT, 'manual'::TEXT, NULL::TEXT, 'Manual trigger for speed audit'::TEXT, ARRAY['pagespeed', 'supabase']::TEXT[], FALSE, FALSE, FALSE);

-- ============================================
-- SUMMARY QUERY
-- ============================================
SELECT * FROM n8n_brain.workflow_test_summary;
SELECT * FROM n8n_brain.workflows_needing_attention LIMIT 20;
