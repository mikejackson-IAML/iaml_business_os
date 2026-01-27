-- Lead Intelligence Schema
-- Migration: Create tables for domain management, lead sourcing, and capacity tracking
-- Date: 2026-01-14

-- ============================================
-- DOMAINS TABLE
-- Email sending domains with health tracking
-- ============================================
CREATE TABLE IF NOT EXISTS domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_name TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warming', 'resting', 'blacklisted')),

  -- Capacity settings
  daily_limit INTEGER DEFAULT 100,
  warmup_day INTEGER,                     -- Current day in warmup cycle (null if not warming)
  warmup_start_date DATE,
  warmup_target_limit INTEGER,            -- Target daily limit after warmup

  -- Health metrics (updated daily)
  health_score INTEGER DEFAULT 100,       -- 0-100
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  spam_rate DECIMAL(5,2) DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,

  -- Usage tracking
  sent_today INTEGER DEFAULT 0,
  sent_this_week INTEGER DEFAULT 0,
  last_sent_at TIMESTAMPTZ,

  -- Cooldown
  cooldown_until TIMESTAMPTZ,
  cooldown_reason TEXT,

  -- Platform association
  platform TEXT DEFAULT 'smartlead',      -- 'smartlead', 'ghl', 'smtp'
  platform_domain_id TEXT,                -- ID in external platform

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX IF NOT EXISTS idx_domains_status ON domains(status);
CREATE INDEX IF NOT EXISTS idx_domains_health ON domains(health_score);
CREATE INDEX IF NOT EXISTS idx_domains_platform ON domains(platform);
-- ============================================
-- DOMAIN_HEALTH_LOG TABLE
-- Daily snapshots of domain health
-- ============================================
CREATE TABLE IF NOT EXISTS domain_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,

  -- Metrics snapshot
  health_score INTEGER,
  bounce_rate DECIMAL(5,2),
  spam_rate DECIMAL(5,2),
  open_rate DECIMAL(5,2),
  emails_sent INTEGER,

  -- Status at time of snapshot
  status TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(domain_id, log_date)
);
-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_domain_health_log_date ON domain_health_log(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_domain_health_log_domain ON domain_health_log(domain_id);
-- ============================================
-- LEAD_SOURCES TABLE
-- Platform configurations for lead sourcing
-- ============================================
CREATE TABLE IF NOT EXISTS lead_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,              -- 'apollo', 'phantombuster', 'apify', 'heyreach', 'smartlead'
  display_name TEXT NOT NULL,
  source_type TEXT,                       -- 'scraper', 'database', 'enrichment', 'email_platform'

  -- Status
  status TEXT DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'down', 'rate_limited')),
  last_status_check TIMESTAMPTZ,
  error_message TEXT,

  -- Limits and usage
  credits_remaining INTEGER,
  credits_total INTEGER,
  daily_limit_used INTEGER DEFAULT 0,
  daily_limit_total INTEGER,

  -- Configuration
  api_endpoint TEXT,
  settings JSONB DEFAULT '{}',

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- ============================================
-- LEAD_IMPORTS TABLE
-- Import batches with validation statistics
-- ============================================
CREATE TABLE IF NOT EXISTS lead_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id UUID REFERENCES lead_sources(id),
  source_name TEXT NOT NULL,              -- Denormalized for quick display
  import_name TEXT,                       -- User-friendly batch name

  -- Counts
  leads_sourced INTEGER DEFAULT 0,
  leads_validated INTEGER DEFAULT 0,
  leads_enriched INTEGER DEFAULT 0,
  leads_ready INTEGER DEFAULT 0,          -- Ready for campaign assignment
  leads_rejected INTEGER DEFAULT 0,

  -- Rates
  validation_rate DECIMAL(5,2),           -- % valid emails
  enrichment_rate DECIMAL(5,2),           -- % successfully enriched
  duplicate_rate DECIMAL(5,2),            -- % rejected as duplicates

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_message TEXT,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);
-- Index
CREATE INDEX IF NOT EXISTS idx_lead_imports_source ON lead_imports(source_name);
CREATE INDEX IF NOT EXISTS idx_lead_imports_date ON lead_imports(imported_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_imports_status ON lead_imports(status);
-- ============================================
-- SENDING_CAPACITY TABLE
-- Daily capacity calculations
-- ============================================
CREATE TABLE IF NOT EXISTS sending_capacity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calculation_date DATE UNIQUE NOT NULL,

  -- Capacity totals
  total_daily_capacity INTEGER,
  used_capacity INTEGER DEFAULT 0,
  available_capacity INTEGER,

  -- Domain breakdown
  active_domains INTEGER DEFAULT 0,
  warming_domains INTEGER DEFAULT 0,
  resting_domains INTEGER DEFAULT 0,
  blacklisted_domains INTEGER DEFAULT 0,

  -- Utilization
  utilization_percent DECIMAL(5,2),

  -- Metadata
  calculated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index
CREATE INDEX IF NOT EXISTS idx_sending_capacity_date ON sending_capacity(calculation_date DESC);
-- ============================================
-- LEAD_INTELLIGENCE_ACTIVITY TABLE
-- Activity log for lead operations
-- ============================================
CREATE TABLE IF NOT EXISTS lead_intelligence_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_type TEXT NOT NULL,
  description TEXT,
  source_name TEXT,

  -- Related entities
  domain_id UUID REFERENCES domains(id) ON DELETE SET NULL,
  lead_import_id UUID REFERENCES lead_imports(id) ON DELETE SET NULL,
  lead_source_id UUID REFERENCES lead_sources(id) ON DELETE SET NULL,

  -- Metadata
  metadata JSONB DEFAULT '{}',
  activity_at TIMESTAMPTZ DEFAULT NOW()
);
-- Constraint on activity_type
ALTER TABLE lead_intelligence_activity DROP CONSTRAINT IF EXISTS lead_intel_activity_type_check;
ALTER TABLE lead_intelligence_activity ADD CONSTRAINT lead_intel_activity_type_check
CHECK (activity_type IN (
  -- Import events
  'import_started', 'import_completed', 'import_failed',
  'validation_completed', 'enrichment_completed',
  -- Domain events
  'domain_added', 'domain_warming_started', 'domain_warmed',
  'domain_rested', 'domain_blacklisted', 'domain_restored',
  'domain_health_warning', 'domain_health_critical',
  -- Platform events
  'platform_status_changed', 'platform_rate_limited', 'platform_recovered',
  'credits_low', 'credits_exhausted', 'credits_purchased',
  -- Capacity events
  'capacity_calculated', 'capacity_warning', 'capacity_critical',
  -- System events
  'sync_completed', 'sync_failed', 'alert_generated', 'alert_resolved'
));
-- Index
CREATE INDEX IF NOT EXISTS idx_lead_intel_activity_type ON lead_intelligence_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_intel_activity_at ON lead_intelligence_activity(activity_at DESC);
-- ============================================
-- VIEW: Domain Summary
-- Aggregate domain statistics
-- ============================================
CREATE OR REPLACE VIEW domain_summary AS
SELECT
  COUNT(*) as total_domains,
  COUNT(*) FILTER (WHERE status = 'active') as active_domains,
  COUNT(*) FILTER (WHERE status = 'warming') as warming_domains,
  COUNT(*) FILTER (WHERE status = 'resting') as resting_domains,
  COUNT(*) FILTER (WHERE status = 'blacklisted') as blacklisted_domains,
  ROUND(AVG(health_score) FILTER (WHERE status = 'active'), 1) as avg_active_health,
  ROUND(AVG(health_score), 1) as avg_overall_health,
  COALESCE(SUM(daily_limit) FILTER (WHERE status = 'active'), 0) as total_active_capacity,
  COALESCE(SUM(sent_today), 0) as total_sent_today
