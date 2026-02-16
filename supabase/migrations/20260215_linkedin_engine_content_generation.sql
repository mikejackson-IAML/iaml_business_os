-- LinkedIn Engine: Content Generation Schema Updates
-- Adds columns to linkedin_engine.posts for storing hook variations,
-- tracking async generation state, and capturing user regeneration instructions.

-- Add hook_variations JSONB column to store all 3 generated hook options
-- Format: [{text: "...", category: "data", variation: "A"}, ...]
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS hook_variations JSONB;

COMMENT ON COLUMN linkedin_engine.posts.hook_variations IS
  'Array of hook objects: [{text, category, variation}] - stores all 3 generated hooks per topic';

-- Add generation_status for tracking async content generation state
-- Values: pending (default), generating, completed, failed, regenerating
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS generation_status TEXT DEFAULT 'pending';

COMMENT ON COLUMN linkedin_engine.posts.generation_status IS
  'Content generation lifecycle status: pending, generating, completed, failed, regenerating';

-- Add generation_instructions for user-provided regeneration context
-- Populated when user requests regeneration with specific guidance
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS generation_instructions TEXT;

COMMENT ON COLUMN linkedin_engine.posts.generation_instructions IS
  'User instructions for content regeneration (e.g., "make it more data-driven")';
