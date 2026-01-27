-- Accomplishments: Daily accomplishment and goal tracking system
-- Migration: Create accomplishments schema and tables
-- Date: 2026-01-15

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS accomplishments;
-- ============================================
-- GOALS TABLE
-- Multi-horizon goal tracking
-- ============================================
CREATE TABLE accomplishments.goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Goal identity
  title TEXT NOT NULL,
  description TEXT,

  -- Horizon/timeframe
  horizon TEXT NOT NULL CHECK (horizon IN ('daily', 'weekly', 'monthly', 'quarterly')),

  -- Time boundaries
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,

  -- Impact category
  impact_category TEXT CHECK (impact_category IN (
    'revenue',             -- Direct revenue impact
    'efficiency',          -- Time/cost savings
    'foundation',          -- Infrastructure, architecture
    'customer_experience', -- UX, customer satisfaction
    'team',                -- Team productivity, hiring, training
    'compliance'           -- Legal, security, regulatory
  )),

  -- Progress tracking
  target_value INTEGER,           -- Optional numeric target
  current_value INTEGER DEFAULT 0,
  unit TEXT,                      -- 'tasks', 'features', 'dollars', etc.

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned', 'carried_forward')),
  completed_at TIMESTAMPTZ,

  -- Hierarchy (goals can have parent goals)
  parent_goal_id UUID REFERENCES accomplishments.goals(id),

  -- Ownership
  user_id TEXT DEFAULT 'mike',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX idx_goals_horizon ON accomplishments.goals(horizon, period_start, period_end);
CREATE INDEX idx_goals_status ON accomplishments.goals(status);
CREATE INDEX idx_goals_impact ON accomplishments.goals(impact_category);
CREATE INDEX idx_goals_user ON accomplishments.goals(user_id);
CREATE INDEX idx_goals_parent ON accomplishments.goals(parent_goal_id);
-- ============================================
-- ENTRIES TABLE
-- Individual accomplishment entries
-- ============================================
CREATE TABLE accomplishments.entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Impact classification
  impact_category TEXT NOT NULL CHECK (impact_category IN (
    'revenue',
    'efficiency',
    'foundation',
    'customer_experience',
    'team',
    'compliance'
  )),
  impact_level TEXT CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),

  -- Time tracking
  logged_at TIMESTAMPTZ DEFAULT NOW(),
  work_date DATE DEFAULT CURRENT_DATE,

  -- Auto-detection source
  detection_source TEXT CHECK (detection_source IN (
    'git_commit',        -- Detected from git commits
    'git_diff',          -- Detected from code changes
    'session_activity',  -- Inferred from session work
    'manual'             -- User manually entered
  )),

  -- Git metadata (if auto-detected)
  git_metadata JSONB DEFAULT '{}',
  -- Structure: {
  --   commits: [{hash, message, files_changed}],
  --   files_modified: ['path/to/file.ts'],
  --   lines_added: 150,
  --   lines_removed: 50,
  --   branch: 'main'
  -- }

  -- Session context
  session_metadata JSONB DEFAULT '{}',
  -- Structure: {
  --   session_start: timestamp,
  --   session_duration_minutes: 120,
  --   tools_used: ['read', 'edit', 'bash'],
  --   commands_run: ['/deploy', '/smoke']
  -- }

  -- Ownership
  user_id TEXT DEFAULT 'mike',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes
