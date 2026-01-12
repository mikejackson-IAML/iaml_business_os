-- ============================================================================
-- CLEANUP: Remove partial campaign tables before re-running migration
-- ============================================================================
-- Run this ONLY if 002_campaign_tracking_tables.sql failed partway through.
-- This drops all campaign-related objects so you can run a fresh migration.
-- ============================================================================

-- Drop views first (they depend on tables)
DROP VIEW IF EXISTS contacts_for_branch_c CASCADE;
DROP VIEW IF EXISTS channel_performance CASCADE;
DROP VIEW IF EXISTS campaign_funnel CASCADE;

-- Drop triggers (must specify table they're on)
DROP TRIGGER IF EXISTS update_contacts_updated_at ON contacts;
DROP TRIGGER IF EXISTS update_multichannel_campaigns_updated_at ON multichannel_campaigns;
DROP TRIGGER IF EXISTS update_campaign_channels_updated_at ON campaign_channels;
DROP TRIGGER IF EXISTS update_campaign_contacts_updated_at ON campaign_contacts;
DROP TRIGGER IF EXISTS update_campaign_contact_channels_updated_at ON campaign_contact_channels;

-- Drop functions (specify full signature)
DROP FUNCTION IF EXISTS handle_opt_out(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS assign_ghl_branch(UUID, TEXT, TEXT) CASCADE;
DROP FUNCTION IF EXISTS update_contact_lifecycle_tag(UUID, TEXT, TEXT, TEXT) CASCADE;

-- Drop tables in reverse dependency order (child tables first)
DROP TABLE IF EXISTS campaign_activity CASCADE;
DROP TABLE IF EXISTS campaign_contact_channels CASCADE;
DROP TABLE IF EXISTS campaign_contacts CASCADE;
DROP TABLE IF EXISTS message_variants CASCADE;
DROP TABLE IF EXISTS campaign_messages CASCADE;
DROP TABLE IF EXISTS campaign_channels CASCADE;
DROP TABLE IF EXISTS multichannel_campaigns CASCADE;
DROP TABLE IF EXISTS contacts CASCADE;

-- Confirm cleanup
SELECT 'Cleanup complete. Now run 002_campaign_tracking_tables.sql' as status;
