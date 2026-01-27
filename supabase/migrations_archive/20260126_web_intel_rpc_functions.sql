-- Web Intel RPC Functions for n8n Workflows
-- Migration: 20260126
-- These functions allow workflows to insert/update data via REST API

-- ============================================
-- ENSURE SCHEMA EXISTS
-- ============================================
CREATE SCHEMA IF NOT EXISTS web_intel;

-- ============================================
-- UPDATE SOURCE BREAKDOWN
-- For TRF-02 Source Breakdown workflow
-- ============================================
CREATE OR REPLACE FUNCTION public.update_source_breakdown(
  p_collected_date DATE,
  p_source_breakdown JSONB
)
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  UPDATE web_intel.daily_traffic
  SET
    source_breakdown = p_source_breakdown,
    updated_at = NOW()
  WHERE collected_date = p_collected_date;

  IF NOT FOUND THEN
    INSERT INTO web_intel.daily_traffic (collected_date, source_breakdown)
    VALUES (p_collected_date, p_source_breakdown);
  END IF;

  v_result := jsonb_build_object(
    'success', true,
    'collected_date', p_collected_date,
    'updated_at', NOW()
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSERT PAGE TRAFFIC
-- For TRF-03 Page Performance workflow
-- ============================================
CREATE OR REPLACE FUNCTION public.insert_page_traffic(
  p_collected_date DATE,
  p_page_path TEXT,
  p_sessions INTEGER DEFAULT 0,
  p_pageviews INTEGER DEFAULT 0,
  p_unique_pageviews INTEGER DEFAULT 0,
  p_avg_time_on_page NUMERIC DEFAULT NULL,
  p_bounce_rate NUMERIC DEFAULT NULL,
  p_exit_rate NUMERIC DEFAULT NULL,
  p_entrances INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.page_traffic (
    collected_date,
    page_path,
    sessions,
    pageviews,
    unique_pageviews,
    avg_time_on_page,
    bounce_rate,
    exit_rate,
    entrances
  ) VALUES (
    p_collected_date,
    p_page_path,
    p_sessions,
    p_pageviews,
    p_unique_pageviews,
    p_avg_time_on_page,
    p_bounce_rate,
    p_exit_rate,
    p_entrances
  )
  ON CONFLICT (collected_date, page_path) DO UPDATE SET
    sessions = EXCLUDED.sessions,
    pageviews = EXCLUDED.pageviews,
    unique_pageviews = EXCLUDED.unique_pageviews,
    avg_time_on_page = EXCLUDED.avg_time_on_page,
    bounce_rate = EXCLUDED.bounce_rate,
    exit_rate = EXCLUDED.exit_rate,
    entrances = EXCLUDED.entrances
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'collected_date', p_collected_date,
    'page_path', p_page_path
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSERT GEO TRAFFIC
-- For TRF-04 Geographic workflow
-- ============================================
CREATE OR REPLACE FUNCTION public.insert_geo_traffic(
  p_week_start DATE,
  p_country_code TEXT,
  p_country_name TEXT,
  p_region TEXT DEFAULT NULL,
  p_sessions INTEGER DEFAULT 0,
  p_users INTEGER DEFAULT 0,
  p_pageviews INTEGER DEFAULT 0
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
  v_prev_sessions INTEGER;
  v_wow_change NUMERIC;
BEGIN
  SELECT sessions INTO v_prev_sessions
  FROM web_intel.geo_traffic
  WHERE country_code = p_country_code
    AND COALESCE(region, '') = COALESCE(p_region, '')
    AND week_start = p_week_start - INTERVAL '7 days';

  IF v_prev_sessions IS NOT NULL AND v_prev_sessions > 0 THEN
    v_wow_change := ((p_sessions - v_prev_sessions)::NUMERIC / v_prev_sessions) * 100;
  END IF;

  INSERT INTO web_intel.geo_traffic (
    week_start,
    country_code,
    country_name,
    region,
    sessions,
    users,
    pageviews,
    previous_week_sessions,
    wow_change
  ) VALUES (
    p_week_start,
    p_country_code,
    p_country_name,
    p_region,
    p_sessions,
    p_users,
    p_pageviews,
    v_prev_sessions,
    v_wow_change
  )
  ON CONFLICT (week_start, country_code, region) DO UPDATE SET
    country_name = EXCLUDED.country_name,
    sessions = EXCLUDED.sessions,
    users = EXCLUDED.users,
    pageviews = EXCLUDED.pageviews,
    previous_week_sessions = EXCLUDED.previous_week_sessions,
    wow_change = EXCLUDED.wow_change
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'week_start', p_week_start,
    'country_code', p_country_code,
    'wow_change', v_wow_change
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRAFFIC ANOMALIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS web_intel.traffic_anomalies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  detected_date DATE NOT NULL,
  metric_name TEXT NOT NULL,
  expected_value NUMERIC NOT NULL,
  actual_value NUMERIC NOT NULL,
  deviation_percent NUMERIC NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(detected_date, metric_name)
);

CREATE INDEX IF NOT EXISTS idx_traffic_anomalies_date ON web_intel.traffic_anomalies(detected_date DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_anomalies_severity ON web_intel.traffic_anomalies(severity);

GRANT SELECT, INSERT, UPDATE ON web_intel.traffic_anomalies TO service_role;
GRANT SELECT ON web_intel.traffic_anomalies TO authenticated;

-- ============================================
-- UPSERT TRAFFIC ANOMALY
-- ============================================
CREATE OR REPLACE FUNCTION public.upsert_traffic_anomaly(
  p_detected_date DATE,
  p_metric_name TEXT,
  p_expected_value NUMERIC,
  p_actual_value NUMERIC,
  p_deviation_percent NUMERIC,
  p_severity TEXT DEFAULT 'warning'
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.traffic_anomalies (
    detected_date,
    metric_name,
    expected_value,
    actual_value,
    deviation_percent,
    severity,
    acknowledged
  ) VALUES (
    p_detected_date,
    p_metric_name,
    p_expected_value,
    p_actual_value,
    p_deviation_percent,
    p_severity,
    FALSE
  )
  ON CONFLICT (detected_date, metric_name) DO UPDATE SET
    expected_value = EXCLUDED.expected_value,
    actual_value = EXCLUDED.actual_value,
    deviation_percent = EXCLUDED.deviation_percent,
    severity = EXCLUDED.severity
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id,
    'detected_date', p_detected_date,
    'metric_name', p_metric_name,
    'severity', p_severity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ALERTS TABLE - Drop and recreate to fix schema
-- ============================================
DROP TABLE IF EXISTS web_intel.alerts CASCADE;

CREATE TABLE web_intel.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT,
  metadata JSONB DEFAULT '{}',
  acknowledged BOOLEAN DEFAULT FALSE,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  notified_at TIMESTAMPTZ,
  notification_channel TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_alerts_type ON web_intel.alerts(alert_type);
CREATE INDEX idx_alerts_severity ON web_intel.alerts(severity);
CREATE INDEX idx_alerts_created ON web_intel.alerts(created_at DESC);
CREATE INDEX idx_alerts_unacked ON web_intel.alerts(acknowledged) WHERE acknowledged = FALSE;

GRANT SELECT, INSERT, UPDATE ON web_intel.alerts TO service_role;
GRANT SELECT ON web_intel.alerts TO authenticated;

-- ============================================
-- DAILY TRAFFIC AVERAGES VIEW
-- ============================================
CREATE OR REPLACE VIEW web_intel.daily_traffic_averages AS
SELECT
  ROUND(AVG(sessions)) as avg_sessions_7d,
  ROUND(AVG(users)) as avg_users_7d,
  ROUND(AVG(pageviews)) as avg_pageviews_7d,
  ROUND(AVG(bounce_rate), 2) as avg_bounce_rate_7d,
  ROUND(AVG(avg_session_duration), 2) as avg_session_duration_7d,
  ROUND(STDDEV(sessions)) as stddev_sessions,
  ROUND(STDDEV(pageviews)) as stddev_pageviews,
  MIN(collected_date) as period_start,
  MAX(collected_date) as period_end,
  COUNT(*) as days_in_period
FROM web_intel.daily_traffic
WHERE collected_date >= CURRENT_DATE - INTERVAL '8 days'
  AND collected_date < CURRENT_DATE;

GRANT SELECT ON web_intel.daily_traffic_averages TO service_role, authenticated;

-- ============================================
-- GET YESTERDAY TRAFFIC (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_yesterday_traffic()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'collected_date', collected_date,
    'sessions', sessions,
    'users', users,
    'pageviews', pageviews,
    'bounce_rate', bounce_rate,
    'avg_session_duration', avg_session_duration
  ) INTO v_result
  FROM web_intel.daily_traffic
  WHERE collected_date = CURRENT_DATE - INTERVAL '1 day'
  LIMIT 1;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET TRAFFIC AVERAGES (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_traffic_averages()
RETURNS JSONB AS $$
DECLARE
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'avg_sessions_7d', avg_sessions_7d,
    'avg_users_7d', avg_users_7d,
    'avg_pageviews_7d', avg_pageviews_7d,
    'avg_bounce_rate_7d', avg_bounce_rate_7d,
    'stddev_sessions', stddev_sessions,
    'stddev_pageviews', stddev_pageviews,
    'period_start', period_start,
    'period_end', period_end,
    'days_in_period', days_in_period
  ) INTO v_result
  FROM web_intel.daily_traffic_averages;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- INSERT ALERT (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION public.insert_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_message TEXT,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.alerts (
    alert_type,
    severity,
    title,
    message,
    metadata
  ) VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_message,
    p_metadata
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- MARK ALERTS NOTIFIED (RPC)
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_alerts_notified(
  p_alert_types TEXT[] DEFAULT ARRAY['traffic_drop', 'traffic_spike'],
  p_channel TEXT DEFAULT 'slack'
)
RETURNS JSONB AS $$
DECLARE
  v_count INTEGER;
BEGIN
  UPDATE web_intel.alerts
  SET
    notified_at = NOW(),
    notification_channel = p_channel
  WHERE alert_type = ANY(p_alert_types)
    AND notified_at IS NULL
    AND created_at > NOW() - INTERVAL '5 minutes';

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN jsonb_build_object(
    'success', true,
    'alerts_marked', v_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANT EXECUTE
-- ============================================
GRANT EXECUTE ON FUNCTION public.update_source_breakdown TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_page_traffic TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_geo_traffic TO service_role;
GRANT EXECUTE ON FUNCTION public.upsert_traffic_anomaly TO service_role;
GRANT EXECUTE ON FUNCTION public.get_yesterday_traffic TO service_role;
GRANT EXECUTE ON FUNCTION public.get_traffic_averages TO service_role;
GRANT EXECUTE ON FUNCTION public.insert_alert TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_alerts_notified TO service_role;
