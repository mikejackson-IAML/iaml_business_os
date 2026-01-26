-- SERP Share Calculator - Public Schema Wrappers
-- Migration: Create public wrapper functions for REST API access
-- Date: 2026-01-27
-- Purpose: Expose web_intel functions via Supabase REST API

-- ============================================
-- WRAPPER: Get Our Rankings
-- ============================================
CREATE OR REPLACE FUNCTION public.get_our_rankings()
RETURNS TABLE (
  keyword_id UUID,
  keyword TEXT,
  our_position INTEGER,
  our_url TEXT
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM web_intel.get_our_rankings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WRAPPER: Get Competitor Rankings
-- ============================================
CREATE OR REPLACE FUNCTION public.get_competitor_rankings()
RETURNS TABLE (
  keyword TEXT,
  competitor_domain TEXT,
  rank_position INTEGER
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM web_intel.get_competitor_rankings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WRAPPER: Upsert SERP Share
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_serp_share(
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
  PERFORM web_intel.upsert_serp_share(
    p_collected_date,
    p_keyword_id,
    p_keyword,
    p_our_position,
    p_our_url,
    p_total_competitors_in_top10,
    p_our_visibility_score,
    p_competitor_positions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.get_our_rankings() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_competitor_rankings() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_serp_share(DATE, UUID, TEXT, INTEGER, TEXT, INTEGER, NUMERIC, JSONB) TO anon, authenticated, service_role;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION public.get_our_rankings() IS 'Public wrapper for web_intel.get_our_rankings - accessible via REST API';
COMMENT ON FUNCTION public.get_competitor_rankings() IS 'Public wrapper for web_intel.get_competitor_rankings - accessible via REST API';
COMMENT ON FUNCTION public.upsert_serp_share IS 'Public wrapper for web_intel.upsert_serp_share - accessible via REST API';