CREATE INDEX idx_entries_date ON accomplishments.entries(work_date);
CREATE INDEX idx_entries_logged ON accomplishments.entries(logged_at DESC);
CREATE INDEX idx_entries_category ON accomplishments.entries(impact_category);
CREATE INDEX idx_entries_user ON accomplishments.entries(user_id);
CREATE INDEX idx_entries_source ON accomplishments.entries(detection_source);
-- ============================================
-- GOAL_ENTRIES TABLE
-- Links entries to goals (many-to-many)
-- ============================================
CREATE TABLE accomplishments.goal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  goal_id UUID NOT NULL REFERENCES accomplishments.goals(id) ON DELETE CASCADE,
  entry_id UUID NOT NULL REFERENCES accomplishments.entries(id) ON DELETE CASCADE,

  -- Contribution tracking
  contribution_value INTEGER DEFAULT 1,  -- How much this contributes to goal progress

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(goal_id, entry_id)
);
CREATE INDEX idx_goal_entries_goal ON accomplishments.goal_entries(goal_id);
CREATE INDEX idx_goal_entries_entry ON accomplishments.goal_entries(entry_id);
-- ============================================
-- EMAIL_SUMMARIES TABLE
-- Track sent email summaries
-- ============================================
CREATE TABLE accomplishments.email_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Summary details
  summary_date DATE NOT NULL,
  summary_type TEXT NOT NULL CHECK (summary_type IN ('daily', 'weekly', 'monthly')),

  -- Content snapshot
  entries_included UUID[],
  goals_snapshot JSONB,  -- State of goals at time of email

  -- Email details
  email_subject TEXT,
  email_body TEXT,
  sent_at TIMESTAMPTZ,
  sent_to TEXT[],

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'failed')),
  error_message TEXT,

  -- Trigger
  trigger_type TEXT CHECK (trigger_type IN ('scheduled', 'manual')),

  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX idx_email_summaries_date ON accomplishments.email_summaries(summary_date);
