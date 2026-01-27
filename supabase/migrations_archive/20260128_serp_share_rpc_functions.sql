-- SERP Share Calculator RPC Functions
-- Migration: Create RPC functions for SERP Share workflow
-- Date: 2026-01-27
-- Purpose: Replace direct Postgres queries with REST API callable functions

-- ============================================
-- FUNCTION: Get Our Rankings with Latest Data
-- Used by: Web Intel - SERP Share Calculator
-- ============================================
CREATE OR REPLACE FUNCTION web_intel.get_our_rankings()
RETURNS TABLE (
  keyword_id UUID,
  keyword TEXT,
  our_position INTEGER,
  our_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    k.id as keyword_id,
    k.keyword,
    dr.position as our_position,
    dr.ranking_url as our_url
  FROM web_intel.tracked_keywords k
  LEFT JOIN web_intel.daily_rankings dr ON k.id = dr.keyword_id
    AND dr.collected_date = (SELECT MAX(collected_date) FROM web_intel.daily_rankings)
  WHERE k.status = 'active'
  ORDER BY k.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Get Competitor Rankings (Latest)
-- Used by: Web Intel - SERP Share Calculator
-- ============================================
CREATE OR REPLACE FUNCTION web_intel.get_competitor_rankings()
RETURNS TABLE (
  keyword TEXT,
  competitor_domain TEXT,
  rank_position INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cr.keyword,
    cr.competitor_domain,
    cr.position as rank_position
  FROM web_intel.competitor_rankings cr
  WHERE cr.collected_date = (SELECT MAX(collected_date) FROM web_intel.competitor_rankings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: Upsert SERP Share Data
-- Used by: Web Intel - SERP Share Calculator
-- ============================================
CREATE OR REPLACE FUNCTION web_intel.upsert_serp_share(
  p_collected_date DATE,
  p_keyword_id UUID,
  p_keyword TEXT,
  p_our_position INTEGER,
  p_our_url TEXT,
  p_total_competitors_in_top10 INTEGER,
  p_our_visibility_score NUMERIC,
  p_competitor_positions JSONB
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO web_intel.serp_share (
    collected_date,
    keyword_id,
    keyword,
    our_position,
    our_url,
    total_competitors_in_top10,
    our_visibility_score,
    competitor_positions
  ) VALUES (
    p_collected_date,
    p_keyword_id,
    p_keyword,
    p_our_position,
    p_our_url,
    p_total_competitors_in_top10,
    p_our_visibility_score,
    p_competitor_positions
  )
  ON CONFLICT (collected_date, keyword_id) DO UPDATE SET
    keyword = EXCLUDED.keyword,
    our_position = EXCLUDED.our_position,
    our_url = EXCLUDED.our_url,
    total_competitors_in_top10 = EXCLUDED.total_competitors_in_top10,
    our_visibility_score = EXCLUDED.our_visibility_score,
    competitor_positions = EXCLUDED.competitor_positions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- Allow service role to call these functions
-- ============================================
GRANT EXECUTE ON FUNCTION web_intel.get_our_rankings() TO service_role;
GRANT EXECUTE ON FUNCTION web_intel.get_competitor_rankings() TO service_role;
GRANT EXECUTE ON FUNCTION web_intel.upsert_serp_share(DATE, UUID, TEXT, INTEGER, TEXT, INTEGER, NUMERIC, JSONB) TO service_role;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION web_intel.get_our_rankings() IS 'Returns our keyword rankings with latest daily data. Used by SERP Share Calculator workflow.';
COMMENT ON FUNCTION web_intel.get_competitor_rankings() IS 'Returns competitor rankings for latest collection date. Used by SERP Share Calculator workflow.';
COMMENT ON FUNCTION web_intel.upsert_serp_share IS 'Upserts SERP share data for a keyword. Used by SERP Share Calculator workflow.';
