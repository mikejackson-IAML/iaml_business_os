-- RPC function for Web Intel - Backlink Quality Scorer workflow
-- Returns backlink profile summary and DA distribution in one call
-- Used by n8n workflow mrAB875zmaatetdg

CREATE OR REPLACE FUNCTION web_intel.get_backlink_quality_data()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'summary', (
      SELECT row_to_json(bp)
      FROM (
        SELECT total_backlinks, referring_domains, dofollow_links, nofollow_links, new_links_7d, collected_date
        FROM web_intel.backlink_profile
        ORDER BY collected_date DESC
        LIMIT 1
      ) bp
    ),
    'da_distribution', COALESCE((
      SELECT json_agg(row_to_json(da))
      FROM (
        SELECT domain_authority
        FROM web_intel.backlinks
        WHERE status = 'active'
      ) da
    ), '[]'::json)
  ) INTO result;
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION web_intel.get_backlink_quality_data() TO anon, authenticated, service_role;
