-- Competitor Rank Tracker RPC Functions
-- Required for workflow zLfG2Cf9pUBYqPNG
-- Converts direct Postgres queries to HTTP-callable RPCs
-- Date: 2026-02-01

-- ============================================
-- FUNCTION: Get Competitor Keyword Combinations
-- Returns all active competitor/keyword pairs for tracking
-- ============================================
CREATE OR REPLACE FUNCTION public.get_competitor_keyword_combinations(p_limit INTEGER DEFAULT 200)
RETURNS TABLE (
  competitor_id UUID,
  competitor_domain TEXT,
  keyword_id UUID,
  keyword TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as competitor_id,
    c.domain as competitor_domain,
    k.id as keyword_id,
    k.keyword
  FROM web_intel.competitors c
  CROSS JOIN web_intel.tracked_keywords k
  WHERE c.is_active = TRUE
    AND k.status = 'active'
  ORDER BY k.priority DESC, c.name ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_competitor_keyword_combinations(INTEGER) TO service_role;

-- ============================================
-- FUNCTION: Upsert Competitor Ranking
-- Stores competitor ranking results
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_competitor_ranking(
  p_collected_date DATE,
  p_competitor_id UUID,
  p_keyword_id UUID,
  p_position INTEGER DEFAULT NULL,
  p_url TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.competitor_rankings (
    collected_date,
    competitor_id,
    keyword_id,
    "position",
    url
  ) VALUES (
    p_collected_date,
    p_competitor_id,
    p_keyword_id,
    p_position,
    p_url
  )
  ON CONFLICT (competitor_id, keyword_id, collected_date) DO UPDATE SET
    "position" = EXCLUDED."position",
    url = EXCLUDED.url
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_competitor_ranking(DATE, UUID, UUID, INTEGER, TEXT) TO service_role;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM pg_proc p
  JOIN pg_namespace n ON p.pronamespace = n.oid
  WHERE n.nspname = 'public'
  AND p.proname IN (
    'get_competitor_keyword_combinations',
    'upsert_competitor_ranking'
  );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Competitor Rank Tracker RPCs: % of 2', v_count;
  RAISE NOTICE '========================================';
END $$;
