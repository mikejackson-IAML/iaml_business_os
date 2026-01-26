-- AI Suggestion Expiry
-- Auto-expire unreviewed AI suggestions after 7 days
-- Date: 2026-01-25

-- Function to expire old AI suggestions
CREATE OR REPLACE FUNCTION action_center.expire_ai_suggestions()
RETURNS INTEGER AS $$
DECLARE
  expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE action_center.tasks
    SET
      status = 'dismissed',
      dismissed_reason = 'ai_expired: Suggestion not reviewed within 7 days',
      dismissed_at = NOW(),
      updated_at = NOW()
    WHERE
      source = 'ai'
      AND status = 'open'
      AND ai_suggested_at IS NOT NULL
      AND ai_suggested_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO expired_count FROM expired;

  RETURN expired_count;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON FUNCTION action_center.expire_ai_suggestions IS
  'Expire AI suggestions that have not been reviewed within 7 days';

-- Grant execute to authenticated users (for RPC call)
GRANT EXECUTE ON FUNCTION action_center.expire_ai_suggestions TO authenticated;
