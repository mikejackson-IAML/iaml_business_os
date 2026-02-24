-- Migration: GSC Index Coverage RPCs
-- Purpose: Create upsert_index_coverage RPC for the Web Intel - GSC - Index Coverage Sync workflow
-- Date: 2026-02-24

-- ============================================================
-- 1. web_intel.upsert_index_coverage - Upserts index coverage data
-- ============================================================
CREATE OR REPLACE FUNCTION web_intel.upsert_index_coverage(
  p_collected_date DATE,
  p_indexed_count INTEGER DEFAULT 0,
  p_crawled_not_indexed INTEGER DEFAULT 0,
  p_discovered_not_indexed INTEGER DEFAULT 0,
  p_excluded_count INTEGER DEFAULT 0,
  p_error_count INTEGER DEFAULT 0,
  p_error_details JSONB DEFAULT '{}'::JSONB,
  p_excluded_details JSONB DEFAULT '{}'::JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_id UUID;
BEGIN
  INSERT INTO web_intel.index_coverage (
    collected_date, indexed_count, crawled_not_indexed,
    discovered_not_indexed, excluded_count, error_count,
    error_details, excluded_details
  ) VALUES (
    p_collected_date, p_indexed_count, p_crawled_not_indexed,
    p_discovered_not_indexed, p_excluded_count, p_error_count,
    p_error_details, p_excluded_details
  )
  ON CONFLICT (collected_date) DO UPDATE SET
    indexed_count = EXCLUDED.indexed_count,
    crawled_not_indexed = EXCLUDED.crawled_not_indexed,
    discovered_not_indexed = EXCLUDED.discovered_not_indexed,
    excluded_count = EXCLUDED.excluded_count,
    error_count = EXCLUDED.error_count,
    error_details = EXCLUDED.error_details,
    excluded_details = EXCLUDED.excluded_details
  RETURNING id INTO result_id;

  RETURN json_build_object('success', true, 'id', result_id);
END;
$$;

-- ============================================================
-- 2. Public wrapper for REST API access
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_index_coverage(
  p_collected_date DATE,
  p_indexed_count INTEGER DEFAULT 0,
  p_crawled_not_indexed INTEGER DEFAULT 0,
  p_discovered_not_indexed INTEGER DEFAULT 0,
  p_excluded_count INTEGER DEFAULT 0,
  p_error_count INTEGER DEFAULT 0,
  p_error_details JSONB DEFAULT '{}'::JSONB,
  p_excluded_details JSONB DEFAULT '{}'::JSONB
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN web_intel.upsert_index_coverage(
    p_collected_date, p_indexed_count, p_crawled_not_indexed,
    p_discovered_not_indexed, p_excluded_count, p_error_count,
    p_error_details, p_excluded_details
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION web_intel.upsert_index_coverage TO service_role;
GRANT EXECUTE ON FUNCTION web_intel.upsert_index_coverage TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_index_coverage TO anon;
GRANT EXECUTE ON FUNCTION public.upsert_index_coverage TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_index_coverage TO service_role;
