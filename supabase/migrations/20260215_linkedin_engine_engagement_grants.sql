-- LinkedIn Engine: Engagement Digests table + anon/authenticated grants
-- Created for WF6 Engagement Engine (Phase 7)
-- Adds engagement_digests table and grants anon access to engagement tables
-- so n8n workflows (using httpHeaderAuth / anon key) can read/write.

-- =============================================
-- 1. Create engagement_digests table
-- =============================================
CREATE TABLE IF NOT EXISTS linkedin_engine.engagement_digests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  digest_date DATE NOT NULL,
  digest_type TEXT NOT NULL DEFAULT 'daily', -- 'daily' or 'warming'
  target_post_url TEXT,
  target_post_content TEXT,
  target_author TEXT,
  target_author_url TEXT,
  target_author_followers INT,
  network_contact_id UUID REFERENCES linkedin_engine.engagement_network(id),
  post_engagement JSONB, -- {likes, comments, shares}
  comment_suggestions JSONB, -- [{style: "insight", text: "..."}, {style: "question", text: "..."}]
  status TEXT DEFAULT 'pending', -- pending, completed, skipped
  completed_at TIMESTAMPTZ,
  warming_context TEXT, -- only for warming type: upcoming post topic context
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. Indexes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_le_digest_date ON linkedin_engine.engagement_digests(digest_date);
CREATE INDEX IF NOT EXISTS idx_le_digest_type ON linkedin_engine.engagement_digests(digest_type);
CREATE INDEX IF NOT EXISTS idx_le_digest_contact ON linkedin_engine.engagement_digests(network_contact_id);

-- =============================================
-- 3. Enable RLS on engagement_digests
-- =============================================
ALTER TABLE linkedin_engine.engagement_digests ENABLE ROW LEVEL SECURITY;

-- Service role full access
DROP POLICY IF EXISTS "Service role full access" ON linkedin_engine.engagement_digests;
CREATE POLICY "Service role full access" ON linkedin_engine.engagement_digests
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Authenticated read access
DROP POLICY IF EXISTS "Authenticated read access" ON linkedin_engine.engagement_digests;
CREATE POLICY "Authenticated read access" ON linkedin_engine.engagement_digests
  FOR SELECT TO authenticated USING (true);

-- =============================================
-- 4. Anon grants for n8n workflows (CRITICAL)
-- engagement_network, comment_activity, and engagement_digests
-- n8n uses the anon key via httpHeaderAuth credential Dy6aCSbL5Tup4TnE
-- =============================================
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.engagement_network TO anon;
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.comment_activity TO anon;
GRANT SELECT, INSERT, UPDATE ON linkedin_engine.engagement_digests TO anon;

-- =============================================
-- 5. Anon RLS policies for engagement tables
-- Same pattern as 20260214_linkedin_engine_anon_rls.sql
-- =============================================
DO $$
DECLARE
  _tables TEXT[] := ARRAY['engagement_network', 'comment_activity', 'engagement_digests'];
  _t TEXT;
BEGIN
  FOREACH _t IN ARRAY _tables LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Anon full access for n8n" ON linkedin_engine.%I', _t);
    EXECUTE format('CREATE POLICY "Anon full access for n8n" ON linkedin_engine.%I FOR ALL TO anon USING (true) WITH CHECK (true)', _t);
  END LOOP;
END $$;

-- =============================================
-- 6. Authenticated grants for dashboard CRUD
-- engagement_network: full CRUD for network management
-- engagement_digests: UPDATE for status changes (pending -> completed/skipped)
-- =============================================
GRANT INSERT, UPDATE, DELETE ON linkedin_engine.engagement_network TO authenticated;
GRANT UPDATE ON linkedin_engine.engagement_digests TO authenticated;
