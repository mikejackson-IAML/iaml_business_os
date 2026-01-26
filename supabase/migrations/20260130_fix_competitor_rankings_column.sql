-- Fix competitor rankings column name
-- Migration: Use quoted identifier for reserved keyword 'position'
-- Date: 2026-01-27

-- Drop and recreate to fix return type
DROP FUNCTION IF EXISTS public.get_competitor_rankings();
DROP FUNCTION IF EXISTS web_intel.get_competitor_rankings();

-- ============================================
-- FUNCTION: Get Competitor Rankings (web_intel schema)
-- Use quoted identifier for reserved keyword
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
    cr.keyword,
    cr.competitor_domain,
    cr."position"
  FROM web_intel.competitor_rankings cr
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
