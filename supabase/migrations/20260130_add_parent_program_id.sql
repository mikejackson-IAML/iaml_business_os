-- Add parent_program_id for virtual certificate block linking
-- Virtual blocks (e.g., "Comprehensive Labor Relations - Oct 2026") point to their parent certificate
-- This enables PROG-07 (blocks show parent link) and PROG-08 (certificate shows rollup counts)

ALTER TABLE program_instances
ADD COLUMN IF NOT EXISTS parent_program_id UUID REFERENCES program_instances(id);

-- Index for faster lookups when querying child blocks
CREATE INDEX IF NOT EXISTS idx_program_instances_parent
ON program_instances(parent_program_id);

-- Comment for documentation
COMMENT ON COLUMN program_instances.parent_program_id IS
'For virtual blocks: references the parent certificate program. NULL for parent programs or standalone programs.';
