-- ============================================================================
-- MIGRATION: Faculty Scheduler Schema
-- ============================================================================
-- Creates the faculty_scheduler schema for the tiered instructor assignment system
-- Date: 2026-01-20
-- ============================================================================

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS faculty_scheduler;

-- ============================================================================
-- EXTEND FACULTY TABLE
-- ============================================================================

-- Add tier designation column (0 = VIP, NULL = normal)
ALTER TABLE faculty ADD COLUMN IF NOT EXISTS tier_designation INTEGER;
COMMENT ON COLUMN faculty.tier_designation IS '0 = VIP (Tier 0 access to all programs), NULL = normal instructor';

-- ============================================================================
-- INSTRUCTOR QUALIFICATIONS (Junction Table)
-- Links faculty to programs they are qualified to teach
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.instructor_qualifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(faculty_id, program_id)
);

CREATE INDEX IF NOT EXISTS idx_instructor_quals_faculty ON faculty_scheduler.instructor_qualifications(faculty_id);
CREATE INDEX IF NOT EXISTS idx_instructor_quals_program ON faculty_scheduler.instructor_qualifications(program_id);

COMMENT ON TABLE faculty_scheduler.instructor_qualifications IS 'Junction table linking instructors to programs they are qualified to teach';

-- ============================================================================
-- SCHEDULED PROGRAMS
-- Programs released for instructor claiming (distinct from program_instances)
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.scheduled_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Link to course catalog (optional - for qualification matching)
  program_id UUID REFERENCES programs(id),

  -- Program details (denormalized for display)
  name TEXT NOT NULL,
  program_type TEXT,

  -- Location (for Tier 1 local matching)
  city TEXT,
  state TEXT,
  venue TEXT,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Tier system status
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',        -- Not yet released
    'tier_0',       -- VIP access (days 1-7)
    'tier_1',       -- Local access (days 8-12)
    'tier_2',       -- Open to all qualified (day 13+)
    'filled',       -- All blocks claimed
    'completed'     -- Program has occurred
  )),

  -- Tier timing
  released_at TIMESTAMPTZ,           -- When released to Tier 0
  tier_0_ends_at TIMESTAMPTZ,        -- When Tier 0 window closes
  tier_1_ends_at TIMESTAMPTZ,        -- When Tier 1 window closes

  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_programs_status ON faculty_scheduler.scheduled_programs(status);
