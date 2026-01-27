-- Web Intelligence Schema
-- Migration: Create web_intel schema and all tables
-- Date: 2026-01-21
-- Purpose: Database foundation for Web Intelligence Department workflows

-- ============================================
-- CREATE SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS web_intel;

-- ============================================
-- CORE TABLES
-- ============================================

-- Daily aggregate traffic from GA4
CREATE TABLE IF NOT EXISTS web_intel.daily_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL UNIQUE,

  -- Core metrics
  sessions INTEGER NOT NULL DEFAULT 0,
  users INTEGER NOT NULL DEFAULT 0,
  pageviews INTEGER NOT NULL DEFAULT 0,
  bounce_rate NUMERIC(5,2),  -- Percentage 0-100
  avg_session_duration NUMERIC(10,2),  -- Seconds

  -- Additional metrics
  new_users INTEGER,
  returning_users INTEGER,
  pages_per_session NUMERIC(5,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_daily_traffic_date ON web_intel.daily_traffic(collected_date DESC);

-- Per-page traffic metrics
CREATE TABLE IF NOT EXISTS web_intel.page_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,

  -- Metrics
  sessions INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,
  unique_pageviews INTEGER DEFAULT 0,
  avg_time_on_page NUMERIC(10,2),
  bounce_rate NUMERIC(5,2),
  exit_rate NUMERIC(5,2),
  entrances INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, page_path)
);

CREATE INDEX IF NOT EXISTS idx_page_traffic_date ON web_intel.page_traffic(collected_date DESC);
CREATE INDEX IF NOT EXISTS idx_page_traffic_path ON web_intel.page_traffic(page_path);

-- Traffic by source/medium
CREATE TABLE IF NOT EXISTS web_intel.traffic_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  source TEXT NOT NULL,
  medium TEXT NOT NULL,

  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  bounce_rate NUMERIC(5,2),
  pages_per_session NUMERIC(5,2),
  avg_session_duration NUMERIC(10,2),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, source, medium)
);

CREATE INDEX IF NOT EXISTS idx_traffic_sources_date ON web_intel.traffic_sources(collected_date DESC);

-- Geographic traffic breakdown
CREATE TABLE IF NOT EXISTS web_intel.traffic_geo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  country TEXT NOT NULL,
  region TEXT,
  city TEXT,

  sessions INTEGER DEFAULT 0,
  users INTEGER DEFAULT 0,
  pageviews INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_traffic_geo_date ON web_intel.traffic_geo(collected_date DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_geo_country ON web_intel.traffic_geo(country);
CREATE UNIQUE INDEX IF NOT EXISTS idx_traffic_geo_unique ON web_intel.traffic_geo(collected_date, country, COALESCE(region, ''), COALESCE(city, ''));

-- ============================================
-- RANKINGS TABLES
-- ============================================

-- Keywords to track
CREATE TABLE IF NOT EXISTS web_intel.tracked_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL UNIQUE,

  -- Metadata
  search_volume INTEGER,
  difficulty INTEGER,  -- 0-100
  cpc NUMERIC(10,2),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  target_url TEXT,
  category TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),

  -- Tracking
  volume_updated_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracked_keywords_status ON web_intel.tracked_keywords(status);
CREATE INDEX IF NOT EXISTS idx_tracked_keywords_priority ON web_intel.tracked_keywords(priority);

-- Daily ranking snapshots
CREATE TABLE IF NOT EXISTS web_intel.daily_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES web_intel.tracked_keywords(id) ON DELETE CASCADE,
  collected_date DATE NOT NULL,

  -- Our position
  position INTEGER,  -- NULL if not ranking
  ranking_url TEXT,

  -- SERP features
  has_featured_snippet BOOLEAN DEFAULT FALSE,
  featured_snippet_owner TEXT,  -- 'us' or competitor domain
  has_people_also_ask BOOLEAN DEFAULT FALSE,
  has_local_pack BOOLEAN DEFAULT FALSE,
  has_knowledge_panel BOOLEAN DEFAULT FALSE,
  has_video_results BOOLEAN DEFAULT FALSE,
  has_image_pack BOOLEAN DEFAULT FALSE,

  -- Competition
  competitor_positions JSONB DEFAULT '[]',  -- [{domain, position}]

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(keyword_id, collected_date)
);

