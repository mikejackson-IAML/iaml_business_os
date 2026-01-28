-- Add pinned column to projects for pin-to-top override in queue
ALTER TABLE planning_studio.projects ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
