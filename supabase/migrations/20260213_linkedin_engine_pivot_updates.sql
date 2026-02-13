-- LinkedIn Engine: HR Agentic Pivot Updates
-- Adds pillar column to posts and content_calendar tables for the 3-pillar
-- content framing system (Legacy & Future, Building in Public, Partnered Authority).
-- Adds new topic categories for pivot-specific content.

-- Add pillar column to posts
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS pillar TEXT;

COMMENT ON COLUMN linkedin_engine.posts.pillar IS 'Content framing pillar: legacy_future, building_in_public, partnered_authority';

-- Add pillar column to content_calendar
ALTER TABLE linkedin_engine.content_calendar
  ADD COLUMN IF NOT EXISTS pillar TEXT;

COMMENT ON COLUMN linkedin_engine.content_calendar.pillar IS 'Content framing pillar: legacy_future, building_in_public, partnered_authority';

-- Add index on pillar for posts (useful for analytics queries)
CREATE INDEX IF NOT EXISTS idx_le_posts_pillar ON linkedin_engine.posts(pillar);

-- Add index on pillar for content_calendar
CREATE INDEX IF NOT EXISTS idx_le_calendar_pillar ON linkedin_engine.content_calendar(pillar);

-- Update existing calendar entries with default pillar assignments based on series/day mapping
-- Tuesday (not_being_told) -> legacy_future or partnered_authority (default to partnered_authority)
UPDATE linkedin_engine.content_calendar
  SET pillar = 'partnered_authority'
  WHERE series = 'not_being_told' AND pillar IS NULL;

-- Wednesday (compliance_radar) -> partnered_authority
UPDATE linkedin_engine.content_calendar
  SET pillar = 'partnered_authority'
  WHERE series = 'compliance_radar' AND pillar IS NULL;

-- Thursday (ask_ai_guy) -> building_in_public
UPDATE linkedin_engine.content_calendar
  SET pillar = 'building_in_public'
  WHERE series = 'ask_ai_guy' AND pillar IS NULL;

-- Friday (flex) -> building_in_public
UPDATE linkedin_engine.content_calendar
  SET pillar = 'building_in_public'
  WHERE series = 'flex' AND pillar IS NULL;
