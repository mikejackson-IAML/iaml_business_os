-- Web Intelligence Department Schema
-- Migration: Create web_intel schema and tables
-- Date: 2026-01-20

-- ============================================
-- CREATE SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS web_intel;

-- ============================================
-- DAILY TRAFFIC TABLE
-- Aggregate daily traffic metrics from GA4
-- ============================================
CREATE TABLE web_intel.daily_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  collected_date DATE NOT NULL,

  -- Core metrics
  sessions INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2),  -- Percentage 0-100
  avg_session_duration NUMERIC(10,2),  -- Seconds

  -- Source breakdown (JSONB for flexibility)
  source_breakdown JSONB DEFAULT '{}',
  -- Format: {"organic": 1234, "direct": 567, "referral": 89, "social": 12, "email": 45}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date)
);

CREATE INDEX idx_daily_traffic_date ON web_intel.daily_traffic(collected_date DESC);

COMMENT ON TABLE web_intel.daily_traffic IS 'Daily aggregate traffic metrics from GA4';

-- ============================================
-- PAGE TRAFFIC TABLE
-- Per-page traffic data
-- ============================================
CREATE TABLE web_intel.page_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date and page
  collected_date DATE NOT NULL,
  page_path TEXT NOT NULL,

  -- Metrics
  sessions INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  unique_pageviews INTEGER DEFAULT 0,
  avg_time_on_page NUMERIC(10,2),  -- Seconds
  bounce_rate NUMERIC(5,2),
  exit_rate NUMERIC(5,2),
  entrances INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, page_path)
);

CREATE INDEX idx_page_traffic_date ON web_intel.page_traffic(collected_date DESC);
CREATE INDEX idx_page_traffic_page ON web_intel.page_traffic(page_path);
CREATE INDEX idx_page_traffic_date_page ON web_intel.page_traffic(collected_date, page_path);

COMMENT ON TABLE web_intel.page_traffic IS 'Per-page traffic metrics from GA4';

-- ============================================
-- GEO TRAFFIC TABLE
-- Geographic traffic breakdown
-- ============================================
CREATE TABLE web_intel.geo_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Period
  week_start DATE NOT NULL,  -- Monday of the week

  -- Location
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  region TEXT,

  -- Metrics
  sessions INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER DEFAULT 0,

  -- Comparison
  previous_week_sessions INTEGER,
  wow_change NUMERIC(5,2),  -- Week-over-week percentage change

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(week_start, country_code, region)
);

CREATE INDEX idx_geo_traffic_week ON web_intel.geo_traffic(week_start DESC);
CREATE INDEX idx_geo_traffic_country ON web_intel.geo_traffic(country_code);

COMMENT ON TABLE web_intel.geo_traffic IS 'Weekly geographic traffic breakdown';

-- ============================================
-- TRACKED KEYWORDS TABLE
-- Keywords to monitor for rankings
-- ============================================
CREATE TABLE web_intel.tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Keyword info
  keyword TEXT NOT NULL UNIQUE,
  search_volume INTEGER,  -- Monthly search volume
  difficulty INTEGER,  -- 0-100 difficulty score

  -- Classification
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
  category TEXT DEFAULT 'general' CHECK (category IN ('brand', 'program', 'competitor', 'industry', 'longtail', 'general')),

  -- Target
  target_url TEXT,  -- Expected/desired ranking URL

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suggested')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tracked_keywords_status ON web_intel.tracked_keywords(status);
CREATE INDEX idx_tracked_keywords_priority ON web_intel.tracked_keywords(priority);
CREATE INDEX idx_tracked_keywords_category ON web_intel.tracked_keywords(category);

COMMENT ON TABLE web_intel.tracked_keywords IS 'Keywords to monitor for search rankings';

-- ============================================
-- DAILY RANKINGS TABLE
-- Daily ranking snapshots
-- ============================================
CREATE TABLE web_intel.daily_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  keyword_id UUID NOT NULL REFERENCES web_intel.tracked_keywords(id) ON DELETE CASCADE,
  collected_date DATE NOT NULL,

  -- Ranking data
  position INTEGER,  -- NULL if not ranking, 1-100 otherwise
  ranking_url TEXT,  -- URL that's ranking

  -- SERP features (stored here for quick access)
  has_featured_snippet BOOLEAN DEFAULT FALSE,
  featured_snippet_owner TEXT,  -- 'us', 'competitor', or domain

  -- Competitor positions (top 5)
  competitor_positions JSONB DEFAULT '[]',
  -- Format: [{"domain": "competitor.com", "position": 3}, ...]

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(keyword_id, collected_date)
);

