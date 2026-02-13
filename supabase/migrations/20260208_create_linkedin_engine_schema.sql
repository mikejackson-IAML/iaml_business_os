-- LinkedIn Content Engine Schema
-- Creates the linkedin_engine schema with all tables for research, topic scoring,
-- content generation, publishing, engagement, and analytics.

-- Schema
CREATE SCHEMA IF NOT EXISTS linkedin_engine;

-- Raw research data from daily RSS + weekly deep research
CREATE TABLE IF NOT EXISTS linkedin_engine.research_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- reddit, linkedin, shrm, hr_dive, eeoc, dol, rss
  source_url TEXT,
  title TEXT,
  body_text TEXT,
  author TEXT,
  platform_engagement JSONB, -- {upvotes, comments, likes, shares, etc.}
  keywords TEXT[],
  topic_category TEXT, -- ai_compliance, ai_hiring, surveillance, employment_law, hr_tech
  sentiment TEXT, -- positive, negative, neutral, concerned, confused
  collected_date TIMESTAMPTZ DEFAULT NOW(),
  signal_week DATE, -- Monday of the week this signal belongs to
  processed BOOLEAN DEFAULT FALSE
);

-- Scored and recommended topics
CREATE TABLE IF NOT EXISTS linkedin_engine.topic_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of DATE NOT NULL,
  topic_title TEXT NOT NULL,
  angle TEXT,
  total_score INT,
  engagement_score INT,
  freshness_score INT,
  gap_score INT,
  positioning_score INT,
  format_score INT,
  recommended_format TEXT, -- text, carousel, data_graphic
  recommended_series TEXT, -- not_being_told, compliance_radar, ask_ai_guy, flex
  hook_suggestion TEXT,
  key_data_points JSONB,
  source_signal_ids UUID[],
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated and published posts
CREATE TABLE IF NOT EXISTS linkedin_engine.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES linkedin_engine.topic_recommendations(id),
  linkedin_post_id TEXT, -- from LinkedIn after publishing
  hook_text TEXT,
  hook_category TEXT, -- data, contrarian, observation, question, story
  hook_variation TEXT, -- A, B, or C
  full_text TEXT NOT NULL,
  first_comment_text TEXT,
  format TEXT, -- text, carousel, data_graphic
  series TEXT, -- content pillar
  carousel_pdf_url TEXT,
  hashtags TEXT[],
  tagged_people TEXT[],
  status TEXT DEFAULT 'draft', -- draft, approved, scheduled, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post performance analytics
CREATE TABLE IF NOT EXISTS linkedin_engine.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES linkedin_engine.posts(id),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  impressions INT,
  reactions_total INT,
  reactions_by_type JSONB, -- {like: X, celebrate: X, support: X, etc.}
  comments_count INT,
  shares_count INT,
  engagement_rate FLOAT,
  profile_views_day INT,
  new_followers_day INT,
  click_through_rate FLOAT,
  hours_since_publish FLOAT
);

-- Hook library
CREATE TABLE IF NOT EXISTS linkedin_engine.hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hook_text TEXT NOT NULL,
  hook_category TEXT, -- data, contrarian, observation, question, story
  character_count INT,
  source TEXT, -- mike_original, external_linkedin, ai_generated
  source_post_url TEXT,
  source_engagement JSONB,
  times_used INT DEFAULT 0,
  avg_engagement_rate FLOAT,
  best_engagement_rate FLOAT,
  last_used_date DATE,
  topic_category TEXT,
  post_id UUID REFERENCES linkedin_engine.posts(id),
  score FLOAT DEFAULT 50.0,
  status TEXT DEFAULT 'active', -- active, retired
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement network (people to monitor and engage with)
CREATE TABLE IF NOT EXISTS linkedin_engine.engagement_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_name TEXT NOT NULL,
  linkedin_url TEXT,
  linkedin_headline TEXT,
  follower_count INT,
  tier TEXT, -- tier_1, tier_2
  category TEXT, -- hr_leader, employment_attorney, ai_policy, hr_tech, journalist
  engagement_history JSONB,
  last_monitored TIMESTAMPTZ,
  last_engaged TIMESTAMPTZ,
  avg_post_engagement FLOAT,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment tracking (Mike's comments on others' posts)
CREATE TABLE IF NOT EXISTS linkedin_engine.comment_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_post_url TEXT,
  target_author TEXT,
  target_author_followers INT,
  comment_text TEXT,
  commented_at TIMESTAMPTZ,
  likes_received INT DEFAULT 0,
  replies_received INT DEFAULT 0,
  profile_visits_driven INT,
  connection_requests_driven INT,
  roi_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content calendar
CREATE TABLE IF NOT EXISTS linkedin_engine.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of DATE,
  post_date DATE NOT NULL,
  day_of_week TEXT, -- tuesday, wednesday, thursday, friday
  series TEXT, -- not_being_told, compliance_radar, ask_ai_guy, flex
  recommended_format TEXT,
  topic_id UUID REFERENCES linkedin_engine.topic_recommendations(id),
  post_id UUID REFERENCES linkedin_engine.posts(id),
  status TEXT DEFAULT 'open', -- open, assigned, generated, approved, published
  notes TEXT
);

