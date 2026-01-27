-- Web Intelligence Department - Phase 3 Tables
-- Migration: Add Competitor and Backlink tables
-- Date: 2026-01-20

-- ============================================
-- COMPETITORS TABLE
-- Track competitor domains
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.competitors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Domain info
  domain TEXT NOT NULL UNIQUE,
  name TEXT,

  -- Classification
  competitor_type TEXT DEFAULT 'direct' CHECK (competitor_type IN ('direct', 'indirect', 'aspirational')),
  priority INTEGER DEFAULT 5 CHECK (priority BETWEEN 1 AND 10),

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  -- Notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_competitors_active ON web_intel.competitors(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_competitors_priority ON web_intel.competitors(priority DESC);

COMMENT ON TABLE web_intel.competitors IS 'Competitor domains to track';

-- ============================================
-- COMPETITOR RANKINGS TABLE
-- Track competitor keyword rankings
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.competitor_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  collected_date DATE NOT NULL,

  -- Competitor
  competitor_id UUID REFERENCES web_intel.competitors(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,

  -- Keyword
  keyword_id UUID REFERENCES web_intel.tracked_keywords(id),
  keyword TEXT NOT NULL,

  -- Ranking data
  position INTEGER,
  url TEXT,

  -- SERP features
  has_featured_snippet BOOLEAN DEFAULT FALSE,
  has_local_pack BOOLEAN DEFAULT FALSE,
  has_knowledge_panel BOOLEAN DEFAULT FALSE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_comp_rankings_date ON web_intel.competitor_rankings(collected_date DESC);
CREATE INDEX idx_comp_rankings_competitor ON web_intel.competitor_rankings(competitor_id);
CREATE INDEX idx_comp_rankings_keyword ON web_intel.competitor_rankings(keyword_id);
CREATE INDEX idx_comp_rankings_date_comp ON web_intel.competitor_rankings(collected_date, competitor_domain);

COMMENT ON TABLE web_intel.competitor_rankings IS 'Daily competitor keyword rankings';

-- ============================================
-- COMPETITOR CONTENT TABLE
-- Track competitor content/pages
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.competitor_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Competitor
  competitor_id UUID REFERENCES web_intel.competitors(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,

  -- Content info
  url TEXT NOT NULL,
  title TEXT,
  publish_date DATE,

  -- Content metrics (estimated)
  word_count INTEGER,
  estimated_traffic INTEGER,

  -- Discovery
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  is_new BOOLEAN DEFAULT TRUE,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(competitor_domain, url)
);

CREATE INDEX idx_comp_content_competitor ON web_intel.competitor_content(competitor_id);
CREATE INDEX idx_comp_content_new ON web_intel.competitor_content(is_new) WHERE is_new = TRUE;
CREATE INDEX idx_comp_content_discovered ON web_intel.competitor_content(discovered_at DESC);

COMMENT ON TABLE web_intel.competitor_content IS 'Competitor content tracking';

-- ============================================
-- SERP SHARE TABLE
-- Track SERP share by keyword
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.serp_share (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  collected_date DATE NOT NULL,

  -- Keyword
  keyword_id UUID REFERENCES web_intel.tracked_keywords(id),
  keyword TEXT NOT NULL,

  -- Our position
  our_position INTEGER,
  our_url TEXT,

  -- Share metrics
  total_competitors_in_top10 INTEGER DEFAULT 0,
  our_visibility_score NUMERIC(5,2),  -- 0-100 based on position

  -- Competitor positions (JSONB for flexibility)
  competitor_positions JSONB DEFAULT '{}',
  -- Format: {"domain1": 3, "domain2": 7, ...}

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(collected_date, keyword_id)
);

CREATE INDEX idx_serp_share_date ON web_intel.serp_share(collected_date DESC);
CREATE INDEX idx_serp_share_keyword ON web_intel.serp_share(keyword_id);

COMMENT ON TABLE web_intel.serp_share IS 'SERP share analysis by keyword';

-- ============================================
-- BACKLINKS TABLE
-- Track backlink profile
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (linking page)
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,

  -- Target (our page)
  target_url TEXT NOT NULL,
  target_path TEXT,

  -- Link attributes
  anchor_text TEXT,
  is_dofollow BOOLEAN DEFAULT TRUE,
  is_image_link BOOLEAN DEFAULT FALSE,

  -- Quality metrics
  domain_authority INTEGER,  -- 0-100
  page_authority INTEGER,    -- 0-100
  spam_score INTEGER,        -- 0-100

  -- Discovery
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost', 'broken', 'toxic')),
  lost_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_url, target_url)
);

