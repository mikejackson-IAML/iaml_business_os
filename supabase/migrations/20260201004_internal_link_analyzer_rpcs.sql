-- Internal Link Analyzer RPC Functions
-- Migration: Create RPC functions for Web Intel Internal Link Analyzer workflow
-- Date: 2026-02-01
-- Workflow: mUNKkdaPIPxfhhvJ

-- ============================================
-- GET INDEXABLE PAGES
-- ============================================
-- Returns pages from content_inventory that should be analyzed for internal links

CREATE OR REPLACE FUNCTION public.get_indexable_pages(
  p_limit INTEGER DEFAULT 200
)
RETURNS TABLE (
  url TEXT,
  content_type TEXT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    url,
    content_type
  FROM web_intel.content_inventory
  WHERE status = 'active'
    AND content_type IN ('blog', 'program', 'resource')
  ORDER BY url
  LIMIT p_limit;
$$;

COMMENT ON FUNCTION public.get_indexable_pages IS 'Returns indexable pages for internal link analysis. Used by Web Intel Internal Link Analyzer workflow.';

-- ============================================
-- INTERNAL LINK ISSUES TABLE
-- ============================================
-- Create table if it doesn't exist

CREATE TABLE IF NOT EXISTS web_intel.internal_link_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  internal_link_count INTEGER DEFAULT 0,
  external_link_count INTEGER DEFAULT 0,
  issue_type TEXT NOT NULL,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  is_addressed BOOLEAN DEFAULT FALSE,
  addressed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_internal_link_issues_url ON web_intel.internal_link_issues(url);
CREATE INDEX IF NOT EXISTS idx_internal_link_issues_unaddressed ON web_intel.internal_link_issues(is_addressed) WHERE is_addressed = FALSE;
CREATE INDEX IF NOT EXISTS idx_internal_link_issues_date ON web_intel.internal_link_issues(detected_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION web_intel.update_internal_link_issues_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS internal_link_issues_updated_at ON web_intel.internal_link_issues;
CREATE TRIGGER internal_link_issues_updated_at
  BEFORE UPDATE ON web_intel.internal_link_issues
  FOR EACH ROW
  EXECUTE FUNCTION web_intel.update_internal_link_issues_timestamp();

COMMENT ON TABLE web_intel.internal_link_issues IS 'Stores detected internal linking issues (low links, orphan pages, etc.)';

-- ============================================
-- LOG INTERNAL LINK ISSUE
-- ============================================
-- RPC function to log internal link issues from n8n workflow

CREATE OR REPLACE FUNCTION public.log_internal_link_issue(
  p_url TEXT,
  p_internal_link_count INTEGER,
  p_external_link_count INTEGER,
  p_issue_type TEXT,
  p_detected_at TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.internal_link_issues (
    url,
    internal_link_count,
    external_link_count,
    issue_type,
    detected_at
  ) VALUES (
    p_url,
    p_internal_link_count,
    p_external_link_count,
    p_issue_type,
    p_detected_at
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.log_internal_link_issue IS 'Logs internal link issues detected by the Internal Link Analyzer workflow.';

-- ============================================
-- VIEW FOR REST API ACCESS
-- ============================================
-- Expose internal_link_issues via public schema view

CREATE OR REPLACE VIEW public.web_intel_internal_link_issues AS
SELECT
  id,
  url,
  internal_link_count,
  external_link_count,
  issue_type,
  detected_at,
  is_addressed,
  addressed_at,
  notes,
  created_at,
  updated_at
FROM web_intel.internal_link_issues;

COMMENT ON VIEW public.web_intel_internal_link_issues IS 'View of internal link issues for REST API access';

-- Grant permissions
GRANT SELECT ON public.web_intel_internal_link_issues TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_indexable_pages TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.log_internal_link_issue TO anon, authenticated;
