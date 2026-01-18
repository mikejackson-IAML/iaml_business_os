-- Email Inboxes Schema
-- Migration: Add inbox-level tracking to Lead Intelligence
-- Date: 2026-01-15

-- ============================================
-- EMAIL_INBOXES TABLE
-- Per-inbox tracking with metrics and health
-- ============================================
CREATE TABLE IF NOT EXISTS email_inboxes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain_id UUID REFERENCES domains(id) ON DELETE CASCADE,
  inbox_email TEXT UNIQUE NOT NULL,
  smartlead_account_id TEXT,
  display_name TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warming', 'paused', 'disconnected')),

  -- Usage
  sent_today INTEGER DEFAULT 0,
  sent_this_week INTEGER DEFAULT 0,
  daily_limit INTEGER DEFAULT 50,

  -- Performance metrics
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  open_rate DECIMAL(5,2) DEFAULT 0,
  reply_rate DECIMAL(5,2) DEFAULT 0,
  spam_rate DECIMAL(5,2) DEFAULT 0,

  -- Warmup
  warmup_enabled BOOLEAN DEFAULT FALSE,
  warmup_day INTEGER,
  warmup_target_limit INTEGER,

  -- Connection status
  is_connected BOOLEAN DEFAULT TRUE,
  last_error TEXT,
  last_connected_at TIMESTAMPTZ,

  -- Health
  health_score INTEGER DEFAULT 100,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_email_inboxes_domain ON email_inboxes(domain_id);
CREATE INDEX IF NOT EXISTS idx_email_inboxes_status ON email_inboxes(status);
CREATE INDEX IF NOT EXISTS idx_email_inboxes_health ON email_inboxes(health_score);
CREATE INDEX IF NOT EXISTS idx_email_inboxes_smartlead ON email_inboxes(smartlead_account_id);

-- ============================================
-- INBOX_HEALTH_LOG TABLE
-- Daily snapshots for trending
-- ============================================
CREATE TABLE IF NOT EXISTS inbox_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inbox_id UUID REFERENCES email_inboxes(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,

  -- Metrics snapshot
  health_score INTEGER,
  bounce_rate DECIMAL(5,2),
  spam_rate DECIMAL(5,2),
  open_rate DECIMAL(5,2),
  reply_rate DECIMAL(5,2),
  emails_sent INTEGER,

  -- Status at time of snapshot
  status TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(inbox_id, log_date)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inbox_health_log_date ON inbox_health_log(log_date DESC);
CREATE INDEX IF NOT EXISTS idx_inbox_health_log_inbox ON inbox_health_log(inbox_id);

-- ============================================
-- UPDATE ACTIVITY TYPES
-- Add inbox-specific activity types
-- ============================================
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
  -- Inbox events (NEW)
  'inbox_added', 'inbox_warming_started', 'inbox_warmed',
  'inbox_paused', 'inbox_disconnected', 'inbox_reconnected',
  'inbox_health_warning', 'inbox_health_critical',
  -- Platform events
  'platform_status_changed', 'platform_rate_limited', 'platform_recovered',
  'credits_low', 'credits_exhausted', 'credits_purchased',
  -- Capacity events
  'capacity_calculated', 'capacity_warning', 'capacity_critical',
  -- System events
  'sync_completed', 'sync_failed', 'alert_generated', 'alert_resolved'
));

-- ============================================
-- VIEW: Inbox Summary
-- Aggregate inbox statistics
-- ============================================
CREATE OR REPLACE VIEW inbox_summary AS
SELECT
  COUNT(*) as total_inboxes,
  COUNT(*) FILTER (WHERE status = 'active') as active_inboxes,
  COUNT(*) FILTER (WHERE status = 'warming') as warming_inboxes,
  COUNT(*) FILTER (WHERE status = 'paused') as paused_inboxes,
  COUNT(*) FILTER (WHERE status = 'disconnected') as disconnected_inboxes,
  COUNT(*) FILTER (WHERE is_connected = FALSE) as connection_issues,
  ROUND(AVG(health_score) FILTER (WHERE status = 'active'), 1) as avg_active_health,
  ROUND(AVG(health_score), 1) as avg_overall_health,
  ROUND(AVG(bounce_rate), 2) as avg_bounce_rate,
  ROUND(AVG(reply_rate), 2) as avg_reply_rate,
  COALESCE(SUM(daily_limit) FILTER (WHERE status IN ('active', 'warming')), 0) as total_inbox_capacity,
  COALESCE(SUM(sent_today), 0) as total_sent_today
FROM email_inboxes;

-- ============================================
-- VIEW: Inbox Performance by Domain
-- Shows inbox rollup per domain
-- ============================================
CREATE OR REPLACE VIEW inbox_performance_by_domain AS
SELECT
  d.id as domain_id,
  d.domain_name,
  d.status as domain_status,
  d.health_score as domain_health,
  COUNT(i.id) as inbox_count,
  COUNT(i.id) FILTER (WHERE i.status = 'active') as active_inboxes,
  COUNT(i.id) FILTER (WHERE i.is_connected = FALSE) as disconnected_count,
  ROUND(AVG(i.health_score), 1) as avg_inbox_health,
  ROUND(AVG(i.bounce_rate), 2) as avg_inbox_bounce,
  ROUND(AVG(i.reply_rate), 2) as avg_inbox_reply,
  COALESCE(SUM(i.sent_today), 0) as domain_sent_today,
  COALESCE(SUM(i.daily_limit), 0) as domain_capacity
FROM domains d
LEFT JOIN email_inboxes i ON i.domain_id = d.id
GROUP BY d.id, d.domain_name, d.status, d.health_score
ORDER BY d.domain_name;

-- ============================================
-- FUNCTION: Calculate Inbox Health Score
-- Consistent health calculation for inboxes
-- ============================================
CREATE OR REPLACE FUNCTION calculate_inbox_health(
  p_bounce_rate DECIMAL,
  p_spam_rate DECIMAL,
  p_reply_rate DECIMAL,
  p_is_connected BOOLEAN
) RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER;
BEGIN
  -- Base score from metrics
  v_score := ROUND(
    -- Penalize bounce rate heavily (30% weight)
    (100 - LEAST(p_bounce_rate * 10, 100)) * 0.30 +
    -- Penalize spam rate (30% weight)
    (100 - LEAST(p_spam_rate * 20, 100)) * 0.30 +
    -- Reward reply rate (20% weight)
    LEAST(p_reply_rate * 2, 100) * 0.20 +
    -- Connection status (20% weight)
    (CASE WHEN p_is_connected THEN 100 ELSE 0 END) * 0.20
  );

  -- Clamp to 0-100
  RETURN GREATEST(0, LEAST(100, v_score));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- TRIGGER: Auto-update timestamps
-- ============================================
DROP TRIGGER IF EXISTS email_inboxes_updated_at ON email_inboxes;
CREATE TRIGGER email_inboxes_updated_at
  BEFORE UPDATE ON email_inboxes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE email_inboxes IS 'Individual email account tracking with per-inbox metrics and health scores';
COMMENT ON TABLE inbox_health_log IS 'Daily health snapshots for inbox trending analysis';
COMMENT ON VIEW inbox_summary IS 'Aggregate statistics across all email inboxes';
COMMENT ON VIEW inbox_performance_by_domain IS 'Inbox metrics rolled up by domain';
COMMENT ON FUNCTION calculate_inbox_health IS 'Calculates health score based on bounce, spam, reply rates and connection status';
