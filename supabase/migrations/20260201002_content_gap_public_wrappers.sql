-- Public schema wrapper functions for Content Gap Analyzer workflow
-- These expose web_intel data through REST API-accessible functions

-- Function 1: Get ranking opportunities (high impressions, low CTR)
CREATE OR REPLACE FUNCTION public.get_content_gap_opportunities(
  p_min_impressions INTEGER DEFAULT 100,
  p_max_ctr NUMERIC DEFAULT 0.02,
  p_min_position INTEGER DEFAULT 10,
  p_days_back INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  query TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = web_intel, public
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT sp.query
  FROM web_intel.search_performance sp
  WHERE sp.impressions > p_min_impressions
    AND sp.ctr < p_max_ctr
    AND sp.position > p_min_position
    AND sp.collected_date >= NOW() - (p_days_back || ' days')::INTERVAL
  ORDER BY sp.query
  LIMIT p_limit;
EXCEPTION WHEN OTHERS THEN
  -- Return empty if table doesn't exist or other error
  RETURN;
END;
$$;

-- Function 2: Get tracked keywords without content
CREATE OR REPLACE FUNCTION public.get_keywords_without_content(
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
  keyword TEXT,
  search_volume INTEGER,
  keyword_difficulty NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = web_intel, public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    kw.keyword,
    kw.search_volume,
    kw.keyword_difficulty
  FROM web_intel.tracked_keywords kw
  LEFT JOIN web_intel.content_inventory ci
    ON ci.path LIKE '%' || REPLACE(LOWER(kw.keyword), ' ', '-') || '%'
  WHERE ci.id IS NULL
  ORDER BY kw.search_volume DESC
  LIMIT p_limit;
EXCEPTION WHEN OTHERS THEN
  -- Return empty if tables don't exist or other error
  RETURN;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_content_gap_opportunities TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_keywords_without_content TO anon, authenticated, service_role;

COMMENT ON FUNCTION public.get_content_gap_opportunities IS
'Returns queries with high impressions but low CTR - content optimization opportunities. For Content Gap Analyzer workflow.';

COMMENT ON FUNCTION public.get_keywords_without_content IS
'Returns tracked keywords that have no matching content. For Content Gap Analyzer workflow.';
