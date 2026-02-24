-- Mobile Usability Schema for PageSpeed Insights
-- Replaces the old GSC-based mobile_usability table with a PageSpeed Insights-based one
-- that tracks mobile performance and accessibility scores over time.

-- Drop the old table (it was empty, designed for non-existent GSC endpoint)
DROP TABLE IF EXISTS web_intel.mobile_usability CASCADE;

-- Drop old functions/views if they exist
DROP FUNCTION IF EXISTS web_intel.upsert_mobile_usability CASCADE;
DROP FUNCTION IF EXISTS public.upsert_mobile_usability CASCADE;
DROP FUNCTION IF EXISTS web_intel.get_mobile_usability_latest CASCADE;
DROP FUNCTION IF EXISTS public.get_mobile_usability_latest CASCADE;
DROP VIEW IF EXISTS public.web_intel_mobile_usability CASCADE;

-- Create new mobile_usability table for PageSpeed Insights data
CREATE TABLE web_intel.mobile_usability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_url TEXT NOT NULL,
  check_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mobile_score NUMERIC(5,2),           -- Performance score 0-100
  accessibility_score NUMERIC(5,2),     -- Accessibility score 0-100
  mobile_friendly BOOLEAN DEFAULT false, -- True if mobile_score >= 90
  issues JSONB DEFAULT '[]'::jsonb,      -- Array of failed audit details
  checked_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for querying by page_url and latest check
CREATE INDEX idx_mobile_usability_page_url ON web_intel.mobile_usability(page_url);
CREATE INDEX idx_mobile_usability_checked_at ON web_intel.mobile_usability(checked_at DESC);
CREATE INDEX idx_mobile_usability_not_friendly ON web_intel.mobile_usability(mobile_friendly) WHERE mobile_friendly = false;

-- Unique constraint: one result per page per check date
CREATE UNIQUE INDEX idx_mobile_usability_page_date
  ON web_intel.mobile_usability(page_url, check_date);

-- RPC: Upsert mobile usability result
CREATE OR REPLACE FUNCTION web_intel.upsert_mobile_usability(
  p_page_url TEXT,
  p_mobile_score NUMERIC,
  p_accessibility_score NUMERIC,
  p_mobile_friendly BOOLEAN,
  p_issues JSONB DEFAULT '[]'::jsonb
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result web_intel.mobile_usability;
BEGIN
  INSERT INTO web_intel.mobile_usability (
    page_url, check_date, mobile_score, accessibility_score, mobile_friendly, issues, checked_at
  ) VALUES (
    p_page_url, CURRENT_DATE, p_mobile_score, p_accessibility_score, p_mobile_friendly, p_issues, now()
  )
  ON CONFLICT (page_url, check_date)
  DO UPDATE SET
    mobile_score = EXCLUDED.mobile_score,
    accessibility_score = EXCLUDED.accessibility_score,
    mobile_friendly = EXCLUDED.mobile_friendly,
    issues = EXCLUDED.issues,
    checked_at = EXCLUDED.checked_at
  RETURNING * INTO v_result;

  RETURN row_to_json(v_result);
END;
$$;

-- RPC: Get latest mobile usability results (most recent check per page)
CREATE OR REPLACE FUNCTION web_intel.get_mobile_usability_latest()
RETURNS SETOF web_intel.mobile_usability
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT ON (page_url) *
  FROM web_intel.mobile_usability
  ORDER BY page_url, checked_at DESC;
$$;

-- Public wrapper: upsert_mobile_usability
CREATE OR REPLACE FUNCTION public.upsert_mobile_usability(
  p_page_url TEXT,
  p_mobile_score NUMERIC,
  p_accessibility_score NUMERIC,
  p_mobile_friendly BOOLEAN,
  p_issues JSONB DEFAULT '[]'::jsonb
)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$ SELECT web_intel.upsert_mobile_usability($1, $2, $3, $4, $5); $$;

-- Public wrapper: get_mobile_usability_latest
CREATE OR REPLACE FUNCTION public.get_mobile_usability_latest()
RETURNS SETOF web_intel.mobile_usability
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$ SELECT * FROM web_intel.get_mobile_usability_latest(); $$;

-- Public view for dashboard access
CREATE OR REPLACE VIEW public.web_intel_mobile_usability AS
SELECT * FROM web_intel.mobile_usability;

-- Grant permissions
GRANT USAGE ON SCHEMA web_intel TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE ON web_intel.mobile_usability TO anon, authenticated, service_role;
GRANT SELECT ON public.web_intel_mobile_usability TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.upsert_mobile_usability TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_mobile_usability_latest TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.upsert_mobile_usability TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.get_mobile_usability_latest TO anon, authenticated, service_role;