-- Weekly analytics summaries
CREATE TABLE IF NOT EXISTS linkedin_engine.weekly_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of DATE NOT NULL,
  total_posts INT,
  total_impressions INT,
  total_reactions INT,
  total_comments INT,
  total_shares INT,
  avg_engagement_rate FLOAT,
  best_post_id UUID REFERENCES linkedin_engine.posts(id),
  worst_post_id UUID REFERENCES linkedin_engine.posts(id),
  new_followers INT,
  total_profile_views INT,
  format_performance JSONB, -- {text: X%, carousel: X%}
  topic_performance JSONB, -- {ai_compliance: X%, ai_hiring: X%}
  hook_performance JSONB, -- {data: X%, contrarian: X%}
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution tracking
CREATE TABLE IF NOT EXISTS linkedin_engine.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  n8n_execution_id TEXT,
  status TEXT DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  items_processed INT,
  error_message TEXT,
  metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_le_signals_week ON linkedin_engine.research_signals(signal_week);
CREATE INDEX IF NOT EXISTS idx_le_signals_source ON linkedin_engine.research_signals(source);
CREATE INDEX IF NOT EXISTS idx_le_signals_processed ON linkedin_engine.research_signals(processed);
CREATE INDEX IF NOT EXISTS idx_le_topics_week ON linkedin_engine.topic_recommendations(week_of);
CREATE INDEX IF NOT EXISTS idx_le_topics_status ON linkedin_engine.topic_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_le_posts_status ON linkedin_engine.posts(status);
CREATE INDEX IF NOT EXISTS idx_le_posts_published ON linkedin_engine.posts(published_at);
CREATE INDEX IF NOT EXISTS idx_le_hooks_category ON linkedin_engine.hooks(hook_category);
CREATE INDEX IF NOT EXISTS idx_le_hooks_score ON linkedin_engine.hooks(score DESC);
CREATE INDEX IF NOT EXISTS idx_le_hooks_status ON linkedin_engine.hooks(status);
CREATE INDEX IF NOT EXISTS idx_le_analytics_post ON linkedin_engine.post_analytics(post_id);
CREATE INDEX IF NOT EXISTS idx_le_calendar_date ON linkedin_engine.content_calendar(post_date);
CREATE INDEX IF NOT EXISTS idx_le_calendar_week ON linkedin_engine.content_calendar(week_of);
CREATE INDEX IF NOT EXISTS idx_le_engagement_tier ON linkedin_engine.engagement_network(tier);
CREATE INDEX IF NOT EXISTS idx_le_workflow_runs_name ON linkedin_engine.workflow_runs(workflow_name);

-- RLS policies (allow service role full access, anon read for dashboard)
-- ENABLE ROW LEVEL SECURITY is idempotent
ALTER TABLE linkedin_engine.research_signals ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.topic_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.post_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.hooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.engagement_network ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.comment_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.content_calendar ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.weekly_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE linkedin_engine.workflow_runs ENABLE ROW LEVEL SECURITY;

-- Idempotent policy creation (drop if exists, then create)
DO $$
DECLARE
  _tables TEXT[] := ARRAY[
    'research_signals', 'topic_recommendations', 'posts', 'post_analytics',
    'hooks', 'engagement_network', 'comment_activity', 'content_calendar',
    'weekly_analytics', 'workflow_runs'
  ];
  _t TEXT;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    -- Drop existing policies to avoid duplicates
    EXECUTE format('DROP POLICY IF EXISTS "Service role full access" ON linkedin_engine.%I', _t);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated read access" ON linkedin_engine.%I', _t);
    -- Create service role policy
    EXECUTE format('CREATE POLICY "Service role full access" ON linkedin_engine.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', _t);
    -- Create authenticated read policy
    EXECUTE format('CREATE POLICY "Authenticated read access" ON linkedin_engine.%I FOR SELECT TO authenticated USING (true)', _t);
  END LOOP;

  -- Drop and recreate update policies
  DROP POLICY IF EXISTS "Authenticated update topics" ON linkedin_engine.topic_recommendations;
  CREATE POLICY "Authenticated update topics" ON linkedin_engine.topic_recommendations FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Authenticated update posts" ON linkedin_engine.posts;
  CREATE POLICY "Authenticated update posts" ON linkedin_engine.posts FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "Authenticated update calendar" ON linkedin_engine.content_calendar;
  CREATE POLICY "Authenticated update calendar" ON linkedin_engine.content_calendar FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
END $$;

-- Grant schema usage
GRANT USAGE ON SCHEMA linkedin_engine TO authenticated;
GRANT USAGE ON SCHEMA linkedin_engine TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA linkedin_engine TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA linkedin_engine TO authenticated;
GRANT UPDATE ON linkedin_engine.topic_recommendations TO authenticated;
GRANT UPDATE ON linkedin_engine.posts TO authenticated;
GRANT UPDATE ON linkedin_engine.content_calendar TO authenticated;
