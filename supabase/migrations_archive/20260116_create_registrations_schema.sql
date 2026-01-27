-- Registrations Schema for Programs Dashboard
-- Migration: Create tables for registration tracking (synced from Airtable)
-- Date: 2026-01-16

-- ============================================
-- REGISTRATIONS TABLE
-- Individual participant registrations
-- ============================================
CREATE TABLE registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  airtable_id TEXT UNIQUE,                    -- Link to Airtable record

  -- Program linkage
  program_instance_id UUID REFERENCES program_instances(id),
  program_instance_airtable_id TEXT,          -- Airtable ID for lookup during sync

  -- Contact info
  contact_airtable_id TEXT,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  job_title TEXT,

  -- Company info
  company_airtable_id TEXT,
  company_name TEXT,

  -- Registration details
  registration_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  registration_source TEXT,                   -- 'Website', 'Phone', 'Email', etc.
  registration_status TEXT DEFAULT 'Confirmed',  -- 'Confirmed', 'Cancelled', 'Transferred'
  registration_code TEXT,                     -- Unique registration code

  -- Payment
  list_price DECIMAL(10,2),
  discount_amount DECIMAL(10,2) DEFAULT 0,
  final_price DECIMAL(10,2),
  payment_status TEXT DEFAULT 'Pending',      -- 'Pending', 'Paid', 'Refunded'
  payment_method TEXT,                        -- 'Credit Card', 'Invoice', 'Check'
  stripe_payment_intent TEXT,
  stripe_invoice_id TEXT,

  -- Block attendance (for partial program registration)
  attendance_type TEXT DEFAULT 'Full',        -- 'Full' or 'Partial'
  selected_blocks TEXT[],                     -- Array of block names

  -- UTM tracking
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast lookups
CREATE INDEX idx_registrations_program ON registrations(program_instance_id);
CREATE INDEX idx_registrations_airtable ON registrations(airtable_id);
CREATE INDEX idx_registrations_email ON registrations(email);
CREATE INDEX idx_registrations_payment_status ON registrations(payment_status);
CREATE INDEX idx_registrations_date ON registrations(registration_date DESC);
CREATE INDEX idx_registrations_instance_airtable ON registrations(program_instance_airtable_id);

-- ============================================
-- VIEW: Registration Dashboard Summary
-- Flattened view joining registrations with program info
-- ============================================
CREATE OR REPLACE VIEW registration_dashboard_summary AS
SELECT
  r.id,
  r.airtable_id,
  r.first_name,
  r.last_name,
  r.first_name || ' ' || r.last_name as full_name,
  r.email,
  r.phone,
  r.company_name,
  r.job_title,
  r.registration_date,
  r.registration_status,
  r.registration_code,
  r.payment_status,
  r.payment_method,
  r.final_price,
  r.attendance_type,
  r.selected_blocks,
  pi.id as program_instance_id,
  pi.instance_name,
  pi.program_name,
  pi.format,
  pi.start_date,
  pi.end_date,
  pi.city,
  pi.state
FROM registrations r
LEFT JOIN program_instances pi ON pi.id = r.program_instance_id
ORDER BY r.registration_date DESC;

-- ============================================
-- VIEW: Registrations by Program
-- Aggregated stats per program instance
-- ============================================
CREATE OR REPLACE VIEW registrations_by_program AS
SELECT
  pi.id as program_instance_id,
  pi.airtable_id as program_airtable_id,
  pi.instance_name,
  pi.program_name,
  pi.format,
  pi.start_date,
  pi.city,
  pi.state,
  pi.current_enrolled,
  pi.min_capacity,
  pi.max_capacity,
  COUNT(r.id) as registration_count,
  COUNT(r.id) FILTER (WHERE r.registration_status = 'Confirmed') as confirmed_count,
  COUNT(r.id) FILTER (WHERE r.payment_status = 'Paid') as paid_count,
  COUNT(r.id) FILTER (WHERE r.payment_status = 'Pending') as pending_count,
  COUNT(r.id) FILTER (WHERE r.attendance_type = 'Partial') as partial_count,
  COALESCE(SUM(r.final_price) FILTER (WHERE r.payment_status = 'Paid'), 0) as revenue_collected,
  COALESCE(SUM(r.final_price) FILTER (WHERE r.payment_status = 'Pending'), 0) as revenue_pending
FROM program_instances pi
LEFT JOIN registrations r ON r.program_instance_id = pi.id
WHERE pi.status != 'cancelled'
GROUP BY pi.id, pi.airtable_id, pi.instance_name, pi.program_name, pi.format,
         pi.start_date, pi.city, pi.state, pi.current_enrolled, pi.min_capacity, pi.max_capacity
ORDER BY pi.start_date;

-- ============================================
-- FUNCTION: Update program enrollment count
-- Automatically updates current_enrolled on program_instances
-- ============================================
CREATE OR REPLACE FUNCTION update_program_enrollment()
RETURNS TRIGGER AS $$
BEGIN
  -- Update enrollment count on program_instances
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    UPDATE program_instances
    SET
      current_enrolled = (
        SELECT COUNT(*)
        FROM registrations
        WHERE program_instance_id = NEW.program_instance_id
          AND registration_status = 'Confirmed'
      ),
      updated_at = NOW()
    WHERE id = NEW.program_instance_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE program_instances
    SET
      current_enrolled = (
        SELECT COUNT(*)
        FROM registrations
        WHERE program_instance_id = OLD.program_instance_id
          AND registration_status = 'Confirmed'
      ),
      updated_at = NOW()
    WHERE id = OLD.program_instance_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update enrollment counts
CREATE TRIGGER registrations_enrollment_update
  AFTER INSERT OR UPDATE OR DELETE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_program_enrollment();

-- ============================================
-- FUNCTION: Auto-update timestamps
-- ============================================
CREATE OR REPLACE FUNCTION update_registration_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER registrations_updated_at
  BEFORE UPDATE ON registrations
  FOR EACH ROW EXECUTE FUNCTION update_registration_timestamp();

-- ============================================
-- FUNCTION: Link registration to program instance by airtable_id
-- Called during sync to establish FK relationship
-- ============================================
CREATE OR REPLACE FUNCTION link_registration_to_program(
  p_registration_id UUID,
  p_program_airtable_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_program_id UUID;
BEGIN
  -- Find program instance by airtable_id
  SELECT id INTO v_program_id
  FROM program_instances
  WHERE airtable_id = p_program_airtable_id;

  IF v_program_id IS NOT NULL THEN
    UPDATE registrations
    SET program_instance_id = v_program_id
    WHERE id = p_registration_id;
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE registrations IS 'Individual participant registrations, synced from Airtable';
COMMENT ON VIEW registration_dashboard_summary IS 'Flattened view for dashboard registration table';
COMMENT ON VIEW registrations_by_program IS 'Aggregated registration stats per program instance';
COMMENT ON FUNCTION update_program_enrollment() IS 'Auto-updates program_instances.current_enrolled when registrations change';
COMMENT ON FUNCTION link_registration_to_program(UUID, TEXT) IS 'Links registration to program_instance using Airtable IDs';