FROM domains;
-- ============================================
-- VIEW: Lead Pipeline Summary (Last 7 Days)
-- ============================================
CREATE OR REPLACE VIEW lead_pipeline_summary AS
SELECT
  COALESCE(SUM(leads_sourced), 0) as leads_sourced_week,
  COALESCE(SUM(leads_validated), 0) as leads_validated_week,
  COALESCE(SUM(leads_enriched), 0) as leads_enriched_week,
  COALESCE(SUM(leads_ready), 0) as leads_ready_week,
  COALESCE(SUM(leads_rejected), 0) as leads_rejected_week,
  ROUND(
    AVG(validation_rate) FILTER (WHERE validation_rate IS NOT NULL),
    1
  ) as avg_validation_rate,
  COUNT(*) as import_count
FROM lead_imports
WHERE imported_at >= CURRENT_DATE - INTERVAL '7 days';
-- ============================================
-- VIEW: Capacity Dashboard
-- Current capacity status
-- ============================================
CREATE OR REPLACE VIEW capacity_dashboard AS
SELECT
  sc.*,
  CASE
    WHEN sc.utilization_percent >= 95 THEN 'critical'
    WHEN sc.utilization_percent >= 85 THEN 'warning'
    ELSE 'healthy'
  END as status
FROM sending_capacity sc
WHERE sc.calculation_date = CURRENT_DATE
ORDER BY sc.calculation_date DESC
LIMIT 1;
-- ============================================
-- FUNCTION: Calculate Daily Capacity
-- Recalculates sending capacity based on domain status
-- ============================================
CREATE OR REPLACE FUNCTION calculate_daily_capacity()
RETURNS VOID AS $$
DECLARE
  v_total_capacity INTEGER;
  v_used_capacity INTEGER;
  v_active_count INTEGER;
  v_warming_count INTEGER;
  v_resting_count INTEGER;
  v_blacklisted_count INTEGER;
