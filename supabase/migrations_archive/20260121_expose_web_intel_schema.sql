-- Expose web_intel schema through PostgREST
-- This allows the Supabase REST API to access web_intel tables

-- Grant usage on web_intel schema to anon and authenticated roles
GRANT USAGE ON SCHEMA web_intel TO anon, authenticated, service_role;

-- Grant select/insert/update/delete on all tables to service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA web_intel TO service_role;

-- Grant select on all tables to authenticated (for read-only access)
GRANT SELECT ON ALL TABLES IN SCHEMA web_intel TO authenticated;

-- For future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA web_intel
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO service_role;

ALTER DEFAULT PRIVILEGES IN SCHEMA web_intel
  GRANT SELECT ON TABLES TO authenticated;

-- Add web_intel to the search path for PostgREST
-- Note: This requires updating the PostgREST config in Supabase dashboard
-- Settings > API > Additional Schemas: add "web_intel"

COMMENT ON SCHEMA web_intel IS 'Web Intelligence schema - SEO tracking, rankings, and content analysis';
