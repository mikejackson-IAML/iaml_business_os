-- Alert Integration: Deduplication Functions
-- Migration: Check for duplicates and handle priority escalation
-- Date: 2026-01-24

-- ============================================
-- FUNCTION: Check Alert Dedupe
-- Returns existing task if duplicate, with escalation recommendation
-- ============================================
CREATE OR REPLACE FUNCTION action_center.check_alert_dedupe(
  p_alert_type TEXT,
  p_affected_resource TEXT,
  p_new_severity TEXT  -- 'critical', 'warning', 'info'
)
RETURNS TABLE (
  is_duplicate BOOLEAN,
  existing_task_id UUID,
  existing_priority TEXT,
  should_escalate BOOLEAN,
  new_priority TEXT,
  reason TEXT
) AS $$
DECLARE
  v_dedupe_key TEXT;
  v_existing_task RECORD;
  v_config RECORD;
  v_priority_rank RECORD;
  v_new_priority_rank INTEGER;
  v_existing_priority_rank INTEGER;
BEGIN
  -- Build dedupe key
  v_dedupe_key := p_alert_type || ':' || p_affected_resource;

  -- Get config for cooldowns
  SELECT * INTO v_config
  FROM action_center.alert_config
  WHERE alert_type = p_alert_type;

  -- Priority ranking (lower number = higher priority)
  v_new_priority_rank := CASE p_new_severity
    WHEN 'critical' THEN 1
    WHEN 'warning' THEN 2
    WHEN 'info' THEN 4
    ELSE 3
  END;

  -- Check for open/in_progress task
  SELECT * INTO v_existing_task
  FROM action_center.tasks
  WHERE dedupe_key = v_dedupe_key
    AND status IN ('open', 'in_progress', 'waiting')
  LIMIT 1;

  IF v_existing_task.id IS NOT NULL THEN
    -- Found open task - check if we should escalate priority
    v_existing_priority_rank := CASE v_existing_task.priority
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'normal' THEN 3
      WHEN 'low' THEN 4
      ELSE 3
    END;

    RETURN QUERY SELECT
      TRUE AS is_duplicate,
      v_existing_task.id AS existing_task_id,
      v_existing_task.priority AS existing_priority,
      (v_new_priority_rank < v_existing_priority_rank) AS should_escalate,
      CASE WHEN v_new_priority_rank < v_existing_priority_rank THEN
        CASE p_new_severity
          WHEN 'critical' THEN 'critical'
          WHEN 'warning' THEN 'high'
          ELSE v_existing_task.priority
        END
      ELSE v_existing_task.priority
      END AS new_priority,
      'Existing open task found' AS reason;
    RETURN;
  END IF;

  -- Check for recently completed task (cooldown period)
  SELECT * INTO v_existing_task
  FROM action_center.tasks
  WHERE dedupe_key = v_dedupe_key
    AND status = 'done'
    AND completed_at > NOW() - (COALESCE(v_config.cooldown_after_completion_hours, 24) || ' hours')::INTERVAL
  ORDER BY completed_at DESC
  LIMIT 1;

  IF v_existing_task.id IS NOT NULL THEN
    RETURN QUERY SELECT
      TRUE AS is_duplicate,
      v_existing_task.id AS existing_task_id,
      v_existing_task.priority AS existing_priority,
      FALSE AS should_escalate,
      NULL::TEXT AS new_priority,
      'Recently completed task in cooldown period' AS reason;
    RETURN;
  END IF;

  -- Check for recently dismissed task
  SELECT * INTO v_existing_task
  FROM action_center.tasks
  WHERE dedupe_key = v_dedupe_key
    AND status = 'dismissed'
    AND dismissed_at > NOW() - (COALESCE(v_config.dismissed_cooldown_days, 7) || ' days')::INTERVAL
  ORDER BY dismissed_at DESC
  LIMIT 1;

  IF v_existing_task.id IS NOT NULL THEN
    RETURN QUERY SELECT
      TRUE AS is_duplicate,
      v_existing_task.id AS existing_task_id,
      v_existing_task.priority AS existing_priority,
      FALSE AS should_escalate,
      NULL::TEXT AS new_priority,
      'Recently dismissed task - respecting dismissal window' AS reason;
    RETURN;
  END IF;

  -- No duplicate found
  RETURN QUERY SELECT
    FALSE AS is_duplicate,
    NULL::UUID AS existing_task_id,
    NULL::TEXT AS existing_priority,
    FALSE AS should_escalate,
    NULL::TEXT AS new_priority,
    'No existing task found' AS reason;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCTION: Escalate Task Priority
-- Updates task priority and logs activity
-- ============================================
CREATE OR REPLACE FUNCTION action_center.escalate_task_priority(
  p_task_id UUID,
  p_new_priority TEXT,
  p_reason TEXT DEFAULT 'Escalated due to higher severity alert'
)
RETURNS VOID AS $$
DECLARE
  v_old_priority TEXT;
BEGIN
  -- Get current priority
  SELECT priority INTO v_old_priority
  FROM action_center.tasks
  WHERE id = p_task_id;

  -- Update priority
  UPDATE action_center.tasks
  SET
    priority = p_new_priority,
    updated_at = NOW()
  WHERE id = p_task_id;

  -- Log activity
  INSERT INTO action_center.task_activity (
    task_id,
    activity_type,
    actor_type,
    old_value,
    new_value,
    metadata
  ) VALUES (
    p_task_id,
    'priority_changed',
    'system',
    v_old_priority,
    p_new_priority,
    jsonb_build_object('reason', p_reason, 'source', 'alert_escalation')
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- FUNCTION: Build Dedupe Key
-- Standardizes dedupe key format
-- ============================================
CREATE OR REPLACE FUNCTION action_center.build_alert_dedupe_key(
  p_alert_type TEXT,
  p_affected_resource TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN p_alert_type || ':' || p_affected_resource;
END;
$$ LANGUAGE sql IMMUTABLE;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION action_center.check_alert_dedupe IS
  'Checks for existing tasks with same dedupe key. Returns escalation recommendation if duplicate with lower priority found.';
COMMENT ON FUNCTION action_center.escalate_task_priority IS
  'Updates task priority and logs activity when alert escalates existing task.';
COMMENT ON FUNCTION action_center.build_alert_dedupe_key IS
  'Builds standardized dedupe key in format: alert_type:affected_resource';
