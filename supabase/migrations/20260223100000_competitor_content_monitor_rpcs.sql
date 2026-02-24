-- Competitor Content Monitor RPCs
-- Creates table (if missing) and RPC functions needed by:
--   Web Intel - Competitor Content Monitor (OIm5d77XTAGHDB47)

-- ============================================
-- COMPETITOR CONTENT TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS web_intel.competitor_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  competitor_id UUID REFERENCES web_intel.competitors(id) ON DELETE CASCADE,
  competitor_domain TEXT NOT NULL,
  url TEXT NOT NULL,
  title TEXT,
  publish_date DATE,
  word_count INTEGER,
  estimated_traffic INTEGER,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  is_new BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(competitor_domain, url)
);

-- RLS
ALTER TABLE web_intel.competitor_content ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read competitor_content" ON web_intel.competitor_content;
CREATE POLICY "Allow authenticated read competitor_content" ON web_intel.competitor_content FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow service role full access competitor_content" ON web_intel.competitor_content;
CREATE POLICY "Allow service role full access competitor_content" ON web_intel.competitor_content FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON web_intel.competitor_content TO authenticated;
GRANT ALL ON web_intel.competitor_content TO service_role;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_comp_content_competitor ON web_intel.competitor_content(competitor_id);
CREATE INDEX IF NOT EXISTS idx_comp_content_new ON web_intel.competitor_content(is_new) WHERE is_new = TRUE;
CREATE INDEX IF NOT EXISTS idx_comp_content_discovered ON web_intel.competitor_content(discovered_at DESC);

-- Add priority column to competitors if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'web_intel' AND table_name = 'competitors' AND column_name = 'priority'
  ) THEN
    ALTER TABLE web_intel.competitors ADD COLUMN priority INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- ============================================
-- RPC FUNCTIONS
-- ============================================

-- 1. Get active competitors
DROP FUNCTION IF EXISTS public.get_active_competitors();
CREATE OR REPLACE FUNCTION public.get_active_competitors()
RETURNS TABLE (
    id UUID,
    domain TEXT,
    name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.domain, c.name
    FROM web_intel.competitors c
    WHERE c.is_active = TRUE
    ORDER BY c.priority DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_active_competitors() TO service_role;
GRANT EXECUTE ON FUNCTION public.get_active_competitors() TO authenticated;

-- 2. Upsert competitor content
DROP FUNCTION IF EXISTS public.upsert_competitor_content(UUID, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.upsert_competitor_content(
    p_competitor_id UUID,
    p_competitor_domain TEXT,
    p_url TEXT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO web_intel.competitor_content (competitor_id, competitor_domain, url, last_seen_at)
    VALUES (p_competitor_id, p_competitor_domain, p_url, NOW())
    ON CONFLICT (competitor_domain, url) DO UPDATE SET
        last_seen_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.upsert_competitor_content(UUID, TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_competitor_content(UUID, TEXT, TEXT) TO authenticated;

-- 3. Mark old content as not new
DROP FUNCTION IF EXISTS public.mark_old_competitor_content();
CREATE OR REPLACE FUNCTION public.mark_old_competitor_content()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE web_intel.competitor_content
    SET is_new = FALSE
    WHERE discovered_at < NOW() - INTERVAL '7 days'
      AND is_new = TRUE;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.mark_old_competitor_content() TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_old_competitor_content() TO authenticated;

-- Public view for competitor content
CREATE OR REPLACE VIEW public.web_intel_competitor_content AS
SELECT * FROM web_intel.competitor_content;
GRANT SELECT ON public.web_intel_competitor_content TO authenticated, anon;
