-- n8n-brain: Learning Layer for n8n Workflow Building
-- Migration: Create n8n_brain schema and tables
-- Date: 2026-01-11

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS n8n_brain;

-- ============================================
-- PATTERNS TABLE
-- Stores successful workflow patterns for reuse
-- ============================================
CREATE TABLE n8n_brain.patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identity
  name TEXT NOT NULL,
  description TEXT NOT NULL,

  -- The actual workflow
  workflow_json JSONB NOT NULL,

  -- Searchability
  tags TEXT[] DEFAULT '{}',
  services TEXT[] DEFAULT '{}',           -- ['supabase', 'ghl', 'heyreach']
  node_types TEXT[] DEFAULT '{}',         -- ['webhook', 'postgres', 'httpRequest']
  trigger_type TEXT,                      -- 'webhook', 'schedule', 'manual', etc.

  -- Metadata
  source_workflow_id TEXT,                -- ID from n8n if imported
  source_workflow_name TEXT,
  notes TEXT,

  -- Learning metrics
  success_count INTEGER DEFAULT 1,
  last_used_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast pattern lookup
CREATE INDEX idx_patterns_services ON n8n_brain.patterns USING GIN (services);
CREATE INDEX idx_patterns_node_types ON n8n_brain.patterns USING GIN (node_types);
CREATE INDEX idx_patterns_tags ON n8n_brain.patterns USING GIN (tags);
CREATE INDEX idx_patterns_trigger ON n8n_brain.patterns (trigger_type);
CREATE INDEX idx_patterns_success ON n8n_brain.patterns (success_count DESC);

-- ============================================
-- ERROR FIXES TABLE
-- Maps error messages to proven fixes
-- ============================================
CREATE TABLE n8n_brain.error_fixes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Error identification
  error_message TEXT NOT NULL,
  error_code TEXT,
  node_type TEXT,                         -- 'n8n-nodes-base.postgres', etc.
  operation TEXT,                         -- 'executeQuery', 'create', etc.

  -- The fix
  fix_description TEXT NOT NULL,
  fix_example JSONB,                      -- Example of correct config

  -- Effectiveness tracking
  times_applied INTEGER DEFAULT 1,
  times_succeeded INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast error lookup
CREATE INDEX idx_error_fixes_message ON n8n_brain.error_fixes
  USING GIN (to_tsvector('english', error_message));
CREATE INDEX idx_error_fixes_node ON n8n_brain.error_fixes (node_type);
CREATE INDEX idx_error_fixes_operation ON n8n_brain.error_fixes (operation);

-- ============================================
-- CREDENTIALS TABLE
-- Maps service names to credential IDs (NO SECRETS)
-- ============================================
CREATE TABLE n8n_brain.credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Mapping (service_name is the key we use to look up)
  service_name TEXT UNIQUE NOT NULL,      -- 'supabase', 'ghl', 'gemini'
  credential_id TEXT NOT NULL,            -- 'EgmvZHbvINHsh6PR'
  credential_name TEXT,                   -- 'Supabase Postgres'
  credential_type TEXT,                   -- 'postgres', 'httpHeaderAuth'

  -- Notes
  notes TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONFIDENCE LOG TABLE
