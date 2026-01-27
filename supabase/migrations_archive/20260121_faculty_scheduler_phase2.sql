-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 2 - Notifications & Magic Links
-- ============================================================================
-- Creates magic_tokens and notifications tables for the tier notification system
-- Date: 2026-01-21
-- ============================================================================

-- ============================================================================
-- MAGIC TOKENS TABLE
-- Passwordless authentication tokens (never expire per user preference)
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.magic_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  use_count INTEGER DEFAULT 0
  -- No expires_at since tokens never expire
);

CREATE INDEX IF NOT EXISTS idx_magic_tokens_token ON faculty_scheduler.magic_tokens(token);
CREATE INDEX IF NOT EXISTS idx_magic_tokens_instructor ON faculty_scheduler.magic_tokens(instructor_id);

COMMENT ON TABLE faculty_scheduler.magic_tokens IS 'Passwordless authentication tokens for instructor sign-up page access';

-- ============================================================================
-- NOTIFICATIONS TABLE
-- Log of all notifications sent to instructors
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES faculty(id),
  scheduled_program_id UUID REFERENCES faculty_scheduler.scheduled_programs(id),

  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'tier_release',       -- New programs available at your tier
    'reminder',           -- Reminder: programs still available
    'claim_confirmation', -- You claimed a block
    'claim_cancelled',    -- Your claim was cancelled
    'program_update'      -- Program details changed
  )),

  tier INTEGER,           -- Which tier triggered this (0, 1, 2)
  email_sent_at TIMESTAMPTZ,
  email_subject TEXT,
  email_to TEXT,
  email_status TEXT DEFAULT 'pending' CHECK (email_status IN (
    'pending', 'sent', 'failed', 'bounced'
  )),
  error_message TEXT,

  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_instructor ON faculty_scheduler.notifications(instructor_id);
