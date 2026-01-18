-- Add ramp-up tracking fields to email_inboxes
-- Date: 2026-01-16

-- Add ramp tracking columns
ALTER TABLE email_inboxes
ADD COLUMN IF NOT EXISTS ramp_start_date DATE,
ADD COLUMN IF NOT EXISTS ramp_week INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_daily_limit INTEGER,
ADD COLUMN IF NOT EXISTS ramp_status TEXT DEFAULT 'not_started'
  CHECK (ramp_status IN ('not_started', 'ramping', 'completed'));

-- Index for ramp queries
CREATE INDEX IF NOT EXISTS idx_email_inboxes_ramp_status ON email_inboxes(ramp_status);

-- Function to calculate target limit based on ramp week
CREATE OR REPLACE FUNCTION calculate_ramp_target(p_ramp_week INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE
    WHEN p_ramp_week <= 0 THEN 15
    WHEN p_ramp_week = 1 THEN 15
    WHEN p_ramp_week = 2 THEN 25
    WHEN p_ramp_week = 3 THEN 35
    WHEN p_ramp_week >= 4 THEN 50
    ELSE 15
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to start ramping all inboxes
CREATE OR REPLACE FUNCTION start_inbox_ramp()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE email_inboxes
  SET
    ramp_start_date = CURRENT_DATE,
    ramp_week = 1,
    target_daily_limit = 15,
    ramp_status = 'ramping'
  WHERE ramp_status = 'not_started'
    AND is_connected = TRUE;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- View for ramp status summary
CREATE OR REPLACE VIEW inbox_ramp_summary AS
SELECT
  ramp_status,
  ramp_week,
  COUNT(*) as inbox_count,
  SUM(daily_limit) as current_capacity,
  SUM(target_daily_limit) as target_capacity,
  SUM(CASE WHEN daily_limit < target_daily_limit THEN 1 ELSE 0 END) as needs_update
FROM email_inboxes
WHERE is_connected = TRUE
GROUP BY ramp_status, ramp_week
ORDER BY ramp_week;

COMMENT ON COLUMN email_inboxes.ramp_start_date IS 'Date when inbox started ramp-up for real sending';
COMMENT ON COLUMN email_inboxes.ramp_week IS 'Current week number in ramp schedule (1-4+)';
COMMENT ON COLUMN email_inboxes.target_daily_limit IS 'Target daily limit based on ramp schedule';
COMMENT ON COLUMN email_inboxes.ramp_status IS 'Ramp status: not_started, ramping, completed';
COMMENT ON FUNCTION calculate_ramp_target IS 'Returns target daily limit for given ramp week: W1=15, W2=25, W3=35, W4+=50';