BEGIN
  -- Calculate totals from domains table
  SELECT
    COALESCE(SUM(
      CASE
        WHEN status = 'active' THEN daily_limit
        WHEN status = 'warming' THEN daily_limit
        ELSE 0
      END
    ), 0),
    COALESCE(SUM(sent_today), 0),
    COUNT(*) FILTER (WHERE status = 'active'),
    COUNT(*) FILTER (WHERE status = 'warming'),
    COUNT(*) FILTER (WHERE status = 'resting'),
    COUNT(*) FILTER (WHERE status = 'blacklisted')
  INTO
    v_total_capacity,
    v_used_capacity,
    v_active_count,
    v_warming_count,
    v_resting_count,
    v_blacklisted_count
  FROM domains;

  -- Upsert capacity record for today
  INSERT INTO sending_capacity (
    calculation_date,
    total_daily_capacity,
    used_capacity,
    available_capacity,
    active_domains,
    warming_domains,
    resting_domains,
    blacklisted_domains,
    utilization_percent,
    calculated_at
  ) VALUES (
    CURRENT_DATE,
    v_total_capacity,
    v_used_capacity,
    v_total_capacity - v_used_capacity,
    v_active_count,
    v_warming_count,
    v_resting_count,
    v_blacklisted_count,
    CASE WHEN v_total_capacity > 0
      THEN ROUND((v_used_capacity::DECIMAL / v_total_capacity) * 100, 2)
      ELSE 0
    END,
    NOW()
  )
  ON CONFLICT (calculation_date) DO UPDATE SET
    total_daily_capacity = EXCLUDED.total_daily_capacity,
    used_capacity = EXCLUDED.used_capacity,
    available_capacity = EXCLUDED.available_capacity,
    active_domains = EXCLUDED.active_domains,
    warming_domains = EXCLUDED.warming_domains,
    resting_domains = EXCLUDED.resting_domains,
    blacklisted_domains = EXCLUDED.blacklisted_domains,
    utilization_percent = EXCLUDED.utilization_percent,
    calculated_at = NOW();
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- TRIGGERS: Auto-update timestamps
-- ============================================
DROP TRIGGER IF EXISTS domains_updated_at ON domains;
CREATE TRIGGER domains_updated_at
  BEFORE UPDATE ON domains
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS lead_sources_updated_at ON lead_sources;
CREATE TRIGGER lead_sources_updated_at
  BEFORE UPDATE ON lead_sources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE domains IS 'Email sending domains with health scores and capacity limits';
COMMENT ON TABLE domain_health_log IS 'Daily health snapshots for trending analysis';
COMMENT ON TABLE lead_sources IS 'Platform configurations for Apollo, PhantomBuster, etc.';
COMMENT ON TABLE lead_imports IS 'Lead import batches with validation statistics';
COMMENT ON TABLE sending_capacity IS 'Daily capacity calculations for dashboard';
COMMENT ON TABLE lead_intelligence_activity IS 'Activity log for lead intelligence operations';
COMMENT ON VIEW domain_summary IS 'Aggregate domain statistics for dashboard';
COMMENT ON VIEW lead_pipeline_summary IS '7-day lead pipeline metrics';
COMMENT ON VIEW capacity_dashboard IS 'Current capacity status with health indicator';
