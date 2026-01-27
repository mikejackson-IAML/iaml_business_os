-- Web Intelligence Department - Phase 4 Tables
-- Migration: Add AI Insights and Reports tables
-- Date: 2026-01-20

-- ============================================
-- AI INSIGHTS TABLE
-- Store AI-generated insights
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Insight classification
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'content_recommendation',
    'keyword_opportunity',
    'trend_alert',
    'competitive_insight',
    'performance_anomaly',
    'optimization_suggestion'
  )),

  category TEXT,  -- 'traffic', 'rankings', 'content', 'backlinks', 'competitors'

  -- Content
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  details TEXT,

  -- Priority/Impact
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('critical', 'high', 'medium', 'low')),
  estimated_impact TEXT,  -- 'high', 'medium', 'low'

  -- Action items
  recommended_actions JSONB DEFAULT '[]',
  -- Format: [{"action": "...", "effort": "low|medium|high", "impact": "low|medium|high"}]

  -- Context
  data_sources TEXT[],  -- Which tables/data informed this insight
  related_entities JSONB DEFAULT '{}',
  -- Format: {"keywords": [...], "pages": [...], "competitors": [...]}

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'actioned', 'dismissed')),
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,

  -- AI metadata
  model_used TEXT,
  confidence_score NUMERIC(3,2),  -- 0.00 to 1.00

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,  -- Some insights become stale
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ai_insights_type ON web_intel.ai_insights(insight_type);
CREATE INDEX idx_ai_insights_priority ON web_intel.ai_insights(priority);
CREATE INDEX idx_ai_insights_status ON web_intel.ai_insights(status);
CREATE INDEX idx_ai_insights_generated ON web_intel.ai_insights(generated_at DESC);
CREATE INDEX idx_ai_insights_active ON web_intel.ai_insights(status, priority)
  WHERE status IN ('new', 'reviewed');

COMMENT ON TABLE web_intel.ai_insights IS 'AI-generated insights and recommendations';

-- ============================================
-- TRENDS TABLE
-- Track identified trends
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.trends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Trend identification
  trend_type TEXT NOT NULL CHECK (trend_type IN (
    'traffic_trend',
    'ranking_trend',
    'keyword_trend',
    'seasonal_pattern',
    'competitor_trend'
  )),

  -- Description
  name TEXT NOT NULL,
  description TEXT,

  -- Direction
  direction TEXT CHECK (direction IN ('up', 'down', 'stable', 'volatile')),
  magnitude NUMERIC(5,2),  -- Percentage change

  -- Time range
  start_date DATE,
  end_date DATE,

  -- Data points
  data_points JSONB DEFAULT '[]',
  -- Format: [{"date": "2026-01-01", "value": 123}, ...]

  -- Prediction
  predicted_continuation BOOLEAN,
  prediction_confidence NUMERIC(3,2),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Timestamps
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  last_updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_trends_type ON web_intel.trends(trend_type);
CREATE INDEX idx_trends_active ON web_intel.trends(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_trends_detected ON web_intel.trends(detected_at DESC);

COMMENT ON TABLE web_intel.trends IS 'Detected trends in web intelligence data';

-- ============================================
-- REPORTS TABLE
-- Generated reports metadata
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Report identification
  report_type TEXT NOT NULL CHECK (report_type IN (
    'weekly_digest',
    'monthly_report',
    'quarterly_review',
    'custom'
  )),

  -- Period
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Content
  title TEXT NOT NULL,
  summary TEXT,

  -- Sections included
  sections JSONB DEFAULT '[]',
  -- Format: [{"name": "Traffic Overview", "data": {...}}, ...]

  -- Key metrics snapshot
  metrics_snapshot JSONB DEFAULT '{}',
  -- Format: {"sessions": 12345, "rankings_improved": 10, ...}

  -- Highlights
  highlights JSONB DEFAULT '[]',
  -- Format: [{"type": "win", "message": "..."}, {"type": "alert", "message": "..."}]

  -- Distribution
  sent_to TEXT[],
  sent_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'generated', 'sent', 'archived')),

  -- Timestamps
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reports_type ON web_intel.reports(report_type);
CREATE INDEX idx_reports_period ON web_intel.reports(period_start DESC);
CREATE INDEX idx_reports_status ON web_intel.reports(status);

COMMENT ON TABLE web_intel.reports IS 'Generated web intelligence reports';

-- ============================================
-- DASHBOARD METRICS TABLE
-- Pre-computed metrics for dashboards
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  metric_date DATE NOT NULL,

  -- Traffic metrics
  daily_sessions INTEGER,
  daily_users INTEGER,
  daily_pageviews INTEGER,
  sessions_7d_avg NUMERIC(10,2),
  sessions_30d_avg NUMERIC(10,2),
  sessions_wow_change NUMERIC(5,2),  -- Week over week
  sessions_mom_change NUMERIC(5,2),  -- Month over month

  -- Ranking metrics
  keywords_tracked INTEGER,
  keywords_top3 INTEGER,
  keywords_top10 INTEGER,
  keywords_improved INTEGER,
  keywords_declined INTEGER,
  avg_position NUMERIC(5,2),

  -- Content metrics
  total_pages INTEGER,
  pages_indexed INTEGER,
  pages_decaying INTEGER,

  -- Backlink metrics
  total_backlinks INTEGER,
  new_backlinks_7d INTEGER,
  lost_backlinks_7d INTEGER,
  avg_domain_authority NUMERIC(5,2),

  -- Alert metrics
  alerts_critical INTEGER DEFAULT 0,
  alerts_warning INTEGER DEFAULT 0,
  alerts_info INTEGER DEFAULT 0,

  -- Timestamps
  computed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(metric_date)
);

