-- Expose accomplishments schema via PostgREST API
-- This allows the /done command to save accomplishments directly via REST API
-- Date: 2026-01-18

-- Add accomplishments schema to exposed schemas
ALTER ROLE authenticator SET pgrst.db_schemas = 'public, graphql_public, n8n_brain, accomplishments';

-- Reload PostgREST configuration
NOTIFY pgrst, 'reload config';

-- Grant necessary permissions for service role
GRANT USAGE ON SCHEMA accomplishments TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA accomplishments TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA accomplishments TO service_role;

-- Grant read permissions for authenticated users (optional, for dashboard)
GRANT USAGE ON SCHEMA accomplishments TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA accomplishments TO authenticated;

-- Ensure future tables also get permissions
ALTER DEFAULT PRIVILEGES IN SCHEMA accomplishments GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA accomplishments GRANT SELECT ON TABLES TO authenticated;
