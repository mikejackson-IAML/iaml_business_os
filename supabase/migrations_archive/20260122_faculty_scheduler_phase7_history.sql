-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 7 - Teaching History
-- ============================================================================
-- Creates the teaching_history table and supporting triggers/functions to
-- automatically capture instructor teaching records when claims are made.
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- TEACHING HISTORY TABLE
-- Historical record of instructor teaching assignments
-- ============================================================================
CREATE TABLE IF NOT EXISTS faculty_scheduler.teaching_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core relationships
  instructor_id UUID NOT NULL REFERENCES faculty(id) ON DELETE CASCADE,
  scheduled_program_id UUID NOT NULL REFERENCES faculty_scheduler.scheduled_programs(id) ON DELETE CASCADE,

  -- Denormalized program info (for historical accuracy)
  program_name TEXT NOT NULL,
  program_type TEXT,
  city TEXT,
  state TEXT,

  -- Dates
  start_date DATE NOT NULL,
  end_date DATE,

  -- Tracking
  block_count INTEGER DEFAULT 1,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),

  -- Timestamps
  claimed_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One record per instructor per program
  UNIQUE(instructor_id, scheduled_program_id)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_teaching_history_instructor ON faculty_scheduler.teaching_history(instructor_id);
CREATE INDEX IF NOT EXISTS idx_teaching_history_program ON faculty_scheduler.teaching_history(scheduled_program_id);
CREATE INDEX IF NOT EXISTS idx_teaching_history_status ON faculty_scheduler.teaching_history(status);

-- ============================================================================
-- TRIGGER FUNCTION: Create or update teaching history on claim INSERT
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.create_or_update_teaching_history()
RETURNS TRIGGER AS $$
DECLARE
  v_program RECORD;
BEGIN
  -- Only process confirmed claims
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get program details via block -> scheduled_program
  SELECT
    sp.id as scheduled_program_id,
    sp.name as program_name,
    sp.program_type,
    sp.city,
    sp.state,
    sp.start_date,
    sp.end_date
  INTO v_program
  FROM faculty_scheduler.program_blocks pb
  JOIN faculty_scheduler.scheduled_programs sp ON sp.id = pb.scheduled_program_id
  WHERE pb.id = NEW.block_id;

  IF v_program IS NULL THEN
    -- Block or program not found, skip silently
    RETURN NEW;
  END IF;

  -- Upsert teaching history record
  INSERT INTO faculty_scheduler.teaching_history (
    instructor_id,
    scheduled_program_id,
    program_name,
    program_type,
    city,
    state,
    start_date,
    end_date,
    block_count,
    status,
    claimed_at
  ) VALUES (
    NEW.instructor_id,
    v_program.scheduled_program_id,
    v_program.program_name,
    v_program.program_type,
    v_program.city,
    v_program.state,
    v_program.start_date,
    v_program.end_date,
    1,
    'pending',
    NEW.claimed_at
  )
  ON CONFLICT (instructor_id, scheduled_program_id) DO UPDATE SET
    block_count = faculty_scheduler.teaching_history.block_count + 1,
    claimed_at = LEAST(faculty_scheduler.teaching_history.claimed_at, EXCLUDED.claimed_at),
    updated_at = NOW();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Fire on claims INSERT to create history record
-- ============================================================================
CREATE TRIGGER trg_claims_insert_history
  AFTER INSERT ON faculty_scheduler.claims
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION faculty_scheduler.create_or_update_teaching_history();

-- ============================================================================
-- TRIGGER FUNCTION: Update teaching history on claim cancellation
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.update_teaching_history_on_cancel()
RETURNS TRIGGER AS $$
DECLARE
  v_scheduled_program_id UUID;
  v_current_block_count INTEGER;
BEGIN
  -- Get the scheduled_program_id for this block
  SELECT pb.scheduled_program_id INTO v_scheduled_program_id
  FROM faculty_scheduler.program_blocks pb
  WHERE pb.id = NEW.block_id;

  IF v_scheduled_program_id IS NULL THEN
    -- Block not found, skip
    RETURN NEW;
  END IF;

  -- Get current block count
  SELECT block_count INTO v_current_block_count
  FROM faculty_scheduler.teaching_history
  WHERE instructor_id = NEW.instructor_id
    AND scheduled_program_id = v_scheduled_program_id;

  IF v_current_block_count IS NULL THEN
    -- No history record exists, skip
    RETURN NEW;
  END IF;

  IF v_current_block_count <= 1 THEN
    -- Last block cancelled, mark history as cancelled
    UPDATE faculty_scheduler.teaching_history
    SET
      block_count = 0,
      status = 'cancelled',
      cancelled_at = NOW(),
      updated_at = NOW()
    WHERE instructor_id = NEW.instructor_id
      AND scheduled_program_id = v_scheduled_program_id;
  ELSE
    -- Decrement block count
    UPDATE faculty_scheduler.teaching_history
    SET
      block_count = block_count - 1,
      updated_at = NOW()
    WHERE instructor_id = NEW.instructor_id
      AND scheduled_program_id = v_scheduled_program_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER: Fire on claims UPDATE when status changes to cancelled
-- ============================================================================
CREATE TRIGGER trg_claims_cancel_history
  AFTER UPDATE ON faculty_scheduler.claims
  FOR EACH ROW
  WHEN (OLD.status = 'confirmed' AND NEW.status = 'cancelled')
  EXECUTE FUNCTION faculty_scheduler.update_teaching_history_on_cancel();

-- ============================================================================
-- FUNCTION: Auto-complete past teaching history records
-- ============================================================================
CREATE OR REPLACE FUNCTION faculty_scheduler.complete_past_teaching_history()
RETURNS INTEGER AS $$
DECLARE
  v_updated_count INTEGER;
BEGIN
  -- Update all pending records where program has ended
  UPDATE faculty_scheduler.teaching_history
  SET
    status = 'completed',
    completed_at = NOW(),
    updated_at = NOW()
  WHERE status = 'pending'
    AND COALESCE(end_date, start_date) < CURRENT_DATE;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- VIEW: Instructor history summary
-- ============================================================================
CREATE OR REPLACE VIEW faculty_scheduler.instructor_history_summary AS
SELECT
  instructor_id,
  COUNT(*) as total_programs,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
  MAX(start_date) as last_program_date
FROM faculty_scheduler.teaching_history
GROUP BY instructor_id;

-- ============================================================================
-- TRIGGER: Update updated_at for teaching_history
-- ============================================================================
CREATE TRIGGER teaching_history_updated_at
  BEFORE UPDATE ON faculty_scheduler.teaching_history
  FOR EACH ROW EXECUTE FUNCTION faculty_scheduler.update_updated_at();

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE faculty_scheduler.teaching_history IS 'Historical record of instructor teaching assignments, one record per instructor per program';
COMMENT ON FUNCTION faculty_scheduler.create_or_update_teaching_history IS 'Trigger function to create/update teaching history when claims are inserted';
COMMENT ON FUNCTION faculty_scheduler.update_teaching_history_on_cancel IS 'Trigger function to update teaching history when claims are cancelled';
COMMENT ON FUNCTION faculty_scheduler.complete_past_teaching_history IS 'Auto-completes teaching history records after program end date. Run daily via n8n.';
COMMENT ON VIEW faculty_scheduler.instructor_history_summary IS 'Summary view of instructor teaching history for dashboard display';
