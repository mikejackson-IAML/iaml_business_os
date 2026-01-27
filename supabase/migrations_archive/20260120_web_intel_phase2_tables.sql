-- Web Intelligence Department - Phase 2 Tables
-- Migration: Add GSC and Content tables
-- Date: 2026-01-20

-- ============================================
-- INDEX COVERAGE TABLE
-- GSC index coverage status
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.index_coverage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  collected_date DATE NOT NULL,

  -- Coverage counts
  indexed_count INTEGER DEFAULT 0,
  crawled_not_indexed_count INTEGER DEFAULT 0,
  excluded_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,

  -- Breakdown by status (JSONB for flexibility)
  status_breakdown JSONB DEFAULT '{}',
  -- Format: {"submitted_indexed": 100, "indexed_not_submitted": 50, ...}

  -- Comparison
  previous_day_indexed INTEGER,
  change_from_previous INTEGER,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date)
);

CREATE INDEX idx_index_coverage_date ON web_intel.index_coverage(collected_date DESC);

COMMENT ON TABLE web_intel.index_coverage IS 'Daily GSC index coverage snapshot';

-- ============================================
-- CORE WEB VITALS TABLE
-- CWV metrics from GSC
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.core_web_vitals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  collected_date DATE NOT NULL,

  -- Device type
  device TEXT NOT NULL CHECK (device IN ('mobile', 'desktop')),

  -- LCP (Largest Contentful Paint) - milliseconds
  lcp_good_percent NUMERIC(5,2),
  lcp_needs_improvement_percent NUMERIC(5,2),
  lcp_poor_percent NUMERIC(5,2),
  lcp_p75 INTEGER,  -- 75th percentile in ms

  -- INP (Interaction to Next Paint) - milliseconds
  inp_good_percent NUMERIC(5,2),
  inp_needs_improvement_percent NUMERIC(5,2),
  inp_poor_percent NUMERIC(5,2),
  inp_p75 INTEGER,

  -- CLS (Cumulative Layout Shift) - score
  cls_good_percent NUMERIC(5,2),
  cls_needs_improvement_percent NUMERIC(5,2),
  cls_poor_percent NUMERIC(5,2),
  cls_p75 NUMERIC(6,4),

  -- Overall status
  overall_status TEXT CHECK (overall_status IN ('good', 'needs_improvement', 'poor')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, device)
);

CREATE INDEX idx_cwv_date ON web_intel.core_web_vitals(collected_date DESC);
CREATE INDEX idx_cwv_device ON web_intel.core_web_vitals(device);

COMMENT ON TABLE web_intel.core_web_vitals IS 'Core Web Vitals metrics from GSC';

-- ============================================
-- SEARCH PERFORMANCE TABLE
-- GSC search analytics data
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.search_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  collected_date DATE NOT NULL,

  -- Dimensions (nullable for aggregate rows)
  query TEXT,
  page TEXT,
  country TEXT,
  device TEXT,

  -- Metrics
  clicks INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  ctr NUMERIC(6,4),  -- 0.0000 to 1.0000
  position NUMERIC(6,2),  -- Average position

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_search_perf_date ON web_intel.search_performance(collected_date DESC);
CREATE INDEX idx_search_perf_query ON web_intel.search_performance(query) WHERE query IS NOT NULL;
CREATE INDEX idx_search_perf_page ON web_intel.search_performance(page) WHERE page IS NOT NULL;
CREATE INDEX idx_search_perf_date_page ON web_intel.search_performance(collected_date, page);

COMMENT ON TABLE web_intel.search_performance IS 'GSC search analytics data';

-- ============================================
-- CONTENT INVENTORY TABLE
-- All site pages with metadata
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.content_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- URL
  url TEXT NOT NULL UNIQUE,
  page_path TEXT NOT NULL,

  -- Content metadata
  title TEXT,
  meta_description TEXT,
  word_count INTEGER,
  heading_count INTEGER,

  -- Dates
  publish_date DATE,
  last_modified DATE,
  last_crawled TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'redirect', 'not_found', 'excluded')),

  -- Content type
  content_type TEXT DEFAULT 'page' CHECK (content_type IN ('page', 'blog', 'program', 'landing', 'other')),

  -- Decay tracking
  is_decaying BOOLEAN DEFAULT FALSE,
  decay_detected_at TIMESTAMPTZ,
  decay_percent NUMERIC(5,2),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_content_inventory_path ON web_intel.content_inventory(page_path);
CREATE INDEX idx_content_inventory_status ON web_intel.content_inventory(status);
CREATE INDEX idx_content_inventory_decaying ON web_intel.content_inventory(is_decaying) WHERE is_decaying = TRUE;
CREATE INDEX idx_content_inventory_type ON web_intel.content_inventory(content_type);

COMMENT ON TABLE web_intel.content_inventory IS 'Inventory of all site content';

-- ============================================
-- VIEWS
-- ============================================

