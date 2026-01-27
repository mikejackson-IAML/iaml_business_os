-- Development Project Management Schema
-- Tracks GSD projects, phases, and ideas for parallel development visibility
-- Date: 2026-01-23

-- ============================================
-- DEV PROJECTS TABLE
-- Main projects table for tracking GSD projects
-- ============================================
CREATE TABLE IF NOT EXISTS dev_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Project identification
  project_key TEXT UNIQUE NOT NULL,           -- 'action-center', 'ios-app', 'dev-dashboard'
  project_name TEXT NOT NULL,                 -- 'Action Center'
  project_path TEXT NOT NULL,                 -- '.planning/projects/action-center'
  description TEXT,

  -- Current milestone
  current_milestone TEXT DEFAULT 'v1.0',

  -- Progress tracking
  current_phase INTEGER,
  total_phases INTEGER,
  current_plan INTEGER,
  total_plans INTEGER,

  -- Status: idle, executing, needs_input, blocked, complete
  status TEXT DEFAULT 'idle' CHECK (status IN ('idle', 'executing', 'needs_input', 'blocked', 'complete')),

  -- Pending decisions (JSONB array)
  -- Each decision: { id, type, question, options, context, created_at }
  pending_decisions JSONB DEFAULT '[]',

  -- Activity tracking
  last_activity_at TIMESTAMPTZ,
  last_activity_description TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for dev_projects