CREATE INDEX idx_backlinks_source_domain ON web_intel.backlinks(source_domain);
CREATE INDEX idx_backlinks_target ON web_intel.backlinks(target_url);
CREATE INDEX idx_backlinks_status ON web_intel.backlinks(status);
CREATE INDEX idx_backlinks_da ON web_intel.backlinks(domain_authority DESC);
CREATE INDEX idx_backlinks_first_seen ON web_intel.backlinks(first_seen_at DESC);

COMMENT ON TABLE web_intel.backlinks IS 'Backlink profile tracking';

-- ============================================
-- BACKLINK CHANGES TABLE
-- Track new/lost backlinks
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.backlink_changes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Date
  detected_date DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Backlink reference
  backlink_id UUID REFERENCES web_intel.backlinks(id),

  -- Change type
  change_type TEXT NOT NULL CHECK (change_type IN ('new', 'lost', 'recovered', 'status_change')),

  -- Link details (denormalized for history)
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,
  target_url TEXT NOT NULL,
  domain_authority INTEGER,

  -- Previous/new status
  previous_status TEXT,
  new_status TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backlink_changes_date ON web_intel.backlink_changes(detected_date DESC);
CREATE INDEX idx_backlink_changes_type ON web_intel.backlink_changes(change_type);
CREATE INDEX idx_backlink_changes_domain ON web_intel.backlink_changes(source_domain);

COMMENT ON TABLE web_intel.backlink_changes IS 'Backlink change history';

-- ============================================
-- LINK OPPORTUNITIES TABLE
-- Potential link building targets
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.link_opportunities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target domain
  domain TEXT NOT NULL,
  url TEXT,

  -- Discovery source
  source TEXT NOT NULL CHECK (source IN ('competitor_backlink', 'broken_link', 'mention', 'guest_post', 'resource_page')),
  source_details TEXT,

  -- Quality metrics
  domain_authority INTEGER,
  relevance_score INTEGER CHECK (relevance_score BETWEEN 1 AND 10),

  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'in_progress', 'won', 'lost', 'rejected')),

  -- Outreach
  contacted_at TIMESTAMPTZ,
  contact_email TEXT,
  notes TEXT,

  -- Metadata
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(domain, url)
);

CREATE INDEX idx_link_opps_status ON web_intel.link_opportunities(status);
CREATE INDEX idx_link_opps_source ON web_intel.link_opportunities(source);
CREATE INDEX idx_link_opps_da ON web_intel.link_opportunities(domain_authority DESC);

COMMENT ON TABLE web_intel.link_opportunities IS 'Link building opportunities';

-- ============================================
-- VIEWS
-- ============================================

-- Backlink summary view
CREATE OR REPLACE VIEW web_intel.backlink_summary AS
SELECT
  COUNT(*) as total_backlinks,
  COUNT(*) FILTER (WHERE status = 'active') as active_backlinks,
  COUNT(*) FILTER (WHERE status = 'lost') as lost_backlinks,
  COUNT(*) FILTER (WHERE status = 'toxic') as toxic_backlinks,
  COUNT(DISTINCT source_domain) as referring_domains,
  AVG(domain_authority) as avg_domain_authority,
  COUNT(*) FILTER (WHERE is_dofollow = TRUE) as dofollow_count,
  COUNT(*) FILTER (WHERE is_dofollow = FALSE) as nofollow_count,
  COUNT(*) FILTER (WHERE first_seen_at >= CURRENT_DATE - INTERVAL '30 days') as new_last_30_days
