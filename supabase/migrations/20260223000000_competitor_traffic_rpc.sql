-- RPC function for Web Intel - Competitor Traffic Estimator workflow
-- Fetches active competitors for traffic estimation

CREATE OR REPLACE FUNCTION web_intel.get_active_competitors_for_traffic()
RETURNS TABLE (
  id uuid,
  domain text,
  name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = web_intel
AS $$
  SELECT c.id, c.domain, c.name
  FROM web_intel.competitors c
  WHERE c.is_active = TRUE
  ORDER BY c.priority DESC
  LIMIT 10;
$$;

-- Grant execute to anon and authenticated roles for REST API access
GRANT EXECUTE ON FUNCTION web_intel.get_active_competitors_for_traffic() TO anon;
GRANT EXECUTE ON FUNCTION web_intel.get_active_competitors_for_traffic() TO authenticated;
GRANT EXECUTE ON FUNCTION web_intel.get_active_competitors_for_traffic() TO service_role;

-- Public wrapper so the standard Supabase REST API credential (which uses public schema) can call it
CREATE OR REPLACE FUNCTION public.get_active_competitors_for_traffic()
RETURNS TABLE (
  id uuid,
  domain text,
  name text
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = web_intel
AS $$
  SELECT c.id, c.domain, c.name
  FROM web_intel.competitors c
  WHERE c.is_active = TRUE
  ORDER BY c.priority DESC
  LIMIT 10;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_competitors_for_traffic() TO anon;
GRANT EXECUTE ON FUNCTION public.get_active_competitors_for_traffic() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_active_competitors_for_traffic() TO service_role;
