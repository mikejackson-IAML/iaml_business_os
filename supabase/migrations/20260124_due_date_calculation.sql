-- Alert Integration: Due Date Calculation Functions
-- Migration: Business hours aware due date logic
-- Date: 2026-01-24

-- ============================================
-- FUNCTION: Calculate Alert Due Date
-- Returns due_date and due_time based on severity and current time
-- ============================================
CREATE OR REPLACE FUNCTION action_center.calculate_alert_due_date(
  p_severity TEXT,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_timezone TEXT DEFAULT 'America/Chicago'  -- CT
)
RETURNS TABLE (
  due_date DATE,
  due_time TIME,
  reasoning TEXT
) AS $$
DECLARE
  v_now TIMESTAMPTZ;
  v_local_now TIMESTAMP;
  v_local_hour INTEGER;
  v_is_weekend BOOLEAN;
  v_next_business_day DATE;
  v_due_offset_days INTEGER;
BEGIN
  -- Get current time in specified timezone
  v_now := NOW();
  v_local_now := v_now AT TIME ZONE p_timezone;
  v_local_hour := EXTRACT(HOUR FROM v_local_now);
  v_is_weekend := EXTRACT(DOW FROM v_local_now) IN (0, 6);  -- Sunday = 0, Saturday = 6

  -- Calculate next business day
  v_next_business_day := CASE
    WHEN EXTRACT(DOW FROM v_local_now) = 5 THEN (v_local_now + INTERVAL '3 days')::DATE  -- Friday → Monday
    WHEN EXTRACT(DOW FROM v_local_now) = 6 THEN (v_local_now + INTERVAL '2 days')::DATE  -- Saturday → Monday
    WHEN EXTRACT(DOW FROM v_local_now) = 0 THEN (v_local_now + INTERVAL '1 day')::DATE   -- Sunday → Monday
    ELSE (v_local_now + INTERVAL '1 day')::DATE  -- Weekday → next day
  END;

  -- Handle by severity
  CASE p_severity
    WHEN 'critical' THEN
      -- Critical: Due today if before 6pm, else next business day 9am
      IF v_local_hour < 18 AND NOT v_is_weekend THEN
        -- Before 6pm on weekday: due today
        RETURN QUERY SELECT
          v_local_now::DATE AS due_date,
          NULL::TIME AS due_time,  -- ASAP, no specific time
          'Critical alert during business hours - due today'::TEXT AS reasoning;
      ELSE
        -- After 6pm or weekend: due next business day 9am
        RETURN QUERY SELECT
          v_next_business_day AS due_date,
          '09:00'::TIME AS due_time,
          'Critical alert outside business hours - due next business day 9am'::TEXT AS reasoning;
      END IF;

    WHEN 'warning' THEN
      -- Warning: Check metadata for due_offset_days, default to end of week
      v_due_offset_days := COALESCE((p_metadata->>'due_offset_days')::INTEGER,
        -- Default: days until Friday
        CASE EXTRACT(DOW FROM v_local_now)::INTEGER
          WHEN 0 THEN 5  -- Sunday → Friday
          WHEN 1 THEN 4  -- Monday → Friday
          WHEN 2 THEN 3  -- Tuesday → Friday
          WHEN 3 THEN 2  -- Wednesday → Friday
          WHEN 4 THEN 1  -- Thursday → Friday
          WHEN 5 THEN 7  -- Friday → next Friday
          WHEN 6 THEN 6  -- Saturday → Friday
        END
      );

      RETURN QUERY SELECT
        (v_local_now + (v_due_offset_days || ' days')::INTERVAL)::DATE AS due_date,
        '17:00'::TIME AS due_time,  -- End of business day
        ('Warning alert - due in ' || v_due_offset_days || ' days')::TEXT AS reasoning;

    WHEN 'info' THEN
      -- Info: No due date by default
      RETURN QUERY SELECT
        NULL::DATE AS due_date,
        NULL::TIME AS due_time,
        'Info alert - no due date'::TEXT AS reasoning;

    ELSE
      -- Unknown severity: treat as normal priority
      RETURN QUERY SELECT
        (v_local_now + INTERVAL '3 days')::DATE AS due_date,
        '17:00'::TIME AS due_time,
        'Unknown severity - defaulting to 3 days'::TEXT AS reasoning;
  END CASE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- FUNCTION: Map Severity to Priority
-- Converts alert severity to task priority
-- ============================================
CREATE OR REPLACE FUNCTION action_center.map_severity_to_priority(
  p_severity TEXT
)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE p_severity
    WHEN 'critical' THEN 'critical'
    WHEN 'warning' THEN 'high'
    WHEN 'info' THEN 'low'
    ELSE 'normal'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION action_center.calculate_alert_due_date IS
  'Calculates due date/time based on severity. Critical: today or next business day 9am. Warning: from metadata or end of week. Info: no due date.';
COMMENT ON FUNCTION action_center.map_severity_to_priority IS
  'Maps alert severity to task priority: critical→critical, warning→high, info→low';
