-- ============================================================================
-- MIGRATION: Analytics RPC Functions (Marketing Analytics Dashboard)
-- ============================================================================
-- Part of: Marketing Analytics Dashboard project
-- Purpose: Creates 6 RPC functions that power all dashboard queries. Each
--          function reads from materialized views (or analytics_sync_log) and
--          accepts an optional tier filter parameter. These are the API surface
--          that the Next.js dashboard calls via supabase.rpc().
--
-- Pattern:
--   - SECURITY DEFINER bypasses RLS for performance on aggregate reads
--   - SUM()::BIGINT aggregates across tier rows when p_tier IS NULL
--   - Explicit table aliases avoid column ambiguity with RETURNS TABLE columns
--   - CREATE OR REPLACE for idempotent re-application
--
-- Dependencies:
--   20260212_analytics_classify_tier.sql  (classify_tier function, analytics_sync_log)
--   20260213001_analytics_materialized_views.sql  (all 5 materialized views)
--
-- Functions created:
--   1. get_analytics_pipeline     - Pipeline funnel per campaign
--   2. get_analytics_channels     - Per-channel engagement metrics
--   3. get_analytics_campaigns    - Campaign health summary cards
--   4. get_campaign_drilldown     - Step-by-step metrics for a campaign
--   5. get_conversion_metrics     - Conversion tracking per campaign
--   6. get_sync_status            - Data freshness per sync source
-- ============================================================================


-- ============================================================================
-- FUNCTION 1: get_analytics_pipeline
-- ============================================================================
-- Returns pipeline funnel stages per campaign with optional tier filtering.
-- When p_tier IS NULL, SUMs across all tiers for aggregate totals.
-- Dashboard component: Pipeline funnel visualization
-- ============================================================================