-- Content decay detection view
CREATE OR REPLACE VIEW web_intel.content_decay_candidates AS
WITH current_traffic AS (
  SELECT
    page_path as page,
    SUM(sessions) as current_sessions,
    SUM(pageviews) as current_pageviews
  FROM web_intel.page_traffic
  WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY page_path
),
historical_traffic AS (
  SELECT
    page_path as page,
    SUM(sessions) as historical_sessions,
    SUM(pageviews) as historical_pageviews
  FROM web_intel.page_traffic
  WHERE collected_date >= CURRENT_DATE - INTERVAL '120 days'
    AND collected_date < CURRENT_DATE - INTERVAL '90 days'
  GROUP BY page_path
)
SELECT
  c.page,
  c.current_sessions,
  h.historical_sessions,
  CASE
    WHEN h.historical_sessions > 0
    THEN ABS(ROUND(((c.current_sessions - h.historical_sessions)::NUMERIC / h.historical_sessions) * 100, 2))
    ELSE 0
  END as decline_percent,
  ci.title,
  ci.content_type,
  ci.last_modified
FROM current_traffic c
JOIN historical_traffic h ON c.page = h.page
LEFT JOIN web_intel.content_inventory ci ON c.page = ci.page_path
WHERE h.historical_sessions >= 50  -- Only pages with meaningful traffic
  AND (c.current_sessions - h.historical_sessions)::NUMERIC / NULLIF(h.historical_sessions, 0) <= -0.20  -- 20% drop
ORDER BY decline_percent DESC;

COMMENT ON VIEW web_intel.content_decay_candidates IS 'Pages with 20%+ traffic decline over 3 months';

-- CWV status view
CREATE OR REPLACE VIEW web_intel.cwv_status AS
SELECT
  collected_date,
  device,
  overall_status,
  lcp_p75,
  inp_p75,
  cls_p75,
  CASE WHEN lcp_p75 <= 2500 THEN 'good' WHEN lcp_p75 <= 4000 THEN 'needs_improvement' ELSE 'poor' END as lcp_status,
  CASE WHEN inp_p75 <= 200 THEN 'good' WHEN inp_p75 <= 500 THEN 'needs_improvement' ELSE 'poor' END as inp_status,
  CASE WHEN cls_p75 <= 0.1 THEN 'good' WHEN cls_p75 <= 0.25 THEN 'needs_improvement' ELSE 'poor' END as cls_status
FROM web_intel.core_web_vitals
WHERE collected_date = (SELECT MAX(collected_date) FROM web_intel.core_web_vitals);

COMMENT ON VIEW web_intel.cwv_status IS 'Current Core Web Vitals status with thresholds';

-- Index coverage trend
CREATE OR REPLACE VIEW web_intel.index_coverage_trend AS
SELECT
  collected_date,
  indexed_count,
  error_count,
  LAG(indexed_count) OVER (ORDER BY collected_date) as prev_indexed,
  indexed_count - LAG(indexed_count) OVER (ORDER BY collected_date) as indexed_change,
  error_count - LAG(error_count) OVER (ORDER BY collected_date) as error_change
FROM web_intel.index_coverage
ORDER BY collected_date DESC
LIMIT 30;

COMMENT ON VIEW web_intel.index_coverage_trend IS '30-day index coverage trend';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER content_inventory_updated_at
  BEFORE UPDATE ON web_intel.content_inventory
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Mark content as decaying
CREATE OR REPLACE FUNCTION web_intel.mark_content_decaying(
  p_page_path TEXT,
  p_decay_percent NUMERIC
)
RETURNS VOID AS $$
BEGIN
  UPDATE web_intel.content_inventory
  SET
    is_decaying = TRUE,
    decay_detected_at = NOW(),
    decay_percent = p_decay_percent,
    updated_at = NOW()
  WHERE page_path = p_page_path;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION web_intel.mark_content_decaying IS 'Mark a page as experiencing traffic decay';

-- ============================================
-- INTERNAL LINK ISSUES TABLE
-- Track pages with linking problems
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.internal_link_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Page
  url TEXT NOT NULL,

  -- Link counts
  internal_link_count INTEGER DEFAULT 0,
  external_link_count INTEGER DEFAULT 0,

  -- Issue type
  issue_type TEXT NOT NULL CHECK (issue_type IN ('low_internal_links', 'orphan_page', 'broken_link', 'redirect_chain')),

  -- Status
  is_resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMPTZ,

  -- Detection
  detected_at TIMESTAMPTZ DEFAULT NOW(),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_internal_link_issues_url ON web_intel.internal_link_issues(url);
CREATE INDEX idx_internal_link_issues_type ON web_intel.internal_link_issues(issue_type);
CREATE INDEX idx_internal_link_issues_unresolved ON web_intel.internal_link_issues(is_resolved) WHERE is_resolved = FALSE;

COMMENT ON TABLE web_intel.internal_link_issues IS 'Pages with internal linking issues';

-- ============================================
-- ADD MISSING COLUMNS TO CONTENT_INVENTORY
-- ============================================
ALTER TABLE web_intel.content_inventory
  ADD COLUMN IF NOT EXISTS path TEXT,
  ADD COLUMN IF NOT EXISTS is_indexed BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS discovered_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_crawled_at TIMESTAMPTZ;

-- Update path from page_path if needed
UPDATE web_intel.content_inventory SET path = page_path WHERE path IS NULL AND page_path IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_content_inventory_indexed ON web_intel.content_inventory(is_indexed) WHERE is_indexed = TRUE;
