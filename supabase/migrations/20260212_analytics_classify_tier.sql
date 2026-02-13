-- ============================================================================
-- MIGRATION: Analytics Foundation (Marketing Analytics Dashboard)
-- ============================================================================
-- Part of: Marketing Analytics Dashboard project
-- Purpose: Creates the foundational building blocks for the analytics layer:
--   1. classify_tier() - Regex-based job title classification for global tier filter
--   2. analytics_sync_log - Tracks data freshness per platform for dashboard badge
--   3. conversion_attributed_channel - Deduplication column on campaign_contacts
--
-- Dependencies: 002_campaign_tracking_tables.sql (campaign_contacts table)
-- Used by: All subsequent analytics materialized views and RPC functions
-- ============================================================================

-- ============================================================================
-- 1. CLASSIFY_TIER() FUNCTION
-- ============================================================================
-- Classifies a contact's job title into one of four tiers used by the global
-- tier filter on the analytics dashboard. Marked IMMUTABLE because the same
-- input always produces the same output, allowing PostgreSQL to optimize
-- materialized view creation and index usage.
--
-- Tier mapping (CASE order matters - first match wins):
--   directors  : director, vp, vice president, svp, chief, C-suite, general counsel
--   executives : executive, president, partner, principal, owner, managing, head of
--   managers   : manager, supervisor, lead, coordinator, administrator, specialist, analyst
--   other      : anything that doesn't match above
--   unknown    : NULL input
--
-- Key L&D title examples:
--   "VP of Learning and Development"    -> directors  (matches "vp ")
--   "Chief Learning Officer"            -> directors  (matches "chief ")
--   "Executive Director of Training"    -> directors  (matches "director", checked FIRST)
--   "Managing Partner"                  -> executives (matches "managing")
--   "Head of Talent Development"        -> executives (matches "head of")
--   "Training Manager"                  -> managers   (matches "manager")
--   "L&D Coordinator"                   -> managers   (matches "coordinator")
--   "Senior Consultant"                 -> other      (no match)
-- ============================================================================

CREATE OR REPLACE FUNCTION classify_tier(p_job_title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN CASE
    WHEN p_job_title IS NULL THEN 'unknown'
    WHEN p_job_title ~* '(director|vp |vice president|svp |chief |ceo|coo|cfo|cpo|clo|general counsel)'
      THEN 'directors'
    WHEN p_job_title ~* '(executive|president|partner|principal|owner|managing|head of)'
      THEN 'executives'
    WHEN p_job_title ~* '(manager|supervisor|lead |coordinator|administrator|specialist|analyst)'
      THEN 'managers'
    ELSE 'other'
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION classify_tier IS 'Classifies job title into tier (directors/executives/managers/other/unknown) for analytics dashboard global filter. IMMUTABLE for materialized view optimization.';

-- ============================================================================
-- 2. ANALYTICS_SYNC_LOG TABLE
-- ============================================================================
-- Tracks when each data source was last synced. Powers the "last updated"
-- badge on the analytics dashboard. Sync workflows use INSERT ... ON CONFLICT
-- (source) DO UPDATE to upsert after each successful sync.
--
-- Expected source values: 'smartlead', 'heyreach', 'ghl', 'matview_refresh'
-- ============================================================================

CREATE TABLE IF NOT EXISTS analytics_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL UNIQUE,
  last_sync_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  records_synced INTEGER DEFAULT 0,
  status TEXT DEFAULT 'success',
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE analytics_sync_log IS 'Tracks data freshness per platform for dashboard sync status badge. One row per source, upserted on each sync.';

-- ============================================================================
-- 3. CONVERSION ATTRIBUTION COLUMN ON CAMPAIGN_CONTACTS
-- ============================================================================
-- Records which channel gets credit for a registration. Set exactly once when
-- quarterly_update_registered is set to TRUE. The application logic (in n8n
-- sync workflows) is responsible for setting this atomically with the
-- registration flag. This enforces SCHEMA-06: one contact = one registration
-- = one attributed channel.
-- ============================================================================

ALTER TABLE campaign_contacts
  ADD COLUMN IF NOT EXISTS conversion_attributed_channel TEXT;

COMMENT ON COLUMN campaign_contacts.conversion_attributed_channel IS 'Channel credited for this contact''s registration. Set exactly once when quarterly_update_registered becomes TRUE. Do not overwrite once set.';

-- Partial index for analytics queries that filter on attributed channel
CREATE INDEX IF NOT EXISTS idx_campaign_contacts_conversion_channel
  ON campaign_contacts(conversion_attributed_channel)
  WHERE conversion_attributed_channel IS NOT NULL;
