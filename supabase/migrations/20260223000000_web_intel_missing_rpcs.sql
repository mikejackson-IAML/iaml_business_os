-- Web Intel Missing RPCs & Views
-- Creates functions, views, and tables needed by:
--   Dashboard Metrics Computer (9EsPgSZcHqyZfaZJ)
--   Recommendation Generator (F0IqIHxzMsVbQpET)

-- ============================================
-- AI INSIGHTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS web_intel.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type TEXT NOT NULL,
    category TEXT,
    title TEXT NOT NULL,
    summary TEXT,
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('high', 'medium', 'low')),
    recommended_actions JSONB NOT NULL DEFAULT '[]'::JSONB,
    data_sources JSONB NOT NULL DEFAULT '[]'::JSONB,
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'in_progress', 'completed', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS
ALTER TABLE web_intel.ai_insights ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON web_intel.ai_insights;
CREATE POLICY "Allow authenticated read" ON web_intel.ai_insights FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow service role full access" ON web_intel.ai_insights;
CREATE POLICY "Allow service role full access" ON web_intel.ai_insights FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON web_intel.ai_insights TO authenticated;
GRANT ALL ON web_intel.ai_insights TO service_role;

-- Index
CREATE INDEX IF NOT EXISTS idx_ai_insights_status ON web_intel.ai_insights(status);
CREATE INDEX IF NOT EXISTS idx_ai_insights_category ON web_intel.ai_insights(category);

-- Updated_at trigger
DROP TRIGGER IF EXISTS update_ai_insights_updated_at ON web_intel.ai_insights;
CREATE TRIGGER update_ai_insights_updated_at
    BEFORE UPDATE ON web_intel.ai_insights
    FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at_column();

-- ============================================
-- LINK OPPORTUNITIES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS web_intel.link_opportunities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    domain TEXT NOT NULL,
    source TEXT,
    domain_authority INTEGER,
    page_url TEXT,
    link_type TEXT DEFAULT 'outreach',
    status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'acquired', 'rejected', 'expired')),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE web_intel.link_opportunities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON web_intel.link_opportunities;
CREATE POLICY "Allow authenticated read" ON web_intel.link_opportunities FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow service role full access" ON web_intel.link_opportunities;
CREATE POLICY "Allow service role full access" ON web_intel.link_opportunities FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON web_intel.link_opportunities TO authenticated;
GRANT ALL ON web_intel.link_opportunities TO service_role;

CREATE INDEX IF NOT EXISTS idx_link_opportunities_status ON web_intel.link_opportunities(status);

DROP TRIGGER IF EXISTS update_link_opportunities_updated_at ON web_intel.link_opportunities;
CREATE TRIGGER update_link_opportunities_updated_at
    BEFORE UPDATE ON web_intel.link_opportunities
    FOR EACH ROW EXECUTE FUNCTION web_intel.update_updated_at_column();

-- ============================================
-- STRIKING DISTANCE VIEW
-- Keywords ranking 11-20 (close to page 1)
-- ============================================

CREATE OR REPLACE VIEW web_intel.striking_distance AS
SELECT
    tk.id AS keyword_id,
    tk.keyword,
    dr.position,
    tk.search_volume,
    dr.ranking_url,
    tk.category,
    tk.difficulty,
    -- Opportunity score: higher for lower positions with higher volume
    ROUND(
        COALESCE(tk.search_volume, 0)::NUMERIC *
        CASE
            WHEN dr.position BETWEEN 11 AND 15 THEN 1.0
            WHEN dr.position BETWEEN 16 AND 20 THEN 0.7
            WHEN dr.position BETWEEN 4 AND 10 THEN 0.5
            ELSE 0.3
        END /
        GREATEST(COALESCE(tk.difficulty, 50), 1),
    2) AS opportunity_score,
    dr.collected_date
FROM web_intel.tracked_keywords tk
INNER JOIN LATERAL (
    SELECT position, ranking_url, collected_date
    FROM web_intel.daily_rankings
    WHERE keyword_id = tk.id
    ORDER BY collected_date DESC
    LIMIT 1
) dr ON TRUE
WHERE tk.status = 'active'
  AND dr.position BETWEEN 4 AND 20;

-- ============================================
-- COMPETITIVE GAPS VIEW
-- Keywords where competitors rank but we don't
-- ============================================