CREATE INDEX IF NOT EXISTS idx_dev_projects_status ON dev_projects(status);
CREATE INDEX IF NOT EXISTS idx_dev_projects_key ON dev_projects(project_key);
-- ============================================
-- DEV PROJECT PHASES TABLE
-- Tracks phases (roadmap) for each project
-- ============================================
CREATE TABLE IF NOT EXISTS dev_project_phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES dev_projects(id) ON DELETE CASCADE,

  -- Phase identification
  phase_number INTEGER NOT NULL,
  phase_name TEXT NOT NULL,
  description TEXT,
  goal TEXT,

  -- Status tracking
  status TEXT DEFAULT 'not_started' CHECK (status IN ('not_started', 'planning', 'in_progress', 'complete', 'blocked')),
  completed_at TIMESTAMPTZ,

  -- From ROADMAP.md
  requirements TEXT[],                        -- REQ-IDs covered by this phase
  success_criteria TEXT[],                    -- Observable criteria for completion
  plan_count INTEGER DEFAULT 0,               -- Number of plans in this phase
  plans_complete INTEGER DEFAULT 0,           -- Number of completed plans

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(project_id, phase_number)
);
-- Indexes for dev_project_phases
CREATE INDEX IF NOT EXISTS idx_dev_project_phases_project ON dev_project_phases(project_id);
CREATE INDEX IF NOT EXISTS idx_dev_project_phases_status ON dev_project_phases(status);
-- ============================================
-- DEV PROJECT IDEAS TABLE
-- Ideas backlog for future work
-- ============================================
CREATE TABLE IF NOT EXISTS dev_project_ideas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES dev_projects(id) ON DELETE CASCADE,

  -- Idea details
  title TEXT NOT NULL,
  description TEXT,
  target_milestone TEXT,                      -- 'v1.1', 'v2.0', etc.
  priority INTEGER DEFAULT 0,                 -- For ordering (higher = more important)

  -- Status tracking
  status TEXT DEFAULT 'captured' CHECK (status IN ('captured', 'planned', 'rejected', 'implemented')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for dev_project_ideas
CREATE INDEX IF NOT EXISTS idx_dev_project_ideas_project ON dev_project_ideas(project_id);
CREATE INDEX IF NOT EXISTS idx_dev_project_ideas_status ON dev_project_ideas(status);
CREATE INDEX IF NOT EXISTS idx_dev_project_ideas_milestone ON dev_project_ideas(target_milestone);
-- ============================================
-- VIEWS
-- ============================================

-- Project status summary view
CREATE OR REPLACE VIEW dev_project_summary AS
SELECT
  dp.id,
  dp.project_key,
  dp.project_name,
  dp.current_milestone,
  dp.current_phase,
  dp.total_phases,
  dp.status,
  dp.last_activity_at,
  dp.last_activity_description,
  jsonb_array_length(dp.pending_decisions) as pending_decision_count,
  (SELECT COUNT(*) FROM dev_project_phases WHERE project_id = dp.id AND status = 'complete') as completed_phases,
  (SELECT COUNT(*) FROM dev_project_ideas WHERE project_id = dp.id AND status = 'captured') as idea_count
FROM dev_projects dp
ORDER BY
  CASE dp.status
    WHEN 'needs_input' THEN 1
    WHEN 'blocked' THEN 2
    WHEN 'executing' THEN 3
    WHEN 'idle' THEN 4
    WHEN 'complete' THEN 5
  END,
  dp.last_activity_at DESC NULLS LAST;
-- Projects needing attention view
CREATE OR REPLACE VIEW dev_projects_needing_attention AS
SELECT
  dp.id,
  dp.project_key,
  dp.project_name,
  dp.current_phase,
  dp.total_phases,
  dp.status,
  jsonb_array_length(dp.pending_decisions) as pending_decision_count,
  dp.last_activity_at,
  CASE
    WHEN dp.status = 'blocked' THEN 'CRITICAL: Blocked'
    WHEN dp.status = 'needs_input' THEN 'HIGH: Needs Input'
    WHEN dp.status = 'idle' AND dp.current_phase < dp.total_phases THEN 'READY: Ready to Execute'
    WHEN dp.status = 'executing' THEN 'INFO: Executing'
    ELSE 'OK'
  END as priority,
  CASE
    WHEN dp.status = 'idle' AND dp.current_phase < dp.total_phases THEN
      '/gsd:execute-phase ' || (dp.current_phase + 1) || ' --project ' || dp.project_key
    WHEN dp.status = 'needs_input' THEN
      '/gsd:discuss-phase ' || dp.current_phase || ' --project ' || dp.project_key
    ELSE NULL
  END as suggested_command
FROM dev_projects dp
WHERE dp.status IN ('needs_input', 'blocked', 'idle')
  AND dp.status != 'complete'
ORDER BY
  CASE
    WHEN dp.status = 'blocked' THEN 1
    WHEN dp.status = 'needs_input' THEN 2
    WHEN dp.status = 'idle' THEN 3
  END;
-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to update project status
CREATE OR REPLACE FUNCTION update_dev_project_status(
  p_project_key TEXT,
  p_status TEXT,
  p_activity_description TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
BEGIN
  UPDATE dev_projects
  SET
    status = p_status,
    last_activity_at = NOW(),
    last_activity_description = COALESCE(p_activity_description, last_activity_description),
    updated_at = NOW()
  WHERE project_key = p_project_key
  RETURNING id INTO v_project_id;

  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql;
-- Function to add a pending decision
CREATE OR REPLACE FUNCTION add_pending_decision(
  p_project_key TEXT,
  p_decision_type TEXT,
  p_question TEXT,
  p_options TEXT[] DEFAULT '{}',
  p_context TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_decision_id UUID := gen_random_uuid();
BEGIN
  UPDATE dev_projects
  SET
    pending_decisions = pending_decisions || jsonb_build_object(
      'id', v_decision_id,
      'type', p_decision_type,
      'question', p_question,
      'options', p_options,
      'context', p_context,
      'created_at', NOW()
    ),
    status = 'needs_input',
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE project_key = p_project_key;

  RETURN v_decision_id;
END;
$$ LANGUAGE plpgsql;
-- Function to resolve a pending decision
CREATE OR REPLACE FUNCTION resolve_pending_decision(
  p_project_key TEXT,
  p_decision_id UUID
) RETURNS VOID AS $$
BEGIN
  UPDATE dev_projects
  SET
    pending_decisions = (
      SELECT jsonb_agg(d)
      FROM jsonb_array_elements(pending_decisions) d
      WHERE (d->>'id')::UUID != p_decision_id
    ),
    updated_at = NOW()
  WHERE project_key = p_project_key;

  -- Reset status to idle if no more pending decisions
  UPDATE dev_projects
  SET status = 'idle'
  WHERE project_key = p_project_key
    AND jsonb_array_length(pending_decisions) = 0
    AND status = 'needs_input';
END;
$$ LANGUAGE plpgsql;
-- Function to update phase progress
CREATE OR REPLACE FUNCTION update_phase_progress(
  p_project_key TEXT,
  p_phase_number INTEGER,
  p_plans_complete INTEGER DEFAULT NULL,
  p_status TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
  UPDATE dev_project_phases dpp
  SET
    plans_complete = COALESCE(p_plans_complete, plans_complete),
    status = COALESCE(p_status, status),
    completed_at = CASE WHEN p_status = 'complete' THEN NOW() ELSE completed_at END,
    updated_at = NOW()
  FROM dev_projects dp
  WHERE dpp.project_id = dp.id
    AND dp.project_key = p_project_key
    AND dpp.phase_number = p_phase_number;

  -- Update project's current phase if this phase is complete
  IF p_status = 'complete' THEN
    UPDATE dev_projects
    SET current_phase = p_phase_number,
        updated_at = NOW()
    WHERE project_key = p_project_key;
  END IF;
END;
$$ LANGUAGE plpgsql;
-- Function to register a new project from GSD
CREATE OR REPLACE FUNCTION register_dev_project(
  p_project_key TEXT,
  p_project_name TEXT,
  p_project_path TEXT,
  p_description TEXT DEFAULT NULL,
  p_total_phases INTEGER DEFAULT 0
) RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO dev_projects (
    project_key,
    project_name,
    project_path,
    description,
    total_phases,
    current_phase,
    status,
    started_at
  ) VALUES (
    p_project_key,
    p_project_name,
    p_project_path,
    p_description,
    p_total_phases,
    0,
    'idle',
    NOW()
  )
  ON CONFLICT (project_key) DO UPDATE SET
    project_name = EXCLUDED.project_name,
    project_path = EXCLUDED.project_path,
    description = COALESCE(EXCLUDED.description, dev_projects.description),
    total_phases = COALESCE(EXCLUDED.total_phases, dev_projects.total_phases),
    updated_at = NOW()
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql;
-- Function to sync phases from roadmap
CREATE OR REPLACE FUNCTION sync_project_phases(
  p_project_key TEXT,
  p_phases JSONB  -- Array of {phase_number, phase_name, goal, requirements, success_criteria, plan_count}
) RETURNS VOID AS $$
DECLARE
  v_project_id UUID;
  v_phase JSONB;
BEGIN
  SELECT id INTO v_project_id FROM dev_projects WHERE project_key = p_project_key;

  IF v_project_id IS NULL THEN
    RAISE EXCEPTION 'Project not found: %', p_project_key;
  END IF;

  -- Upsert each phase
  FOR v_phase IN SELECT * FROM jsonb_array_elements(p_phases)
  LOOP
    INSERT INTO dev_project_phases (
      project_id,
      phase_number,
      phase_name,
      goal,
      requirements,
      success_criteria,
      plan_count
    ) VALUES (
      v_project_id,
      (v_phase->>'phase_number')::INTEGER,
      v_phase->>'phase_name',
      v_phase->>'goal',
      ARRAY(SELECT jsonb_array_elements_text(v_phase->'requirements')),
      ARRAY(SELECT jsonb_array_elements_text(v_phase->'success_criteria')),
      COALESCE((v_phase->>'plan_count')::INTEGER, 0)
    )
    ON CONFLICT (project_id, phase_number) DO UPDATE SET
      phase_name = EXCLUDED.phase_name,
      goal = EXCLUDED.goal,
      requirements = EXCLUDED.requirements,
      success_criteria = EXCLUDED.success_criteria,
      plan_count = EXCLUDED.plan_count,
      updated_at = NOW();
  END LOOP;

  -- Update total phases count
  UPDATE dev_projects
  SET total_phases = (SELECT COUNT(*) FROM dev_project_phases WHERE project_id = v_project_id),
      updated_at = NOW()
  WHERE id = v_project_id;
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_dev_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER dev_projects_updated_at
  BEFORE UPDATE ON dev_projects
  FOR EACH ROW EXECUTE FUNCTION update_dev_updated_at();
CREATE TRIGGER dev_project_phases_updated_at
  BEFORE UPDATE ON dev_project_phases
  FOR EACH ROW EXECUTE FUNCTION update_dev_updated_at();
CREATE TRIGGER dev_project_ideas_updated_at
  BEFORE UPDATE ON dev_project_ideas
  FOR EACH ROW EXECUTE FUNCTION update_dev_updated_at();
-- ============================================
-- RLS POLICIES (optional - enable if needed)
-- ============================================

-- Enable RLS (uncomment if needed)
-- ALTER TABLE dev_projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dev_project_phases ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dev_project_ideas ENABLE ROW LEVEL SECURITY;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE dev_projects IS 'GSD projects for parallel development tracking';
COMMENT ON TABLE dev_project_phases IS 'Phase/roadmap tracking for each project';
COMMENT ON TABLE dev_project_ideas IS 'Ideas backlog for future features';
COMMENT ON VIEW dev_project_summary IS 'Summary view of all projects with status';
COMMENT ON VIEW dev_projects_needing_attention IS 'Projects that need action with suggested commands';
COMMENT ON FUNCTION register_dev_project IS 'Register or update a project from GSD new-project command';
COMMENT ON FUNCTION sync_project_phases IS 'Sync phases from ROADMAP.md to database';
COMMENT ON FUNCTION update_dev_project_status IS 'Update project status and activity';
COMMENT ON FUNCTION add_pending_decision IS 'Add a decision that needs user input';
COMMENT ON FUNCTION resolve_pending_decision IS 'Remove a decision after it has been answered';
