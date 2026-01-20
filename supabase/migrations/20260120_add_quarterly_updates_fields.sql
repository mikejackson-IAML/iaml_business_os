-- Add Quarterly Updates Access Tracking Fields to Contacts Table
-- Migration: 20260120_add_quarterly_updates_fields.sql
-- Purpose: Track alumni access to Quarterly Employment Law Updates
--
-- Fields:
-- - quarterly_updates_registered_at: When they claimed their alumni access
-- - quarterly_updates_access_expires: When their access expires
-- - quarterly_updates_access_type: 'legacy_alumni' or 'program_benefit'

-- Add columns to contacts table
ALTER TABLE contacts
ADD COLUMN IF NOT EXISTS quarterly_updates_registered_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quarterly_updates_access_expires TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS quarterly_updates_access_type TEXT;

-- Add check constraint for access_type
ALTER TABLE contacts
ADD CONSTRAINT contacts_quarterly_updates_access_type_check
CHECK (quarterly_updates_access_type IS NULL OR quarterly_updates_access_type IN ('legacy_alumni', 'program_benefit'));

-- Create index for efficient queries on access status
CREATE INDEX IF NOT EXISTS idx_contacts_quarterly_updates_access
ON contacts (quarterly_updates_access_expires)
WHERE quarterly_updates_registered_at IS NOT NULL;

-- Add comments
COMMENT ON COLUMN contacts.quarterly_updates_registered_at IS 'When the contact registered for Quarterly Updates access';
COMMENT ON COLUMN contacts.quarterly_updates_access_expires IS 'When their Quarterly Updates access expires';
COMMENT ON COLUMN contacts.quarterly_updates_access_type IS 'Type of access: legacy_alumni (claimed retroactively) or program_benefit (granted at program completion)';
