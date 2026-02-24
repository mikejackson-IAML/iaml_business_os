-- RPCs for Web Intel - New/Lost Backlink Detector workflow (heGC1O1wf9IZTSqW)
-- Provides functions to detect new backlinks, lost backlinks, and mark lost ones

-- ============================================
-- FETCH NEW BACKLINKS (seen in last 7 days)
-- ============================================
CREATE OR REPLACE FUNCTION web_intel.get_new_backlinks()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(row_to_json(b))
     FROM (
       SELECT id, source_url, source_domain, target_url, domain_authority, 'new' AS change_type
       FROM web_intel.backlinks
       WHERE first_seen_at >= NOW() - INTERVAL '7 days'
         AND status = 'active'
       ORDER BY domain_authority DESC NULLS LAST
     ) b),
    '[]'::json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION web_intel.get_new_backlinks() TO anon, authenticated, service_role;

-- Public wrapper for PostgREST
DROP FUNCTION IF EXISTS public.get_new_backlinks();
CREATE OR REPLACE FUNCTION public.get_new_backlinks()
RETURNS json AS $$ SELECT web_intel.get_new_backlinks(); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_new_backlinks() TO anon, authenticated, service_role;

-- ============================================
-- FETCH LOST BACKLINKS (not seen in 14+ days, still marked active)
-- ============================================
CREATE OR REPLACE FUNCTION web_intel.get_lost_backlinks()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN COALESCE(
    (SELECT json_agg(row_to_json(b))
     FROM (
       SELECT id, source_url, source_domain, target_url, domain_authority, 'lost' AS change_type
       FROM web_intel.backlinks
       WHERE last_seen_at < NOW() - INTERVAL '14 days'
         AND status = 'active'
       ORDER BY domain_authority DESC NULLS LAST
     ) b),
    '[]'::json
  );
END;
$$;

GRANT EXECUTE ON FUNCTION web_intel.get_lost_backlinks() TO anon, authenticated, service_role;

-- Public wrapper for PostgREST
DROP FUNCTION IF EXISTS public.get_lost_backlinks();
CREATE OR REPLACE FUNCTION public.get_lost_backlinks()
RETURNS json AS $$ SELECT web_intel.get_lost_backlinks(); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.get_lost_backlinks() TO anon, authenticated, service_role;

-- ============================================
-- MARK LOST BACKLINKS (update status from active to lost)
-- ============================================
CREATE OR REPLACE FUNCTION web_intel.mark_lost_backlinks()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE web_intel.backlinks
  SET status = 'lost', lost_at = NOW(), updated_at = NOW()
  WHERE last_seen_at < NOW() - INTERVAL '14 days'
    AND status = 'active';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN json_build_object(
    'marked_lost', v_count,
    'timestamp', NOW()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION web_intel.mark_lost_backlinks() TO anon, authenticated, service_role;

-- Public wrapper for PostgREST
DROP FUNCTION IF EXISTS public.mark_lost_backlinks();
CREATE OR REPLACE FUNCTION public.mark_lost_backlinks()
RETURNS json AS $$ SELECT web_intel.mark_lost_backlinks(); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.mark_lost_backlinks() TO anon, authenticated, service_role;
