-- Action Center Critical Fixes
-- Applies missing tables and functions needed for workflows
-- Date: 2026-01-27

-- ============================================
-- 1. ALERT CONFIGURATION TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  creates_tasks BOOLEAN DEFAULT TRUE,
  default_department TEXT,
  task_title_template TEXT,
  info_creates_task BOOLEAN DEFAULT FALSE,
  accumulation_threshold INTEGER DEFAULT 3,
  accumulation_window_hours INTEGER DEFAULT 24,
  cooldown_after_completion_hours INTEGER DEFAULT 24,
  dismissed_cooldown_days INTEGER DEFAULT 7,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alert_config_type ON action_center.alert_config(alert_type);

-- Seed default configurations
INSERT INTO action_center.alert_config (alert_type, display_name, default_department, cooldown_after_completion_hours) VALUES
  ('ssl_expiry', 'SSL Certificate Expiry', 'Digital', 168),
  ('domain_health', 'Domain Health Issue', 'Digital', 24),
  ('uptime_down', 'Site Downtime', 'Digital', 1),
  ('payment_failed', 'Payment Failed', 'Operations', 24),
  ('tier_ending', 'Tier Ending Soon', 'Programs', 4),
  ('vip_non_response', 'VIP Non-Response', 'Programs', 24)
ON CONFLICT (alert_type) DO NOTHING;

-- Trigger for updated_at
DROP TRIGGER IF EXISTS alert_config_updated_at ON action_center.alert_config;
CREATE TRIGGER alert_config_updated_at
  BEFORE UPDATE ON action_center.alert_config
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

COMMENT ON TABLE action_center.alert_config IS 'Per-alert-type configuration for task creation behavior';

-- ============================================
-- 2. EXECUTE CONDITION QUERY RPC
-- ============================================
CREATE OR REPLACE FUNCTION action_center.execute_condition_query(p_query TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_normalized_query TEXT;
BEGIN
  v_normalized_query := UPPER(TRIM(p_query));

  -- Security: Only allow SELECT queries
  IF NOT v_normalized_query LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Security: Block dangerous keywords
  IF v_normalized_query ~ '(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Execute and return as JSON array
  EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t', p_query)
  INTO v_result;

  RETURN v_result;
END;
$$;

GRANT EXECUTE ON FUNCTION action_center.execute_condition_query(TEXT) TO service_role;

COMMENT ON FUNCTION action_center.execute_condition_query IS
  'Safely execute a SELECT query and return results as JSONB array. Used by condition-based task rules.';

-- ============================================
-- 3. NOTIFICATION COLUMNS ON PROFILES
-- ============================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS notification_daily_digest BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS notification_digest_time TIME DEFAULT '07:00',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Chicago';

COMMENT ON COLUMN public.profiles.notification_daily_digest IS 'Whether user receives daily task digest emails';
COMMENT ON COLUMN public.profiles.notification_digest_time IS 'Preferred time to receive daily digest (in user timezone)';
COMMENT ON COLUMN public.profiles.timezone IS 'User timezone for notification scheduling';
