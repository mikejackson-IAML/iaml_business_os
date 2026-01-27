-- Create program_cle_approvals table for CLE Approval Monitor workflow
-- Migration: 20260134
-- Workflow: CLE Approval Monitor (8TBH2O0GuYghWTaZ)

-- This table tracks CLE (Continuing Legal Education) approval status per state
-- for each program. The workflow monitors upcoming programs and alerts when
-- CLE approvals are pending or missing for states where the program will be delivered.

CREATE TABLE IF NOT EXISTS program_cle_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Program reference
  program_id UUID REFERENCES programs(id) ON DELETE CASCADE,

  -- State tracking
  state TEXT NOT NULL,  -- State code (e.g., 'TX', 'CA', 'NY')
  state_name TEXT,      -- Full state name for display

  -- Approval status
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'not_required',   -- CLE not required for this state
    'pending',        -- Not yet submitted
    'submitted',      -- Application submitted, awaiting response
    'approved',       -- Approved by state bar
    'denied',         -- Denied by state bar
    'expired'         -- Approval expired, needs renewal
  )),

  -- Timeline tracking
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Approval details
  credits_requested NUMERIC(4,2),   -- Credits requested
  credits_approved NUMERIC(4,2),    -- Credits actually approved
  approval_number TEXT,             -- State bar approval number

  -- Notes
  notes TEXT,
  denial_reason TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate entries for same program/state
  UNIQUE(program_id, state)
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_cle_program ON program_cle_approvals(program_id);
CREATE INDEX IF NOT EXISTS idx_cle_state ON program_cle_approvals(state);
CREATE INDEX IF NOT EXISTS idx_cle_status ON program_cle_approvals(status);
CREATE INDEX IF NOT EXISTS idx_cle_expires ON program_cle_approvals(expires_at) WHERE expires_at IS NOT NULL;

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_cle_approval_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS cle_approval_updated_at ON program_cle_approvals;
CREATE TRIGGER cle_approval_updated_at
  BEFORE UPDATE ON program_cle_approvals
  FOR EACH ROW EXECUTE FUNCTION update_cle_approval_timestamp();

-- RLS policies
ALTER TABLE program_cle_approvals ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
CREATE POLICY "Service role has full access to CLE approvals"
  ON program_cle_approvals
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users to read
CREATE POLICY "Authenticated users can read CLE approvals"
  ON program_cle_approvals
  FOR SELECT
  TO authenticated
  USING (true);

COMMENT ON TABLE program_cle_approvals IS 'Tracks CLE (Continuing Legal Education) approval status per state for each program';
