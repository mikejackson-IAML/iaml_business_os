-- Add columns for hotel sourcing workflow
-- Enables hotel sourcing skill to query programs needing hotel arrangements
-- Date: 2026-02-12

-- ============================================
-- Add duration_days to program_instances
-- ============================================
-- Matches Airtable field, allows half-days (e.g., 4.5)
ALTER TABLE program_instances
ADD COLUMN IF NOT EXISTS duration_days NUMERIC(3,1);

COMMENT ON COLUMN program_instances.duration_days IS
'Program duration in days (e.g., 4.5 for 4.5-day programs). Used for meeting space calculations.';

-- Backfill duration_days from start_date/end_date where possible
UPDATE program_instances
SET duration_days = (end_date - start_date + 1)
WHERE duration_days IS NULL
  AND start_date IS NOT NULL
  AND end_date IS NOT NULL;

-- ============================================
-- Add hotel_status to program_instances
-- ============================================
-- Tracks hotel sourcing progress for in-person programs

-- Create enum type for hotel status
DO $$ BEGIN
  CREATE TYPE hotel_status_enum AS ENUM (
    'not_applicable',   -- Virtual/on-demand programs
    'not_started',      -- Haven't begun sourcing
    'sourcing',         -- Actively looking for hotels
    'proposals_received', -- Got proposals back from hotels
    'contract_pending', -- Negotiating/reviewing contract
    'confirmed'         -- Hotel confirmed and contracted
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE program_instances
ADD COLUMN IF NOT EXISTS hotel_status hotel_status_enum;

COMMENT ON COLUMN program_instances.hotel_status IS
'Hotel sourcing status. NULL means status unknown. Virtual programs should be not_applicable.';

-- Backfill hotel_status based on existing data
-- If venue_confirmed_at is set in program_readiness, mark as confirmed
-- If format is not 'in-person', mark as not_applicable
UPDATE program_instances pi
SET hotel_status = CASE
  WHEN pi.format != 'in-person' THEN 'not_applicable'::hotel_status_enum
  WHEN EXISTS (
    SELECT 1 FROM program_readiness pr
    WHERE pr.program_instance_id = pi.id
    AND pr.venue_confirmed_at IS NOT NULL
  ) THEN 'confirmed'::hotel_status_enum
  WHEN EXISTS (
    SELECT 1 FROM room_blocks rb
    WHERE rb.program_instance_id = pi.id
    AND rb.hotel_name IS NOT NULL
  ) THEN 'contract_pending'::hotel_status_enum
  ELSE 'not_started'::hotel_status_enum
END
WHERE pi.hotel_status IS NULL;

-- ============================================
-- Create view for hotel sourcing queries
-- ============================================
CREATE OR REPLACE VIEW programs_needing_hotels AS
SELECT
  pi.id,
  pi.program_name,
  pi.instance_name,
  pi.format,
  pi.start_date,
  pi.end_date,
  pi.duration_days,
  pi.city,
  pi.state,
  pi.hotel_status,
  pi.current_enrolled,
  pi.min_capacity,
  pi.start_date - CURRENT_DATE as days_until_start
FROM program_instances pi
WHERE pi.format = 'in-person'
  AND pi.hotel_status IN ('not_started', 'sourcing')
  AND pi.start_date >= CURRENT_DATE
  AND pi.status != 'cancelled'
ORDER BY pi.start_date;

COMMENT ON VIEW programs_needing_hotels IS
'In-person programs that need hotel sourcing (not_started or sourcing status, upcoming dates)';

-- ============================================
-- Create RPC for hotel sourcing email generation
-- ============================================
CREATE OR REPLACE FUNCTION get_programs_for_hotel_sourcing()
RETURNS TABLE (
  id UUID,
  program_name TEXT,
  instance_name TEXT,
  start_date DATE,
  end_date DATE,
  duration_days NUMERIC(3,1),
  city TEXT,
  state TEXT,
  hotel_status hotel_status_enum,
  days_until_start INTEGER
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT
    pi.id,
    pi.program_name,
    pi.instance_name,
    pi.start_date,
    pi.end_date,
    pi.duration_days,
    pi.city,
    pi.state,
    pi.hotel_status,
    (pi.start_date - CURRENT_DATE)::INTEGER as days_until_start
  FROM program_instances pi
  WHERE pi.format = 'in-person'
    AND pi.hotel_status IN ('not_started', 'sourcing')
    AND pi.start_date >= CURRENT_DATE
    AND pi.status != 'cancelled'
  ORDER BY pi.start_date;
$$;

COMMENT ON FUNCTION get_programs_for_hotel_sourcing() IS
'Returns upcoming in-person programs that need hotel sourcing for email generation';

-- Grant access
GRANT EXECUTE ON FUNCTION get_programs_for_hotel_sourcing() TO anon, authenticated;
