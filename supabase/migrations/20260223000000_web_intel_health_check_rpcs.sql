-- Web Intel Health Checker RPCs
-- Replaces direct Postgres queries with REST-callable functions

-- RPC 1: Get workflow health from collection_log (last 7 days)
CREATE OR REPLACE FUNCTION web_intel.get_workflow_health()
RETURNS TABLE (
  workflow_id text,
  workflow_name text,
  last_run timestamptz,
  failures_24h bigint
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = web_intel, public
AS $$
  SELECT
    workflow_id,
    workflow_name,
    MAX(completed_at) as last_run,
    COUNT(*) FILTER (WHERE status = 'failure' AND started_at >= NOW() - INTERVAL '24 hours') as failures_24h
  FROM web_intel.collection_log
  WHERE started_at >= NOW() - INTERVAL '7 days'
  GROUP BY workflow_id, workflow_name;
$$;

-- RPC 2: Get data freshness health
CREATE OR REPLACE FUNCTION web_intel.get_data_health()
RETURNS TABLE (
  traffic_data bigint,
  ranking_data bigint,
  last_traffic_date date,
  last_ranking_date date
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = web_intel, public
AS $$
  SELECT
    (SELECT COUNT(*) FROM web_intel.daily_traffic WHERE collected_date >= CURRENT_DATE - 1)::bigint as traffic_data,
    (SELECT COUNT(*) FROM web_intel.daily_rankings WHERE collected_date >= CURRENT_DATE - 1)::bigint as ranking_data,
    (SELECT MAX(collected_date) FROM web_intel.daily_traffic) as last_traffic_date,
    (SELECT MAX(collected_date) FROM web_intel.daily_rankings) as last_ranking_date;
$$;

-- Grant access to authenticated and anon for REST API usage
GRANT EXECUTE ON FUNCTION web_intel.get_workflow_health() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION web_intel.get_data_health() TO authenticated, anon, service_role;

-- Public wrapper functions (needed for REST API access via PostgREST)
CREATE OR REPLACE FUNCTION public.get_web_intel_workflow_health()
RETURNS TABLE (
  workflow_id text,
  workflow_name text,
  last_run timestamptz,
  failures_24h bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM web_intel.get_workflow_health();
$$;

CREATE OR REPLACE FUNCTION public.get_web_intel_data_health()
RETURNS TABLE (
  traffic_data bigint,
  ranking_data bigint,
  last_traffic_date date,
  last_ranking_date date
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM web_intel.get_data_health();
$$;

GRANT EXECUTE ON FUNCTION public.get_web_intel_workflow_health() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_web_intel_data_health() TO authenticated, anon, service_role;