CREATE INDEX IF NOT EXISTS idx_daily_rankings_date ON web_intel.daily_rankings(collected_date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_rankings_keyword ON web_intel.daily_rankings(keyword_id);
CREATE INDEX IF NOT EXISTS idx_daily_rankings_position ON web_intel.daily_rankings(position) WHERE position IS NOT NULL;

-- Ranking changes (detected anomalies)
CREATE TABLE IF NOT EXISTS web_intel.ranking_change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword_id UUID REFERENCES web_intel.tracked_keywords(id) ON DELETE CASCADE,
  detected_date DATE NOT NULL,

  previous_position INTEGER,
  current_position INTEGER,
  change_amount INTEGER,  -- Positive = improved, negative = dropped
  change_type TEXT CHECK (change_type IN ('improved', 'dropped', 'new_ranking', 'lost_ranking')),

  -- Context
  is_significant BOOLEAN DEFAULT FALSE,  -- Change >= 5 positions
  alert_sent BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ranking_change_events_date ON web_intel.ranking_change_events(detected_date DESC);
CREATE INDEX IF NOT EXISTS idx_ranking_change_events_significant ON web_intel.ranking_change_events(is_significant) WHERE is_significant = TRUE;

-- ============================================
-- GSC TABLES
-- ============================================

-- Index coverage from GSC
CREATE TABLE IF NOT EXISTS web_intel.index_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL UNIQUE,

  -- Counts
  indexed_count INTEGER DEFAULT 0,
  crawled_not_indexed INTEGER DEFAULT 0,
  discovered_not_indexed INTEGER DEFAULT 0,
  excluded_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Details (JSONB for flexibility)
  error_details JSONB DEFAULT '{}',
  excluded_details JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_index_coverage_date ON web_intel.index_coverage(collected_date DESC);

-- Index errors
CREATE TABLE IF NOT EXISTS web_intel.index_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  url TEXT NOT NULL,
  error_type TEXT NOT NULL,

  -- Status
  first_detected DATE,
  last_detected DATE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(url, error_type)
);

CREATE INDEX IF NOT EXISTS idx_index_errors_date ON web_intel.index_errors(collected_date DESC);
CREATE INDEX IF NOT EXISTS idx_index_errors_unresolved ON web_intel.index_errors(is_resolved) WHERE is_resolved = FALSE;

-- Core Web Vitals
CREATE TABLE IF NOT EXISTS web_intel.core_web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('mobile', 'desktop')),

  -- LCP (Largest Contentful Paint)
  lcp_good_pct NUMERIC(5,2),
  lcp_needs_improvement_pct NUMERIC(5,2),
  lcp_poor_pct NUMERIC(5,2),

  -- FID (First Input Delay) / INP (Interaction to Next Paint)
  fid_good_pct NUMERIC(5,2),
  fid_needs_improvement_pct NUMERIC(5,2),
  fid_poor_pct NUMERIC(5,2),

  -- CLS (Cumulative Layout Shift)
  cls_good_pct NUMERIC(5,2),
  cls_needs_improvement_pct NUMERIC(5,2),
  cls_poor_pct NUMERIC(5,2),

  -- Overall
  overall_status TEXT CHECK (overall_status IN ('good', 'needs_improvement', 'poor')),

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, device_type)
);

CREATE INDEX IF NOT EXISTS idx_cwv_date ON web_intel.core_web_vitals(collected_date DESC);

-- Search performance (from GSC)
CREATE TABLE IF NOT EXISTS web_intel.search_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  query TEXT,
  page TEXT,
  country TEXT,
  device TEXT,

  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(5,4),  -- Click-through rate as decimal
  position NUMERIC(5,2),  -- Average position

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_search_perf_date ON web_intel.search_performance(collected_date DESC);
CREATE INDEX IF NOT EXISTS idx_search_perf_query ON web_intel.search_performance(query);

