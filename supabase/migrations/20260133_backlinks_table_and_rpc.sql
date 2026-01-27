-- Backlinks Table and RPC Function
-- Migration: Create backlinks table and upsert RPC for workflow
-- Date: 2026-01-26

-- ============================================
-- ENSURE SCHEMA EXISTS
-- ============================================
CREATE SCHEMA IF NOT EXISTS web_intel;

-- ============================================
-- CREATE BACKLINKS TABLE (if not exists)
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.backlinks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source (linking page)
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL,

  -- Target (our page)
  target_url TEXT NOT NULL,
  target_path TEXT,

  -- Link attributes
  anchor_text TEXT,
  is_dofollow BOOLEAN DEFAULT TRUE,
  is_image_link BOOLEAN DEFAULT FALSE,

  -- Quality metrics
  domain_authority INTEGER,  -- 0-100
  page_authority INTEGER,    -- 0-100
  spam_score INTEGER,        -- 0-100

  -- Discovery
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'lost', 'broken', 'toxic')),
  lost_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(source_url, target_url)
);

-- Create indexes if not exist
CREATE INDEX IF NOT EXISTS idx_backlinks_source_domain ON web_intel.backlinks(source_domain);
CREATE INDEX IF NOT EXISTS idx_backlinks_target ON web_intel.backlinks(target_url);
CREATE INDEX IF NOT EXISTS idx_backlinks_status ON web_intel.backlinks(status);
CREATE INDEX IF NOT EXISTS idx_backlinks_da ON web_intel.backlinks(domain_authority DESC);
CREATE INDEX IF NOT EXISTS idx_backlinks_first_seen ON web_intel.backlinks(first_seen_at DESC);

-- ============================================
-- RPC FUNCTION: Bulk upsert backlinks
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_backlinks(
  p_records JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_inserted INTEGER := 0;
  v_updated INTEGER := 0;
  v_total INTEGER := 0;
  v_record JSONB;
BEGIN
  -- Count total records
  v_total := jsonb_array_length(p_records);

  -- Handle empty array
  IF v_total = 0 THEN
    RETURN jsonb_build_object(
      'success', true,
      'inserted', 0,
      'updated', 0,
      'total', 0
    );
  END IF;

  -- Perform bulk upsert
  WITH upserted AS (
    INSERT INTO web_intel.backlinks (
      source_url,
      source_domain,
      target_url,
      target_path,
      anchor_text,
      is_dofollow,
      is_image_link,
      domain_authority,
      page_authority,
      spam_score,
      first_seen_at,
      last_seen_at,
      status
    )
    SELECT
      (r->>'source_url')::TEXT,
      (r->>'source_domain')::TEXT,
      (r->>'target_url')::TEXT,
      (r->>'target_path')::TEXT,
      (r->>'anchor_text')::TEXT,
      COALESCE((r->>'is_dofollow')::BOOLEAN, TRUE),
      COALESCE((r->>'is_image_link')::BOOLEAN, FALSE),
      (r->>'domain_authority')::INTEGER,
      (r->>'page_authority')::INTEGER,
      (r->>'spam_score')::INTEGER,
      COALESCE((r->>'first_seen_at')::TIMESTAMPTZ, NOW()),
      COALESCE((r->>'last_seen_at')::TIMESTAMPTZ, NOW()),
      COALESCE((r->>'status')::TEXT, 'active')
    FROM jsonb_array_elements(p_records) AS r
    ON CONFLICT (source_url, target_url) DO UPDATE SET
      anchor_text = EXCLUDED.anchor_text,
      is_dofollow = EXCLUDED.is_dofollow,
      domain_authority = EXCLUDED.domain_authority,
      page_authority = EXCLUDED.page_authority,
      spam_score = EXCLUDED.spam_score,
      last_seen_at = EXCLUDED.last_seen_at,
      updated_at = NOW()
    RETURNING (xmax = 0) AS inserted
  )
  SELECT
    COUNT(*) FILTER (WHERE inserted),
    COUNT(*) FILTER (WHERE NOT inserted)
  INTO v_inserted, v_updated
  FROM upserted;

  RETURN jsonb_build_object(
    'success', true,
    'inserted', v_inserted,
    'updated', v_updated,
    'total', v_total
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_backlinks(JSONB) TO service_role;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  -- Verify table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'web_intel' AND table_name = 'backlinks'
  ) THEN
    RAISE EXCEPTION 'Table web_intel.backlinks was not created';
  END IF;

  -- Verify function exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname = 'upsert_backlinks'
  ) THEN
    RAISE EXCEPTION 'Function public.upsert_backlinks was not created';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SUCCESS: Backlinks table and RPC ready';
  RAISE NOTICE '========================================';
END $$;
