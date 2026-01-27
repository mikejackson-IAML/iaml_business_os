-- RPC functions for Smartlead Inbox Ramp-Up workflow
-- These replace the Postgres nodes that use the broken credential

-- ============================================
-- 1. Get Inbox Ramp Config
-- Returns ramp schedule info based on preferences
-- ============================================
CREATE OR REPLACE FUNCTION get_inbox_ramp_config()
RETURNS TABLE (
  ramp_start_date DATE,
  current_week INTEGER,
  target_daily_limit INTEGER
)
SECURITY DEFINER
LANGUAGE sql
AS $$
  WITH ramp_config AS (
    SELECT
      COALESCE(
        (SELECT value->>'start_date' FROM n8n_brain.preferences WHERE category = 'ramp' AND key = 'inbox_ramp'),
        '2026-01-20'
      )::date as start_date
  ),
  week_calc AS (
    SELECT
      start_date,
      GREATEST(1, CEIL((CURRENT_DATE - start_date)::numeric / 7))::integer as week_num
    FROM ramp_config
  )
  SELECT
    start_date as ramp_start_date,
    week_num as current_week,
    CASE
      WHEN week_num = 1 THEN 15
      WHEN week_num = 2 THEN 25
      WHEN week_num = 3 THEN 35
      ELSE 50
    END as target_daily_limit
  FROM week_calc;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION get_inbox_ramp_config() TO anon, authenticated;


-- ============================================
-- 2. Log Inbox Ramp Update
-- Logs capacity increase to lead_intelligence_activity
-- ============================================
CREATE OR REPLACE FUNCTION log_inbox_ramp_update(
  p_account_id TEXT,
  p_email TEXT,
  p_old_limit INTEGER,
  p_new_limit INTEGER,
  p_ramp_week INTEGER
)
RETURNS JSON
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  v_result RECORD;
BEGIN
  INSERT INTO lead_intelligence_activity (
    activity_type,
    description,
    source_name,
    metadata,
    activity_at
  ) VALUES (
    'capacity_calculated',
    'Increased daily limit for ' || p_email || ' from ' || p_old_limit::text || ' to ' || p_new_limit::text || ' (Week ' || p_ramp_week::text || ')',
    'smartlead_rampup',
    jsonb_build_object(
      'account_id', p_account_id,
      'email', p_email,
      'old_limit', p_old_limit,
      'new_limit', p_new_limit,
      'ramp_week', p_ramp_week
    ),
    NOW()
  )
  RETURNING id INTO v_result;

  RETURN json_build_object('success', true, 'id', v_result.id);
END;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION log_inbox_ramp_update(TEXT, TEXT, INTEGER, INTEGER, INTEGER) TO anon, authenticated;


-- ============================================
-- Comments
-- ============================================
COMMENT ON FUNCTION get_inbox_ramp_config() IS 'Get inbox ramp-up configuration - returns current week and target daily limit based on ramp start date in preferences';
COMMENT ON FUNCTION log_inbox_ramp_update(TEXT, TEXT, INTEGER, INTEGER, INTEGER) IS 'Log an inbox daily limit increase to lead_intelligence_activity table';
