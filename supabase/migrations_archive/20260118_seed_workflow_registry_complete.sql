-- Complete Workflow Registry Seed
-- Migration: Populate workflow registry with all Business OS workflows
-- Date: 2026-01-18
-- Source: business-os/workflows/WORKFLOW-AUDIT.md

-- ============================================
-- SITE MONITORING - CORE PERFORMANCE
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Uptime Monitor
('QBS1n2E0IFDyhR7y', 'Uptime Monitor - iaml.com',
 'Pings iaml.com every 5 minutes and alerts via Slack/email if the site goes down.',
 'digital', 'monitoring', ARRAY['uptime', 'availability', 'alerting'],
 'Mike', 'critical', 'schedule', 'Every 5 minutes', '*/5 * * * *',
 ARRAY['slack', 'sendgrid', 'http'], true),

-- Page Speed Monitor
('H2H172J1WS9poTfl', 'Page Speed Monitor - iaml.com',
 'Measures page load times daily and tracks performance trends to catch slowdowns early.',
 'digital', 'monitoring', ARRAY['performance', 'page-speed', 'metrics'],
 'Mike', 'high', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['pagespeed', 'supabase'], true),

-- Lighthouse Auditor
('RvHwQeupCo1e3N9c', 'Lighthouse Auditor - iaml.com',
 'Runs Google Lighthouse audits weekly to score performance, accessibility, and SEO.',
 'digital', 'monitoring', ARRAY['lighthouse', 'performance', 'accessibility', 'seo'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['lighthouse', 'supabase'], true),

-- Core Web Vitals Monitor
('7tKjCpQEjJLHji1t', 'Core Web Vitals Monitor - iaml.com',
 'Tracks Google Core Web Vitals (LCP, FID, CLS) to ensure good search rankings.',
 'digital', 'monitoring', ARRAY['core-web-vitals', 'lcp', 'fid', 'cls', 'seo'],
 'Mike', 'high', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['pagespeed', 'supabase'], true),

-- TTFB Monitor
('eR0cVQUtFopWafzg', 'TTFB Monitor - iaml.com',
 'Measures Time To First Byte to detect server performance issues before users notice.',
 'digital', 'monitoring', ARRAY['ttfb', 'performance', 'server'],
 'Mike', 'medium', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['http', 'supabase'], true),

-- Mobile Friendliness Checker
('KK7RbZJ4SOz5brCj', 'Mobile Friendliness Checker - iaml.com',
 'Verifies mobile responsiveness to ensure good experience on phones and tablets.',
 'digital', 'monitoring', ARRAY['mobile', 'responsive', 'ux'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['pagespeed', 'supabase'], true),

-- Compression Checker
('XTMQb4VizrYtz3tn', 'Compression Checker - iaml.com',
 'Ensures Gzip/Brotli compression is working to keep page sizes small and fast.',
 'digital', 'monitoring', ARRAY['compression', 'gzip', 'performance'],
 'Mike', 'low', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Image Optimization Checker
('09f0Tp7T3c2uhplj', 'Image Optimization Checker - iaml.com',
 'Scans for unoptimized images that could slow down page loads.',
 'digital', 'monitoring', ARRAY['images', 'optimization', 'performance'],
 'Mike', 'low', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Resource Hints Checker
('DSSJIHWl7XeeCyAu', 'Resource Hints Checker - iaml.com',
 'Validates preload/prefetch hints are correctly implemented for faster navigation.',
 'digital', 'monitoring', ARRAY['preload', 'prefetch', 'performance'],
 'Mike', 'low', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Weekly Speed Audit
('3ynFk0HYxFwFA5LS', 'Weekly Speed Audit - iaml.com',
 'Runs comprehensive PageSpeed Insights audits on key pages weekly to track performance trends and catch regressions.',
 'digital', 'monitoring', ARRAY['performance', 'lighthouse', 'core-web-vitals', 'audit'],
 'Mike', 'medium', 'manual', 'Weekly (Manual Trigger)', NULL,
 ARRAY['pagespeed', 'supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- SITE MONITORING - SEO & INDEXING
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Meta Tag Auditor
('7dlwbR7yQGnTOYcn', 'Meta Tag Auditor - iaml.com',
 'Checks all pages have proper title tags and meta descriptions for search visibility.',
 'digital', 'monitoring', ARRAY['meta-tags', 'seo', 'title', 'description'],
 'Mike', 'high', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['http', 'supabase'], true),

-- Schema Validator
('AqUWODfMaJOhS6fb', 'Schema Validator - iaml.com',
 'Verifies structured data markup is correct so Google can display rich snippets.',
 'digital', 'monitoring', ARRAY['schema', 'structured-data', 'seo', 'rich-snippets'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Indexability Checker
('bGgsBjTfjCV6mv72', 'Indexability Checker - iaml.com',
 'Ensures pages are not accidentally blocked from search engine indexing.',
 'digital', 'monitoring', ARRAY['indexing', 'seo', 'robots', 'noindex'],
 'Mike', 'high', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['http', 'supabase'], true),

-- Robots.txt Monitor
('dCkv7FsgxwKOXlc7', 'Robots.txt Monitor - iaml.com',
 'Watches for changes to robots.txt that could block search crawlers.',
 'digital', 'monitoring', ARRAY['robots', 'seo', 'crawlers'],
 'Mike', 'medium', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['http', 'supabase'], true),

-- Social Tags Checker
('eStzcArnHJIQamGN', 'Social Tags Checker - iaml.com',
 'Validates Open Graph and Twitter card tags for proper social media sharing.',
 'digital', 'monitoring', ARRAY['open-graph', 'twitter-cards', 'social', 'seo'],
 'Mike', 'low', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- HTML Lang Checker
('92ur6UI4RpaPM262', 'HTML Lang Checker - iaml.com',
 'Verifies language attributes are set correctly for international SEO.',
 'digital', 'monitoring', ARRAY['lang', 'i18n', 'seo', 'accessibility'],
 'Mike', 'low', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Favicon Checker
('OEAWLUXCcU3lViqt', 'Favicon Checker - iaml.com',
 'Ensures favicons are present and properly configured across all sizes.',
 'digital', 'monitoring', ARRAY['favicon', 'branding', 'ux'],
 'Mike', 'low', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- SITE MONITORING - SECURITY & COMPLIANCE
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- DNS Record Monitor
('4i92X3Rm27Z1WdTT', 'DNS Record Monitor - iaml.com',
 'Monitors DNS records for unexpected changes that could indicate security issues.',
 'digital', 'monitoring', ARRAY['dns', 'security', 'monitoring'],
 'Mike', 'high', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['dns', 'supabase', 'slack'], true),

-- DKIM Checker
('FfKkT1SHgkZ2EjFD', 'DKIM Checker - iaml.com',
 'Verifies email authentication records are configured for deliverability.',
 'digital', 'monitoring', ARRAY['dkim', 'email', 'dns', 'deliverability'],
 'Mike', 'high', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['dns', 'supabase'], true),

-- Security Headers Checker
('8T88WjyL0WOCYcZM', 'Security Headers Checker - iaml.com',
 'Audits HTTP security headers to protect against common web vulnerabilities.',
 'digital', 'monitoring', ARRAY['security', 'headers', 'csp', 'hsts'],
 'Mike', 'high', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Mixed Content Checker
('TfdyBwoJJ05MOFDz', 'Mixed Content Checker - iaml.com',
 'Finds insecure HTTP resources on HTTPS pages that trigger browser warnings.',
 'digital', 'monitoring', ARRAY['https', 'mixed-content', 'security'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Cookie Compliance Checker
('9TpLXE5PwM5GkJyq', 'Cookie Compliance Checker - iaml.com',
 'Verifies cookie consent banners and GDPR/CCPA compliance.',
 'digital', 'monitoring', ARRAY['cookies', 'gdpr', 'ccpa', 'compliance', 'privacy'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true),

-- Accessibility Checker
('CLPZDdyckhcLWgN4', 'Accessibility Checker - iaml.com',
 'Scans for WCAG accessibility issues to ensure site is usable by everyone.',
 'digital', 'monitoring', ARRAY['accessibility', 'wcag', 'a11y', 'compliance'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 6 * * 1',
 ARRAY['http', 'supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- MARKETING - EMAIL INFRASTRUCTURE
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Domain Health Sync
('HnZQopXL7xjZnX3O', 'Domain Health Sync - Daily',
 'Monitors email domain reputation and alerts before deliverability problems hurt campaigns.',
 'marketing', 'sync', ARRAY['email', 'deliverability', 'dns', 'domain-health'],
 'Mike', 'critical', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['smartlead', 'mxtoolbox', 'supabase', 'slack'], true),

-- Smartlead Inbox Sync
('8IBiLLAIHgSt2xWs', 'Smartlead Inbox Sync',
 'Syncs email campaign metrics from Smartlead to track opens, clicks, and replies.',
 'marketing', 'sync', ARRAY['email', 'campaigns', 'smartlead', 'metrics'],
 'Mike', 'high', 'schedule', 'Every 15 minutes', '*/15 * * * *',
 ARRAY['smartlead', 'supabase'], true),

-- Smartlead Inbox Ramp-Up
('b2XTKw8oy1lNKIDj', 'Smartlead Inbox Ramp-Up',
 'Manages gradual sending volume increases for new email domains to build reputation.',
 'marketing', 'sync', ARRAY['email', 'warmup', 'deliverability', 'smartlead'],
 'Mike', 'high', 'schedule', 'Daily at 7 AM CT', '0 7 * * *',
 ARRAY['smartlead', 'supabase'], true),

-- Email Validator - NeverBounce
('PAyKdjpKLHfH5L89', 'Email Validator - NeverBounce',
 'Validates email addresses before campaigns to reduce bounces and protect sender reputation.',
 'marketing', 'integration', ARRAY['email', 'validation', 'neverbounce', 'deliverability'],
 'Mike', 'high', 'webhook', 'On-demand via webhook', NULL,
 ARRAY['neverbounce', 'supabase'], true),

-- Domain Capacity Tracker
('XGpk3RnAtgky0Svk', 'Domain Capacity Tracker',
 'Tracks how many emails each domain can safely send per day.',
 'marketing', 'monitoring', ARRAY['email', 'capacity', 'domains', 'deliverability'],
 'Mike', 'medium', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['smartlead', 'supabase'], true),

-- Sending Capacity Calculator
('XQyMCuoLyimoIqkm', 'Sending Capacity Calculator',
 'Calculates total available email sending capacity across all domains.',
 'marketing', 'monitoring', ARRAY['email', 'capacity', 'planning'],
 'Mike', 'medium', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- MARKETING - CAMPAIGN ACTIVITY
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Smartlead Activity Receiver
('3KqJGyOOHSSaC7pU', 'Smartlead Activity Receiver',
 'Captures email opens, clicks, and replies from Smartlead campaigns in real-time.',
 'marketing', 'integration', ARRAY['email', 'campaigns', 'smartlead', 'webhooks'],
 'Mike', 'high', 'webhook', 'On Smartlead webhook events', NULL,
 ARRAY['smartlead', 'supabase'], true),

-- HeyReach Activity Receiver
('G8d0Jyyf7OHSgr99', 'HeyReach Activity Receiver',
 'Captures LinkedIn connection requests, messages, and replies from HeyReach.',
 'marketing', 'integration', ARRAY['linkedin', 'outreach', 'heyreach', 'webhooks'],
 'Mike', 'high', 'webhook', 'On HeyReach webhook events', NULL,
 ARRAY['heyreach', 'supabase', 'ghl'], true),

-- GHL Activity Receiver
('IshJyOdRDNHy7wfz', 'GHL Activity Receiver',
 'Captures CRM activity from GoHighLevel for unified contact tracking.',
 'marketing', 'integration', ARRAY['crm', 'ghl', 'contacts', 'webhooks'],
 'Mike', 'high', 'webhook', 'On GHL contact events', NULL,
 ARRAY['ghl', 'supabase'], true),

-- Campaign Analyst - Performance
('7xEGFk7fgkp3egBj', 'Campaign Analyst - Performance',
 'Aggregates campaign metrics to identify top-performing sequences and messages.',
 'marketing', 'report', ARRAY['campaigns', 'analytics', 'performance', 'reporting'],
 'Mike', 'medium', 'schedule', 'Daily at 8 AM CT', '0 8 * * *',
 ARRAY['supabase', 'slack'], true),

-- Branch C Scheduler
('R9AgG9ZK4m8vXqNT', 'Branch C Scheduler',
 'Manages the no-contact follow-up branch for contacts who have not responded.',
 'marketing', 'integration', ARRAY['campaigns', 'follow-up', 'ghl', 'automation'],
 'Mike', 'medium', 'schedule', 'Daily at 9 AM CT', '0 9 * * *',
 ARRAY['ghl', 'supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- MARKETING - CONTACT MANAGEMENT
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Lifecycle Manager - Stale Contacts
('6PdgkfipCXPU0FHL', 'Lifecycle Manager - Stale Contacts',
 'Identifies and updates lifecycle stages for contacts who have not engaged recently.',
 'leads', 'sync', ARRAY['contacts', 'lifecycle', 'engagement', 'automation'],
 'Mike', 'medium', 'schedule', 'Daily at 7 AM CT', '0 7 * * *',
 ARRAY['supabase', 'ghl'], true),

-- Deduplication Manager
('HNZPMaeWce2qsICS', 'Deduplication Manager',
 'Finds and merges duplicate contact records to maintain clean data.',
 'leads', 'sync', ARRAY['contacts', 'deduplication', 'data-quality'],
 'Mike', 'medium', 'schedule', 'Weekly on Sundays', '0 6 * * 0',
 ARRAY['supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- PROGRAMS - REGISTRATION & SALES
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Airtable Registrations Sync + GHL
('2HAORwXKt7UffvxG', 'Airtable Registrations Sync + GHL',
 'Syncs program registrations from Airtable to GHL so sales can follow up quickly.',
 'programs', 'sync', ARRAY['registrations', 'airtable', 'ghl', 'sales'],
 'Mike', 'critical', 'schedule', 'Hourly + Webhook', '0 * * * *',
 ARRAY['airtable', 'ghl', 'supabase'], true),

-- Registration Page Monitor
('VbSCZR47nzwYUYns', 'Registration Page Monitor - iaml.com',
 'Monitors registration pages for errors that could prevent sign-ups.',
 'programs', 'monitoring', ARRAY['registrations', 'monitoring', 'uptime', 'sales'],
 'Mike', 'critical', 'schedule', 'Every 15 minutes', '*/15 * * * *',
 ARRAY['http', 'slack'], true),

-- Enrollment Alert Monitor
('AzelTCjRxj8fGi2d', 'Enrollment Alert Monitor',
 'Alerts when enrollment thresholds are hit (e.g., 80% full, sold out).',
 'programs', 'alert', ARRAY['enrollment', 'capacity', 'alerts', 'sales'],
 'Mike', 'high', 'schedule', 'Hourly', '0 * * * *',
 ARRAY['airtable', 'slack', 'supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- PROGRAMS - INVENTORY & SHIPPING
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Inventory Manager
('0A8OBSOYaqSCJUPm', 'Inventory Manager',
 'Tracks program materials inventory and alerts when stock is low.',
 'programs', 'monitoring', ARRAY['inventory', 'materials', 'alerts', 'operations'],
 'Mike', 'medium', 'schedule', 'Daily at 8 AM CT', '0 8 * * *',
 ARRAY['airtable', 'slack', 'supabase'], true),

-- Shipping Monitor
('UKhLyZQsrkqTwZ0F', 'Shipping Monitor',
 'Tracks participant materials shipments and flags delivery issues.',
 'programs', 'monitoring', ARRAY['shipping', 'delivery', 'tracking', 'operations'],
 'Mike', 'medium', 'schedule', 'Daily at 9 AM CT', '0 9 * * *',
 ARRAY['http', 'slack', 'supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- PROGRAMS - FACULTY MANAGEMENT
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Faculty Availability Tracker
('GOiy6L7XYjevYDSA', 'Faculty Availability Tracker',
 'Tracks faculty availability and scheduling preferences for program planning.',
 'programs', 'sync', ARRAY['faculty', 'availability', 'scheduling'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 8 * * 1',
 ARRAY['airtable', 'supabase'], true),

-- Faculty Gap Alert
('c4xNLJMC29NkFk06', 'Faculty Gap Alert',
 'Alerts when programs lack assigned faculty within required lead time.',
 'programs', 'alert', ARRAY['faculty', 'gaps', 'scheduling', 'alerts'],
 'Mike', 'high', 'schedule', 'Daily at 8 AM CT', '0 8 * * *',
 ARRAY['airtable', 'slack'], true),

-- Faculty Performance Monitor
('dyLqARBmoR2mu4j2', 'Faculty Performance Monitor',
 'Aggregates faculty evaluation scores to track teaching quality over time.',
 'programs', 'report', ARRAY['faculty', 'evaluations', 'performance', 'quality'],
 'Mike', 'medium', 'schedule', 'After programs (Weekly)', '0 10 * * 1',
 ARRAY['airtable', 'supabase'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- PROGRAMS - SCHEDULING & VENUES
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Schedule Optimizer - Conflict Detector
('Ew97MGec45jBDdVq', 'Schedule Optimizer - Conflict Detector',
 'Finds scheduling conflicts between programs, faculty, or venues.',
 'programs', 'monitoring', ARRAY['scheduling', 'conflicts', 'calendar', 'operations'],
 'Mike', 'high', 'schedule', 'Daily at 7 AM CT', '0 7 * * *',
 ARRAY['airtable', 'supabase', 'slack'], true),

-- Capacity Tracker - Hourly
('OSA3j9nLLGRd8o0j', 'Capacity Tracker - Hourly',
 'Monitors venue and session capacity utilization in real-time.',
 'programs', 'monitoring', ARRAY['capacity', 'venues', 'sessions', 'real-time'],
 'Mike', 'high', 'schedule', 'Hourly', '0 * * * *',
 ARRAY['airtable', 'supabase'], true),

-- Room Block Monitor
('ABCZiTL4CyT6eOAl', 'Room Block Monitor',
 'Tracks hotel room block pickups and alerts when blocks are at risk.',
 'programs', 'monitoring', ARRAY['hotels', 'room-blocks', 'venues', 'alerts'],
 'Mike', 'medium', 'schedule', 'Daily at 9 AM CT', '0 9 * * *',
 ARRAY['airtable', 'slack'], true),

-- Attendance Tracker
('d9mvXgCOZ3IlvNML', 'Attendance Tracker',
 'Records and reports on program attendance for compliance and follow-up.',
 'programs', 'sync', ARRAY['attendance', 'compliance', 'reporting'],
 'Mike', 'medium', 'schedule', 'During programs', NULL,
 ARRAY['airtable', 'supabase'], true),

-- CLE Approval Monitor
('8TBH2O0GuYghWTaZ', 'CLE Approval Monitor',
 'Tracks CLE credit approval status and alerts on pending submissions.',
 'programs', 'monitoring', ARRAY['cle', 'credits', 'compliance', 'approvals'],
 'Mike', 'medium', 'schedule', 'Weekly on Mondays', '0 9 * * 1',
 ARRAY['airtable', 'slack'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- DIGITAL INFRASTRUCTURE
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Daily Accomplishment Email
('LaUJMP9pSbE9dw3N', 'Daily Accomplishment Email',
 'Sends daily summary of logged accomplishments to keep team aligned.',
 'digital', 'report', ARRAY['accomplishments', 'daily', 'team', 'communication'],
 'Mike', 'low', 'schedule', 'Daily at 5 PM CT', '0 17 * * *',
 ARRAY['supabase', 'sendgrid'], true),

-- Database Manager - Health Check
('YLyx0mAJMqCZYTQ5', 'Database Manager - Health Check',
 'Monitors database connection health and query performance.',
 'digital', 'monitoring', ARRAY['database', 'health', 'supabase', 'infrastructure'],
 'Mike', 'high', 'schedule', 'Hourly', '0 * * * *',
 ARRAY['supabase', 'slack'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- CONTENT & RESEARCH
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
-- Research Process Step 1
('I2bJHnz22liOr6Cu', 'Research Process Step 1',
 'Initiates research requests and routes to appropriate team members.',
 'digital', 'integration', ARRAY['research', 'workflow', 'routing'],
 'Mike', 'low', 'webhook', 'On-demand', NULL,
 ARRAY['airtable', 'slack'], true),

-- Research Approval Step 2
('EnHsPN3uADvaa2mZ', 'Research Approval Step 2',
 'Handles research approval workflow and notifications.',
 'digital', 'integration', ARRAY['research', 'approval', 'workflow'],
 'Mike', 'low', 'webhook', 'On-demand', NULL,
 ARRAY['airtable', 'slack'], true),

-- Content Creation Step 4
('Pg2F5pKAJSJjUnTp', 'Content Creation Step 4',
 'Manages content creation workflow from research to publication.',
 'digital', 'integration', ARRAY['content', 'creation', 'workflow'],
 'Mike', 'low', 'webhook', 'On-demand', NULL,
 ARRAY['airtable', 'slack'], true),

-- Content Approval Step 5
('6IIqACrQwm5CZ51H', 'Content Approval Step 5',
 'Routes content through approval chain with stakeholder notifications.',
 'digital', 'integration', ARRAY['content', 'approval', 'workflow'],
 'Mike', 'low', 'webhook', 'On-demand', NULL,
 ARRAY['airtable', 'slack'], true)

ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description,
  department = EXCLUDED.department,
  category = EXCLUDED.category,
  tags = EXCLUDED.tags,
  criticality = EXCLUDED.criticality,
  trigger_type = EXCLUDED.trigger_type,
  schedule_description = EXCLUDED.schedule_description,
  schedule_cron = EXCLUDED.schedule_cron,
  services = EXCLUDED.services,
  is_active = EXCLUDED.is_active;

-- ============================================
-- VERIFICATION
-- ============================================

-- Count workflows by department
DO $$
DECLARE
  v_count INTEGER;
  v_by_dept RECORD;
BEGIN
  SELECT COUNT(*) INTO v_count FROM n8n_brain.workflows;
  RAISE NOTICE 'Total workflows registered: %', v_count;

  FOR v_by_dept IN
    SELECT department, COUNT(*) as cnt
    FROM n8n_brain.workflows
    GROUP BY department
    ORDER BY cnt DESC
  LOOP
    RAISE NOTICE '  %: %', v_by_dept.department, v_by_dept.cnt;
  END LOOP;
END $$;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE n8n_brain.workflows IS 'Complete Business OS workflow registry - 61 production workflows';

-- ============================================
-- WORKFLOW REGISTRY SYNC (Self-registration)
-- ============================================

INSERT INTO n8n_brain.workflows (
  workflow_id, workflow_name, description, department, category, tags, owner, criticality,
  trigger_type, schedule_description, schedule_cron, services, is_active
) VALUES
('ZYmDHUgDKNbqfjRO', 'Workflow Registry Sync - Business OS',
 'Automatically syncs n8n workflows tagged with business-os to the dashboard registry.',
 'digital', 'sync', ARRAY['infrastructure', 'registry', 'automation', 'business-os'],
 'Mike', 'medium', 'schedule', 'Daily at 6 AM CT', '0 6 * * *',
 ARRAY['n8n', 'supabase'], true)
ON CONFLICT (workflow_id) DO UPDATE SET
  workflow_name = EXCLUDED.workflow_name,
  description = EXCLUDED.description;
