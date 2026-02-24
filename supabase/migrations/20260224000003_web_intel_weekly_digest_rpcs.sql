-- Migration: Web Intel Weekly Digest RPCs
-- Purpose: Create RPCs for the Web Intel Weekly Digest workflow

-- 1. RPC: get_weekly_traffic_summary
-- Returns traffic aggregation for the past 7 days
CREATE OR REPLACE FUNCTION public.get_weekly_traffic_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT row_to_json(t)::jsonb
  INTO result
  FROM (
    SELECT
      COALESCE(SUM(sessions), 0)::int as total_sessions,
      COALESCE(SUM(users), 0)::int as total_users,
      COALESCE(SUM(pageviews), 0)::int as total_pageviews,
      COALESCE(ROUND(AVG(bounce_rate), 2), 0) as avg_bounce_rate,
      COALESCE(ROUND(AVG(avg_session_duration), 2), 0) as avg_session_duration
    FROM web_intel.daily_traffic
    WHERE collected_date >= CURRENT_DATE - INTERVAL '7 days'
  ) t;

  RETURN COALESCE(result, '{"total_sessions":0,"total_users":0,"total_pageviews":0,"avg_bounce_rate":0,"avg_session_duration":0}'::jsonb);
END;
$$;

-- 2. RPC: get_weekly_ranking_changes
-- Returns ranking change summary for the past 7 days
CREATE OR REPLACE FUNCTION public.get_weekly_ranking_changes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT row_to_json(t)::jsonb
  INTO result
  FROM (
    SELECT
      COUNT(*) FILTER (WHERE change_type = 'improved')::int as improved,
      COUNT(*) FILTER (WHERE change_type = 'dropped')::int as declined,
      COUNT(*) FILTER (WHERE change_type = 'new_ranking')::int as new_rankings,
      COUNT(*) FILTER (WHERE change_type = 'lost_ranking')::int as lost_rankings,
      COUNT(*)::int as total_changes
    FROM web_intel.ranking_change_events
    WHERE detected_date >= CURRENT_DATE - INTERVAL '7 days'
  ) t;

  RETURN COALESCE(result, '{"improved":0,"declined":0,"new_rankings":0,"lost_rankings":0,"total_changes":0}'::jsonb);
END;
$$;

-- 3. RPC: get_weekly_backlink_summary
-- Returns new backlinks in the past 7 days from backlink_profile
CREATE OR REPLACE FUNCTION public.get_weekly_backlink_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  latest_profile record;
BEGIN
  -- Get latest backlink profile snapshot
  SELECT
    total_backlinks,
    referring_domains,
    new_links_7d,
    lost_links_7d,
    domain_rating
  INTO latest_profile
  FROM web_intel.backlink_profile
  ORDER BY collected_date DESC
  LIMIT 1;

  IF latest_profile IS NOT NULL THEN
    result := jsonb_build_object(
      'total_backlinks', COALESCE(latest_profile.total_backlinks, 0),
      'referring_domains', COALESCE(latest_profile.referring_domains, 0),
      'new_links_7d', COALESCE(latest_profile.new_links_7d, 0),
      'lost_links_7d', COALESCE(latest_profile.lost_links_7d, 0),
      'domain_rating', COALESCE(latest_profile.domain_rating, 0)
    );
  ELSE
    result := '{"total_backlinks":0,"referring_domains":0,"new_links_7d":0,"lost_links_7d":0,"domain_rating":0}'::jsonb;
  END IF;

  RETURN result;
END;
$$;

-- 4. RPC: get_weekly_alerts_summary
-- Returns alert counts for the past 7 days
CREATE OR REPLACE FUNCTION public.get_weekly_alerts_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT row_to_json(t)::jsonb
  INTO result
  FROM (
    SELECT
      COUNT(*)::int as total,
      COUNT(*) FILTER (WHERE severity = 'critical')::int as critical,
      COUNT(*) FILTER (WHERE severity = 'warning')::int as warning,
      COUNT(*) FILTER (WHERE severity = 'info')::int as info
    FROM web_intel.alerts
    WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'
  ) t;

  RETURN COALESCE(result, '{"total":0,"critical":0,"warning":0,"info":0}'::jsonb);
END;
$$;

-- 5. RPC: store_weekly_digest
-- Stores a generated weekly digest report
CREATE OR REPLACE FUNCTION public.store_weekly_digest(
  p_period_start date,
  p_period_end date,
  p_title text,
  p_summary text,
  p_metrics_snapshot jsonb,
  p_highlights jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  INSERT INTO web_intel.reports (
    report_type, period_start, period_end, title, summary,
    metrics_snapshot, highlights, status
  ) VALUES (
    'weekly_digest', p_period_start, p_period_end, p_title, p_summary,
    p_metrics_snapshot, p_highlights, 'generated'
  )
  RETURNING jsonb_build_object('id', id, 'title', title, 'status', status)
  INTO result;

  RETURN result;
END;
$$;

-- Grant execute on all RPCs
GRANT EXECUTE ON FUNCTION public.get_weekly_traffic_summary() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_ranking_changes() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_backlink_summary() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_weekly_alerts_summary() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.store_weekly_digest(date, date, text, text, jsonb, jsonb) TO authenticated, service_role, anon;
