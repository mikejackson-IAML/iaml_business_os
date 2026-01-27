-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 8 - Dashboard Alerts
-- ============================================================================
-- Adds alert system for programs at risk and unresponsive VIP instructors:
-- - alerts table with status tracking
-- - refresh_alerts() function for alert generation
-- - active_alerts view for dashboard queries
-- - Configuration in n8n_brain.preferences
--
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- ALERTS TABLE
-- Tracks tier_ending and vip_non_response alerts with status management
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Alert classification
  alert_type TEXT NOT NULL CHECK (alert_type IN ('tier_ending', 'vip_non_response')),
  severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),

  -- References
  scheduled_program_id UUID REFERENCES faculty_scheduler.scheduled_programs(id) ON DELETE CASCADE,
  instructor_id UUID REFERENCES faculty(id) ON DELETE CASCADE,  -- For VIP alerts, nullable
  notification_id UUID REFERENCES faculty_scheduler.notifications(id),  -- For VIP alerts, nullable

  -- Display (denormalized for performance)
  title TEXT NOT NULL,
  description TEXT,

  -- Status tracking
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'dismissed', 'resolved')),
  triggered_at TIMESTAMPTZ DEFAULT NOW(),
  dismissed_at TIMESTAMPTZ,
  dismissed_by TEXT,
  resolved_at TIMESTAMPTZ
);

-- Unique constraint to prevent duplicate alerts per program/instructor combo
-- Uses COALESCE to handle NULL instructor_id for tier_ending alerts
CREATE UNIQUE INDEX IF NOT EXISTS idx_alerts_unique_combo
ON faculty_scheduler.alerts(alert_type, scheduled_program_id, COALESCE(instructor_id, '00000000-0000-0000-0000-000000000000'))
WHERE status = 'active';

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_alerts_status ON faculty_scheduler.alerts(status);
CREATE INDEX IF NOT EXISTS idx_alerts_program ON faculty_scheduler.alerts(scheduled_program_id);
CREATE INDEX IF NOT EXISTS idx_alerts_type_status ON faculty_scheduler.alerts(alert_type, status);

-- ============================================================================
-- HELPER FUNCTION: Get Alert Threshold
-- Reads from n8n_brain.preferences with sensible defaults
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.get_alert_threshold(p_key TEXT)
RETURNS INTEGER AS $$
  SELECT COALESCE(
    (SELECT (value)::INTEGER FROM n8n_brain.preferences
     WHERE category = 'faculty_scheduler' AND key = p_key),
    CASE p_key
      WHEN 'tier_ending_alert_hours' THEN 24
      WHEN 'vip_non_response_days' THEN 3
      ELSE 24
    END
  );
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- FUNCTION: Refresh Alerts
-- Creates new alerts and auto-resolves alerts when conditions change
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.refresh_alerts()
RETURNS TABLE (
  created_count INTEGER,
  resolved_count INTEGER,
  active_count INTEGER
) AS $$
DECLARE
  v_created INTEGER := 0;
  v_resolved INTEGER := 0;
  v_active INTEGER;
  v_tier_ending_hours INTEGER;
  v_vip_non_response_days INTEGER;
