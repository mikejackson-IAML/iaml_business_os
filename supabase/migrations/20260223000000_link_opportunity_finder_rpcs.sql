-- RPCs for Web Intel - Link Opportunity Finder workflow
-- Replaces direct Postgres access with REST API callable functions

-- Add unique constraint for upsert support
CREATE UNIQUE INDEX IF NOT EXISTS idx_link_opportunities_domain_url
  ON web_intel.link_opportunities (source_domain, source_url)
  WHERE source_url IS NOT NULL;

-- 1. Get active competitors for backlink analysis
CREATE OR REPLACE FUNCTION web_intel.get_active_competitors()
RETURNS TABLE (
  id uuid,
  domain text,
  name text,
  priority integer
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = web_intel, public
AS $$
  SELECT c.id, c.domain, c.name, c.priority
  FROM web_intel.competitors c
  WHERE c.is_active = TRUE
  ORDER BY c.priority DESC
  LIMIT 10;
$$;

-- 2. Upsert link opportunities discovered from competitor backlinks
CREATE OR REPLACE FUNCTION web_intel.upsert_link_opportunities(
  p_opportunities jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = web_intel, public
AS $$
DECLARE
  v_inserted integer := 0;
  v_updated integer := 0;
  v_total integer := 0;
  v_result record;
BEGIN
  WITH input_data AS (
    SELECT
      (elem->>'source_domain')::text AS source_domain,
      (elem->>'source_url')::text AS source_url,
      COALESCE(elem->>'opportunity_type', 'competitor_backlink')::text AS opportunity_type,
      COALESCE((elem->>'domain_rating')::numeric, 0) AS domain_rating,
      'new'::text AS status,
      (elem->>'notes')::text AS notes
    FROM jsonb_array_elements(p_opportunities) AS elem
  ),
  upserted AS (
    INSERT INTO web_intel.link_opportunities (
      source_domain, source_url, opportunity_type, domain_rating, status, notes
    )
    SELECT source_domain, source_url, opportunity_type, domain_rating, status, notes
    FROM input_data
    WHERE source_domain IS NOT NULL AND source_url IS NOT NULL
    ON CONFLICT (source_domain, source_url) WHERE source_url IS NOT NULL
    DO UPDATE SET
      domain_rating = GREATEST(EXCLUDED.domain_rating, web_intel.link_opportunities.domain_rating),
      notes = COALESCE(EXCLUDED.notes, web_intel.link_opportunities.notes),
      updated_at = now()
    RETURNING (xmax = 0) AS is_insert
  )
  SELECT
    COUNT(*) FILTER (WHERE is_insert) AS ins,
    COUNT(*) FILTER (WHERE NOT is_insert) AS upd,
    COUNT(*) AS tot
  INTO v_result
  FROM upserted;

  RETURN jsonb_build_object(
    'inserted', COALESCE(v_result.ins, 0),
    'updated', COALESCE(v_result.upd, 0),
    'total', COALESCE(v_result.tot, 0)
  );
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION web_intel.get_active_competitors() TO service_role;
GRANT EXECUTE ON FUNCTION web_intel.upsert_link_opportunities(jsonb) TO service_role;
