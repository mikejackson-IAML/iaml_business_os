-- Alert Integration: Standardized Alert Webhook Schema
-- Migration: Create alert_config table and helper functions
-- Date: 2026-01-24

-- ============================================
-- ALERT CONFIGURATION TABLE
-- Stores per-alert-type configuration for task creation
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.alert_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert type identification
  alert_type TEXT UNIQUE NOT NULL,  -- e.g., 'ssl_expiry', 'domain_health', 'uptime_down'

  -- Display name for UI
  display_name TEXT NOT NULL,

  -- Task creation settings
  creates_tasks BOOLEAN DEFAULT TRUE,  -- Whether to create tasks (false for info-only)
  default_department TEXT,              -- Which department owns this alert type
  task_title_template TEXT,             -- Optional: override AI transformation

  -- Info alert exceptions
  info_creates_task BOOLEAN DEFAULT FALSE,  -- If true, info alerts also create tasks
  accumulation_threshold INTEGER DEFAULT 3,  -- Number of occurrences to trigger task
  accumulation_window_hours INTEGER DEFAULT 24,  -- Window for accumulation count

  -- Duplicate handling
  cooldown_after_completion_hours INTEGER DEFAULT 24,  -- Cooldown before creating new task
  dismissed_cooldown_days INTEGER DEFAULT 7,  -- Respect dismissal for this many days

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_alert_config_type ON action_center.alert_config(alert_type);

-- ============================================
-- SEED DEFAULT CONFIGURATIONS
-- ============================================
INSERT INTO action_center.alert_config (alert_type, display_name, default_department, cooldown_after_completion_hours) VALUES
  ('ssl_expiry', 'SSL Certificate Expiry', 'Digital', 168),  -- 7 day cooldown
  ('domain_health', 'Domain Health Issue', 'Digital', 24),
  ('uptime_down', 'Site Downtime', 'Digital', 1),
  ('payment_failed', 'Payment Failed', 'Operations', 24),
  ('tier_ending', 'Tier Ending Soon', 'Programs', 4),
  ('vip_non_response', 'VIP Non-Response', 'Programs', 24)
ON CONFLICT (alert_type) DO NOTHING;

-- ============================================
-- TRIGGER FOR UPDATED_AT
-- ============================================
CREATE TRIGGER alert_config_updated_at
  BEFORE UPDATE ON action_center.alert_config
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE action_center.alert_config IS
  'Per-alert-type configuration for task creation behavior';
COMMENT ON COLUMN action_center.alert_config.info_creates_task IS
  'Exception: if true, info severity alerts for this type still create low-priority tasks';
COMMENT ON COLUMN action_center.alert_config.accumulation_threshold IS
  'For info alerts: create task after this many occurrences within accumulation_window_hours';