BEGIN
  -- Get configurable thresholds
  v_tier_ending_hours := faculty_scheduler.get_alert_threshold('tier_ending_alert_hours');
  v_vip_non_response_days := faculty_scheduler.get_alert_threshold('vip_non_response_days');

  -- =========================================================================
  -- TIER ENDING ALERTS (Critical)
  -- Programs with open blocks where current tier ends within threshold
  -- =========================================================================

  -- Insert new tier_ending alerts
  WITH programs_at_risk AS (
    SELECT
      sp.id as scheduled_program_id,
      sp.name as program_name,
      sp.status as tier_status,
      CASE sp.status
        WHEN 'tier_0' THEN sp.tier_0_ends_at
        WHEN 'tier_1' THEN sp.tier_1_ends_at
        ELSE NULL
      END as tier_ends_at,
      CASE sp.status
        WHEN 'tier_0' THEN 'Tier 0'
        WHEN 'tier_1' THEN 'Tier 1'
        ELSE NULL
      END as tier_name,
      COUNT(pb.id) FILTER (WHERE pb.status = 'open') as open_blocks,
      COUNT(DISTINCT n.instructor_id) as instructors_notified
    FROM faculty_scheduler.scheduled_programs sp
    LEFT JOIN faculty_scheduler.program_blocks pb ON pb.scheduled_program_id = sp.id
    LEFT JOIN faculty_scheduler.notifications n ON n.scheduled_program_id = sp.id
      AND n.notification_type = 'tier_release'
      AND n.email_status = 'sent'
    WHERE sp.status IN ('tier_0', 'tier_1')
    GROUP BY sp.id, sp.name, sp.status
    HAVING COUNT(pb.id) FILTER (WHERE pb.status = 'open') > 0
  )
  INSERT INTO faculty_scheduler.alerts (
    alert_type,
    severity,
    scheduled_program_id,
    title,
    description,
    status,
    triggered_at
  )
  SELECT
    'tier_ending',
    'critical',
    par.scheduled_program_id,
    par.program_name || ' - ' || par.tier_name || ' ends in ' ||
      GREATEST(1, CEIL(EXTRACT(EPOCH FROM (par.tier_ends_at - NOW())) / 3600))::INTEGER || ' hours',
    par.open_blocks || ' open blocks, ' || par.instructors_notified || ' instructors notified',
    'active',
    NOW()
  FROM programs_at_risk par
  WHERE par.tier_ends_at IS NOT NULL
    AND par.tier_ends_at <= NOW() + (v_tier_ending_hours || ' hours')::INTERVAL
    AND par.tier_ends_at > NOW()  -- Don't alert for already-passed tiers
    -- Don't create if active alert already exists
    AND NOT EXISTS (
      SELECT 1 FROM faculty_scheduler.alerts a
      WHERE a.scheduled_program_id = par.scheduled_program_id
        AND a.alert_type = 'tier_ending'
        AND a.status = 'active'
    );

  GET DIAGNOSTICS v_created = ROW_COUNT;

  -- =========================================================================
  -- VIP NON-RESPONSE ALERTS (Warning)
  -- VIP instructors who haven't viewed notification after N days
  -- =========================================================================

  -- Insert new vip_non_response alerts
  WITH vip_non_responders AS (
    SELECT
      n.id as notification_id,
      n.instructor_id,
      n.scheduled_program_id,
      f.full_name as instructor_name,
      sp.name as program_name,
      n.created_at as notified_at
    FROM faculty_scheduler.notifications n
    JOIN faculty f ON f.id = n.instructor_id
    JOIN faculty_scheduler.scheduled_programs sp ON sp.id = n.scheduled_program_id
    WHERE n.notification_type = 'tier_release'
      AND n.email_status = 'sent'
      AND n.viewed_at IS NULL  -- Not yet viewed
      AND f.tier_designation = 0  -- VIP only
      AND sp.status IN ('tier_0', 'tier_1', 'tier_2')  -- Still recruiting
      AND n.created_at <= NOW() - (v_vip_non_response_days || ' days')::INTERVAL
      -- No active claim for this instructor on this program
      AND NOT EXISTS (
        SELECT 1
        FROM faculty_scheduler.claims c
        JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
        WHERE c.instructor_id = n.instructor_id
          AND pb.scheduled_program_id = n.scheduled_program_id
          AND c.status IN ('confirmed', 'completed')
      )
  )
  INSERT INTO faculty_scheduler.alerts (
    alert_type,
    severity,
    scheduled_program_id,
    instructor_id,
    notification_id,
    title,
    description,
    status,
    triggered_at
  )
  SELECT
    'vip_non_response',
    'warning',
    vnr.scheduled_program_id,
    vnr.instructor_id,
    vnr.notification_id,
    vnr.instructor_name || ' hasn''t viewed ' || vnr.program_name,
    'VIP instructor notified ' || CEIL(EXTRACT(EPOCH FROM (NOW() - vnr.notified_at)) / 86400)::INTEGER || ' days ago',
    'active',
    NOW()
  FROM vip_non_responders vnr
  -- Don't create if active alert already exists
  WHERE NOT EXISTS (
    SELECT 1 FROM faculty_scheduler.alerts a
    WHERE a.scheduled_program_id = vnr.scheduled_program_id
      AND a.instructor_id = vnr.instructor_id
      AND a.alert_type = 'vip_non_response'
      AND a.status = 'active'
  );

  v_created := v_created + (SELECT COUNT(*) FROM faculty_scheduler.alerts WHERE triggered_at >= NOW() - INTERVAL '1 second' AND alert_type = 'vip_non_response');

  -- =========================================================================
  -- AUTO-RESOLVE TIER_ENDING ALERTS
  -- Resolve when all blocks claimed OR tier has advanced
  -- =========================================================================
  UPDATE faculty_scheduler.alerts a
  SET
    status = 'resolved',
    resolved_at = NOW()
  WHERE a.alert_type = 'tier_ending'
    AND a.status = 'active'
    AND (
      -- All blocks are now claimed
      NOT EXISTS (
        SELECT 1 FROM faculty_scheduler.program_blocks pb
        WHERE pb.scheduled_program_id = a.scheduled_program_id
          AND pb.status = 'open'
      )
      -- OR tier has advanced (program status changed)
      OR NOT EXISTS (
        SELECT 1 FROM faculty_scheduler.scheduled_programs sp
        WHERE sp.id = a.scheduled_program_id
          AND sp.status IN ('tier_0', 'tier_1')
      )
    );

  GET DIAGNOSTICS v_resolved = ROW_COUNT;

  -- =========================================================================
  -- AUTO-RESOLVE VIP_NON_RESPONSE ALERTS
  -- Resolve when instructor views (viewed_at set) or claims a block
  -- =========================================================================
  UPDATE faculty_scheduler.alerts a
  SET
    status = 'resolved',
    resolved_at = NOW()
  WHERE a.alert_type = 'vip_non_response'
    AND a.status = 'active'
    AND (
      -- Instructor has now viewed the notification
      EXISTS (
        SELECT 1 FROM faculty_scheduler.notifications n
        WHERE n.id = a.notification_id
          AND n.viewed_at IS NOT NULL
      )
      -- OR instructor has claimed a block for this program
      OR EXISTS (
        SELECT 1
        FROM faculty_scheduler.claims c
        JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
        WHERE c.instructor_id = a.instructor_id
          AND pb.scheduled_program_id = a.scheduled_program_id
          AND c.status IN ('confirmed', 'completed')
      )
      -- OR program is no longer recruiting
      OR NOT EXISTS (
        SELECT 1 FROM faculty_scheduler.scheduled_programs sp
        WHERE sp.id = a.scheduled_program_id
          AND sp.status IN ('tier_0', 'tier_1', 'tier_2')
      )
    );

  v_resolved := v_resolved + (SELECT COUNT(*) FROM faculty_scheduler.alerts WHERE resolved_at >= NOW() - INTERVAL '1 second' AND alert_type = 'vip_non_response');

  -- Get active count
  SELECT COUNT(*) INTO v_active
  FROM faculty_scheduler.alerts
  WHERE status = 'active';

  RETURN QUERY SELECT v_created, v_resolved, v_active;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Active Alerts