CREATE INDEX idx_email_summaries_type ON accomplishments.email_summaries(summary_type);
-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get current period boundaries for a given horizon
CREATE OR REPLACE FUNCTION accomplishments.get_period_boundaries(
  p_horizon TEXT,
  p_reference_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (period_start DATE, period_end DATE) AS $$
BEGIN
  RETURN QUERY SELECT
    CASE p_horizon
      WHEN 'daily' THEN p_reference_date
      WHEN 'weekly' THEN date_trunc('week', p_reference_date)::DATE
      WHEN 'monthly' THEN date_trunc('month', p_reference_date)::DATE
      WHEN 'quarterly' THEN date_trunc('quarter', p_reference_date)::DATE
    END AS period_start,
    CASE p_horizon
      WHEN 'daily' THEN p_reference_date
      WHEN 'weekly' THEN (date_trunc('week', p_reference_date) + INTERVAL '6 days')::DATE
      WHEN 'monthly' THEN (date_trunc('month', p_reference_date) + INTERVAL '1 month - 1 day')::DATE
      WHEN 'quarterly' THEN (date_trunc('quarter', p_reference_date) + INTERVAL '3 months - 1 day')::DATE
    END AS period_end;
END;
$$ LANGUAGE plpgsql STABLE;
-- Get accomplishments for a date range
CREATE OR REPLACE FUNCTION accomplishments.get_entries_for_period(
  p_start_date DATE,
  p_end_date DATE,
  p_user_id TEXT DEFAULT 'mike'
)
RETURNS SETOF accomplishments.entries AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM accomplishments.entries
  WHERE work_date BETWEEN p_start_date AND p_end_date
    AND user_id = p_user_id
  ORDER BY logged_at DESC;
END;
$$ LANGUAGE plpgsql STABLE;
-- Get active goals for a horizon
CREATE OR REPLACE FUNCTION accomplishments.get_active_goals(
  p_horizon TEXT DEFAULT NULL,
  p_user_id TEXT DEFAULT 'mike'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  horizon TEXT,
  impact_category TEXT,
  target_value INTEGER,
  current_value INTEGER,
  progress_percent NUMERIC,
  period_start DATE,
  period_end DATE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.title,
    g.description,
    g.horizon,
    g.impact_category,
    g.target_value,
    g.current_value,
    CASE
      WHEN g.target_value > 0 THEN ROUND((g.current_value::NUMERIC / g.target_value) * 100, 1)
      ELSE NULL
    END AS progress_percent,
    g.period_start,
    g.period_end,
    (g.period_end - CURRENT_DATE) AS days_remaining
  FROM accomplishments.goals g
  WHERE g.status = 'active'
    AND g.user_id = p_user_id
    AND (p_horizon IS NULL OR g.horizon = p_horizon)
    AND g.period_end >= CURRENT_DATE
  ORDER BY
    CASE g.horizon
      WHEN 'daily' THEN 1
      WHEN 'weekly' THEN 2
      WHEN 'monthly' THEN 3
      WHEN 'quarterly' THEN 4
    END,
    g.period_end;
END;
$$ LANGUAGE plpgsql STABLE;
-- Update goal progress from linked entries
CREATE OR REPLACE FUNCTION accomplishments.update_goal_progress(p_goal_id UUID)
RETURNS VOID AS $$
DECLARE
  v_total_contribution INTEGER;
  v_target INTEGER;
BEGIN
  SELECT COALESCE(SUM(contribution_value), 0)
  INTO v_total_contribution
  FROM accomplishments.goal_entries
  WHERE goal_id = p_goal_id;

  SELECT target_value INTO v_target
  FROM accomplishments.goals WHERE id = p_goal_id;

  UPDATE accomplishments.goals
  SET
    current_value = v_total_contribution,
    status = CASE
      WHEN v_target IS NOT NULL AND v_total_contribution >= v_target THEN 'completed'
      ELSE status
    END,
    completed_at = CASE
      WHEN v_target IS NOT NULL AND v_total_contribution >= v_target AND completed_at IS NULL THEN NOW()
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = p_goal_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- VIEWS
-- ============================================

-- Daily summary view
CREATE OR REPLACE VIEW accomplishments.daily_summary AS
SELECT
  work_date,
  COUNT(*) as entry_count,
  array_agg(DISTINCT impact_category) as categories,
  COUNT(*) FILTER (WHERE impact_level = 'high' OR impact_level = 'critical') as high_impact_count,
  array_agg(title ORDER BY logged_at) as titles
FROM accomplishments.entries
WHERE work_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY work_date
ORDER BY work_date DESC;
-- Goal progress view
CREATE OR REPLACE VIEW accomplishments.goal_progress AS
SELECT
  g.*,
  CASE
    WHEN g.target_value > 0 THEN ROUND((g.current_value::NUMERIC / g.target_value) * 100, 1)
    ELSE NULL
  END AS progress_percent,
  (g.period_end - CURRENT_DATE) AS days_remaining,
  COUNT(ge.id) AS linked_entries
FROM accomplishments.goals g
LEFT JOIN accomplishments.goal_entries ge ON ge.goal_id = g.id
WHERE g.status = 'active'
GROUP BY g.id;
-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamps
CREATE OR REPLACE FUNCTION accomplishments.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER goals_updated_at
  BEFORE UPDATE ON accomplishments.goals
  FOR EACH ROW EXECUTE FUNCTION accomplishments.update_updated_at();
-- Auto-update goal progress when entries are linked/unlinked
CREATE OR REPLACE FUNCTION accomplishments.trigger_update_goal_progress()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM accomplishments.update_goal_progress(OLD.goal_id);
    RETURN OLD;
  ELSE
    PERFORM accomplishments.update_goal_progress(NEW.goal_id);
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER goal_entries_progress_update
  AFTER INSERT OR UPDATE OR DELETE ON accomplishments.goal_entries
  FOR EACH ROW EXECUTE FUNCTION accomplishments.trigger_update_goal_progress();
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA accomplishments IS 'Developer accomplishment and goal tracking system';
COMMENT ON TABLE accomplishments.goals IS 'Multi-horizon goals: daily, weekly, monthly, quarterly';
COMMENT ON TABLE accomplishments.entries IS 'Individual accomplishment entries with auto-detection support';
COMMENT ON TABLE accomplishments.goal_entries IS 'Links entries to goals for progress tracking';
COMMENT ON TABLE accomplishments.email_summaries IS 'Tracks sent email summaries for audit trail';
