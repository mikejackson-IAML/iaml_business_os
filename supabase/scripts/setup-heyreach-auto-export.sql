-- Setup HeyReach Auto-Export System
-- Run this in Supabase SQL editor
-- Created: 2026-01-19

-- ============================================
-- 1. CREATE EXPORT TRACKING TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS contact_heyreach_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES contacts(id) ON DELETE CASCADE,
  segment_code TEXT NOT NULL,
  heyreach_list_id TEXT NOT NULL,
  exported_at TIMESTAMPTZ DEFAULT NOW(),
  export_count INTEGER DEFAULT 1,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(contact_id, heyreach_list_id)
);

CREATE INDEX idx_heyreach_exports_contact ON contact_heyreach_exports(contact_id);
CREATE INDEX idx_heyreach_exports_segment ON contact_heyreach_exports(segment_code);
CREATE INDEX idx_heyreach_exports_date ON contact_heyreach_exports(exported_at DESC);

COMMENT ON TABLE contact_heyreach_exports IS 'Tracks which contacts have been exported to which HeyReach lists';

-- ============================================
-- 2. ADD has_company_alumni FLAG TO CONTACTS (if not exists)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contacts' AND column_name = 'has_company_alumni'
  ) THEN
    ALTER TABLE contacts ADD COLUMN has_company_alumni BOOLEAN DEFAULT FALSE;
    COMMENT ON COLUMN contacts.has_company_alumni IS 'True if this lead works at a company where we have past participants';
  END IF;
END $$;

-- ============================================
-- 3. CREATE FUNCTION TO CALL N8N WEBHOOK
-- ============================================
CREATE OR REPLACE FUNCTION notify_heyreach_export()
RETURNS TRIGGER AS $$
DECLARE
  webhook_url TEXT := 'https://n8n.realtyamp.ai/webhook/supabase-to-heyreach';
BEGIN
  -- Only trigger for contacts with LinkedIn URLs
  IF NEW.linkedin_url IS NOT NULL AND NEW.linkedin_url != '' THEN
    -- Check if already exported to avoid duplicates
    IF NOT EXISTS (
      SELECT 1 FROM contact_heyreach_exports
      WHERE contact_id = NEW.id
    ) THEN
      -- Call n8n webhook (fire and forget)
      PERFORM net.http_post(
        url := webhook_url,
        headers := '{"Content-Type": "application/json"}'::jsonb,
        body := jsonb_build_object(
          'record', jsonb_build_object(
            'id', NEW.id,
            'first_name', NEW.first_name,
            'last_name', NEW.last_name,
            'email', NEW.email,
            'company', NEW.company,
            'job_title', NEW.job_title,
            'linkedin_url', NEW.linkedin_url,
            'lifecycle_stage', NEW.lifecycle_stage,
            'email_validation_result', NEW.email_validation_result,
            'has_company_alumni', COALESCE(NEW.has_company_alumni, FALSE)
          )
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 4. CREATE TRIGGER ON CONTACTS TABLE
-- ============================================
DROP TRIGGER IF EXISTS trigger_heyreach_export ON contacts;

CREATE TRIGGER trigger_heyreach_export
  AFTER INSERT ON contacts
  FOR EACH ROW
  EXECUTE FUNCTION notify_heyreach_export();

-- ============================================
-- 5. VERIFY SETUP
-- ============================================
SELECT 'Setup complete!' as status;

-- Show table counts
SELECT
  'contact_heyreach_exports' as table_name,
  COUNT(*) as row_count
FROM contact_heyreach_exports

UNION ALL

SELECT
  'heyreach_routing' as table_name,
  COUNT(*) as row_count
FROM heyreach_routing;

-- Show routing config
SELECT segment_code, segment_name, heyreach_list_id, is_active
FROM heyreach_routing
ORDER BY segment_code;
