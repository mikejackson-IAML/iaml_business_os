-- Add pinned column to planning_studio.projects for build queue ordering
-- Pinned projects appear first in the ready-to-build queue

ALTER TABLE planning_studio.projects
ADD COLUMN IF NOT EXISTS pinned BOOLEAN DEFAULT FALSE;
