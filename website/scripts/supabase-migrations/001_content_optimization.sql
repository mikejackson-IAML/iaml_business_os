-- Content Optimization System Tables
-- Run this migration in Supabase SQL Editor
-- Project: IAML Business OS

-- ============================================
-- Table: content_insights
-- Stores aggregated data from quiz responses,
-- registrations, and SEO sources
-- ============================================

CREATE TABLE IF NOT EXISTS content_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Classification
  insight_type TEXT NOT NULL CHECK (insight_type IN (
    'challenge',     -- What challenges brought users here
    'role',          -- User role distribution
    'goal',          -- What users want to learn
    'format',        -- Preferred learning format
    'seo',           -- SEO performance metrics
    'conversion',    -- Page conversion metrics
    'keyword'        -- Keyword performance
  )),

  source TEXT NOT NULL CHECK (source IN (
    'quiz',           -- From website quiz
    'ghl',            -- From GoHighLevel contacts
    'registration',   -- From registration data
    'search_console', -- From Google Search Console
    'dataforseo',     -- From DataForSEO research
    'lighthouse',     -- From Lighthouse audits
    'manual'          -- Manually entered
  )),

  -- The actual data payload
  data JSONB NOT NULL,

  -- Metadata
  period TEXT CHECK (period IN ('daily', 'weekly', 'monthly', 'all_time')),
  page_path TEXT,  -- Optional: specific page this insight relates to

  -- Timestamps
  aggregated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for common queries
CREATE INDEX idx_content_insights_type ON content_insights(insight_type);
CREATE INDEX idx_content_insights_source ON content_insights(source);
CREATE INDEX idx_content_insights_period ON content_insights(period);
CREATE INDEX idx_content_insights_page ON content_insights(page_path);

-- ============================================
-- Table: content_recommendations
-- Stores generated content optimization
-- recommendations for approval workflow
-- ============================================

CREATE TABLE IF NOT EXISTS content_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Target
  page_path TEXT NOT NULL,
  element_selector TEXT,  -- CSS selector for specific element
  content_type TEXT CHECK (content_type IN (
    'meta_title',
    'meta_description',
    'hero_headline',
    'hero_description',
    'cta_button',
    'section_headline',
    'body_copy',
    'faq_answer',
    'testimonial_section',
    'schema_markup',
    'full_rewrite'
  )),

  -- Classification
  recommendation_type TEXT NOT NULL CHECK (recommendation_type IN (
    'seo',           -- SEO-driven optimization
    'conversion',    -- Conversion-driven optimization
    'brand_voice',   -- Brand voice alignment
    'data_driven',   -- Based on quiz/user data
    'accessibility', -- A11y improvement
    'performance'    -- Page performance
  )),

  priority TEXT NOT NULL CHECK (priority IN ('high', 'medium', 'low')),

  -- Content
  current_content TEXT,
  suggested_content TEXT NOT NULL,
  rationale TEXT NOT NULL,

  -- Data backing
  data_sources JSONB,  -- Array of sources that informed this
  metrics JSONB,       -- Relevant metrics (search volume, CTR, etc.)

  -- Workflow
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending',    -- Awaiting review
    'approved',   -- Approved, ready to apply
    'rejected',   -- Rejected, won't apply
    'applied',    -- Successfully applied
    'failed'      -- Application failed
  )),

  -- Audit trail
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,     -- Claude session or manual
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  applied_at TIMESTAMPTZ,
  applied_by TEXT,

  -- Git integration
  branch_name TEXT,
  commit_hash TEXT,

  -- Notes
  notes TEXT
);

-- Indexes for common queries
CREATE INDEX idx_content_recommendations_page ON content_recommendations(page_path);
CREATE INDEX idx_content_recommendations_status ON content_recommendations(status);
CREATE INDEX idx_content_recommendations_type ON content_recommendations(recommendation_type);
CREATE INDEX idx_content_recommendations_priority ON content_recommendations(priority);
CREATE INDEX idx_content_recommendations_pending ON content_recommendations(status)
  WHERE status = 'pending';

-- ============================================
-- Table: content_audits
-- Stores historical audit results for tracking
-- ============================================

CREATE TABLE IF NOT EXISTS content_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  page_path TEXT NOT NULL,
  audit_type TEXT NOT NULL CHECK (audit_type IN (
    'brand_voice',
    'seo',
    'lighthouse',
    'accessibility',
    'full'
  )),

  -- Scores
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  scores JSONB,  -- Detailed breakdown

  -- Issues found
  issues_count INTEGER DEFAULT 0,
  issues JSONB,  -- Array of issues

  -- Recommendations generated
  recommendations_count INTEGER DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

CREATE INDEX idx_content_audits_page ON content_audits(page_path);
CREATE INDEX idx_content_audits_type ON content_audits(audit_type);
CREATE INDEX idx_content_audits_created ON content_audits(created_at DESC);

