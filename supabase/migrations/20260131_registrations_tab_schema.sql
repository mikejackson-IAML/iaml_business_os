-- Migration: Registrations Tab Schema Extensions
-- Purpose: Add cancellation tracking and Apollo enrichment columns for Phase 2
--
-- MANUAL RUN REQUIRED:
-- The Supabase CLI migration history is out of sync.
-- Please run this SQL manually in the Supabase Dashboard SQL Editor:
-- https://supabase.com/dashboard/project/mnkuffgxemfyitcjnjdc/sql/new

-- ============================================
-- 1. Registrations table extensions
-- ============================================

-- Cancellation tracking
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS refund_status TEXT DEFAULT 'not_applicable';
ALTER TABLE registrations ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);

-- Add comment for refund_status values
COMMENT ON COLUMN registrations.refund_status IS 'Values: not_applicable, pending, processed, denied';

-- ============================================
-- 2. Contacts table Apollo tracking
-- ============================================

ALTER TABLE contacts ADD COLUMN IF NOT EXISTS apollo_person_id TEXT;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS apollo_enriched_at TIMESTAMPTZ;
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS apollo_enrichment_data JSONB DEFAULT '{}';
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- ============================================
-- 3. Companies table Apollo tracking
-- ============================================

ALTER TABLE companies ADD COLUMN IF NOT EXISTS apollo_org_id TEXT;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS apollo_enriched_at TIMESTAMPTZ;
ALTER TABLE companies ADD COLUMN IF NOT EXISTS growth_30d NUMERIC(5,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS growth_60d NUMERIC(5,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS growth_90d NUMERIC(5,2);
ALTER TABLE companies ADD COLUMN IF NOT EXISTS technologies TEXT[];

-- ============================================
-- 4. Update registration_dashboard_summary view
-- ============================================

CREATE OR REPLACE VIEW registration_dashboard_summary AS
SELECT
  r.id,
  r.airtable_id,
  r.first_name,
  r.last_name,
  r.first_name || ' ' || r.last_name as full_name,
  r.email,
  r.phone,
  r.company_name,
  r.job_title,
  r.registration_date,
  r.registration_status,
  r.registration_code,
  r.payment_status,
  r.payment_method,
  r.final_price,
  r.attendance_type,
  r.selected_blocks,
  -- New columns for Phase 2
  r.registration_source,
  r.cancelled_at,
  r.cancellation_reason,
  r.refund_status,
  r.refund_amount,
  -- Program instance info
  pi.id as program_instance_id,
  pi.instance_name,
  pi.program_name,
  pi.format,
  pi.start_date,
  pi.end_date,
  pi.city,
  pi.state
FROM registrations r
LEFT JOIN program_instances pi ON pi.id = r.program_instance_id;

-- Grant select on the view
GRANT SELECT ON registration_dashboard_summary TO anon, authenticated;
