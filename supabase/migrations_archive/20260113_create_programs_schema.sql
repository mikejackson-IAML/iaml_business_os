-- Programs & Operations Schema
-- Migration: Create tables for program tracking, readiness checklist, and operational data
-- Date: 2026-01-13

-- ============================================
-- PROGRAM INSTANCES TABLE
-- Core program instance tracking (synced from Airtable)
-- ============================================
CREATE TABLE program_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id TEXT UNIQUE,              -- Link to Airtable record
  instance_name TEXT NOT NULL,
  program_name TEXT NOT NULL,
  format TEXT,                          -- 'in-person', 'virtual', 'on-demand'
  start_date DATE,
  end_date DATE,
  city TEXT,
  state TEXT,
  venue_name TEXT,
  current_enrolled INTEGER DEFAULT 0,
  min_capacity INTEGER DEFAULT 15,
  max_capacity INTEGER DEFAULT 35,
  status TEXT DEFAULT 'scheduled',      -- 'scheduled', 'confirmed', 'cancelled', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_program_instances_start_date ON program_instances(start_date);
CREATE INDEX idx_program_instances_status ON program_instances(status);
CREATE INDEX idx_program_instances_airtable ON program_instances(airtable_id);

-- ============================================
-- PROGRAM READINESS TABLE
-- 10-point readiness checklist
-- ============================================
CREATE TABLE program_readiness (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_instance_id UUID REFERENCES program_instances(id) ON DELETE CASCADE,

  -- Checklist items (date = confirmed, null = pending)
  faculty_confirmed_at TIMESTAMPTZ,
  faculty_brief_sent_at TIMESTAMPTZ,
  venue_confirmed_at TIMESTAMPTZ,
  materials_ordered_at TIMESTAMPTZ,
  materials_received_at TIMESTAMPTZ,
  shrm_approved_at TIMESTAMPTZ,
  av_ordered_at TIMESTAMPTZ,
  catering_confirmed_at TIMESTAMPTZ,
  room_block_active_at TIMESTAMPTZ,
  registration_page_live_at TIMESTAMPTZ,

  notes TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(program_instance_id)
);

-- Index for quick lookups
CREATE INDEX idx_program_readiness_instance ON program_readiness(program_instance_id);

-- ============================================
-- ROOM BLOCKS TABLE
-- Hotel room block tracking
-- ============================================
CREATE TABLE room_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_instance_id UUID REFERENCES program_instances(id) ON DELETE CASCADE,
  hotel_name TEXT,
  block_size INTEGER,
  rooms_booked INTEGER DEFAULT 0,
  rate_per_night DECIMAL(10,2),
  cutoff_date DATE,
  attrition_date DATE,
  booking_link TEXT,
  status TEXT DEFAULT 'active',         -- 'active', 'released', 'expired'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_room_blocks_instance ON room_blocks(program_instance_id);
CREATE INDEX idx_room_blocks_cutoff ON room_blocks(cutoff_date);

-- ============================================
-- FACULTY ASSIGNMENTS TABLE
-- Track faculty assignments per program
-- ============================================
CREATE TABLE faculty_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_instance_id UUID REFERENCES program_instances(id) ON DELETE CASCADE,
  faculty_name TEXT NOT NULL,
  block_number INTEGER,                 -- 1, 2, 3 for multi-block programs
  confirmed BOOLEAN DEFAULT FALSE,
  confirmed_at TIMESTAMPTZ,
  brief_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index
CREATE INDEX idx_faculty_assignments_instance ON faculty_assignments(program_instance_id);
CREATE INDEX idx_faculty_assignments_confirmed ON faculty_assignments(confirmed);

-- ============================================
-- PROGRAM ACTIVITY TABLE
-- Activity log for programs
-- ============================================
CREATE TABLE program_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_instance_id UUID REFERENCES program_instances(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,          -- 'registration', 'faculty_confirmed', 'materials_shipped', etc.
  description TEXT,
  metadata JSONB DEFAULT '{}',
  activity_at TIMESTAMPTZ DEFAULT NOW()
);

-- Constraint on activity_type
ALTER TABLE program_activity ADD CONSTRAINT program_activity_type_check
CHECK (activity_type IN (
  'registration', 'cancellation', 'transfer',
  'faculty_confirmed', 'faculty_brief_sent', 'faculty_changed',
  'venue_confirmed', 'venue_changed',
  'materials_ordered', 'materials_shipped', 'materials_received',
  'shrm_submitted', 'shrm_approved', 'shrm_rejected',
  'av_ordered', 'av_received',
  'catering_confirmed', 'catering_updated',
  'room_block_created', 'room_block_updated', 'room_block_released',
  'registration_page_live', 'status_changed',
  'note_added', 'alert_generated', 'alert_resolved'
));

-- Index
CREATE INDEX idx_program_activity_instance ON program_activity(program_instance_id);
CREATE INDEX idx_program_activity_type ON program_activity(activity_type);
CREATE INDEX idx_program_activity_at ON program_activity(activity_at DESC);