-- Crawl stats
CREATE TABLE IF NOT EXISTS web_intel.crawl_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL UNIQUE,

  total_crawl_requests INTEGER DEFAULT 0,
  total_download_size_bytes BIGINT DEFAULT 0,
  avg_response_time_ms INTEGER,

  -- By response code
  responses_2xx INTEGER DEFAULT 0,
  responses_3xx INTEGER DEFAULT 0,
  responses_4xx INTEGER DEFAULT 0,
  responses_5xx INTEGER DEFAULT 0,

  -- By purpose
  crawl_discovery INTEGER DEFAULT 0,
  crawl_refresh INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_crawl_stats_date ON web_intel.crawl_stats(collected_date DESC);

-- Mobile usability issues
CREATE TABLE IF NOT EXISTS web_intel.mobile_usability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  url TEXT NOT NULL,
  issue_type TEXT NOT NULL,

  first_detected DATE,
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(url, issue_type)
);

CREATE INDEX IF NOT EXISTS idx_mobile_usability_unresolved ON web_intel.mobile_usability(is_resolved) WHERE is_resolved = FALSE;

-- Sitemap status
CREATE TABLE IF NOT EXISTS web_intel.sitemap_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  sitemap_url TEXT NOT NULL,

  submitted_urls INTEGER DEFAULT 0,
  indexed_urls INTEGER DEFAULT 0,
  last_downloaded TIMESTAMPTZ,
  is_pending BOOLEAN DEFAULT FALSE,
  has_errors BOOLEAN DEFAULT FALSE,
  error_details TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, sitemap_url)
);

-- ============================================
-- CONTENT TABLES
-- ============================================

-- Content inventory
CREATE TABLE IF NOT EXISTS web_intel.content_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL UNIQUE,

  -- Page info
  title TEXT,
  meta_description TEXT,
  h1 TEXT,
  word_count INTEGER,

  -- Dates
  publish_date DATE,
  last_modified DATE,
  last_crawled TIMESTAMPTZ,

  -- Classification
  content_type TEXT,  -- 'blog', 'landing', 'product', 'resource', etc.
  category TEXT,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redirect', 'removed', 'draft')),

  -- Metrics snapshot
  avg_monthly_sessions INTEGER,
  avg_monthly_pageviews INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_inventory_type ON web_intel.content_inventory(content_type);
CREATE INDEX IF NOT EXISTS idx_content_inventory_status ON web_intel.content_inventory(status);

-- Content decay tracking
CREATE TABLE IF NOT EXISTS web_intel.content_decay (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES web_intel.content_inventory(id) ON DELETE CASCADE,
  detected_date DATE NOT NULL,

  -- Traffic comparison
  baseline_period TEXT,  -- e.g., '2025-Q4'
  baseline_sessions INTEGER,
  current_sessions INTEGER,
  decay_percentage NUMERIC(5,2),

  -- Status
  severity TEXT CHECK (severity IN ('minor', 'moderate', 'severe')),
  is_addressed BOOLEAN DEFAULT FALSE,
  addressed_at TIMESTAMPTZ,
  action_taken TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_decay_date ON web_intel.content_decay(detected_date DESC);
CREATE INDEX IF NOT EXISTS idx_content_decay_unaddressed ON web_intel.content_decay(is_addressed) WHERE is_addressed = FALSE;

-- Thin content identification
CREATE TABLE IF NOT EXISTS web_intel.thin_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES web_intel.content_inventory(id) ON DELETE CASCADE,
  detected_date DATE NOT NULL,

  word_count INTEGER,
  avg_time_on_page NUMERIC(10,2),
  bounce_rate NUMERIC(5,2),

  reason TEXT,  -- Why flagged as thin
  recommendation TEXT,  -- Suggested action

  is_addressed BOOLEAN DEFAULT FALSE,
  addressed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content gaps
CREATE TABLE IF NOT EXISTS web_intel.content_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword TEXT NOT NULL,
  detected_date DATE NOT NULL,

  search_volume INTEGER,
  difficulty INTEGER,
  current_coverage TEXT,  -- 'none', 'partial', 'indirect'

  recommended_action TEXT,
  priority TEXT DEFAULT 'medium',

  is_addressed BOOLEAN DEFAULT FALSE,
  addressed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_gaps_unaddressed ON web_intel.content_gaps(is_addressed) WHERE is_addressed = FALSE;

-- Internal linking analysis
CREATE TABLE IF NOT EXISTS web_intel.internal_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,
  page_url TEXT NOT NULL,

  incoming_links INTEGER DEFAULT 0,
  outgoing_links INTEGER DEFAULT 0,
  is_orphan BOOLEAN DEFAULT FALSE,
  depth_from_home INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, page_url)
);

