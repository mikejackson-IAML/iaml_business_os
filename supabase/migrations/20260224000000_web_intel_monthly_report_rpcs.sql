-- Migration: Web Intel Monthly Report RPCs
-- Purpose: Create RPCs and table for the Web Intel Monthly Report workflow

-- 1. Create reports table if it doesn't exist
CREATE TABLE IF NOT EXISTS web_intel.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type text NOT NULL DEFAULT 'monthly_report',
  period_start date NOT NULL,
  period_end date NOT NULL,
  title text NOT NULL,
  summary text,
  metrics_snapshot jsonb DEFAULT '{}'::jsonb,
  highlights jsonb DEFAULT '[]'::jsonb,
  status text DEFAULT 'generated',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- RLS policies
ALTER TABLE web_intel.reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated read" ON web_intel.reports
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow service role full access" ON web_intel.reports
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Grant access
GRANT SELECT ON web_intel.reports TO authenticated;
GRANT ALL ON web_intel.reports TO service_role;

-- 2. RPC: get_monthly_traffic_summary
-- Returns weekly traffic aggregation for the previous month
CREATE OR REPLACE FUNCTION public.get_monthly_traffic_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT
      DATE_TRUNC('week', collected_date)::DATE as week,
      SUM(sessions)::int as sessions,
      SUM(users)::int as users,
      SUM(pageviews)::int as pageviews,
      ROUND(AVG(bounce_rate), 2) as avg_bounce_rate,
      ROUND(AVG(avg_session_duration), 2) as avg_session_duration
    FROM web_intel.daily_traffic
    WHERE collected_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      AND collected_date < DATE_TRUNC('month', CURRENT_DATE)
    GROUP BY DATE_TRUNC('week', collected_date)
    ORDER BY week
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 3. RPC: get_monthly_ranking_changes
-- Returns top 20 keyword ranking changes for the previous month
CREATE OR REPLACE FUNCTION public.get_monthly_ranking_changes()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  SELECT jsonb_agg(row_to_json(t))
  INTO result
  FROM (
    SELECT
      tk.keyword,
      tk.priority,
      first_pos.position as start_position,
      last_pos.position as end_position,
      COALESCE(first_pos.position, 100) - COALESCE(last_pos.position, 100) as improvement
    FROM web_intel.tracked_keywords tk
    LEFT JOIN LATERAL (
      SELECT position
      FROM web_intel.daily_rankings
      WHERE keyword_id = tk.id
        AND collected_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month')
      ORDER BY collected_date
      LIMIT 1
    ) first_pos ON true
    LEFT JOIN LATERAL (
      SELECT position
      FROM web_intel.daily_rankings
      WHERE keyword_id = tk.id
        AND collected_date < DATE_TRUNC('month', CURRENT_DATE)
      ORDER BY collected_date DESC
      LIMIT 1
    ) last_pos ON true
    WHERE tk.status = 'active'
    ORDER BY improvement DESC
    LIMIT 20
  ) t;

  RETURN COALESCE(result, '[]'::jsonb);
END;
$$;

-- 4. RPC: get_backlink_summary
-- Returns the latest backlink profile data
CREATE OR REPLACE FUNCTION public.get_backlink_summary()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  new_30d int;
BEGIN
  -- Get latest backlink profile
  SELECT row_to_json(bp)::jsonb
  INTO result
  FROM (
    SELECT
      total_backlinks,
      referring_domains,
      dofollow_links,
      nofollow_links,
      domain_rating,
      url_rating,
      new_links_7d,
      lost_links_7d
    FROM web_intel.backlink_profile
    ORDER BY collected_date DESC
    LIMIT 1
  ) bp;

  -- Estimate new backlinks in last 30 days from recent profiles
  SELECT COALESCE(SUM(new_links_7d), 0)
  INTO new_30d
  FROM web_intel.backlink_profile
  WHERE collected_date >= CURRENT_DATE - INTERVAL '30 days';

  -- Add the 30-day count
  IF result IS NOT NULL THEN
    result := result || jsonb_build_object('new_last_30_days', new_30d);
  ELSE
    result := jsonb_build_object(
      'total_backlinks', 0,
      'referring_domains', 0,
      'dofollow_links', 0,
      'nofollow_links', 0,
      'domain_rating', 0,
      'url_rating', 0,
      'new_links_7d', 0,
      'lost_links_7d', 0,
      'new_last_30_days', 0
    );
  END IF;

  RETURN result;
END;
$$;

-- 5. RPC: store_monthly_report
-- Stores a generated monthly report
CREATE OR REPLACE FUNCTION public.store_monthly_report(
  p_report_type text,
  p_period_start date,
  p_period_end date,
  p_title text,
  p_summary text,
  p_metrics_snapshot jsonb,
  p_highlights jsonb,
  p_status text DEFAULT 'generated'
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
    p_report_type, p_period_start, p_period_end, p_title, p_summary,
    p_metrics_snapshot, p_highlights, p_status
  )
  RETURNING jsonb_build_object('id', id, 'title', title, 'status', status)
  INTO result;

  RETURN result;
END;
$$;

-- Grant execute on all RPCs
GRANT EXECUTE ON FUNCTION public.get_monthly_traffic_summary() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_monthly_ranking_changes() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.get_backlink_summary() TO authenticated, service_role, anon;
GRANT EXECUTE ON FUNCTION public.store_monthly_report(text, date, date, text, text, jsonb, jsonb, text) TO authenticated, service_role, anon;