CREATE INDEX idx_daily_rankings_date ON web_intel.daily_rankings(collected_date DESC);
CREATE INDEX idx_daily_rankings_keyword ON web_intel.daily_rankings(keyword_id);
CREATE INDEX idx_daily_rankings_keyword_date ON web_intel.daily_rankings(keyword_id, collected_date DESC);
CREATE INDEX idx_daily_rankings_position ON web_intel.daily_rankings(position) WHERE position IS NOT NULL;

COMMENT ON TABLE web_intel.daily_rankings IS 'Daily search ranking snapshots for tracked keywords';

-- ============================================
-- SERP FEATURES TABLE
-- Detailed SERP feature tracking
-- ============================================
CREATE TABLE web_intel.serp_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference
  keyword_id UUID NOT NULL REFERENCES web_intel.tracked_keywords(id) ON DELETE CASCADE,
  collected_date DATE NOT NULL,

  -- Feature presence
  features_present TEXT[] DEFAULT '{}',
  -- Possible values: featured_snippet, people_also_ask, local_pack, knowledge_panel,
  -- video_carousel, image_pack, top_stories, shopping, site_links

  -- Feature details
  featured_snippet JSONB,
  -- Format: {"present": true, "owner": "domain.com", "type": "paragraph|list|table"}

  people_also_ask JSONB,
  -- Format: {"present": true, "questions": ["question1", "question2"]}

  local_pack JSONB,
  -- Format: {"present": true, "count": 3}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(keyword_id, collected_date)
);

CREATE INDEX idx_serp_features_date ON web_intel.serp_features(collected_date DESC);
CREATE INDEX idx_serp_features_keyword ON web_intel.serp_features(keyword_id);

COMMENT ON TABLE web_intel.serp_features IS 'SERP feature presence for tracked keywords';

-- ============================================
-- ALERTS TABLE
-- All system alerts
-- ============================================
CREATE TABLE web_intel.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert info
  alert_type TEXT NOT NULL,
  -- Types: traffic_drop, traffic_spike, ranking_drop, ranking_gain,
  -- ranking_lost, ranking_new, opportunity, index_error, decay_detected

  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),

  -- Content
  title TEXT NOT NULL,
  message TEXT,

  -- Context
  metadata JSONB DEFAULT '{}',
  -- Flexible structure for alert-specific data

  -- Status
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  notified_at TIMESTAMPTZ,
  notification_channel TEXT,  -- 'slack', 'email', etc.

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_type ON web_intel.alerts(alert_type);
CREATE INDEX idx_alerts_severity ON web_intel.alerts(severity);
CREATE INDEX idx_alerts_created ON web_intel.alerts(created_at DESC);
CREATE INDEX idx_alerts_unacknowledged ON web_intel.alerts(severity, created_at DESC)
  WHERE acknowledged_at IS NULL;

COMMENT ON TABLE web_intel.alerts IS 'All web intelligence alerts';

-- ============================================
-- COLLECTION LOG TABLE
-- Track workflow runs
-- ============================================
CREATE TABLE web_intel.collection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Workflow info
  workflow_id TEXT NOT NULL,
  workflow_name TEXT,

  -- Execution
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL CHECK (status IN ('running', 'success', 'failure', 'partial')),

  -- Details
  records_processed INTEGER DEFAULT 0,
  error_message TEXT,
  details JSONB DEFAULT '{}'
);

CREATE INDEX idx_collection_log_workflow ON web_intel.collection_log(workflow_id);
CREATE INDEX idx_collection_log_status ON web_intel.collection_log(status);
CREATE INDEX idx_collection_log_started ON web_intel.collection_log(started_at DESC);

COMMENT ON TABLE web_intel.collection_log IS 'Workflow execution log for monitoring';

-- ============================================
-- VIEWS
-- ============================================

