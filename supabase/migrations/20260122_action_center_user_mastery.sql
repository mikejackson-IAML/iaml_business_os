-- Action Center: User Task Mastery
-- Migration: Add task_mastery JSONB column to profiles table
-- Date: 2026-01-22
-- Depends on: 20260113_create_profiles_table.sql, 20260122_action_center_schema.sql

-- ============================================
-- ADD TASK MASTERY COLUMN TO PROFILES
-- Tracks user mastery level for each SOP template
-- ============================================
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS task_mastery JSONB DEFAULT '{}';

-- Add comment explaining the structure
COMMENT ON COLUMN public.profiles.task_mastery IS 'User mastery levels for SOP templates. Format: {sop_template_id: mastery_level}. Levels: 0-2=Novice, 3-5=Developing, 6-9=Proficient, 10+=Expert';

-- ============================================
-- HELPER FUNCTION: Get user mastery level
-- ============================================
CREATE OR REPLACE FUNCTION action_center.get_user_mastery(
  p_user_id UUID,
  p_sop_template_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_mastery INTEGER;
BEGIN
  SELECT COALESCE(
    (task_mastery->>p_sop_template_id::TEXT)::INTEGER,
    0
  )
  INTO v_mastery
  FROM public.profiles
  WHERE id = p_user_id;

  RETURN COALESCE(v_mastery, 0);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION action_center.get_user_mastery IS 'Returns user mastery level for a specific SOP template (0 if not found)';

-- ============================================
-- HELPER FUNCTION: Get mastery tier name
-- ============================================
CREATE OR REPLACE FUNCTION action_center.get_mastery_tier(p_level INTEGER)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_level >= 10 THEN 'expert'
    WHEN p_level >= 6 THEN 'proficient'
    WHEN p_level >= 3 THEN 'developing'
    ELSE 'novice'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION action_center.get_mastery_tier IS 'Converts numeric mastery level to tier name: novice (0-2), developing (3-5), proficient (6-9), expert (10+)';

-- ============================================
-- FUNCTION: Increment user mastery
-- Called when a task with SOP reference is completed
-- ============================================
CREATE OR REPLACE FUNCTION action_center.increment_user_mastery(
  p_user_id UUID,
  p_sop_template_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_current_level INTEGER;
  v_new_level INTEGER;
BEGIN
  -- Get current level (default 0)
  SELECT COALESCE(
    (task_mastery->>p_sop_template_id::TEXT)::INTEGER,
    0
  )
  INTO v_current_level
  FROM public.profiles
  WHERE id = p_user_id;

  v_new_level := COALESCE(v_current_level, 0) + 1;

  -- Update mastery level
  UPDATE public.profiles
  SET
    task_mastery = COALESCE(task_mastery, '{}'::JSONB) ||
                   jsonb_build_object(p_sop_template_id::TEXT, v_new_level),
    updated_at = NOW()
  WHERE id = p_user_id;

  RETURN v_new_level;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION action_center.increment_user_mastery IS 'Increments user mastery level for an SOP template by 1, returns new level';

-- ============================================
-- INDEX: GIN index for task_mastery JSONB queries
-- ============================================
CREATE INDEX IF NOT EXISTS idx_profiles_task_mastery
  ON public.profiles USING GIN (task_mastery);