FROM web_intel.backlinks;

COMMENT ON VIEW web_intel.backlink_summary IS 'Backlink profile summary';

-- New backlinks last 7 days
CREATE OR REPLACE VIEW web_intel.recent_backlinks AS
SELECT
  source_url,
  source_domain,
  target_url,
  anchor_text,
  domain_authority,
  is_dofollow,
  first_seen_at
FROM web_intel.backlinks
WHERE first_seen_at >= CURRENT_DATE - INTERVAL '7 days'
  AND status = 'active'
ORDER BY domain_authority DESC, first_seen_at DESC;

COMMENT ON VIEW web_intel.recent_backlinks IS 'Backlinks discovered in last 7 days';

-- Competitor rank comparison view
CREATE OR REPLACE VIEW web_intel.competitor_rank_comparison AS
WITH our_ranks AS (
  SELECT
    dr.keyword_id,
    tk.keyword,
    dr.position as our_position,
    dr.collected_date
  FROM web_intel.daily_rankings dr
  JOIN web_intel.tracked_keywords tk ON dr.keyword_id = tk.id
  WHERE dr.collected_date = (SELECT MAX(collected_date) FROM web_intel.daily_rankings)
),
comp_ranks AS (
  SELECT
    keyword,
    competitor_domain,
    position,
    collected_date
  FROM web_intel.competitor_rankings
  WHERE collected_date = (SELECT MAX(collected_date) FROM web_intel.competitor_rankings)
)
SELECT
  o.keyword,
  o.our_position,
  c.competitor_domain,
  c.position as competitor_position,
  o.our_position - c.position as position_gap,
  CASE
    WHEN o.our_position < c.position THEN 'winning'
    WHEN o.our_position > c.position THEN 'losing'
    ELSE 'tied'
  END as status
FROM our_ranks o
LEFT JOIN comp_ranks c ON o.keyword = c.keyword
ORDER BY o.keyword, c.competitor_domain;

COMMENT ON VIEW web_intel.competitor_rank_comparison IS 'Compare our rankings vs competitors';

-- Competitive gaps (keywords where competitors rank but we don't)
CREATE OR REPLACE VIEW web_intel.competitive_gaps AS
WITH our_keywords AS (
  SELECT DISTINCT tk.keyword
  FROM web_intel.daily_rankings dr
  JOIN web_intel.tracked_keywords tk ON dr.keyword_id = tk.id
  WHERE dr.position <= 100
),
competitor_keywords AS (
  SELECT DISTINCT keyword, competitor_domain, position
  FROM web_intel.competitor_rankings
  WHERE position <= 20
    AND collected_date >= CURRENT_DATE - INTERVAL '7 days'
)
SELECT
  ck.keyword,
  ck.competitor_domain,
  ck.position as competitor_position,
  'gap' as gap_type
FROM competitor_keywords ck
LEFT JOIN our_keywords ok ON ck.keyword = ok.keyword
WHERE ok.keyword IS NULL
ORDER BY ck.position ASC;

COMMENT ON VIEW web_intel.competitive_gaps IS 'Keywords competitors rank for but we do not';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER competitors_updated_at
  BEFORE UPDATE ON web_intel.competitors
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER backlinks_updated_at
  BEFORE UPDATE ON web_intel.backlinks
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

CREATE TRIGGER link_opportunities_updated_at
  BEFORE UPDATE ON web_intel.link_opportunities
  FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at();

-- ============================================
-- SEED COMPETITORS (placeholder)
-- ============================================
-- Add your competitors here:
-- INSERT INTO web_intel.competitors (domain, name, competitor_type, priority) VALUES
--   ('competitor1.com', 'Competitor 1', 'direct', 10),
--   ('competitor2.com', 'Competitor 2', 'direct', 8);