-- ============================================
-- HELPER FUNCTION: Calculate Readiness Score
-- ============================================
CREATE OR REPLACE FUNCTION calculate_readiness_score(p_instance_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_score INTEGER := 0;
  v_readiness RECORD;
BEGIN
  SELECT * INTO v_readiness FROM program_readiness WHERE program_instance_id = p_instance_id;

  IF v_readiness IS NULL THEN
    RETURN 0;
  END IF;

  IF v_readiness.faculty_confirmed_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.faculty_brief_sent_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.venue_confirmed_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.materials_ordered_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.materials_received_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.shrm_approved_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.av_ordered_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.catering_confirmed_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.room_block_active_at IS NOT NULL THEN v_score := v_score + 10; END IF;
  IF v_readiness.registration_page_live_at IS NOT NULL THEN v_score := v_score + 10; END IF;

  RETURN v_score;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- VIEW: Program Dashboard Summary
-- Main view for dashboard queries
-- ============================================
CREATE OR REPLACE VIEW program_dashboard_summary AS
SELECT
  pi.id,
  pi.airtable_id,
  pi.instance_name,
  pi.program_name,
  pi.format,
  pi.start_date,
  pi.end_date,
  pi.city,
  pi.state,
  pi.venue_name,
  pi.current_enrolled,
  pi.min_capacity,
  pi.max_capacity,
  pi.status,
  ROUND((pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) * 100) as enrollment_percent,
  pi.start_date - CURRENT_DATE as days_until_start,
  calculate_readiness_score(pi.id) as readiness_score,
  pr.faculty_confirmed_at IS NOT NULL as faculty_confirmed,
  pr.faculty_brief_sent_at IS NOT NULL as faculty_brief_sent,
  pr.venue_confirmed_at IS NOT NULL as venue_confirmed,
  pr.materials_ordered_at IS NOT NULL as materials_ordered,
  pr.materials_received_at IS NOT NULL as materials_received,
  pr.shrm_approved_at IS NOT NULL as shrm_approved,
  pr.av_ordered_at IS NOT NULL as av_ordered,
  pr.catering_confirmed_at IS NOT NULL as catering_confirmed,
  pr.room_block_active_at IS NOT NULL as room_block_active,
  pr.registration_page_live_at IS NOT NULL as registration_live,
  rb.hotel_name as room_block_hotel,
  rb.rooms_booked,
  rb.block_size,
  ROUND((rb.rooms_booked::DECIMAL / NULLIF(rb.block_size, 0)) * 100) as room_block_percent,
  rb.cutoff_date as room_block_cutoff,
  rb.attrition_date as room_block_attrition
FROM program_instances pi
LEFT JOIN program_readiness pr ON pr.program_instance_id = pi.id
LEFT JOIN room_blocks rb ON rb.program_instance_id = pi.id AND rb.status = 'active'
WHERE pi.status != 'cancelled'
ORDER BY pi.start_date;

-- ============================================
-- VIEW: Readiness Breakdown Aggregates
-- Aggregate readiness stats across all programs
-- ============================================
CREATE OR REPLACE VIEW readiness_breakdown AS
SELECT
  COUNT(*) as total_programs,
  COUNT(*) FILTER (WHERE pr.faculty_confirmed_at IS NOT NULL) as faculty_confirmed_count,
  COUNT(*) FILTER (WHERE pr.faculty_brief_sent_at IS NOT NULL) as faculty_brief_count,
  COUNT(*) FILTER (WHERE pr.venue_confirmed_at IS NOT NULL) as venue_confirmed_count,
  COUNT(*) FILTER (WHERE pr.materials_ordered_at IS NOT NULL) as materials_ordered_count,
  COUNT(*) FILTER (WHERE pr.materials_received_at IS NOT NULL) as materials_received_count,
  COUNT(*) FILTER (WHERE pr.shrm_approved_at IS NOT NULL) as shrm_approved_count,
  COUNT(*) FILTER (WHERE pr.av_ordered_at IS NOT NULL) as av_ordered_count,
  COUNT(*) FILTER (WHERE pr.catering_confirmed_at IS NOT NULL) as catering_confirmed_count,
  COUNT(*) FILTER (WHERE pr.room_block_active_at IS NOT NULL) as room_block_count,
  COUNT(*) FILTER (WHERE pr.registration_page_live_at IS NOT NULL) as registration_live_count,
  COUNT(*) FILTER (WHERE calculate_readiness_score(pi.id) >= 80) as programs_ready_count
FROM program_instances pi
LEFT JOIN program_readiness pr ON pr.program_instance_id = pi.id
WHERE pi.status NOT IN ('cancelled', 'completed')
  AND pi.start_date >= CURRENT_DATE
  AND pi.start_date <= CURRENT_DATE + INTERVAL '90 days';

-- ============================================
-- VIEW: At-Risk Programs
-- Programs with low enrollment or readiness
-- ============================================
CREATE OR REPLACE VIEW at_risk_programs AS
SELECT
  pi.id,
  pi.instance_name,
  pi.program_name,
  pi.start_date,
  pi.current_enrolled,
  pi.min_capacity,
  ROUND((pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) * 100) as enrollment_percent,
  pi.start_date - CURRENT_DATE as days_until_start,
  calculate_readiness_score(pi.id) as readiness_score,
  CASE
    WHEN pi.start_date - CURRENT_DATE <= 14 AND (pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) < 0.8 THEN 'critical'
    WHEN pi.start_date - CURRENT_DATE <= 30 AND (pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) < 0.6 THEN 'warning'
    WHEN calculate_readiness_score(pi.id) < 60 AND pi.start_date - CURRENT_DATE <= 30 THEN 'warning'
    ELSE 'info'
  END as risk_level,
  CASE
    WHEN (pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) < 0.6 THEN 'Low enrollment'
    WHEN calculate_readiness_score(pi.id) < 60 THEN 'Low readiness'
    ELSE 'Monitor'
  END as risk_reason
FROM program_instances pi
WHERE pi.status NOT IN ('cancelled', 'completed')
  AND pi.start_date >= CURRENT_DATE
  AND pi.start_date <= CURRENT_DATE + INTERVAL '90 days'
  AND (
    (pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) < 0.8
    OR calculate_readiness_score(pi.id) < 80
  )
ORDER BY
  CASE
    WHEN pi.start_date - CURRENT_DATE <= 14 AND (pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) < 0.8 THEN 1
    WHEN pi.start_date - CURRENT_DATE <= 30 AND (pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) < 0.6 THEN 2
    ELSE 3
  END,
  pi.start_date;

-- ============================================
-- VIEW: Room Block Alerts
-- Room blocks approaching cutoff
-- ============================================
CREATE OR REPLACE VIEW room_block_alerts AS
SELECT
  rb.id,
  pi.instance_name,
  pi.program_name,
  pi.start_date,
  rb.hotel_name,
  rb.rooms_booked,
  rb.block_size,
  ROUND((rb.rooms_booked::DECIMAL / NULLIF(rb.block_size, 0)) * 100) as pickup_percent,
  rb.cutoff_date,
  rb.cutoff_date - CURRENT_DATE as days_to_cutoff,
  CASE
    WHEN rb.cutoff_date - CURRENT_DATE <= 3 THEN 'critical'
    WHEN rb.cutoff_date - CURRENT_DATE <= 7 THEN 'warning'
    ELSE 'info'
  END as urgency,
  CASE
    WHEN (rb.rooms_booked::DECIMAL / NULLIF(rb.block_size, 0)) < 0.4 THEN 'Consider releasing rooms'
    WHEN (rb.rooms_booked::DECIMAL / NULLIF(rb.block_size, 0)) < 0.6 THEN 'Monitor pickup'
    ELSE 'On track'
  END as recommendation
FROM room_blocks rb
JOIN program_instances pi ON pi.id = rb.program_instance_id
WHERE rb.status = 'active'
  AND rb.cutoff_date >= CURRENT_DATE
  AND rb.cutoff_date <= CURRENT_DATE + INTERVAL '30 days'
ORDER BY rb.cutoff_date;

-- ============================================
-- VIEW: Faculty Gaps
-- Programs with unconfirmed faculty
-- ============================================
CREATE OR REPLACE VIEW faculty_gaps AS
SELECT
  pi.id as program_instance_id,
  pi.instance_name,
  pi.program_name,
  pi.start_date,
  pi.start_date - CURRENT_DATE as days_until_start,
  fa.faculty_name,
  fa.block_number,
  fa.confirmed,
  CASE
    WHEN pi.start_date - CURRENT_DATE <= 14 AND NOT fa.confirmed THEN 'critical'
    WHEN pi.start_date - CURRENT_DATE <= 30 AND NOT fa.confirmed THEN 'warning'
    ELSE 'info'
  END as urgency
FROM program_instances pi
JOIN faculty_assignments fa ON fa.program_instance_id = pi.id
WHERE pi.status NOT IN ('cancelled', 'completed')
  AND pi.start_date >= CURRENT_DATE
  AND pi.start_date <= CURRENT_DATE + INTERVAL '90 days'
  AND NOT fa.confirmed
ORDER BY pi.start_date, fa.block_number;

-- ============================================
-- TRIGGERS: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER program_instances_updated_at
  BEFORE UPDATE ON program_instances
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER program_readiness_updated_at
  BEFORE UPDATE ON program_readiness
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER room_blocks_updated_at
  BEFORE UPDATE ON room_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE program_instances IS 'Core program instance data, synced from Airtable';
COMMENT ON TABLE program_readiness IS '10-point readiness checklist for each program';
COMMENT ON TABLE room_blocks IS 'Hotel room block tracking for in-person programs';
COMMENT ON TABLE faculty_assignments IS 'Faculty assignments per program block';
COMMENT ON TABLE program_activity IS 'Activity log for program operations';
COMMENT ON VIEW program_dashboard_summary IS 'Main dashboard view with readiness scores';
COMMENT ON VIEW readiness_breakdown IS 'Aggregate readiness stats for health score';
COMMENT ON VIEW at_risk_programs IS 'Programs needing attention (low enrollment/readiness)';
COMMENT ON VIEW room_block_alerts IS 'Room blocks approaching cutoff dates';
COMMENT ON VIEW faculty_gaps IS 'Programs with unconfirmed faculty assignments';
