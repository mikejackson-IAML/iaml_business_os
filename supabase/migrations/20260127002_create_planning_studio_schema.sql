-- Planning Studio Schema
-- AI-guided idea-to-production pipeline with incubation periods and semantic memory
-- Date: 2026-01-27

-- ============================================
-- ENABLE EXTENSIONS
-- ============================================

-- pgvector for semantic search on memories
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm for text search fallback
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================
-- CREATE SCHEMA
-- ============================================

CREATE SCHEMA IF NOT EXISTS planning_studio;

-- ============================================
-- PROJECTS TABLE
-- Main project tracking for the idea pipeline
-- ============================================
CREATE TABLE planning_studio.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Basic info
  title VARCHAR(255) NOT NULL,
  one_liner TEXT,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'idea',
  -- Values: 'idea', 'planning', 'ready_to_build', 'building', 'shipped', 'archived'

  current_phase VARCHAR(50) DEFAULT 'capture',
  -- Values: 'capture', 'discover', 'define', 'develop', 'validate', 'package'

  phase_locked_until TIMESTAMPTZ,
  incubation_skipped BOOLEAN DEFAULT FALSE,

  -- Prioritization
  priority_score NUMERIC(5,2),
  priority_reasoning TEXT,
  priority_updated_at TIMESTAMPTZ,

  -- Build tracking (when in 'building' status)
  build_phase INTEGER,
  build_total_phases INTEGER,
  build_progress_percent INTEGER DEFAULT 0,
  claude_code_command TEXT,
  github_repo VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  ready_to_build_at TIMESTAMPTZ,
  build_started_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ,
  archive_reason TEXT
);

-- ============================================
-- USER_GOALS TABLE
-- User goals for AI prioritization
-- ============================================
CREATE TABLE planning_studio.user_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  goal_type VARCHAR(50) NOT NULL,
  -- Values: 'revenue', 'learning', 'strategic', 'quick_win', 'passion'

  description TEXT NOT NULL,
  priority INTEGER DEFAULT 5, -- 1-10 scale

  active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONFIG TABLE
-- System configuration key-value store
-- ============================================
CREATE TABLE planning_studio.config (
  key VARCHAR(100) PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- PHASES TABLE
-- Phase tracking for each project
-- ============================================
CREATE TABLE planning_studio.phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES planning_studio.projects(id) ON DELETE CASCADE,

  phase_type VARCHAR(50) NOT NULL,
  status VARCHAR(50) DEFAULT 'not_started',
  -- Values: 'not_started', 'in_progress', 'incubating', 'complete'

  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  incubation_ends_at TIMESTAMPTZ,

  -- AI assessment
  readiness_check_passed BOOLEAN,
  readiness_notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- CONVERSATIONS TABLE
-- Conversations within phases
-- ============================================
CREATE TABLE planning_studio.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES planning_studio.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES planning_studio.phases(id) ON DELETE CASCADE,

  title VARCHAR(255),
  summary TEXT, -- AI-generated summary after conversation ends

  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0
);

-- ============================================
-- MESSAGES TABLE
-- Individual messages in conversations
-- ============================================
CREATE TABLE planning_studio.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES planning_studio.conversations(id) ON DELETE CASCADE,

  role VARCHAR(20) NOT NULL, -- 'user', 'assistant'
  content TEXT NOT NULL,

  -- Metadata for special messages
  metadata JSONB DEFAULT '{}',
  -- Examples:
  -- { "type": "research_trigger", "query": "...", "research_id": "..." }
  -- { "type": "readiness_check", "passed": true }
  -- { "type": "phase_transition", "from": "discover", "to": "define" }

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- RESEARCH TABLE
-- Deep research runs (Perplexity integration)
-- ============================================
CREATE TABLE planning_studio.research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES planning_studio.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES planning_studio.phases(id),
  conversation_id UUID REFERENCES planning_studio.conversations(id),

  research_type VARCHAR(50) NOT NULL,
  -- Values: 'icp_deep_dive', 'competitive_analysis', 'market_research',
  --         'user_workflows', 'technical_feasibility', 'custom'

  query TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  -- Values: 'pending', 'running', 'complete', 'failed'

  -- Results
  raw_results JSONB,
  summary TEXT,
  key_findings JSONB, -- Array of extracted insights

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- ============================================
-- DOCUMENTS TABLE
-- Generated documents for projects
-- ============================================
CREATE TABLE planning_studio.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES planning_studio.projects(id) ON DELETE CASCADE,

  doc_type VARCHAR(50) NOT NULL,
  -- Values: 'icp', 'competitive_intel', 'lean_canvas', 'problem_statement',
  --         'feature_spec', 'technical_scope', 'gsd_project', 'gsd_requirements',
  --         'gsd_roadmap'

  content TEXT NOT NULL,
  version INTEGER DEFAULT 1,

  -- For GSD export
  file_path VARCHAR(255), -- e.g., '.planning/PROJECT.md'

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MEMORIES TABLE
-- AI-queryable memories for semantic search
-- ============================================
CREATE TABLE planning_studio.memories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES planning_studio.projects(id) ON DELETE CASCADE,
  phase_id UUID REFERENCES planning_studio.phases(id),
  conversation_id UUID REFERENCES planning_studio.conversations(id),

  memory_type VARCHAR(50) NOT NULL,
  -- Values: 'decision', 'inspiration', 'insight', 'pivot', 'research_finding',
  --         'constraint', 'user_preference', 'rejection_reason'

  content TEXT NOT NULL,
  summary TEXT,

  -- Vector embedding for semantic search (OpenAI text-embedding-3-small = 1536 dimensions)
  embedding VECTOR(1536),

  -- Rich metadata
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

