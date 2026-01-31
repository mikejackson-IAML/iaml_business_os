-- ============================================
-- Automatic Apollo Enrichment on Registration
-- PROG-65: Apollo auto-enrichment on registration
-- ============================================

-- Enable pg_net extension if not already enabled
-- Note: Requires Supabase Pro plan or higher
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function to trigger Apollo enrichment via HTTP
CREATE OR REPLACE FUNCTION trigger_apollo_enrichment()
RETURNS TRIGGER AS $$
DECLARE
  contact_email TEXT;
  contact_first_name TEXT;
  contact_last_name TEXT;
  api_url TEXT;
  request_body JSONB;
BEGIN
  -- Get contact details from the registration
  SELECT
    c.email,
    c.first_name,
    c.last_name
  INTO
    contact_email,
    contact_first_name,
    contact_last_name
  FROM contacts c
  WHERE c.id = NEW.contact_id;

  -- Skip if no email found
  IF contact_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Skip if contact was recently enriched (within 24 hours)
  -- This check is also done in the API, but we can save the HTTP call
  IF EXISTS (
    SELECT 1 FROM contacts
    WHERE id = NEW.contact_id
    AND apollo_enriched_at > NOW() - INTERVAL '24 hours'
  ) THEN
    RETURN NEW;
  END IF;

  -- Build the API URL (use environment variable or config table)
  -- Default to production URL, override in development
  api_url := COALESCE(
    current_setting('app.api_base_url', true),
    'https://your-domain.com'
  ) || '/api/apollo/enrich';

  -- Build request body
  request_body := jsonb_build_object(
    'email', contact_email,
    'firstName', contact_first_name,
    'lastName', contact_last_name
  );

  -- Make async HTTP POST request using pg_net
  -- This is non-blocking and won't slow down the insert
  PERFORM net.http_post(
    url := api_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json'
    ),
    body := request_body
  );

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the registration insert
    RAISE WARNING 'Apollo enrichment trigger failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on registrations table
DROP TRIGGER IF EXISTS trigger_apollo_enrichment_on_registration ON registrations;

CREATE TRIGGER trigger_apollo_enrichment_on_registration
  AFTER INSERT ON registrations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_apollo_enrichment();

-- Add comment for documentation
COMMENT ON FUNCTION trigger_apollo_enrichment() IS
  'Automatically triggers Apollo enrichment API when a new registration is inserted.
   Uses pg_net for async HTTP calls to avoid blocking the insert operation.
   Skips if contact was enriched within the last 24 hours.
   PROG-65: Apollo auto-enrichment on registration';

-- ============================================
-- Configuration table for API URL (optional)
-- ============================================

-- Create config table if it doesn't exist
CREATE TABLE IF NOT EXISTS app_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert or update API base URL configuration
INSERT INTO app_config (key, value, description)
VALUES (
  'api_base_url',
  'https://your-domain.com',
  'Base URL for internal API calls from database triggers'
)
ON CONFLICT (key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Grant access to the config table
GRANT SELECT ON app_config TO authenticated;
GRANT SELECT ON app_config TO service_role;