-- ============================================
-- COMPETITOR TABLES
-- ============================================

-- Tracked competitors
CREATE TABLE IF NOT EXISTS web_intel.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  name TEXT,

  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Competitor rankings
CREATE TABLE IF NOT EXISTS web_intel.competitor_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES web_intel.competitors(id) ON DELETE CASCADE,
  keyword_id UUID REFERENCES web_intel.tracked_keywords(id) ON DELETE CASCADE,
  collected_date DATE NOT NULL,

  position INTEGER,
  url TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(competitor_id, keyword_id, collected_date)
);

CREATE INDEX IF NOT EXISTS idx_competitor_rankings_date ON web_intel.competitor_rankings(collected_date DESC);

-- Competitor traffic estimates
CREATE TABLE IF NOT EXISTS web_intel.competitor_traffic (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES web_intel.competitors(id) ON DELETE CASCADE,
  collected_date DATE NOT NULL,

  estimated_monthly_visits INTEGER,
  estimated_organic_traffic INTEGER,
  traffic_rank INTEGER,

  top_keywords JSONB DEFAULT '[]',
  traffic_sources JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(competitor_id, collected_date)
);

-- SERP share of voice
CREATE TABLE IF NOT EXISTS web_intel.serp_share (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL,

  our_share NUMERIC(5,2),  -- Percentage
  competitor_shares JSONB DEFAULT '{}',  -- {domain: percentage}

  keywords_tracked INTEGER,
  keywords_ranking INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_serp_share_date ON web_intel.serp_share(collected_date DESC);

-- ============================================
-- BACKLINK TABLES
-- ============================================

-- Backlink profile snapshots
CREATE TABLE IF NOT EXISTS web_intel.backlink_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collected_date DATE NOT NULL UNIQUE,

  total_backlinks INTEGER DEFAULT 0,
  referring_domains INTEGER DEFAULT 0,
  dofollow_links INTEGER DEFAULT 0,
  nofollow_links INTEGER DEFAULT 0,

  domain_rating NUMERIC(5,2),
  url_rating NUMERIC(5,2),

  new_links_7d INTEGER DEFAULT 0,
  lost_links_7d INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_backlink_profile_date ON web_intel.backlink_profile(collected_date DESC);

-- Individual backlinks
CREATE TABLE IF NOT EXISTS web_intel.backlink_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_url TEXT NOT NULL,
  target_url TEXT NOT NULL,

  anchor_text TEXT,
  is_dofollow BOOLEAN DEFAULT TRUE,
  domain_rating NUMERIC(5,2),

  first_seen DATE,
  last_seen DATE,
  is_lost BOOLEAN DEFAULT FALSE,
  lost_date DATE,

  -- Quality scoring
  quality_score INTEGER,  -- 0-100
  is_toxic BOOLEAN DEFAULT FALSE,
  toxic_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_url, target_url)
);

-- Add columns if they don't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'web_intel' AND table_name = 'backlink_items' AND column_name = 'is_lost') THEN
    ALTER TABLE web_intel.backlink_items ADD COLUMN is_lost BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'web_intel' AND table_name = 'backlink_items' AND column_name = 'lost_date') THEN
    ALTER TABLE web_intel.backlink_items ADD COLUMN lost_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'web_intel' AND table_name = 'backlink_items' AND column_name = 'is_toxic') THEN
    ALTER TABLE web_intel.backlink_items ADD COLUMN is_toxic BOOLEAN DEFAULT FALSE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'web_intel' AND table_name = 'backlink_items' AND column_name = 'toxic_reason') THEN
    ALTER TABLE web_intel.backlink_items ADD COLUMN toxic_reason TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'web_intel' AND table_name = 'backlink_items' AND column_name = 'quality_score') THEN
    ALTER TABLE web_intel.backlink_items ADD COLUMN quality_score INTEGER;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_backlinks_lost ON web_intel.backlink_items(is_lost);