-- Vector similarity search (HNSW for fast approximate nearest neighbor)
CREATE INDEX memories_embedding_idx
  ON planning_studio.memories
  USING hnsw (embedding vector_cosine_ops);

-- Common query indexes
CREATE INDEX projects_status_idx ON planning_studio.projects(status);
CREATE INDEX projects_current_phase_idx ON planning_studio.projects(current_phase);
CREATE INDEX phases_project_idx ON planning_studio.phases(project_id);
CREATE INDEX phases_project_type_idx ON planning_studio.phases(project_id, phase_type);
CREATE INDEX conversations_project_idx ON planning_studio.conversations(project_id);
CREATE INDEX conversations_phase_idx ON planning_studio.conversations(phase_id);
CREATE INDEX messages_conversation_idx ON planning_studio.messages(conversation_id);
CREATE INDEX messages_created_idx ON planning_studio.messages(created_at DESC);
CREATE INDEX documents_project_idx ON planning_studio.documents(project_id);
CREATE INDEX documents_type_idx ON planning_studio.documents(doc_type);
CREATE INDEX memories_project_idx ON planning_studio.memories(project_id);
CREATE INDEX memories_type_idx ON planning_studio.memories(memory_type);
CREATE INDEX research_project_idx ON planning_studio.research(project_id);
CREATE INDEX research_status_idx ON planning_studio.research(status);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION planning_studio.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Semantic search across all memories
CREATE OR REPLACE FUNCTION planning_studio.search_memories(
  query_embedding VECTOR(1536),
  match_count INT DEFAULT 10,
  filter_project_id UUID DEFAULT NULL,
  filter_memory_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  project_title TEXT,
  memory_type TEXT,
  content TEXT,
  summary TEXT,
  metadata JSONB,
  similarity FLOAT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.project_id,
    p.title::TEXT as project_title,
    m.memory_type::TEXT,
    m.content,
    m.summary,
    m.metadata,
    1 - (m.embedding <=> query_embedding) AS similarity,
    m.created_at
  FROM planning_studio.memories m
  JOIN planning_studio.projects p ON p.id = m.project_id
  WHERE
    m.embedding IS NOT NULL
    AND (filter_project_id IS NULL OR m.project_id = filter_project_id)
    AND (filter_memory_type IS NULL OR m.memory_type = filter_memory_type)
  ORDER BY m.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Get conversation context for Claude (for a specific phase)
CREATE OR REPLACE FUNCTION planning_studio.get_phase_context(
  p_project_id UUID,
  p_phase_type TEXT
)
RETURNS TABLE (
  conversation_summaries TEXT[],
  document_contents JSONB,
  recent_messages JSONB
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ARRAY(
      SELECT c.summary
      FROM planning_studio.conversations c
      JOIN planning_studio.phases ph ON ph.id = c.phase_id
      WHERE c.project_id = p_project_id
        AND ph.phase_type = p_phase_type
        AND c.summary IS NOT NULL
      ORDER BY c.started_at
    ) as conversation_summaries,
    (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'type', d.doc_type,
        'content', d.content,
        'version', d.version
      )), '[]'::jsonb)
      FROM planning_studio.documents d
      WHERE d.project_id = p_project_id
    ) as document_contents,
    (
      SELECT COALESCE(jsonb_agg(msg_data ORDER BY msg_created DESC), '[]'::jsonb)
      FROM (
        SELECT
          jsonb_build_object(
            'role', m.role,
            'content', m.content,
            'created_at', m.created_at
          ) as msg_data,
          m.created_at as msg_created
        FROM planning_studio.messages m
        JOIN planning_studio.conversations c ON c.id = m.conversation_id
        WHERE c.project_id = p_project_id
        ORDER BY m.created_at DESC
        LIMIT 10
      ) recent_msgs
    ) as recent_messages;