CREATE INDEX IF NOT EXISTS idx_notifications_program ON faculty_scheduler.notifications(scheduled_program_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON faculty_scheduler.notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON faculty_scheduler.notifications(created_at DESC);

COMMENT ON TABLE faculty_scheduler.notifications IS 'Log of all email notifications sent to instructors';

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Generate or get existing magic token for instructor
CREATE OR REPLACE FUNCTION faculty_scheduler.get_or_create_magic_token(
  p_instructor_id UUID
)
RETURNS TEXT AS $$
DECLARE
  v_token TEXT;
BEGIN
  -- Check for existing token
  SELECT token INTO v_token
  FROM faculty_scheduler.magic_tokens
  WHERE instructor_id = p_instructor_id;

  IF v_token IS NOT NULL THEN
    RETURN v_token;
  END IF;

  -- Generate new token (URL-safe base64, ~32 chars)
  v_token := encode(gen_random_bytes(24), 'base64');
  v_token := replace(replace(replace(v_token, '+', '-'), '/', '_'), '=', '');

  INSERT INTO faculty_scheduler.magic_tokens (instructor_id, token)
  VALUES (p_instructor_id, v_token);

  RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Validate magic token and return instructor info
CREATE OR REPLACE FUNCTION faculty_scheduler.validate_magic_token(
  p_token TEXT
)
RETURNS TABLE (
  instructor_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  firm_state TEXT,
  tier_designation INTEGER
) AS $$
BEGIN
  -- Update usage stats
  UPDATE faculty_scheduler.magic_tokens
  SET last_used_at = NOW(), use_count = use_count + 1
  WHERE token = p_token;

  -- Return instructor info
  RETURN QUERY
  SELECT f.id, f.first_name, f.last_name, f.email, f.firm_state, f.tier_designation
  FROM faculty_scheduler.magic_tokens mt
  JOIN faculty f ON f.id = mt.instructor_id
  WHERE mt.token = p_token
    AND f.faculty_status = 'active';
END;
$$ LANGUAGE plpgsql;

-- Get instructors to notify for a program at a specific tier
CREATE OR REPLACE FUNCTION faculty_scheduler.get_instructors_to_notify(
  p_scheduled_program_id UUID,
  p_tier INTEGER
)
RETURNS TABLE (
  instructor_id UUID,
  email TEXT,
  first_name TEXT,
  last_name TEXT,
  magic_token TEXT
) AS $$
DECLARE
  v_program RECORD;
BEGIN
  -- Get program details
  SELECT * INTO v_program
  FROM faculty_scheduler.scheduled_programs
  WHERE id = p_scheduled_program_id;

  IF v_program IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.email,
    f.first_name,
    f.last_name,
    faculty_scheduler.get_or_create_magic_token(f.id) as magic_token
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  WHERE iq.program_id = v_program.program_id
    AND f.faculty_status = 'active'
    AND f.email IS NOT NULL
    AND (f.available_for_teaching = true OR f.available_for_teaching IS NULL)
    -- Tier eligibility
    AND (
      (p_tier = 0 AND f.tier_designation = 0)
      OR (p_tier = 1 AND (f.tier_designation = 0 OR f.firm_state = v_program.state))
      OR (p_tier = 2)
    )
    -- Not already notified for this program at this tier
    AND NOT EXISTS (
      SELECT 1 FROM faculty_scheduler.notifications n
      WHERE n.instructor_id = f.id
        AND n.scheduled_program_id = p_scheduled_program_id
        AND n.tier = p_tier
        AND n.notification_type = 'tier_release'
        AND n.email_status = 'sent'
    );
END;
$$ LANGUAGE plpgsql;

-- Get programs that just advanced tier (for notification trigger)
CREATE OR REPLACE FUNCTION faculty_scheduler.get_recently_advanced_programs(
  p_minutes INTEGER DEFAULT 5
)
RETURNS TABLE (
  program_id UUID,
  program_name TEXT,
  city TEXT,
  state TEXT,
  venue TEXT,
  start_date DATE,
  current_tier INTEGER,
  tier_ends_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    sp.id,
    sp.name,
    sp.city,
    sp.state,
    sp.venue,
    sp.start_date,
    CASE sp.status
      WHEN 'tier_0' THEN 0
      WHEN 'tier_1' THEN 1
      WHEN 'tier_2' THEN 2
    END::INTEGER as current_tier,
    CASE sp.status
      WHEN 'tier_0' THEN sp.tier_0_ends_at
      WHEN 'tier_1' THEN sp.tier_1_ends_at
      ELSE NULL
    END as tier_ends_at
  FROM faculty_scheduler.scheduled_programs sp
  WHERE sp.updated_at >= NOW() - (p_minutes || ' minutes')::INTERVAL
    AND sp.status IN ('tier_0', 'tier_1', 'tier_2');
END;
$$ LANGUAGE plpgsql;

-- Log a notification
CREATE OR REPLACE FUNCTION faculty_scheduler.log_notification(
  p_instructor_id UUID,
  p_program_id UUID,
  p_type TEXT,
  p_tier INTEGER,
  p_email_to TEXT,
  p_subject TEXT,
  p_status TEXT DEFAULT 'sent',
  p_error TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO faculty_scheduler.notifications (
    instructor_id,
    scheduled_program_id,
    notification_type,
    tier,
    email_to,
    email_subject,
    email_sent_at,
    email_status,
    error_message,
    metadata
  ) VALUES (
    p_instructor_id,
    p_program_id,
    p_type,
    p_tier,
    p_email_to,
    p_subject,
    CASE WHEN p_status = 'sent' THEN NOW() ELSE NULL END,
    p_status,
    p_error,
    p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Notification history
CREATE OR REPLACE VIEW faculty_scheduler.notification_history AS
SELECT
  n.id,
  n.created_at,
  n.notification_type,
  n.tier,
  n.email_status,
  n.email_subject,
  f.full_name as instructor_name,
  f.email as instructor_email,
  sp.name as program_name,
  sp.city,
  sp.state,
  sp.start_date
FROM faculty_scheduler.notifications n
JOIN faculty f ON f.id = n.instructor_id
LEFT JOIN faculty_scheduler.scheduled_programs sp ON sp.id = n.scheduled_program_id
ORDER BY n.created_at DESC;

-- View: Pending notifications summary
CREATE OR REPLACE VIEW faculty_scheduler.notification_summary AS
SELECT
  notification_type,
  email_status,
  COUNT(*) as count,
  MAX(created_at) as last_sent
FROM faculty_scheduler.notifications
GROUP BY notification_type, email_status
ORDER BY notification_type, email_status;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON FUNCTION faculty_scheduler.get_or_create_magic_token IS 'Gets existing or creates new magic link token for an instructor';
COMMENT ON FUNCTION faculty_scheduler.validate_magic_token IS 'Validates a magic token and returns instructor info, updates usage stats';
COMMENT ON FUNCTION faculty_scheduler.get_instructors_to_notify IS 'Gets instructors eligible for notification at a specific tier who haven''t been notified yet';
COMMENT ON FUNCTION faculty_scheduler.get_recently_advanced_programs IS 'Gets programs that advanced tier in the last N minutes (for notification trigger)';
COMMENT ON FUNCTION faculty_scheduler.log_notification IS 'Logs a notification to the database';