CREATE OR REPLACE VIEW web_intel.competitive_gaps AS
SELECT
    tk.keyword,
    (comp->>'domain')::TEXT AS competitor_domain,
    (comp->>'position')::INTEGER AS competitor_position,
    'content_gap' AS gap_type,
    tk.search_volume,
    tk.category
FROM web_intel.tracked_keywords tk
CROSS JOIN LATERAL (
    SELECT competitor_positions, position
    FROM web_intel.daily_rankings
    WHERE keyword_id = tk.id
    ORDER BY collected_date DESC
    LIMIT 1
) dr
CROSS JOIN LATERAL jsonb_array_elements(dr.competitor_positions) AS comp
WHERE tk.status = 'active'
  AND (dr.position IS NULL OR dr.position > 50)
  AND (comp->>'position')::INTEGER <= 20;

-- ============================================
-- DASHBOARD METRICS TABLE (materialized snapshot)
-- ============================================

CREATE TABLE IF NOT EXISTS web_intel.dashboard_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    computed_date DATE NOT NULL,
    sessions_today INTEGER DEFAULT 0,
    sessions_7d_avg NUMERIC(10,2) DEFAULT 0,
    sessions_30d_avg NUMERIC(10,2) DEFAULT 0,
    keywords_tracked INTEGER DEFAULT 0,
    keywords_top10 INTEGER DEFAULT 0,
    keywords_improved_7d INTEGER DEFAULT 0,
    keywords_declined_7d INTEGER DEFAULT 0,
    backlinks_total INTEGER DEFAULT 0,
    referring_domains INTEGER DEFAULT 0,
    new_links_7d INTEGER DEFAULT 0,
    alerts_critical INTEGER DEFAULT 0,
    alerts_warning INTEGER DEFAULT 0,
    thin_content_count INTEGER DEFAULT 0,
    content_decay_count INTEGER DEFAULT 0,
    serp_share_pct NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_dashboard_metrics_date UNIQUE (computed_date)
);

ALTER TABLE web_intel.dashboard_metrics ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON web_intel.dashboard_metrics;
CREATE POLICY "Allow authenticated read" ON web_intel.dashboard_metrics FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow service role full access" ON web_intel.dashboard_metrics;
CREATE POLICY "Allow service role full access" ON web_intel.dashboard_metrics FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON web_intel.dashboard_metrics TO authenticated;
GRANT ALL ON web_intel.dashboard_metrics TO service_role;

-- ============================================
-- COMPUTE DASHBOARD METRICS FUNCTION
-- ============================================

CREATE OR REPLACE FUNCTION web_intel.compute_dashboard_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
    v_sessions_today INTEGER;
    v_sessions_7d NUMERIC;
    v_sessions_30d NUMERIC;
    v_kw_tracked INTEGER;
    v_kw_top10 INTEGER;
    v_kw_improved INTEGER;
    v_kw_declined INTEGER;
    v_bl_total INTEGER;
    v_ref_domains INTEGER;
    v_new_links INTEGER;
    v_alerts_crit INTEGER;
    v_alerts_warn INTEGER;
    v_thin INTEGER;
    v_decay INTEGER;
    v_serp NUMERIC;