-- ============================================
-- Table: brand_voice_config
-- Stores brand voice rules for programmatic checking
-- (Synced from Notion, used for fast lookups)
-- ============================================

CREATE TABLE IF NOT EXISTS brand_voice_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  config_type TEXT NOT NULL CHECK (config_type IN (
    'preferred_terms',
    'avoid_terms',
    'messaging_pillars',
    'tone_rules',
    'copy_patterns'
  )),

  data JSONB NOT NULL,

  -- Sync tracking
  notion_page_id TEXT,
  synced_at TIMESTAMPTZ DEFAULT NOW(),

  -- Versioning
  version INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX idx_brand_voice_config_type ON brand_voice_config(config_type);
CREATE INDEX idx_brand_voice_config_active ON brand_voice_config(is_active)
  WHERE is_active = true;

-- ============================================
-- Views for common queries
-- ============================================

-- Pending recommendations by priority
CREATE OR REPLACE VIEW v_pending_recommendations AS
SELECT
  id,
  page_path,
  content_type,
  recommendation_type,
  priority,
  LEFT(current_content, 100) as current_preview,
  LEFT(suggested_content, 100) as suggested_preview,
  created_at
FROM content_recommendations
WHERE status = 'pending'
ORDER BY
  CASE priority
    WHEN 'high' THEN 1
    WHEN 'medium' THEN 2
    WHEN 'low' THEN 3
  END,
  created_at DESC;

-- Latest insights by type
CREATE OR REPLACE VIEW v_latest_insights AS
SELECT DISTINCT ON (insight_type, source)
  id,
  insight_type,
  source,
  data,
  period,
  aggregated_at
FROM content_insights
ORDER BY insight_type, source, aggregated_at DESC;

-- Page health summary
CREATE OR REPLACE VIEW v_page_health AS
SELECT
  page_path,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_recommendations,
  COUNT(*) FILTER (WHERE status = 'approved') as approved_recommendations,
  COUNT(*) FILTER (WHERE status = 'applied') as applied_recommendations,
  MAX(created_at) as last_recommendation_at
FROM content_recommendations
GROUP BY page_path
ORDER BY pending_recommendations DESC;

-- ============================================
-- RLS Policies (optional, for security)
-- ============================================

-- Enable RLS on tables (uncomment if using Supabase auth)
-- ALTER TABLE content_insights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE content_audits ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE brand_voice_config ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Seed data for brand voice config
-- ============================================

INSERT INTO brand_voice_config (config_type, data, version) VALUES
(
  'preferred_terms',
  '{
    "program": ["certificate program", "program"],
    "faculty": ["faculty", "practicing attorneys"],
    "participants": ["participants", "HR professionals", "attendees"],
    "learning": ["master", "build expertise", "transform"],
    "outcomes": ["protect your organization", "navigate with confidence", "defensible outcomes"]
  }'::jsonb,
  1
),
(
  'avoid_terms',
  '{
    "never_use": ["course", "class", "training seminar", "webinar", "teachers", "students", "tricks", "hacks", "easy", "simple"],
    "use_sparingly": ["best", "comprehensive", "world-class", "cutting-edge"]
  }'::jsonb,
  1
),
(
  'messaging_pillars',
  '{
    "expertise": {
      "tagline": "Practicing attorneys, not academics",
      "proof_points": ["taught by attorneys who argue these cases daily", "faculty handle thousands of employment cases annually"]
    },
    "practical_application": {
      "tagline": "Ready to apply Monday morning",
      "proof_points": ["walk away with policies you can implement immediately", "includes templates and checklists"]
    },
    "ongoing_support": {
      "tagline": "Not just a program, a partnership",
      "proof_points": ["join 50,000+ HR professionals in our alumni network", "receive annual updates on major law changes"]
    },
    "credentials": {
      "tagline": "Advance your career while protecting your organization",
      "proof_points": ["earn up to 35.75 SHRM/HRCI credits", "qualifies for continuing legal education"]
    }
  }'::jsonb,
  1
),
(
  'tone_rules',
  '{
    "attributes": {
      "authoritative": {"do": "Speak with confidence based on expertise", "dont": "Lecture, condescend, use jargon to impress"},
      "approachable": {"do": "Use you language, be conversational", "dont": "Be stiff, use passive voice"},
      "urgent": {"do": "Highlight consequences of inaction", "dont": "Fear-monger, exaggerate risks"},
      "practical": {"do": "Focus on application, use real examples", "dont": "Get theoretical, cite studies without context"},
      "supportive": {"do": "Emphasize ongoing relationship, community", "dont": "Make it feel transactional"}
    }
  }'::jsonb,
  1
);

-- ============================================
-- Success message
-- ============================================
DO $$
BEGIN
  RAISE NOTICE 'Content Optimization System tables created successfully!';
  RAISE NOTICE 'Tables: content_insights, content_recommendations, content_audits, brand_voice_config';
  RAISE NOTICE 'Views: v_pending_recommendations, v_latest_insights, v_page_health';
END $$;
