-- Fix competitor rankings function with proper joins
-- Migration: Join with keywords and competitors tables to get required fields
-- Date: 2026-01-27

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_competitor_rankings();
DROP FUNCTION IF EXISTS web_intel.get_competitor_rankings();

-- ============================================
-- FUNCTION: Get Competitor Rankings (web_intel schema)
-- Join with related tables to get keyword text and domain
-- ============================================
CREATE OR REPLACE FUNCTION web_intel.get_competitor_rankings()
RETURNS TABLE (
  keyword TEXT,
  competitor_domain TEXT,
  "position" INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tk.keyword,
    c.domain as competitor_domain,
    cr."position"
  FROM web_intel.competitor_rankings cr
  JOIN web_intel.tracked_keywords tk ON cr.keyword_id = tk.id
  JOIN web_intel.competitors c ON cr.competitor_id = c.id
  WHERE cr.collected_date = (SELECT MAX(collected_date) FROM web_intel.competitor_rankings);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- WRAPPER: Get Competitor Rankings (public schema)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_competitor_rankings()
RETURNS TABLE (
  keyword TEXT,
  competitor_domain TEXT,
  "position" INTEGER
) AS $$
BEGIN
  RETURN QUERY SELECT * FROM web_intel.get_competitor_rankings();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================
GRANT EXECUTE ON FUNCTION web_intel.get_competitor_rankings() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_competitor_rankings() TO anon, authenticated, service_role;
