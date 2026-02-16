-- LinkedIn Engine: Post-Publish Monitoring Schema
-- Phase 8: Adds post_incoming_comments table for tracking comments on our
-- published posts, monitoring columns on posts table for state-driven polling,
-- and grants for both n8n (anon) and dashboard (authenticated) access.

-- =============================================
-- 1. Create post_incoming_comments table
-- =============================================
CREATE TABLE IF NOT EXISTS linkedin_engine.post_incoming_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES linkedin_engine.posts(id),
  linkedin_comment_id TEXT,
  commenter_name TEXT,
  commenter_url TEXT,
  commenter_headline TEXT,
  comment_text TEXT NOT NULL,
  comment_posted_at TIMESTAMPTZ,
  comment_likes INT DEFAULT 0,
  comment_replies_count INT DEFAULT 0,
  comment_type TEXT,                 -- question, agreement, disagreement, addition, spam
  reply_suggestion TEXT,
  reply_posted BOOLEAN DEFAULT FALSE,
  reply_posted_at TIMESTAMPTZ,
  parent_comment_id UUID REFERENCES linkedin_engine.post_incoming_comments(id),
  thread_state TEXT DEFAULT 'new',   -- new, follow_up_sent, resolved
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  poll_sequence INT,
  notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. Indexes on post_incoming_comments
-- =============================================
CREATE INDEX IF NOT EXISTS idx_le_incoming_post ON linkedin_engine.post_incoming_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_le_incoming_type ON linkedin_engine.post_incoming_comments(comment_type);
CREATE UNIQUE INDEX IF NOT EXISTS idx_le_incoming_linkedin_id ON linkedin_engine.post_incoming_comments(linkedin_comment_id);
CREATE INDEX IF NOT EXISTS idx_le_incoming_thread ON linkedin_engine.post_incoming_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_le_incoming_detected ON linkedin_engine.post_incoming_comments(detected_at DESC);

-- =============================================
-- 3. Monitoring columns on posts table
-- =============================================
ALTER TABLE linkedin_engine.posts
  ADD COLUMN IF NOT EXISTS monitoring_status TEXT DEFAULT 'inactive',
  ADD COLUMN IF NOT EXISTS monitoring_started_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_polled_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS monitoring_ends_at TIMESTAMPTZ;

COMMENT ON COLUMN linkedin_engine.posts.monitoring_status IS
  'Post monitoring lifecycle: inactive, active, completed. Set to active when published.';

COMMENT ON COLUMN linkedin_engine.posts.monitoring_started_at IS
  'When monitoring began (typically matches published_at). Used for polling interval calculation.';

COMMENT ON COLUMN linkedin_engine.posts.last_polled_at IS
  'Last time WF7 polled this post for comments/analytics. Used to determine next poll time.';

COMMENT ON COLUMN linkedin_engine.posts.monitoring_ends_at IS
  'When monitoring window closes (published_at + 7 days). Posts past this date are skipped.';

-- =============================================
-- 4. Enable RLS on post_incoming_comments
-- =============================================
ALTER TABLE linkedin_engine.post_incoming_comments ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access" ON linkedin_engine.post_incoming_comments;
CREATE POLICY "Service role full access" ON linkedin_engine.post_incoming_comments
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated read access
DROP POLICY IF EXISTS "Authenticated read access" ON linkedin_engine.post_incoming_comments;
CREATE POLICY "Authenticated read access" ON linkedin_engine.post_incoming_comments
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 5. Anon grants for n8n workflows (CRITICAL)
-- n8n uses the anon key via httpHeaderAuth credential
-- =============================================

-- post_incoming_comments: n8n needs full CRUD for comment storage + dedup
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.post_incoming_comments TO anon;

-- posts: n8n needs SELECT (find monitored posts) + UPDATE (set monitoring columns)
GRANT SELECT, UPDATE ON linkedin_engine.posts TO anon;

-- post_analytics: n8n needs SELECT (read existing analytics) + INSERT (new analytics rows)
GRANT SELECT, INSERT ON linkedin_engine.post_analytics TO anon;

-- engagement_digests: n8n needs INSERT (viral boost warming entries)
-- (already granted in engagement_grants migration, but include for safety)
GRANT INSERT ON linkedin_engine.engagement_digests TO anon;

-- =============================================
-- 6. Anon RLS policies for monitoring tables
-- =============================================
DO $$
DECLARE
  _tables TEXT[] := ARRAY['post_incoming_comments', 'posts', 'post_analytics'];
  _t TEXT;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Anon full access for n8n" ON linkedin_engine.%I', _t);
    EXECUTE format('CREATE POLICY "Anon full access for n8n" ON linkedin_engine.%I FOR ALL TO anon USING (true) WITH CHECK (true)', _t);
  END LOOP;
END $$;

-- =============================================
-- 7. Authenticated grants for dashboard
-- =============================================
-- Dashboard needs to read incoming comments
GRANT SELECT ON linkedin_engine.post_incoming_comments TO authenticated;