-- Dashboard view for active, non-dismissed alerts
-- ============================================================================
CREATE OR REPLACE VIEW faculty_scheduler.active_alerts AS
SELECT
  id,
  alert_type,
  scheduled_program_id,
  instructor_id,
  severity,
  title,
  description,
  triggered_at
FROM faculty_scheduler.alerts
WHERE status = 'active'
ORDER BY
  severity = 'critical' DESC,
  triggered_at DESC;

-- ============================================================================
-- FUNCTION: Dismiss Alert
-- Marks an alert as dismissed by user action
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.dismiss_alert(
  p_alert_id UUID,
  p_dismissed_by TEXT DEFAULT 'dashboard'
)
RETURNS VOID AS $$
BEGIN
  UPDATE faculty_scheduler.alerts
  SET
    status = 'dismissed',
    dismissed_at = NOW(),
    dismissed_by = p_dismissed_by
  WHERE id = p_alert_id
    AND status = 'active';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- CONFIGURATION: Default Threshold Values
-- ============================================================================
INSERT INTO n8n_brain.preferences (category, key, value)
VALUES
  ('faculty_scheduler', 'tier_ending_alert_hours', '24'),
  ('faculty_scheduler', 'vip_non_response_days', '3')
ON CONFLICT (category, key) DO NOTHING;

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE faculty_scheduler.alerts IS
  'Tracks dashboard alerts for programs at risk (tier_ending) and unresponsive VIP instructors (vip_non_response)';

COMMENT ON FUNCTION faculty_scheduler.get_alert_threshold IS
  'Reads alert threshold configuration from n8n_brain.preferences with sensible defaults';

COMMENT ON FUNCTION faculty_scheduler.refresh_alerts IS
  'Creates new alerts and auto-resolves alerts when conditions change. Returns created/resolved/active counts.';

COMMENT ON VIEW faculty_scheduler.active_alerts IS
  'Dashboard view showing only active, non-dismissed alerts sorted by severity (critical first)';

COMMENT ON FUNCTION faculty_scheduler.dismiss_alert IS
  'Marks an alert as dismissed by user action. Records who dismissed it and when.';
