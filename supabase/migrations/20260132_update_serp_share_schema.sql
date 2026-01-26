-- Update serp_share table for per-keyword tracking
-- Migration: Add keyword-level columns to support SERP Share Calculator workflow
-- Date: 2026-01-27

-- Add keyword-level columns
ALTER TABLE web_intel.serp_share
ADD COLUMN IF NOT EXISTS keyword_id UUID REFERENCES web_intel.tracked_keywords(id),
ADD COLUMN IF NOT EXISTS keyword TEXT,
ADD COLUMN IF NOT EXISTS our_position INTEGER,
ADD COLUMN IF NOT EXISTS our_url TEXT,
ADD COLUMN IF NOT EXISTS total_competitors_in_top10 INTEGER,
ADD COLUMN IF NOT EXISTS our_visibility_score NUMERIC,
ADD COLUMN IF NOT EXISTS competitor_positions JSONB DEFAULT '{}';

-- Create unique constraint for per-keyword upserts
-- First drop any existing constraint
ALTER TABLE web_intel.serp_share DROP CONSTRAINT IF EXISTS serp_share_date_keyword_unique;

-- Add unique constraint (allow NULLs to be unique for aggregate rows)
CREATE UNIQUE INDEX IF NOT EXISTS serp_share_date_keyword_idx
ON web_intel.serp_share(collected_date, keyword_id)
WHERE keyword_id IS NOT NULL;

-- Update the upsert function to handle the new schema
DROP FUNCTION IF EXISTS public.upsert_serp_share(DATE, UUID, TEXT, INTEGER, TEXT, INTEGER, NUMERIC, JSONB);
DROP FUNCTION IF EXISTS web_intel.upsert_serp_share(DATE, UUID, TEXT, INTEGER, TEXT, INTEGER, NUMERIC, JSONB);

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
  ON CONFLICT (collected_date, keyword_id)
  WHERE keyword_id IS NOT NULL
  DO UPDATE SET
    keyword = EXCLUDED.keyword,
    our_position = EXCLUDED.our_position,
    our_url = EXCLUDED.our_url,
    total_competitors_in_top10 = EXCLUDED.total_competitors_in_top10,
    our_visibility_score = EXCLUDED.our_visibility_score,
    competitor_positions = EXCLUDED.competitor_positions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Public wrapper
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION web_intel.upsert_serp_share(DATE, UUID, TEXT, INTEGER, TEXT, INTEGER, NUMERIC, JSONB) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_serp_share(DATE, UUID, TEXT, INTEGER, TEXT, INTEGER, NUMERIC, JSONB) TO anon, authenticated, service_role;