CREATE INDEX IF NOT EXISTS idx_scheduled_programs_state ON faculty_scheduler.scheduled_programs(state);
CREATE INDEX IF NOT EXISTS idx_scheduled_programs_start ON faculty_scheduler.scheduled_programs(start_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_programs_program ON faculty_scheduler.scheduled_programs(program_id);

COMMENT ON TABLE faculty_scheduler.scheduled_programs IS 'Programs released for instructor claiming with tier-based access control';

-- ============================================================================
-- PROGRAM BLOCKS
-- Individual claimable teaching slots within a program
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.program_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_program_id UUID NOT NULL REFERENCES faculty_scheduler.scheduled_programs(id) ON DELETE CASCADE,

  -- Block details
  block_name TEXT NOT NULL,          -- e.g., "Block 1", "Day 1 AM"
  sequence_order INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,

  -- Assignment
  instructor_id UUID REFERENCES faculty(id),
  claimed_at TIMESTAMPTZ,

  -- Status
  status TEXT DEFAULT 'open' CHECK (status IN (
    'open',      -- Available for claiming
    'claimed',   -- Claimed by instructor
    'confirmed', -- Admin confirmed (if needed)
    'completed'  -- Block has been taught
  )),

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_program_blocks_program ON faculty_scheduler.program_blocks(scheduled_program_id);
CREATE INDEX IF NOT EXISTS idx_program_blocks_instructor ON faculty_scheduler.program_blocks(instructor_id);
CREATE INDEX IF NOT EXISTS idx_program_blocks_status ON faculty_scheduler.program_blocks(status);

COMMENT ON TABLE faculty_scheduler.program_blocks IS 'Individual claimable teaching slots within a scheduled program';

-- ============================================================================
-- CLAIMS
-- Track instructor claims with full history
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instructor_id UUID NOT NULL REFERENCES faculty(id),
  block_id UUID NOT NULL REFERENCES faculty_scheduler.program_blocks(id),

  -- Claim status
  status TEXT DEFAULT 'confirmed' CHECK (status IN (
    'confirmed',  -- Active claim
    'cancelled',  -- Instructor or admin cancelled
    'completed'   -- Block was taught
  )),

  -- Timestamps
  claimed_at TIMESTAMPTZ DEFAULT NOW(),
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,        -- 'instructor' or 'admin'
  cancelled_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_claims_instructor ON faculty_scheduler.claims(instructor_id);
CREATE INDEX IF NOT EXISTS idx_claims_block ON faculty_scheduler.claims(block_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON faculty_scheduler.claims(status);

COMMENT ON TABLE faculty_scheduler.claims IS 'Instructor claims on program blocks with full history';

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View: Available programs with open blocks
CREATE OR REPLACE VIEW faculty_scheduler.available_programs AS
SELECT
  sp.id as program_id,
  sp.name as program_name,
  sp.program_type,
  sp.city,
  sp.state,
  sp.venue,
  sp.start_date as program_start_date,
  sp.end_date as program_end_date,
  sp.status as tier_status,
  sp.released_at,
  sp.tier_0_ends_at,
  sp.tier_1_ends_at,
  pb.id as block_id,
  pb.block_name,
  pb.sequence_order,
  pb.start_date as block_start_date,
  pb.end_date as block_end_date,
  pb.status as block_status
FROM faculty_scheduler.scheduled_programs sp
JOIN faculty_scheduler.program_blocks pb ON pb.scheduled_program_id = sp.id
WHERE sp.status IN ('tier_0', 'tier_1', 'tier_2')
  AND pb.status = 'open'
ORDER BY sp.start_date, pb.sequence_order;

-- View: Instructor claims summary
CREATE OR REPLACE VIEW faculty_scheduler.instructor_claims_summary AS
SELECT
  f.id as instructor_id,
  f.full_name,
  f.email,
  f.firm_state,
  f.tier_designation,
  COUNT(c.id) FILTER (WHERE c.status = 'confirmed') as active_claims,
  COUNT(c.id) FILTER (WHERE c.status = 'completed') as completed_claims,
  COUNT(c.id) FILTER (WHERE c.status = 'cancelled') as cancelled_claims
FROM faculty f
LEFT JOIN faculty_scheduler.claims c ON c.instructor_id = f.id
WHERE f.faculty_status = 'active'
GROUP BY f.id, f.full_name, f.email, f.firm_state, f.tier_designation;

-- View: Program recruitment pipeline (for dashboard)
CREATE OR REPLACE VIEW faculty_scheduler.recruitment_pipeline AS
SELECT
  sp.id,
  sp.name,
  sp.program_type,
  sp.city,
  sp.state,
  sp.start_date,
  sp.status,
  sp.released_at,
  sp.tier_0_ends_at,
  sp.tier_1_ends_at,
  CASE
    WHEN sp.status = 'tier_0' THEN EXTRACT(EPOCH FROM (sp.tier_0_ends_at - NOW())) / 86400
    WHEN sp.status = 'tier_1' THEN EXTRACT(EPOCH FROM (sp.tier_1_ends_at - NOW())) / 86400
    ELSE NULL
  END as days_remaining,
  COUNT(pb.id) as total_blocks,
  COUNT(pb.id) FILTER (WHERE pb.status = 'open') as open_blocks,
  COUNT(pb.id) FILTER (WHERE pb.status IN ('claimed', 'confirmed')) as filled_blocks,
  COUNT(pb.id) FILTER (WHERE pb.status = 'completed') as completed_blocks
FROM faculty_scheduler.scheduled_programs sp
LEFT JOIN faculty_scheduler.program_blocks pb ON pb.scheduled_program_id = sp.id
GROUP BY sp.id
ORDER BY
  CASE sp.status
    WHEN 'tier_0' THEN 1
    WHEN 'tier_1' THEN 2
    WHEN 'tier_2' THEN 3
    WHEN 'filled' THEN 4
    WHEN 'draft' THEN 5
    WHEN 'completed' THEN 6
  END,
  sp.start_date;

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function: Get eligible instructors for a program at current tier
CREATE OR REPLACE FUNCTION faculty_scheduler.get_eligible_instructors(
  p_scheduled_program_id UUID
)
RETURNS TABLE (
  instructor_id UUID,
  full_name TEXT,
  email TEXT,
  firm_state TEXT,
  tier INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_program RECORD;
BEGIN
  -- Get program details
  SELECT sp.*, p.id as catalog_program_id
  INTO v_program
  FROM faculty_scheduler.scheduled_programs sp
  LEFT JOIN programs p ON p.id = sp.program_id
  WHERE sp.id = p_scheduled_program_id;

  IF v_program IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT DISTINCT
    f.id,
    f.full_name,
    f.email,
    f.firm_state,
    CASE
      WHEN f.tier_designation = 0 THEN 0
      WHEN f.firm_state = v_program.state THEN 1
      ELSE 2
    END::INTEGER as tier,
    CASE
      WHEN f.tier_designation = 0 THEN 'VIP instructor'
      WHEN f.firm_state = v_program.state THEN 'Local instructor (same state)'
      ELSE 'Qualified instructor'
    END as reason
  FROM faculty f
  JOIN faculty_scheduler.instructor_qualifications iq ON iq.faculty_id = f.id
  WHERE iq.program_id = v_program.catalog_program_id
    AND f.faculty_status = 'active'
    AND (f.available_for_teaching = true OR f.available_for_teaching IS NULL)
    AND (
      -- Tier 0: Only VIPs
      (v_program.status = 'tier_0' AND f.tier_designation = 0)
      -- Tier 1: VIPs + Local
      OR (v_program.status = 'tier_1' AND (f.tier_designation = 0 OR f.firm_state = v_program.state))
      -- Tier 2: All qualified
      OR (v_program.status = 'tier_2')
    )
  ORDER BY tier;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function: Release a program to Tier 0
CREATE OR REPLACE FUNCTION faculty_scheduler.release_program(
  p_program_id UUID,
  p_tier_0_days INTEGER DEFAULT 7,
  p_tier_1_days INTEGER DEFAULT 5
)
RETURNS VOID AS $$
BEGIN
  UPDATE faculty_scheduler.scheduled_programs
  SET
    status = 'tier_0',
    released_at = NOW(),
    tier_0_ends_at = NOW() + (p_tier_0_days || ' days')::INTERVAL,
    tier_1_ends_at = NOW() + ((p_tier_0_days + p_tier_1_days) || ' days')::INTERVAL,
    updated_at = NOW()
  WHERE id = p_program_id
    AND status = 'draft';
END;
$$ LANGUAGE plpgsql;

-- Function: Advance tiers (called by n8n scheduler daily)
CREATE OR REPLACE FUNCTION faculty_scheduler.advance_tiers()
RETURNS TABLE (
  programs_advanced INTEGER,
  tier_0_to_1 INTEGER,
  tier_1_to_2 INTEGER
) AS $$
DECLARE
  v_tier_0_count INTEGER := 0;
  v_tier_1_count INTEGER := 0;
BEGIN
  -- Advance Tier 0 → Tier 1
  UPDATE faculty_scheduler.scheduled_programs
  SET status = 'tier_1', updated_at = NOW()
  WHERE status = 'tier_0'
    AND tier_0_ends_at <= NOW();
  GET DIAGNOSTICS v_tier_0_count = ROW_COUNT;

  -- Advance Tier 1 → Tier 2
  UPDATE faculty_scheduler.scheduled_programs
  SET status = 'tier_2', updated_at = NOW()
  WHERE status = 'tier_1'
    AND tier_1_ends_at <= NOW();
  GET DIAGNOSTICS v_tier_1_count = ROW_COUNT;

  RETURN QUERY SELECT
    (v_tier_0_count + v_tier_1_count)::INTEGER,
    v_tier_0_count,
    v_tier_1_count;
END;
$$ LANGUAGE plpgsql;

-- Function: Claim a block
CREATE OR REPLACE FUNCTION faculty_scheduler.claim_block(
  p_instructor_id UUID,
  p_block_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_claim_id UUID;
  v_block RECORD;
BEGIN
  -- Get block and check availability
  SELECT pb.*, sp.status as program_status, sp.state as program_state, sp.program_id as catalog_program_id
  INTO v_block
  FROM faculty_scheduler.program_blocks pb
  JOIN faculty_scheduler.scheduled_programs sp ON sp.id = pb.scheduled_program_id
  WHERE pb.id = p_block_id
  FOR UPDATE;

  IF v_block IS NULL THEN
    RAISE EXCEPTION 'Block not found';
  END IF;

  IF v_block.status != 'open' THEN
    RAISE EXCEPTION 'Block is not available for claiming';
  END IF;

  -- Verify instructor is eligible
  IF NOT EXISTS (
    SELECT 1 FROM faculty_scheduler.get_eligible_instructors(v_block.scheduled_program_id)
    WHERE instructor_id = p_instructor_id
  ) THEN
    RAISE EXCEPTION 'Instructor is not eligible to claim this block';
  END IF;

  -- Create claim
  INSERT INTO faculty_scheduler.claims (instructor_id, block_id, status, claimed_at)
  VALUES (p_instructor_id, p_block_id, 'confirmed', NOW())
  RETURNING id INTO v_claim_id;

  -- Update block
  UPDATE faculty_scheduler.program_blocks
  SET
    instructor_id = p_instructor_id,
    claimed_at = NOW(),
    status = 'claimed',
    updated_at = NOW()
  WHERE id = p_block_id;

  -- Check if all blocks are filled
  IF NOT EXISTS (
    SELECT 1 FROM faculty_scheduler.program_blocks
    WHERE scheduled_program_id = v_block.scheduled_program_id
      AND status = 'open'
  ) THEN
    UPDATE faculty_scheduler.scheduled_programs
    SET status = 'filled', updated_at = NOW()
    WHERE id = v_block.scheduled_program_id;
  END IF;

  RETURN v_claim_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Cancel a claim
CREATE OR REPLACE FUNCTION faculty_scheduler.cancel_claim(
  p_claim_id UUID,
  p_cancelled_by TEXT DEFAULT 'admin',
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_claim RECORD;
BEGIN
  -- Get claim
  SELECT c.*, pb.scheduled_program_id
  INTO v_claim
  FROM faculty_scheduler.claims c
  JOIN faculty_scheduler.program_blocks pb ON pb.id = c.block_id
  WHERE c.id = p_claim_id
    AND c.status = 'confirmed';

  IF v_claim IS NULL THEN
    RAISE EXCEPTION 'Active claim not found';
  END IF;

  -- Update claim
  UPDATE faculty_scheduler.claims
  SET
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancelled_reason = p_reason
  WHERE id = p_claim_id;

  -- Re-open block
  UPDATE faculty_scheduler.program_blocks
  SET
    instructor_id = NULL,
    claimed_at = NULL,
    status = 'open',
    updated_at = NOW()
  WHERE id = v_claim.block_id;

  -- Update program status if it was filled
  UPDATE faculty_scheduler.scheduled_programs
  SET
    status = CASE
      WHEN tier_1_ends_at <= NOW() THEN 'tier_2'
      WHEN tier_0_ends_at <= NOW() THEN 'tier_1'
      ELSE 'tier_0'
    END,
    updated_at = NOW()
  WHERE id = v_claim.scheduled_program_id
    AND status = 'filled';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION faculty_scheduler.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_programs_updated_at
  BEFORE UPDATE ON faculty_scheduler.scheduled_programs
  FOR EACH ROW EXECUTE FUNCTION faculty_scheduler.update_updated_at();

CREATE TRIGGER program_blocks_updated_at
  BEFORE UPDATE ON faculty_scheduler.program_blocks
  FOR EACH ROW EXECUTE FUNCTION faculty_scheduler.update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON SCHEMA faculty_scheduler IS 'Tiered instructor assignment system for IAML programs';
COMMENT ON FUNCTION faculty_scheduler.get_eligible_instructors IS 'Returns instructors eligible to view/claim a program based on current tier';
COMMENT ON FUNCTION faculty_scheduler.release_program IS 'Releases a draft program to Tier 0 with configurable tier windows';
COMMENT ON FUNCTION faculty_scheduler.advance_tiers IS 'Advances programs through tiers based on timing (call daily via n8n)';
COMMENT ON FUNCTION faculty_scheduler.claim_block IS 'Claims a block for an instructor with eligibility verification';
COMMENT ON FUNCTION faculty_scheduler.cancel_claim IS 'Cancels a claim and re-opens the block for claiming';
COMMENT ON VIEW faculty_scheduler.available_programs IS 'All programs with open blocks available for claiming';
COMMENT ON VIEW faculty_scheduler.instructor_claims_summary IS 'Summary of claims per instructor';
COMMENT ON VIEW faculty_scheduler.recruitment_pipeline IS 'Dashboard view of program recruitment status';