CREATE OR REPLACE FUNCTION get_analytics_pipeline(
  p_campaign_id UUID DEFAULT NULL,
  p_tier TEXT DEFAULT NULL
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_cold BIGINT,
  engaged BIGINT,
  qualified BIGINT,
  registered BIGINT,
  alumni BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pf.campaign_id,
    pf.campaign_name,
    SUM(pf.total_cold)::BIGINT,
    SUM(pf.engaged)::BIGINT,
    SUM(pf.qualified)::BIGINT,
    SUM(pf.registered)::BIGINT,
    SUM(pf.alumni)::BIGINT
  FROM mv_pipeline_funnel pf
  WHERE (p_campaign_id IS NULL OR pf.campaign_id = p_campaign_id)
    AND (p_tier IS NULL OR pf.tier = p_tier)
  GROUP BY pf.campaign_id, pf.campaign_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_analytics_pipeline IS 'Pipeline funnel (cold->engaged->qualified->registered->alumni) per campaign. Called by dashboard Pipeline Funnel widget via supabase.rpc("get_analytics_pipeline"). Accepts optional p_campaign_id and p_tier filters.';


-- ============================================================================
-- FUNCTION 2: get_analytics_channels
-- ============================================================================
-- Returns per-channel engagement metrics with optional campaign and tier
-- filters. When p_tier IS NULL, SUMs across all tiers for aggregate totals.
-- Dashboard component: Channel scoreboard / comparison table
-- ============================================================================

CREATE OR REPLACE FUNCTION get_analytics_channels(
  p_campaign_id UUID DEFAULT NULL,
  p_tier TEXT DEFAULT NULL
)
RETURNS TABLE (
  channel_id UUID,
  campaign_id UUID,
  channel TEXT,
  platform TEXT,
  total_contacts BIGINT,
  sends BIGINT,
  opens BIGINT,
  clicks BIGINT,
  replies BIGINT,
  bounces BIGINT,
  connection_requests BIGINT,
  connections_accepted BIGINT,
  registrations BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.channel_id,
    cs.campaign_id,
    cs.channel,
    cs.platform,
    SUM(cs.total_contacts)::BIGINT,
    SUM(cs.sends)::BIGINT,
    SUM(cs.opens)::BIGINT,
    SUM(cs.clicks)::BIGINT,
    SUM(cs.replies)::BIGINT,
    SUM(cs.bounces)::BIGINT,
    SUM(cs.connection_requests)::BIGINT,
    SUM(cs.connections_accepted)::BIGINT,
    SUM(cs.registrations)::BIGINT
  FROM mv_channel_scoreboard cs
  WHERE (p_campaign_id IS NULL OR cs.campaign_id = p_campaign_id)
    AND (p_tier IS NULL OR cs.tier = p_tier)
  GROUP BY cs.channel_id, cs.campaign_id, cs.channel, cs.platform;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_analytics_channels IS 'Per-channel engagement metrics (sends/opens/clicks/replies/bounces/connections/registrations). Called by dashboard Channel Scoreboard widget via supabase.rpc("get_analytics_channels"). Accepts optional p_campaign_id and p_tier filters.';


-- ============================================================================
-- FUNCTION 3: get_analytics_campaigns
-- ============================================================================
-- Returns campaign summary cards with health metrics and branch distribution.
-- When p_tier IS NULL, SUMs across all tiers for aggregate totals.
-- Dashboard component: Campaign overview / summary cards
-- ============================================================================

CREATE OR REPLACE FUNCTION get_analytics_campaigns(
  p_tier TEXT DEFAULT NULL
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  campaign_status TEXT,
  started_at TIMESTAMPTZ,
  total_contacts BIGINT,
  active_contacts BIGINT,
  replied_contacts BIGINT,
  registered_contacts BIGINT,
  branch_a BIGINT,
  branch_a_plus BIGINT,
  branch_b BIGINT,
  branch_c BIGINT,
  opted_out BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cm.campaign_id,
    cm.campaign_name,
    cm.campaign_status,
    cm.started_at,
    SUM(cm.total_contacts)::BIGINT,
    SUM(cm.active_contacts)::BIGINT,
    SUM(cm.replied_contacts)::BIGINT,
    SUM(cm.registered_contacts)::BIGINT,
    SUM(cm.branch_a)::BIGINT,
    SUM(cm.branch_a_plus)::BIGINT,
    SUM(cm.branch_b)::BIGINT,
    SUM(cm.branch_c)::BIGINT,
    SUM(cm.opted_out)::BIGINT
  FROM mv_campaign_summary cm
  WHERE (p_tier IS NULL OR cm.tier = p_tier)
  GROUP BY cm.campaign_id, cm.campaign_name, cm.campaign_status, cm.started_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_analytics_campaigns IS 'Campaign health summary (contacts, replies, registrations, branch distribution, opt-outs). Called by dashboard Campaign Overview widget via supabase.rpc("get_analytics_campaigns"). Accepts optional p_tier filter.';


-- ============================================================================
-- FUNCTION 4: get_campaign_drilldown
-- ============================================================================
-- Returns per-step metrics for a specific campaign. p_campaign_id is REQUIRED
-- (no default) since drill-down always targets a specific campaign.
-- When p_tier IS NULL, SUMs across all tiers for aggregate totals.
-- Dashboard component: Campaign step-by-step performance drill-down
-- ============================================================================

CREATE OR REPLACE FUNCTION get_campaign_drilldown(
  p_campaign_id UUID,
  p_tier TEXT DEFAULT NULL
)
RETURNS TABLE (
  campaign_id UUID,
  channel_id UUID,
  message_id UUID,
  message_code TEXT,
  message_name TEXT,
  message_type TEXT,
  sequence_order INTEGER,
  channel TEXT,
  sends BIGINT,
  opens BIGINT,
  clicks BIGINT,
  replies BIGINT,
  bounces BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sm.campaign_id,
    sm.channel_id,
    sm.message_id,
    sm.message_code,
    sm.message_name,
    sm.message_type,
    sm.sequence_order,
    sm.channel,
    SUM(sm.sends)::BIGINT,
    SUM(sm.opens)::BIGINT,
    SUM(sm.clicks)::BIGINT,
    SUM(sm.replies)::BIGINT,
    SUM(sm.bounces)::BIGINT
  FROM mv_campaign_step_metrics sm
  WHERE sm.campaign_id = p_campaign_id
    AND (p_tier IS NULL OR sm.tier = p_tier)
  GROUP BY sm.campaign_id, sm.channel_id, sm.message_id, sm.message_code,
           sm.message_name, sm.message_type, sm.sequence_order, sm.channel
  ORDER BY sm.channel, sm.sequence_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_campaign_drilldown IS 'Step-by-step engagement metrics (sends/opens/clicks/replies/bounces) for a specific campaign. Called by dashboard Campaign Drill-down view via supabase.rpc("get_campaign_drilldown"). Requires p_campaign_id, accepts optional p_tier filter.';


-- ============================================================================
-- FUNCTION 5: get_conversion_metrics
-- ============================================================================
-- Returns conversion tracking data per campaign with optional tier filtering.
-- When p_tier IS NULL, SUMs across all tiers for aggregate totals.
-- Dashboard component: Conversion metrics / ROI panel
-- ============================================================================

CREATE OR REPLACE FUNCTION get_conversion_metrics(
  p_campaign_id UUID DEFAULT NULL,
  p_tier TEXT DEFAULT NULL
)
RETURNS TABLE (
  campaign_id UUID,
  campaign_name TEXT,
  total_contacts BIGINT,
  qu_signups BIGINT,
  qu_attended BIGINT,
  secondary_interested BIGINT,
  secondary_accepted BIGINT,
  referrals_generated BIGINT,
  referrals_converted BIGINT,
  positive_replies BIGINT,
  total_replies BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cv.campaign_id,
    cv.campaign_name,
    SUM(cv.total_contacts)::BIGINT,
    SUM(cv.qu_signups)::BIGINT,
    SUM(cv.qu_attended)::BIGINT,
    SUM(cv.secondary_interested)::BIGINT,
    SUM(cv.secondary_accepted)::BIGINT,
    SUM(cv.referrals_generated)::BIGINT,
    SUM(cv.referrals_converted)::BIGINT,
    SUM(cv.positive_replies)::BIGINT,
    SUM(cv.total_replies)::BIGINT
  FROM mv_conversion_metrics cv
  WHERE (p_campaign_id IS NULL OR cv.campaign_id = p_campaign_id)
    AND (p_tier IS NULL OR cv.tier = p_tier)
  GROUP BY cv.campaign_id, cv.campaign_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_conversion_metrics IS 'Conversion funnel (QU signups, attendance, secondary offers, referrals, reply sentiment) per campaign. Called by dashboard Conversion Metrics widget via supabase.rpc("get_conversion_metrics"). Accepts optional p_campaign_id and p_tier filters.';


-- ============================================================================
-- FUNCTION 6: get_sync_status
-- ============================================================================
-- Returns data freshness per sync source. Reads directly from
-- analytics_sync_log (not a materialized view). No tier filter since sync
-- status is not contact-scoped.
-- Dashboard component: Sync status badge / last-updated indicator
-- ============================================================================

CREATE OR REPLACE FUNCTION get_sync_status()
RETURNS TABLE (
  source TEXT,
  last_sync_at TIMESTAMPTZ,
  records_synced INTEGER,
  status TEXT,
  error_message TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.source,
    s.last_sync_at,
    s.records_synced,
    s.status,
    s.error_message,
    s.metadata
  FROM analytics_sync_log s
  ORDER BY s.source;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_sync_status IS 'Data freshness per sync source (smartlead, heyreach, ghl, matview_refresh). Called by dashboard Sync Status badge via supabase.rpc("get_sync_status"). No parameters - returns all sources.';
