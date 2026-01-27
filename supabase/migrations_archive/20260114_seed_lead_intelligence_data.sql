-- Lead Intelligence Seed Data
-- Run after: 20260114_create_lead_intelligence_schema.sql
-- Date: 2026-01-14

-- ============================================
-- SEED: Lead Sources (Platforms)
-- ============================================
INSERT INTO lead_sources (name, display_name, source_type, status, credits_remaining, credits_total, daily_limit_total)
VALUES
  ('apollo', 'Apollo', 'database', 'operational', 4500, 5000, 100),
  ('phantombuster', 'PhantomBuster', 'scraper', 'operational', NULL, NULL, 150),
  ('apify', 'Apify', 'scraper', 'operational', NULL, NULL, 50),
  ('heyreach', 'HeyReach', 'scraper', 'operational', NULL, NULL, 100),
  ('smartlead', 'Smartlead', 'email_platform', 'operational', NULL, NULL, 2000)
ON CONFLICT (name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  source_type = EXCLUDED.source_type,
  updated_at = NOW();

-- ============================================
-- SEED: Email Domains
-- ============================================
INSERT INTO domains (domain_name, status, daily_limit, health_score, bounce_rate, spam_rate, open_rate, sent_today, platform)
VALUES
  -- Established domains (active)
  ('outreach.iaml.com', 'active', 300, 92, 1.2, 0.1, 32.5, 145, 'smartlead'),
  ('connect.iaml.com', 'active', 250, 88, 1.8, 0.2, 28.3, 120, 'smartlead'),
  ('engage.iaml.com', 'active', 200, 85, 2.1, 0.3, 26.1, 95, 'smartlead'),
  ('reach.iaml.com', 'active', 200, 90, 1.5, 0.1, 30.2, 88, 'smartlead'),
  ('info.iaml.com', 'active', 150, 87, 1.9, 0.2, 27.8, 72, 'smartlead'),

  -- Warming domains
  ('notify.iaml.com', 'warming', 50, 75, 0.5, 0.0, 35.0, 25, 'smartlead'),
  ('updates.iaml.com', 'warming', 30, 70, 0.8, 0.1, 33.0, 15, 'smartlead'),

  -- Resting domains
  ('news.iaml.com', 'resting', 0, 55, 4.2, 0.8, 18.5, 0, 'smartlead'),

  -- GHL domain for past participants
  ('iaml.com', 'active', 500, 95, 0.5, 0.0, 45.2, 200, 'ghl')
ON CONFLICT (domain_name) DO UPDATE SET
  status = EXCLUDED.status,
  daily_limit = EXCLUDED.daily_limit,
  health_score = EXCLUDED.health_score,
  bounce_rate = EXCLUDED.bounce_rate,
  spam_rate = EXCLUDED.spam_rate,
  open_rate = EXCLUDED.open_rate,
  sent_today = EXCLUDED.sent_today,
  updated_at = NOW();

-- Set warmup details for warming domains
UPDATE domains
SET warmup_day = 12, warmup_start_date = CURRENT_DATE - INTERVAL '12 days', warmup_target_limit = 200
WHERE domain_name = 'notify.iaml.com';

UPDATE domains
SET warmup_day = 5, warmup_start_date = CURRENT_DATE - INTERVAL '5 days', warmup_target_limit = 150
WHERE domain_name = 'updates.iaml.com';

-- Set cooldown for resting domain
UPDATE domains
SET cooldown_until = CURRENT_DATE + INTERVAL '5 days', cooldown_reason = 'High bounce rate - resting for recovery'
WHERE domain_name = 'news.iaml.com';

-- ============================================
-- SEED: Recent Lead Imports
-- ============================================
INSERT INTO lead_imports (source_name, import_name, leads_sourced, leads_validated, leads_enriched, leads_ready, leads_rejected, validation_rate, enrichment_rate, duplicate_rate, status, imported_at, completed_at)
VALUES
  ('Apollo', 'HR Directors - Tech Q1', 250, 228, 215, 210, 22, 91.2, 94.3, 3.5, 'completed', NOW() - INTERVAL '1 day', NOW() - INTERVAL '23 hours'),
  ('Apollo', 'L&D Managers - Finance', 180, 162, 155, 150, 18, 90.0, 95.7, 4.2, 'completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 22 hours'),
  ('PhantomBuster', 'LinkedIn - SHRM Attendees', 120, 102, 95, 92, 18, 85.0, 93.1, 6.8, 'completed', NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 20 hours'),
  ('Apollo', 'Training Managers - Healthcare', 300, 276, 260, 255, 24, 92.0, 94.2, 3.1, 'completed', NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 21 hours'),
  ('Apify', 'Conference Speakers 2025', 85, 74, 70, 68, 11, 87.1, 94.6, 5.2, 'completed', NOW() - INTERVAL '7 days', NOW() - INTERVAL '6 days 22 hours')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Recent Activity
-- ============================================
INSERT INTO lead_intelligence_activity (activity_type, description, source_name, activity_at)
VALUES
  ('import_completed', 'Imported 250 leads from HR Directors - Tech Q1', 'Apollo', NOW() - INTERVAL '1 day'),
  ('validation_completed', '228 of 250 emails validated (91.2%)', 'Apollo', NOW() - INTERVAL '23 hours'),
  ('enrichment_completed', '215 leads enriched with company data', 'Apollo', NOW() - INTERVAL '22 hours'),
  ('domain_warming_started', 'Started warming notify.iaml.com', NULL, NOW() - INTERVAL '12 days'),
  ('domain_warming_started', 'Started warming updates.iaml.com', NULL, NOW() - INTERVAL '5 days'),
  ('domain_health_warning', 'news.iaml.com bounce rate exceeded 4%', NULL, NOW() - INTERVAL '3 days'),
  ('domain_rested', 'Moved news.iaml.com to resting status', NULL, NOW() - INTERVAL '2 days'),
  ('capacity_calculated', 'Daily capacity: 1,680 emails across 7 active domains', NULL, NOW() - INTERVAL '1 hour'),
  ('sync_completed', 'Synced 450 contacts to Smartlead', 'Smartlead', NOW() - INTERVAL '2 hours')
ON CONFLICT DO NOTHING;

-- ============================================
-- Calculate initial capacity
-- ============================================
SELECT calculate_daily_capacity();