END;
$$;

-- Get project summary with phase progress
CREATE OR REPLACE FUNCTION planning_studio.get_project_summary(
  p_project_id UUID
)
RETURNS TABLE (
  project_id UUID,
  title VARCHAR(255),
  one_liner TEXT,
  status VARCHAR(50),
  current_phase VARCHAR(50),
  phase_locked_until TIMESTAMPTZ,
  priority_score NUMERIC(5,2),
  phases_completed INTEGER,
  total_phases INTEGER,
  conversation_count INTEGER,
  memory_count INTEGER,
  document_count INTEGER
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as project_id,
    p.title,
    p.one_liner,
    p.status,
    p.current_phase,
    p.phase_locked_until,
    p.priority_score,
    (SELECT COUNT(*)::INTEGER FROM planning_studio.phases ph WHERE ph.project_id = p.id AND ph.status = 'complete') as phases_completed,
    (SELECT COUNT(*)::INTEGER FROM planning_studio.phases ph WHERE ph.project_id = p.id) as total_phases,
    (SELECT COUNT(*)::INTEGER FROM planning_studio.conversations c WHERE c.project_id = p.id) as conversation_count,
    (SELECT COUNT(*)::INTEGER FROM planning_studio.memories m WHERE m.project_id = p.id) as memory_count,
    (SELECT COUNT(*)::INTEGER FROM planning_studio.documents d WHERE d.project_id = p.id) as document_count
  FROM planning_studio.projects p
  WHERE p.id = p_project_id;
END;
$$;

-- ============================================
-- TRIGGERS
-- ============================================

-- Auto-update updated_at for projects
CREATE TRIGGER projects_updated_at
  BEFORE UPDATE ON planning_studio.projects
  FOR EACH ROW EXECUTE FUNCTION planning_studio.update_updated_at();

-- Auto-update updated_at for user_goals
CREATE TRIGGER user_goals_updated_at
  BEFORE UPDATE ON planning_studio.user_goals
  FOR EACH ROW EXECUTE FUNCTION planning_studio.update_updated_at();

-- Auto-update updated_at for config
CREATE TRIGGER config_updated_at
  BEFORE UPDATE ON planning_studio.config
  FOR EACH ROW EXECUTE FUNCTION planning_studio.update_updated_at();

-- Auto-update updated_at for documents
CREATE TRIGGER documents_updated_at
  BEFORE UPDATE ON planning_studio.documents
  FOR EACH ROW EXECUTE FUNCTION planning_studio.update_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON SCHEMA planning_studio IS 'AI-guided idea-to-production pipeline with incubation periods and semantic memory';

COMMENT ON TABLE planning_studio.projects IS 'Main project tracking table for ideas moving through the planning pipeline';
COMMENT ON TABLE planning_studio.phases IS 'Phase tracking for each project (capture, discover, define, develop, validate, package)';
COMMENT ON TABLE planning_studio.conversations IS 'AI conversations within phases for guided planning';
COMMENT ON TABLE planning_studio.messages IS 'Individual messages in planning conversations';
COMMENT ON TABLE planning_studio.research IS 'Deep research runs using Perplexity API for market/competitor/user research';
COMMENT ON TABLE planning_studio.documents IS 'Generated planning documents (ICP, Lean Canvas, PRD, etc.)';
COMMENT ON TABLE planning_studio.memories IS 'AI-extractable memories with vector embeddings for semantic search';
COMMENT ON TABLE planning_studio.user_goals IS 'User goals that influence AI prioritization of projects';
COMMENT ON TABLE planning_studio.config IS 'System configuration key-value store';

COMMENT ON FUNCTION planning_studio.search_memories IS 'Semantic search across project memories using vector similarity';
COMMENT ON FUNCTION planning_studio.get_phase_context IS 'Get conversation context for Claude including summaries, documents, and recent messages';
COMMENT ON FUNCTION planning_studio.get_project_summary IS 'Get project summary with phase progress and counts';

COMMENT ON INDEX planning_studio.memories_embedding_idx IS 'HNSW index for fast approximate nearest neighbor vector search';