CREATE INDEX IF NOT EXISTS idx_backlinks_toxic ON web_intel.backlink_items(is_toxic) WHERE is_toxic = TRUE;

-- Link opportunities
CREATE TABLE IF NOT EXISTS web_intel.link_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_domain TEXT NOT NULL,
  source_url TEXT,

  opportunity_type TEXT,  -- 'competitor_link', 'broken_link', 'unlinked_mention', 'resource_page'
  domain_rating NUMERIC(5,2),

  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'acquired', 'rejected', 'expired')),
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AI INSIGHTS & REPORTS
-- ============================================

-- AI-generated insights
CREATE TABLE IF NOT EXISTS web_intel.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insight_type TEXT NOT NULL,  -- 'content_analysis', 'trend', 'recommendation', 'anomaly_explanation'

  title TEXT NOT NULL,
  content TEXT NOT NULL,  -- The insight text

  -- Context
  data_sources JSONB DEFAULT '[]',  -- Which tables/metrics informed this
  date_range_start DATE,
  date_range_end DATE,

  -- Classification
  priority TEXT DEFAULT 'medium',
  category TEXT,

  -- Status
  is_actionable BOOLEAN DEFAULT FALSE,
  is_addressed BOOLEAN DEFAULT FALSE,
  addressed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON web_intel.ai_insights(insight_type);
CREATE INDEX IF NOT EXISTS idx_ai_insights_date ON web_intel.ai_insights(created_at DESC);

-- Recommendations
CREATE TABLE IF NOT EXISTS web_intel.recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  title TEXT NOT NULL,
  description TEXT NOT NULL,

  category TEXT,  -- 'content', 'technical', 'rankings', 'backlinks'
  priority TEXT DEFAULT 'medium',
  estimated_impact TEXT,  -- 'low', 'medium', 'high'

  -- Source
  source_workflow TEXT,
  source_data JSONB DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'dismissed')),
  assigned_to TEXT,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_recommendations_status ON web_intel.recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_priority ON web_intel.recommendations(priority);

-- ============================================
-- ALERTS & LOGGING
-- ============================================

-- Alerts
CREATE TABLE IF NOT EXISTS web_intel.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,  -- 'traffic_anomaly', 'ranking_change', 'index_error', etc.
  severity TEXT NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),

  title TEXT NOT NULL,
  message TEXT NOT NULL,

  -- Context
  metadata JSONB DEFAULT '{}',
  source_workflow TEXT,

  -- Status
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_type ON web_intel.alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON web_intel.alerts(severity);
CREATE INDEX IF NOT EXISTS idx_alerts_unacknowledged ON web_intel.alerts(acknowledged_at) WHERE acknowledged_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_alerts_date ON web_intel.alerts(created_at DESC);

-- Collection/workflow run log
CREATE TABLE IF NOT EXISTS web_intel.collection_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id TEXT NOT NULL,
  workflow_name TEXT NOT NULL,

  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  records_processed INTEGER DEFAULT 0,

  error_message TEXT,
  details JSONB DEFAULT '{}',

  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_collection_log_workflow ON web_intel.collection_log(workflow_id);
CREATE INDEX IF NOT EXISTS idx_collection_log_date ON web_intel.collection_log(completed_at DESC);
CREATE INDEX IF NOT EXISTS idx_collection_log_status ON web_intel.collection_log(status);

-- ============================================
-- VIEWS
-- ============================================

-- 7-day traffic average by page
CREATE OR REPLACE VIEW web_intel.traffic_7day_avg AS
SELECT
  page_path,
  AVG(sessions) as avg_sessions,
  AVG(pageviews) as avg_pageviews,
  AVG(bounce_rate) as avg_bounce_rate
