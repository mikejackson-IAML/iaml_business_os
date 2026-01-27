-- Mobile Device Tokens for Push Notifications
-- Stores APNs device tokens and notification preferences

CREATE TABLE IF NOT EXISTS mobile_device_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Device identification
  device_token TEXT UNIQUE NOT NULL,
  device_name TEXT,
  os_version TEXT,
  app_version TEXT,

  -- User association (single user for now, structure allows expansion)
  user_identifier TEXT DEFAULT 'primary',

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'bounced', 'revoked')),
  bounce_reason TEXT,
  bounced_at TIMESTAMPTZ,

  -- Notification preferences
  timezone TEXT DEFAULT 'America/Chicago',  -- IANA format
  quiet_hours_enabled BOOLEAN DEFAULT TRUE,
  quiet_hours_start INTEGER DEFAULT 22,     -- 10pm local
  quiet_hours_end INTEGER DEFAULT 7,        -- 7am local
  digest_enabled BOOLEAN DEFAULT TRUE,
  digest_hour INTEGER DEFAULT 7,            -- 7am local

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ
);

-- Index for active token lookup
CREATE INDEX IF NOT EXISTS idx_device_tokens_status ON mobile_device_tokens(status) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_device_tokens_user ON mobile_device_tokens(user_identifier);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_device_token_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER device_tokens_updated_at
  BEFORE UPDATE ON mobile_device_tokens
  FOR EACH ROW EXECUTE FUNCTION update_device_token_updated_at();

COMMENT ON TABLE mobile_device_tokens IS 'APNs device tokens for push notifications with user preferences';