BEGIN
    -- Sessions
    SELECT COALESCE(sessions, 0) INTO v_sessions_today
    FROM web_intel.daily_traffic WHERE collected_date = p_date;

    SELECT COALESCE(AVG(sessions), 0) INTO v_sessions_7d
    FROM web_intel.daily_traffic WHERE collected_date BETWEEN p_date - 7 AND p_date;

    SELECT COALESCE(AVG(sessions), 0) INTO v_sessions_30d
    FROM web_intel.daily_traffic WHERE collected_date BETWEEN p_date - 30 AND p_date;

    -- Keywords
    SELECT COUNT(*) INTO v_kw_tracked FROM web_intel.tracked_keywords WHERE status = 'active';

    SELECT COUNT(*) INTO v_kw_top10
    FROM web_intel.tracked_keywords tk
    INNER JOIN LATERAL (
        SELECT position FROM web_intel.daily_rankings
        WHERE keyword_id = tk.id ORDER BY collected_date DESC LIMIT 1
    ) dr ON TRUE
    WHERE tk.status = 'active' AND dr.position <= 10;

    -- Ranking changes (improved/declined in last 7 days)
    SELECT
        COUNT(*) FILTER (WHERE change_type = 'improved'),
        COUNT(*) FILTER (WHERE change_type = 'dropped')
    INTO v_kw_improved, v_kw_declined
    FROM web_intel.ranking_change_events
    WHERE detected_date BETWEEN p_date - 7 AND p_date;

    -- Backlinks
    SELECT COALESCE(total_backlinks, 0), COALESCE(referring_domains, 0), COALESCE(new_links_7d, 0)
    INTO v_bl_total, v_ref_domains, v_new_links
    FROM web_intel.backlink_profile ORDER BY collected_date DESC LIMIT 1;

    -- Alerts
    SELECT
        COUNT(*) FILTER (WHERE severity = 'critical' AND acknowledged_at IS NULL),
        COUNT(*) FILTER (WHERE severity = 'warning' AND acknowledged_at IS NULL)
    INTO v_alerts_crit, v_alerts_warn
    FROM web_intel.alerts;

    -- Content
    SELECT COUNT(*) INTO v_thin FROM web_intel.thin_content WHERE is_addressed = FALSE;
    SELECT COUNT(*) INTO v_decay FROM web_intel.content_decay WHERE is_addressed = FALSE;

    -- SERP share
    SELECT COALESCE(our_share, 0) INTO v_serp
    FROM web_intel.serp_share ORDER BY collected_date DESC LIMIT 1;

    -- Upsert into dashboard_metrics
    INSERT INTO web_intel.dashboard_metrics (
        computed_date, sessions_today, sessions_7d_avg, sessions_30d_avg,
        keywords_tracked, keywords_top10, keywords_improved_7d, keywords_declined_7d,
        backlinks_total, referring_domains, new_links_7d,
        alerts_critical, alerts_warning, thin_content_count, content_decay_count, serp_share_pct
    ) VALUES (
        p_date, COALESCE(v_sessions_today, 0), COALESCE(v_sessions_7d, 0), COALESCE(v_sessions_30d, 0),
        COALESCE(v_kw_tracked, 0), COALESCE(v_kw_top10, 0), COALESCE(v_kw_improved, 0), COALESCE(v_kw_declined, 0),
        COALESCE(v_bl_total, 0), COALESCE(v_ref_domains, 0), COALESCE(v_new_links, 0),
        COALESCE(v_alerts_crit, 0), COALESCE(v_alerts_warn, 0),
        COALESCE(v_thin, 0), COALESCE(v_decay, 0), COALESCE(v_serp, 0)
    )
    ON CONFLICT (computed_date) DO UPDATE SET
        sessions_today = EXCLUDED.sessions_today,
        sessions_7d_avg = EXCLUDED.sessions_7d_avg,
        sessions_30d_avg = EXCLUDED.sessions_30d_avg,
        keywords_tracked = EXCLUDED.keywords_tracked,
        keywords_top10 = EXCLUDED.keywords_top10,
        keywords_improved_7d = EXCLUDED.keywords_improved_7d,
        keywords_declined_7d = EXCLUDED.keywords_declined_7d,
        backlinks_total = EXCLUDED.backlinks_total,
        referring_domains = EXCLUDED.referring_domains,
        new_links_7d = EXCLUDED.new_links_7d,
        alerts_critical = EXCLUDED.alerts_critical,
        alerts_warning = EXCLUDED.alerts_warning,
        thin_content_count = EXCLUDED.thin_content_count,
        content_decay_count = EXCLUDED.content_decay_count,
        serp_share_pct = EXCLUDED.serp_share_pct;

    -- Return as JSON
    v_result := jsonb_build_object(
        'computed_date', p_date,
        'sessions_today', COALESCE(v_sessions_today, 0),
        'sessions_7d_avg', COALESCE(v_sessions_7d, 0),
        'sessions_30d_avg', COALESCE(v_sessions_30d, 0),
        'keywords_tracked', COALESCE(v_kw_tracked, 0),
        'keywords_top10', COALESCE(v_kw_top10, 0),
        'keywords_improved_7d', COALESCE(v_kw_improved, 0),
        'keywords_declined_7d', COALESCE(v_kw_declined, 0),
        'backlinks_total', COALESCE(v_bl_total, 0),
        'referring_domains', COALESCE(v_ref_domains, 0),
        'new_links_7d', COALESCE(v_new_links, 0),
        'alerts_critical', COALESCE(v_alerts_crit, 0),
        'alerts_warning', COALESCE(v_alerts_warn, 0),
        'thin_content_count', COALESCE(v_thin, 0),
        'content_decay_count', COALESCE(v_decay, 0),
        'serp_share_pct', COALESCE(v_serp, 0)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- LATEST DASHBOARD VIEW
-- ============================================

CREATE OR REPLACE VIEW web_intel.latest_dashboard AS
SELECT * FROM web_intel.dashboard_metrics
ORDER BY computed_date DESC
LIMIT 1;

-- ============================================
-- BULK INSERT AI INSIGHTS RPC
-- ============================================

CREATE OR REPLACE FUNCTION web_intel.bulk_insert_ai_insights(p_insights JSONB)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    INSERT INTO web_intel.ai_insights (insight_type, category, title, summary, priority, recommended_actions, data_sources)
    SELECT
        (r->>'insight_type')::TEXT,
        (r->>'category')::TEXT,
        (r->>'title')::TEXT,
        (r->>'summary')::TEXT,
        COALESCE(r->>'priority', 'medium')::TEXT,
        COALESCE(r->'recommended_actions', '[]'::JSONB),
        COALESCE(r->'data_sources', '[]'::JSONB)
    FROM jsonb_array_elements(p_insights) AS r;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET LATEST DASHBOARD RPC (for PostgREST)
-- ============================================

CREATE OR REPLACE FUNCTION web_intel.get_latest_dashboard()
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(dm.*) INTO v_result
    FROM web_intel.dashboard_metrics dm
    ORDER BY computed_date DESC
    LIMIT 1;

    RETURN COALESCE(v_result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS ON SCHEMA FUNCTIONS
-- ============================================

GRANT EXECUTE ON FUNCTION web_intel.compute_dashboard_metrics(DATE) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.bulk_insert_ai_insights(JSONB) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.get_latest_dashboard() TO authenticated, service_role;

-- ============================================
-- PUBLIC WRAPPERS FOR POSTGREST
-- ============================================

-- compute_dashboard_metrics
DROP FUNCTION IF EXISTS public.compute_dashboard_metrics(DATE);
CREATE OR REPLACE FUNCTION public.compute_dashboard_metrics(p_date DATE DEFAULT CURRENT_DATE)
RETURNS JSONB AS $$ SELECT web_intel.compute_dashboard_metrics($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.compute_dashboard_metrics(DATE) TO authenticated, service_role;

-- get_latest_dashboard
DROP FUNCTION IF EXISTS public.get_latest_dashboard();
CREATE OR REPLACE FUNCTION public.get_latest_dashboard()
RETURNS JSONB AS $$ SELECT web_intel.get_latest_dashboard(); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_latest_dashboard() TO authenticated, service_role;

-- bulk_insert_ai_insights
DROP FUNCTION IF EXISTS public.bulk_insert_ai_insights(JSONB);
CREATE OR REPLACE FUNCTION public.bulk_insert_ai_insights(p_insights JSONB)
RETURNS INTEGER AS $$ SELECT web_intel.bulk_insert_ai_insights($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.bulk_insert_ai_insights(JSONB) TO authenticated, service_role;

-- ============================================
-- PUBLIC VIEWS FOR NEW TABLES
-- ============================================

CREATE OR REPLACE VIEW public.web_intel_ai_insights AS
SELECT * FROM web_intel.ai_insights;
GRANT SELECT ON public.web_intel_ai_insights TO authenticated, anon;

CREATE OR REPLACE VIEW public.web_intel_link_opportunities AS
SELECT * FROM web_intel.link_opportunities;
GRANT SELECT ON public.web_intel_link_opportunities TO authenticated, anon;

CREATE OR REPLACE VIEW public.web_intel_striking_distance AS
SELECT * FROM web_intel.striking_distance;
GRANT SELECT ON public.web_intel_striking_distance TO authenticated, anon;

CREATE OR REPLACE VIEW public.web_intel_competitive_gaps AS
SELECT * FROM web_intel.competitive_gaps;
GRANT SELECT ON public.web_intel_competitive_gaps TO authenticated, anon;

CREATE OR REPLACE VIEW public.web_intel_dashboard_metrics AS
SELECT * FROM web_intel.dashboard_metrics;
GRANT SELECT ON public.web_intel_dashboard_metrics TO authenticated, anon;