FROM web_intel.page_traffic
WHERE collected_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY page_path;

-- Ranking changes (today vs yesterday)
CREATE OR REPLACE VIEW web_intel.ranking_changes_today AS
SELECT
  tk.keyword,
  tk.priority,
  t.position as today_position,
  y.position as yesterday_position,
  COALESCE(y.position, 101) - COALESCE(t.position, 101) as change
FROM web_intel.tracked_keywords tk
LEFT JOIN web_intel.daily_rankings t
  ON tk.id = t.keyword_id AND t.collected_date = CURRENT_DATE
LEFT JOIN web_intel.daily_rankings y
  ON tk.id = y.keyword_id AND y.collected_date = CURRENT_DATE - INTERVAL '1 day'
WHERE tk.status = 'active';

-- Unresolved alerts summary
CREATE OR REPLACE VIEW web_intel.unresolved_alerts AS
SELECT
  alert_type,
  severity,
  COUNT(*) as count,
  MIN(created_at) as oldest,
  MAX(created_at) as newest
FROM web_intel.alerts
WHERE acknowledged_at IS NULL
GROUP BY alert_type, severity
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    ELSE 3
  END,
  count DESC;

-- Content health overview
CREATE OR REPLACE VIEW web_intel.content_health AS
SELECT
  ci.id,
  ci.url,
  ci.title,
  ci.word_count,
  ci.content_type,
  ci.avg_monthly_sessions,
  CASE
    WHEN ci.word_count < 300 THEN 'thin'
    WHEN cd.id IS NOT NULL AND cd.is_addressed = FALSE THEN 'decaying'
    ELSE 'healthy'
  END as health_status
FROM web_intel.content_inventory ci
LEFT JOIN web_intel.content_decay cd ON ci.id = cd.content_id AND cd.is_addressed = FALSE
WHERE ci.status = 'active';

-- Daily collection status
CREATE OR REPLACE VIEW web_intel.daily_collection_status AS
SELECT
  workflow_id,
  workflow_name,
  status,
  records_processed,
  completed_at
FROM web_intel.collection_log
WHERE DATE(completed_at) = CURRENT_DATE
ORDER BY completed_at DESC;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION web_intel.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER daily_traffic_updated_at BEFORE UPDATE ON web_intel.daily_traffic
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER tracked_keywords_updated_at BEFORE UPDATE ON web_intel.tracked_keywords
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER content_inventory_updated_at BEFORE UPDATE ON web_intel.content_inventory
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER competitors_updated_at BEFORE UPDATE ON web_intel.competitors
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER backlinks_updated_at BEFORE UPDATE ON web_intel.backlink_items
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER recommendations_updated_at BEFORE UPDATE ON web_intel.recommendations
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER link_opportunities_updated_at BEFORE UPDATE ON web_intel.link_opportunities
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA web_intel IS 'Web Intelligence Department - SEO monitoring, traffic analysis, and content performance tracking';
COMMENT ON TABLE web_intel.daily_traffic IS 'Daily aggregate traffic metrics from GA4';
COMMENT ON TABLE web_intel.tracked_keywords IS 'Keywords being tracked for ranking monitoring';
COMMENT ON TABLE web_intel.daily_rankings IS 'Daily ranking snapshots for tracked keywords';
COMMENT ON TABLE web_intel.content_inventory IS 'Catalog of all tracked content pages';
COMMENT ON TABLE web_intel.alerts IS 'Alerts generated by Web Intelligence workflows';
COMMENT ON TABLE web_intel.collection_log IS 'Log of workflow execution results';

-- ============================================
-- SEED DATA: Sample competitors
-- ============================================
INSERT INTO web_intel.competitors (domain, name, notes) VALUES
  ('competitor1.com', 'Competitor 1', 'Primary competitor - update with actual domain'),
  ('competitor2.com', 'Competitor 2', 'Secondary competitor - update with actual domain')
ON CONFLICT (domain) DO NOTHING;