-- Tracks autonomous action outcomes for calibration
-- ============================================
CREATE TABLE n8n_brain.confidence_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- What was attempted
  task_description TEXT NOT NULL,
  services_involved TEXT[],
  node_types_involved TEXT[],

  -- Confidence at time of action
  confidence_score INTEGER,
  confidence_factors JSONB,
  recommendation TEXT,                    -- 'ask_first', 'do_and_verify', 'autonomous'

  -- What happened
  action_taken TEXT,                      -- 'created_workflow', 'fixed_error', etc.
  outcome TEXT NOT NULL,                  -- 'success', 'failure', 'partial'
  outcome_notes TEXT,

  -- For learning
  pattern_id UUID REFERENCES n8n_brain.patterns(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for confidence analysis
CREATE INDEX idx_confidence_outcome ON n8n_brain.confidence_log (outcome);
CREATE INDEX idx_confidence_services ON n8n_brain.confidence_log USING GIN (services_involved);
CREATE INDEX idx_confidence_created ON n8n_brain.confidence_log (created_at DESC);

-- ============================================
-- PREFERENCES TABLE
-- User preferences for workflow building
-- ============================================
CREATE TABLE n8n_brain.preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  category TEXT NOT NULL,                 -- 'naming', 'error_handling', 'style'
  key TEXT NOT NULL,
  value JSONB NOT NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(category, key)
);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Function to calculate success rate for error fixes
CREATE OR REPLACE FUNCTION n8n_brain.get_fix_success_rate(fix_id UUID)
RETURNS NUMERIC AS $$
  SELECT
    CASE WHEN times_applied > 0
    THEN (times_succeeded::NUMERIC / times_applied)
    ELSE 0 END
  FROM n8n_brain.error_fixes
  WHERE id = fix_id;
$$ LANGUAGE SQL STABLE;

-- Function to find similar patterns by services
CREATE OR REPLACE FUNCTION n8n_brain.find_patterns_by_services(
  p_services TEXT[],
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  services TEXT[],
  node_types TEXT[],
  trigger_type TEXT,
  success_count INTEGER,
  overlap_count INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.services,
    p.node_types,
    p.trigger_type,
    p.success_count,
    (SELECT COUNT(*)::INTEGER FROM unnest(p.services) s WHERE s = ANY(p_services)) as overlap_count
  FROM n8n_brain.patterns p
  WHERE p.services && p_services  -- Array overlap operator
  ORDER BY overlap_count DESC, p.success_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to search error fixes by message
CREATE OR REPLACE FUNCTION n8n_brain.search_error_fixes(
  p_error_message TEXT,
  p_node_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  error_message TEXT,
  node_type TEXT,
  fix_description TEXT,
  fix_example JSONB,
  times_applied INTEGER,
  times_succeeded INTEGER,
  relevance REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ef.id,
    ef.error_message,
    ef.node_type,
    ef.fix_description,
    ef.fix_example,
    ef.times_applied,
    ef.times_succeeded,
    ts_rank(to_tsvector('english', ef.error_message), plainto_tsquery('english', p_error_message)) as relevance
  FROM n8n_brain.error_fixes ef
  WHERE
    to_tsvector('english', ef.error_message) @@ plainto_tsquery('english', p_error_message)
    AND (p_node_type IS NULL OR ef.node_type = p_node_type)
  ORDER BY relevance DESC, ef.times_succeeded DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION n8n_brain.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER patterns_updated_at
  BEFORE UPDATE ON n8n_brain.patterns
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

CREATE TRIGGER error_fixes_updated_at
  BEFORE UPDATE ON n8n_brain.error_fixes
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

CREATE TRIGGER credentials_updated_at
  BEFORE UPDATE ON n8n_brain.credentials
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

CREATE TRIGGER preferences_updated_at
  BEFORE UPDATE ON n8n_brain.preferences
  FOR EACH ROW EXECUTE FUNCTION n8n_brain.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA n8n_brain IS 'Learning layer for n8n workflow building - stores patterns, error fixes, credentials, and confidence data';
COMMENT ON TABLE n8n_brain.patterns IS 'Successful workflow patterns that can be reused as templates';
COMMENT ON TABLE n8n_brain.error_fixes IS 'Error message to fix mappings learned from debugging';
COMMENT ON TABLE n8n_brain.credentials IS 'Service name to n8n credential ID mappings (no secrets stored)';
COMMENT ON TABLE n8n_brain.confidence_log IS 'Log of autonomous actions and outcomes for confidence calibration';
COMMENT ON TABLE n8n_brain.preferences IS 'User preferences for naming conventions, error handling, and style';