CREATE INDEX idx_dashboard_metrics_date ON web_intel.dashboard_metrics(metric_date DESC);

COMMENT ON TABLE web_intel.dashboard_metrics IS 'Pre-computed daily dashboard metrics';

-- ============================================
-- VIEWS
-- ============================================

-- Active insights summary
CREATE OR REPLACE VIEW web_intel.active_insights AS
SELECT
  insight_type,
  priority,
  COUNT(*) as count,
  ARRAY_AGG(title ORDER BY generated_at DESC) as titles
FROM web_intel.ai_insights
WHERE status IN ('new', 'reviewed')
  AND (expires_at IS NULL OR expires_at > NOW())
GROUP BY insight_type, priority
ORDER BY
  CASE priority
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    ELSE 4
  END;

COMMENT ON VIEW web_intel.active_insights IS 'Summary of active AI insights by type and priority';

-- Latest dashboard metrics
CREATE OR REPLACE VIEW web_intel.latest_dashboard AS
SELECT *
FROM web_intel.dashboard_metrics
WHERE metric_date = (SELECT MAX(metric_date) FROM web_intel.dashboard_metrics);

COMMENT ON VIEW web_intel.latest_dashboard IS 'Most recent dashboard metrics';

-- Weekly trend summary
CREATE OR REPLACE VIEW web_intel.weekly_performance AS
SELECT
  DATE_TRUNC('week', dt.collected_date)::DATE as week_start,
  SUM(dt.sessions) as total_sessions,
  SUM(dt.users) as total_users,
  SUM(dt.pageviews) as total_pageviews,
  AVG(dt.bounce_rate) as avg_bounce_rate
FROM web_intel.daily_traffic dt
WHERE dt.collected_date >= CURRENT_DATE - INTERVAL '12 weeks'
GROUP BY DATE_TRUNC('week', dt.collected_date)
ORDER BY week_start DESC;

COMMENT ON VIEW web_intel.weekly_performance IS 'Weekly aggregated performance metrics';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Store AI insight
CREATE OR REPLACE FUNCTION web_intel.store_insight(
  p_type TEXT,
  p_title TEXT,
  p_summary TEXT,
  p_priority TEXT DEFAULT 'medium',
  p_category TEXT DEFAULT NULL,
  p_details TEXT DEFAULT NULL,
  p_recommended_actions JSONB DEFAULT '[]',
  p_data_sources TEXT[] DEFAULT '{}',
  p_confidence NUMERIC DEFAULT 0.8
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.ai_insights (
    insight_type,
    category,
    title,
    summary,
    details,
    priority,
    recommended_actions,
    data_sources,
    confidence_score,
    model_used
  ) VALUES (
    p_type,
    p_category,
    p_title,
    p_summary,
    p_details,
    p_priority,
    p_recommended_actions,
    p_data_sources,
    p_confidence,
    'claude'
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION web_intel.store_insight IS 'Store a new AI-generated insight';

-- Compute daily dashboard metrics
CREATE OR REPLACE FUNCTION web_intel.compute_dashboard_metrics(p_date DATE DEFAULT CURRENT_DATE - 1)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.dashboard_metrics (
    metric_date,
    daily_sessions,
    daily_users,
    daily_pageviews,
    sessions_7d_avg,
    sessions_30d_avg,
    keywords_tracked,
    keywords_top10,
    alerts_critical,
    alerts_warning,
    alerts_info
  )
  SELECT
    p_date,
    (SELECT sessions FROM web_intel.daily_traffic WHERE collected_date = p_date),
    (SELECT users FROM web_intel.daily_traffic WHERE collected_date = p_date),
    (SELECT pageviews FROM web_intel.daily_traffic WHERE collected_date = p_date),
    (SELECT AVG(sessions) FROM web_intel.daily_traffic WHERE collected_date BETWEEN p_date - 6 AND p_date),
    (SELECT AVG(sessions) FROM web_intel.daily_traffic WHERE collected_date BETWEEN p_date - 29 AND p_date),
    (SELECT COUNT(*) FROM web_intel.tracked_keywords WHERE status = 'active'),
    (SELECT COUNT(*) FROM web_intel.daily_rankings WHERE collected_date = p_date AND position <= 10),
    (SELECT COUNT(*) FROM web_intel.alerts WHERE DATE(created_at) = p_date AND severity = 'critical'),
    (SELECT COUNT(*) FROM web_intel.alerts WHERE DATE(created_at) = p_date AND severity = 'warning'),
    (SELECT COUNT(*) FROM web_intel.alerts WHERE DATE(created_at) = p_date AND severity = 'info')
  ON CONFLICT (metric_date) DO UPDATE SET
    daily_sessions = EXCLUDED.daily_sessions,
    daily_users = EXCLUDED.daily_users,
    daily_pageviews = EXCLUDED.daily_pageviews,
    sessions_7d_avg = EXCLUDED.sessions_7d_avg,
    sessions_30d_avg = EXCLUDED.sessions_30d_avg,
    keywords_tracked = EXCLUDED.keywords_tracked,
    keywords_top10 = EXCLUDED.keywords_top10,
    alerts_critical = EXCLUDED.alerts_critical,
    alerts_warning = EXCLUDED.alerts_warning,
    alerts_info = EXCLUDED.alerts_info,
    computed_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION web_intel.compute_dashboard_metrics IS 'Compute and store daily dashboard metrics';