-- 7-day traffic average by page
CREATE OR REPLACE VIEW web_intel.traffic_7day_avg AS
SELECT
  page_path,
  AVG(sessions) as avg_sessions,
  AVG(pageviews) as avg_pageviews,
  AVG(bounce_rate) as avg_bounce_rate,
  COUNT(*) as days_with_data
FROM web_intel.page_traffic
WHERE collected_date >= CURRENT_DATE - INTERVAL '7 days'
  AND collected_date < CURRENT_DATE
GROUP BY page_path;

COMMENT ON VIEW web_intel.traffic_7day_avg IS 'Rolling 7-day average traffic by page';

-- 30-day traffic average by page
CREATE OR REPLACE VIEW web_intel.traffic_30day_avg AS
SELECT
  page_path,
  AVG(sessions) as avg_sessions,
  AVG(pageviews) as avg_pageviews,
  AVG(bounce_rate) as avg_bounce_rate,
  COUNT(*) as days_with_data
FROM web_intel.page_traffic
WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days'
  AND collected_date < CURRENT_DATE
GROUP BY page_path;

COMMENT ON VIEW web_intel.traffic_30day_avg IS 'Rolling 30-day average traffic by page';

-- Daily aggregate traffic averages
CREATE OR REPLACE VIEW web_intel.daily_traffic_averages AS
SELECT
  AVG(sessions) FILTER (WHERE collected_date >= CURRENT_DATE - INTERVAL '7 days') as avg_sessions_7d,
  AVG(sessions) FILTER (WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days') as avg_sessions_30d,
  AVG(users) FILTER (WHERE collected_date >= CURRENT_DATE - INTERVAL '7 days') as avg_users_7d,
  AVG(users) FILTER (WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days') as avg_users_30d,
  AVG(pageviews) FILTER (WHERE collected_date >= CURRENT_DATE - INTERVAL '7 days') as avg_pageviews_7d,
  AVG(pageviews) FILTER (WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days') as avg_pageviews_30d
FROM web_intel.daily_traffic
WHERE collected_date < CURRENT_DATE;

COMMENT ON VIEW web_intel.daily_traffic_averages IS 'Aggregate traffic averages for anomaly detection';

-- Ranking changes (today vs yesterday)
CREATE OR REPLACE VIEW web_intel.ranking_changes AS
SELECT
  tk.id as keyword_id,
  tk.keyword,
  tk.priority,
  tk.category,
  tk.target_url,
  t.position as today_position,
  t.ranking_url as today_url,
  y.position as yesterday_position,
  y.ranking_url as yesterday_url,
  CASE
    WHEN y.position IS NULL AND t.position IS NOT NULL THEN 'new_ranking'
    WHEN y.position IS NOT NULL AND t.position IS NULL THEN 'lost_ranking'
    WHEN t.position IS NOT NULL AND y.position IS NOT NULL THEN
      CASE
        WHEN t.position - y.position > 10 THEN 'major_drop'
        WHEN t.position - y.position > 3 THEN 'drop'
        WHEN t.position - y.position < -5 THEN 'major_gain'
        WHEN t.position - y.position < -2 THEN 'gain'
        ELSE 'stable'
      END
    ELSE 'no_data'
  END as change_type,
  COALESCE(t.position, 0) - COALESCE(y.position, 0) as position_change
FROM web_intel.tracked_keywords tk
LEFT JOIN web_intel.daily_rankings t
  ON tk.id = t.keyword_id
  AND t.collected_date = CURRENT_DATE
LEFT JOIN web_intel.daily_rankings y
  ON tk.id = y.keyword_id
  AND y.collected_date = CURRENT_DATE - INTERVAL '1 day'
WHERE tk.status = 'active';

COMMENT ON VIEW web_intel.ranking_changes IS 'Compare today vs yesterday rankings';

-- 7-day ranking trend
CREATE OR REPLACE VIEW web_intel.ranking_trends AS
SELECT
  tk.id as keyword_id,
  tk.keyword,
  tk.priority,
  dr.collected_date,
  dr.position,
  AVG(dr.position) OVER (
    PARTITION BY tk.id
    ORDER BY dr.collected_date
    ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
  ) as avg_position_7d
FROM web_intel.tracked_keywords tk
JOIN web_intel.daily_rankings dr ON tk.id = dr.keyword_id
WHERE dr.collected_date >= CURRENT_DATE - INTERVAL '14 days'
  AND tk.status = 'active';

COMMENT ON VIEW web_intel.ranking_trends IS '7-day rolling average ranking position';

-- Striking distance opportunities
CREATE OR REPLACE VIEW web_intel.striking_distance AS
SELECT
  tk.id as keyword_id,
  tk.keyword,
  tk.search_volume,
  tk.priority,
  tk.target_url,
  dr.position,
  dr.ranking_url,
  CASE
    WHEN dr.position BETWEEN 4 AND 10 THEN 'page_1_opportunity'
    WHEN dr.position BETWEEN 11 AND 20 THEN 'page_2_opportunity'
  END as opportunity_type,
  -- Score: higher search volume and closer to top = higher priority
  COALESCE(tk.search_volume, 100) * (21 - dr.position) as opportunity_score
FROM web_intel.tracked_keywords tk
JOIN web_intel.daily_rankings dr
  ON tk.id = dr.keyword_id
  AND dr.collected_date = CURRENT_DATE
WHERE tk.status = 'active'
  AND dr.position BETWEEN 4 AND 20
ORDER BY opportunity_score DESC;

COMMENT ON VIEW web_intel.striking_distance IS 'Keywords in striking distance for optimization';

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Log collection run
CREATE OR REPLACE FUNCTION web_intel.log_collection(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_status TEXT,
  p_records_processed INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.collection_log (
    workflow_id,
    workflow_name,
    status,
    completed_at,
    records_processed,
    error_message,
    details
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    p_status,
    CASE WHEN p_status != 'running' THEN NOW() ELSE NULL END,
    p_records_processed,
    p_error_message,
    p_details
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION web_intel.log_collection IS 'Log workflow collection run';

-- Create alert
CREATE OR REPLACE FUNCTION web_intel.create_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.alerts (
    alert_type,
    severity,
    title,
    message,
    metadata
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION web_intel.create_alert IS 'Create a new alert';

-- Get traffic baseline
CREATE OR REPLACE FUNCTION web_intel.get_traffic_baseline(
  p_page_path TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  avg_sessions NUMERIC,
  avg_pageviews NUMERIC,
  avg_bounce_rate NUMERIC,
  data_points INTEGER
) AS $$
BEGIN
  IF p_page_path IS NULL THEN
    -- Aggregate baseline
    RETURN QUERY
    SELECT
      AVG(dt.sessions)::NUMERIC,
      AVG(dt.pageviews)::NUMERIC,
      AVG(dt.bounce_rate)::NUMERIC,
      COUNT(*)::INTEGER
    FROM web_intel.daily_traffic dt
    WHERE dt.collected_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
      AND dt.collected_date < CURRENT_DATE;
  ELSE
    -- Page-specific baseline
    RETURN QUERY
    SELECT
      AVG(pt.sessions)::NUMERIC,
      AVG(pt.pageviews)::NUMERIC,
      AVG(pt.bounce_rate)::NUMERIC,
      COUNT(*)::INTEGER
    FROM web_intel.page_traffic pt
    WHERE pt.page_path = p_page_path
      AND pt.collected_date >= CURRENT_DATE - (p_days || ' days')::INTERVAL
      AND pt.collected_date < CURRENT_DATE;
  END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION web_intel.get_traffic_baseline IS 'Get traffic baseline for comparison';

-- Mark alert as notified
CREATE OR REPLACE FUNCTION web_intel.mark_alert_notified(
  p_alert_id UUID,
  p_channel TEXT DEFAULT 'slack'
)
RETURNS VOID AS $$
BEGIN
  UPDATE web_intel.alerts
  SET
    notified_at = NOW(),
    notification_channel = p_channel
  WHERE id = p_alert_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION web_intel.mark_alert_notified IS 'Mark alert as notified';

-- ============================================
-- TRIGGERS
-- ============================================

-- Update updated_at on tracked_keywords
CREATE OR REPLACE FUNCTION web_intel.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tracked_keywords_updated_at
  BEFORE UPDATE ON web_intel.tracked_keywords
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER daily_traffic_updated_at
  BEFORE UPDATE ON web_intel.daily_traffic
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA web_intel IS 'Web Intelligence Department - traffic, rankings, and SEO monitoring';
