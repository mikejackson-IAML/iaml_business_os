-- Rankings Workflows RPC Functions
-- Converts direct Postgres queries to HTTP-callable RPCs
-- SAFE: Only creates NEW functions, no table modifications
-- Run this in Supabase SQL Editor

-- ============================================
-- PRE-CHECK: Verify required tables exist
-- ============================================
DO $$
DECLARE
  v_missing TEXT[] := '{}';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'web_intel' AND table_name = 'tracked_keywords') THEN
    v_missing := array_append(v_missing, 'tracked_keywords');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'web_intel' AND table_name = 'daily_rankings') THEN
    v_missing := array_append(v_missing, 'daily_rankings');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'web_intel' AND table_name = 'serp_features') THEN
    v_missing := array_append(v_missing, 'serp_features');
  END IF;

  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %. Create these tables first.', array_to_string(v_missing, ', ');
  END IF;

  RAISE NOTICE 'Pre-check passed: All required tables exist';
END $$;

-- ============================================
-- RNK-01: Daily Tracker RPCs
-- ============================================

CREATE OR REPLACE FUNCTION public.get_active_keywords()
RETURNS TABLE (
  id UUID,
  keyword TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT tk.id, tk.keyword
  FROM web_intel.tracked_keywords tk
  WHERE tk.status = 'active'
  ORDER BY tk.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_active_keywords() TO service_role;

CREATE OR REPLACE FUNCTION public.upsert_daily_ranking(
  p_keyword_id UUID,
  p_collected_date DATE,
  p_position INTEGER,
  p_ranking_url TEXT DEFAULT NULL,
  p_has_featured_snippet BOOLEAN DEFAULT FALSE,
  p_featured_snippet_owner TEXT DEFAULT NULL,
  p_competitor_positions JSONB DEFAULT '[]'
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.daily_rankings (
    keyword_id,
    collected_date,
    position,
    ranking_url,
    has_featured_snippet,
    featured_snippet_owner,
    competitor_positions
  ) VALUES (
    p_keyword_id,
    p_collected_date,
    p_position,
    p_ranking_url,
    p_has_featured_snippet,
    p_featured_snippet_owner,
    p_competitor_positions
  )
  ON CONFLICT (keyword_id, collected_date) DO UPDATE SET
    position = EXCLUDED.position,
    ranking_url = EXCLUDED.ranking_url,
    has_featured_snippet = EXCLUDED.has_featured_snippet,
    featured_snippet_owner = EXCLUDED.featured_snippet_owner,
    competitor_positions = EXCLUDED.competitor_positions
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_daily_ranking(UUID, DATE, INTEGER, TEXT, BOOLEAN, TEXT, JSONB) TO service_role;

-- ============================================
-- RNK-02: SERP Features RPCs
-- ============================================

CREATE OR REPLACE FUNCTION public.get_today_rankings()
RETURNS TABLE (
  keyword_id UUID,
  collected_date DATE,
  has_featured_snippet BOOLEAN,
  featured_snippet_owner TEXT,
  competitor_positions JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    dr.keyword_id,
    dr.collected_date,
    dr.has_featured_snippet,
    dr.featured_snippet_owner,
    dr.competitor_positions
  FROM web_intel.daily_rankings dr
  JOIN web_intel.tracked_keywords tk ON dr.keyword_id = tk.id
  WHERE dr.collected_date = CURRENT_DATE
    AND tk.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_today_rankings() TO service_role;

CREATE OR REPLACE FUNCTION public.upsert_serp_features(
  p_keyword_id UUID,
  p_collected_date DATE,
  p_features_present TEXT[],
  p_featured_snippet JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.serp_features (
    keyword_id,
    collected_date,
    features_present,
    featured_snippet
  ) VALUES (
    p_keyword_id,
    p_collected_date,
    p_features_present,
    p_featured_snippet
  )
  ON CONFLICT (keyword_id, collected_date) DO UPDATE SET
    features_present = EXCLUDED.features_present,
    featured_snippet = EXCLUDED.featured_snippet
  RETURNING id INTO v_id;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_serp_features(UUID, DATE, TEXT[], JSONB) TO service_role;

CREATE OR REPLACE FUNCTION public.get_featured_snippet_opportunities()
RETURNS TABLE (
  keyword TEXT,
  rank_position INTEGER,
  fs_owner TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tk.keyword,
    dr.position::INTEGER as rank_position,
    sf.featured_snippet->>'owner' as fs_owner
  FROM web_intel.daily_rankings dr
  JOIN web_intel.tracked_keywords tk ON dr.keyword_id = tk.id
  JOIN web_intel.serp_features sf ON dr.keyword_id = sf.keyword_id AND dr.collected_date = sf.collected_date
  WHERE dr.collected_date = CURRENT_DATE
    AND dr.position BETWEEN 1 AND 3
    AND sf.featured_snippet IS NOT NULL
    AND sf.featured_snippet->>'owner' != 'us'
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_featured_snippet_opportunities() TO service_role;

-- ============================================
-- RNK-03: Keyword Discovery RPCs
-- ============================================

CREATE OR REPLACE FUNCTION public.get_seed_keywords()
RETURNS TABLE (
  keyword TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT tk.keyword
  FROM web_intel.tracked_keywords tk
  WHERE tk.status = 'active'
    AND tk.priority IN ('critical', 'high')
  ORDER BY tk.search_volume DESC NULLS LAST
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_seed_keywords() TO service_role;

CREATE OR REPLACE FUNCTION public.get_all_keywords()
RETURNS TABLE (
  keyword TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT tk.keyword
  FROM web_intel.tracked_keywords tk;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_all_keywords() TO service_role;

CREATE OR REPLACE FUNCTION public.insert_discovered_keyword(
  p_keyword TEXT,
  p_search_volume INTEGER,
  p_difficulty INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.tracked_keywords (
    keyword,
    search_volume,
    difficulty,
    priority,
    category,
    status
  ) VALUES (
    p_keyword,
    p_search_volume,
    p_difficulty,
    'low',
    'discovered',
    'paused'
  )
  ON CONFLICT (keyword) DO NOTHING
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'duplicate');
  END IF;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.insert_discovered_keyword(TEXT, INTEGER, INTEGER) TO service_role;

-- ============================================
-- RNK-04: Opportunity Finder RPCs
-- ============================================

-- Note: striking_distance may be a VIEW not a TABLE
-- This function will work with either
CREATE OR REPLACE FUNCTION public.get_striking_distance_opportunities()
RETURNS TABLE (
  keyword TEXT,
  rank_position INTEGER,
  search_volume INTEGER,
  opportunity_type TEXT,
  opportunity_score NUMERIC
) AS $$
BEGIN
  -- Check if striking_distance exists, return empty if not
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'web_intel'
    AND table_name = 'striking_distance'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema = 'web_intel'
    AND table_name = 'striking_distance'
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY EXECUTE '
    SELECT
      sd.keyword::TEXT,
      sd.position::INTEGER as rank_position,
      COALESCE(sd.search_volume, 0)::INTEGER,
      sd.opportunity_type::TEXT,
      sd.opportunity_score::NUMERIC
    FROM web_intel.striking_distance sd
    ORDER BY sd.opportunity_score DESC
    LIMIT 20
  ';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_striking_distance_opportunities() TO service_role;

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
    'get_active_keywords',
    'upsert_daily_ranking',
    'get_today_rankings',
    'upsert_serp_features',
    'get_featured_snippet_opportunities',
    'get_seed_keywords',
    'get_all_keywords',
    'insert_discovered_keyword',
    'get_striking_distance_opportunities'
  );

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Rankings RPCs created: % of 9', v_count;
  RAISE NOTICE '========================================';

  IF v_count = 9 THEN
    RAISE NOTICE 'SUCCESS: All RPCs ready for Rankings workflows';
  ELSE
    RAISE NOTICE 'WARNING: Some RPCs may be missing';
  END IF;
END $$;
