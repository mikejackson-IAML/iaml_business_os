-- RPC function for Campaign Analyst - Performance workflow
-- Replaces direct Postgres query with REST API callable function
-- Created: 2026-01-26

CREATE OR REPLACE FUNCTION get_active_campaign_performance()
RETURNS TABLE (
  campaign_name TEXT,
  total_contacts BIGINT,
  engaged BIGINT,
  qualified BIGINT,
  converted BIGINT
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    mc.name as campaign_name,
    COUNT(cc.id) as total_contacts,
    COUNT(cc.id) FILTER (WHERE cc.first_engagement_at IS NOT NULL) as engaged,
    COUNT(cc.id) FILTER (WHERE cc.ghl_branch IS NOT NULL) as qualified,
    COUNT(cc.id) FILTER (WHERE cc.quarterly_update_registered = true) as converted
  FROM multichannel_campaigns mc
  LEFT JOIN campaign_contacts cc ON cc.campaign_id = mc.id
  WHERE mc.status = 'active'
  GROUP BY mc.id, mc.name;
$$;

-- Grant execute to anon and authenticated roles for REST API access
GRANT EXECUTE ON FUNCTION get_active_campaign_performance() TO anon, authenticated, service_role;

COMMENT ON FUNCTION get_active_campaign_performance() IS
'Returns performance metrics for all active campaigns. Used by Campaign Analyst - Performance n8n workflow.';
