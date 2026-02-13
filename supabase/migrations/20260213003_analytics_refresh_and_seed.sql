-- ============================================================================
-- Migration: 20260213003_analytics_refresh_and_seed.sql
-- Phase 1, Plan 04: Refresh function + sync log seed data
--
-- Creates refresh_analytics_views() function that refreshes all 5 analytics
-- materialized views in a single call using CONCURRENTLY (requires unique
-- indexes from Plan 02). Logs refresh timing to analytics_sync_log.
-- Seeds analytics_sync_log with initial rows for all data source platforms.
--
-- Dependencies:
--   - 20260212_analytics_classify_tier.sql (analytics_sync_log table)
--   - 20260213001_analytics_materialized_views.sql (5 materialized views + unique indexes)
-- ============================================================================

-- ==========================================================================
-- 1. refresh_analytics_views() function
-- ==========================================================================

CREATE OR REPLACE FUNCTION refresh_analytics_views()
RETURNS JSON AS $$
DECLARE
  v_start TIMESTAMPTZ := NOW();
  v_duration_ms INTEGER;
BEGIN
  -- Refresh all 5 materialized views concurrently (no read locks)
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_pipeline_funnel;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_channel_scoreboard;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_summary;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_campaign_step_metrics;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_conversion_metrics;

  -- Calculate duration
  v_duration_ms := EXTRACT(MILLISECONDS FROM (NOW() - v_start))::INTEGER;

  -- Log the refresh to analytics_sync_log
  INSERT INTO analytics_sync_log (source, last_sync_at, records_synced, status, metadata)
  VALUES (
    'matview_refresh',
    NOW(),
    0,
    'success',
    jsonb_build_object('duration_ms', v_duration_ms, 'views_refreshed', 5)
  )
  ON CONFLICT (source) DO UPDATE SET
    last_sync_at = NOW(),
    records_synced = 0,
    status = 'success',
    error_message = NULL,
    metadata = jsonb_build_object('duration_ms', v_duration_ms, 'views_refreshed', 5),
    updated_at = NOW();

  RETURN json_build_object(
    'success', true,
    'refreshed_at', NOW(),
    'duration_ms', v_duration_ms,
    'views_refreshed', 5
  );
EXCEPTION WHEN OTHERS THEN
  -- Log failure
  INSERT INTO analytics_sync_log (source, last_sync_at, status, error_message, metadata)
  VALUES (
    'matview_refresh',
    NOW(),
    'error',
    SQLERRM,
    jsonb_build_object('sqlstate', SQLSTATE)
  )
  ON CONFLICT (source) DO UPDATE SET
    last_sync_at = NOW(),
    status = 'error',
    error_message = SQLERRM,
    metadata = jsonb_build_object('sqlstate', SQLSTATE),
    updated_at = NOW();

  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION refresh_analytics_views IS 'Refreshes all 5 analytics materialized views and logs to sync_log. Called by n8n after data sync.';

-- ==========================================================================
-- 2. Seed analytics_sync_log with initial rows
-- ==========================================================================

-- Seed initial sync log rows so dashboard can show "never synced" for all platforms
INSERT INTO analytics_sync_log (source, last_sync_at, records_synced, status, metadata)
VALUES
  ('smartlead', '1970-01-01'::TIMESTAMPTZ, 0, 'pending', '{"note": "Never synced - awaiting Phase 2 SmartLead workflow"}'::JSONB),
  ('heyreach', '1970-01-01'::TIMESTAMPTZ, 0, 'pending', '{"note": "Never synced - awaiting Phase 3 HeyReach enhancement"}'::JSONB),
  ('ghl', '1970-01-01'::TIMESTAMPTZ, 0, 'pending', '{"note": "Never synced - awaiting Phase 5 GHL workflow"}'::JSONB),
  ('matview_refresh', '1970-01-01'::TIMESTAMPTZ, 0, 'pending', '{"note": "Never refreshed - awaiting first sync"}'::JSONB)
ON CONFLICT (source) DO NOTHING;
