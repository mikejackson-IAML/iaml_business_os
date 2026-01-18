-- n8n-brain: Learnings from Workflow Registry Sync Development
-- Date: 2026-01-18

-- ============================================
-- ERROR FIXES LEARNED
-- ============================================

-- Error Fix 1: n8n API list endpoint doesn't include tags
INSERT INTO n8n_brain.error_fixes (
  error_message,
  error_code,
  node_type,
  operation,
  fix_description,
  fix_example,
  times_applied,
  times_succeeded
) VALUES (
  'Tags not found in workflow data when using n8n list API',
  'MISSING_TAGS',
  'n8n-nodes-base.httpRequest',
  'GET /api/v1/workflows',
  'The n8n API /api/v1/workflows endpoint does NOT include tags in the response. Tags are only returned when fetching individual workflows by ID. Solution: After getting the list, loop through each workflow and call GET /api/v1/workflows/{id} to get full details including tags.',
  '{
    "problem": "Workflow list response has empty tags array",
    "cause": "n8n list API excludes tags for performance",
    "solution": "Fetch each workflow individually by ID",
    "workflow_pattern": [
      "1. GET /api/v1/workflows?limit=250 (get list)",
      "2. Split out workflows",
      "3. GET /api/v1/workflows/{id} for each (gets tags)",
      "4. Filter by tag"
    ]
  }'::jsonb,
  1,
  1
)
ON CONFLICT DO NOTHING;

-- Error Fix 2: n8n API pagination
INSERT INTO n8n_brain.error_fixes (
  error_message,
  error_code,
  node_type,
  operation,
  fix_description,
  fix_example,
  times_applied,
  times_succeeded
) VALUES (
  'Not all workflows returned from n8n API - missing workflows',
  'API_PAGINATION',
  'n8n-nodes-base.httpRequest',
  'GET /api/v1/workflows',
  'The n8n API defaults to returning only 100 workflows. If you have more than 100 workflows, add ?limit=250 (or higher) to the URL to get more results.',
  '{
    "problem": "Only 100 workflows returned, but have 145+",
    "cause": "Default pagination limit is 100",
    "solution": "Add ?limit=250 to API URL",
    "correct_url": "https://n8n.realtyamp.ai/api/v1/workflows?limit=250"
  }'::jsonb,
  1,
  1
)
ON CONFLICT DO NOTHING;

-- Error Fix 3: Set node array serialization causing SQL errors
INSERT INTO n8n_brain.error_fixes (
  error_message,
  error_code,
  node_type,
  operation,
  fix_description,
  fix_example,
  times_applied,
  times_succeeded
) VALUES (
  'column "undefined" does not exist - ARRAY[undefined]::TEXT[]',
  'ARRAY_SERIALIZATION',
  'n8n-nodes-base.set',
  'SQL INSERT with arrays',
  'When using n8n Set nodes to create arrays, they get serialized as JSON strings (e.g., "[\"value1\",\"value2\"]"). When you try to use .map() in SQL templates, it fails because .map() cannot be called on a string. Solution: Use a Code node instead of Set node to format arrays as PostgreSQL array literals using the format {"value1","value2"}.',
  '{
    "problem": "Set node outputs arrays as JSON strings",
    "error": "column \"undefined\" does not exist",
    "cause": "$json.myArray.map() fails because myArray is a string",
    "solution": "Use Code node with formatPgArray function",
    "code_example": "const formatPgArray = (arr) => { if (!arr || arr.length === 0) return ''{}''::TEXT[]; return ''{'' + arr.map(s => ''\"'' + s + ''\"'').join('','') + ''}''; };"
  }'::jsonb,
  1,
  1
)
ON CONFLICT DO NOTHING;

-- Error Fix 4: n8n node vs HTTP Request for n8n API
INSERT INTO n8n_brain.error_fixes (
  error_message,
  error_code,
  node_type,
  operation,
  fix_description,
  fix_example,
  times_applied,
  times_succeeded
) VALUES (
  'The resource you are requesting could not be found (404) - n8n node',
  'N8N_NODE_404',
  'n8n-nodes-base.n8n',
  'list workflows',
  'The native n8n node may return 404 errors due to API version mismatches with self-hosted n8n instances. Solution: Use HTTP Request node instead, calling the n8n API directly with Header Auth credential containing X-N8N-API-KEY.',
  '{
    "problem": "n8n node returns 404 even though credentials test passes",
    "cause": "API version mismatch with n8n 1.106.3",
    "solution": "Replace n8n node with HTTP Request node",
    "credential_setup": {
      "type": "Header Auth",
      "header_name": "X-N8N-API-KEY",
      "header_value": "[your API key]"
    },
    "api_url": "https://n8n.realtyamp.ai/api/v1/workflows"
  }'::jsonb,
  1,
  1
)
ON CONFLICT DO NOTHING;

-- ============================================
-- PATTERN: Tag-based Workflow Registry Sync
-- ============================================

INSERT INTO n8n_brain.patterns (
  name,
  description,
  workflow_json,
  tags,
  services,
  node_types,
  trigger_type,
  source_workflow_id,
  source_workflow_name,
  notes,
  success_count
) VALUES (
  'Tag-based Workflow Registry Sync',
  'Syncs n8n workflows tagged with a specific tag to a Supabase registry table. Fetches workflow list, retrieves full details for each (to get tags), filters by tag, and upserts to database.',
  '{
    "description": "Pattern for syncing n8n workflows to a database registry based on tags",
    "key_learnings": [
      "Must fetch each workflow individually to get tags",
      "Use ?limit=250 to avoid pagination issues",
      "Use Code node for array formatting, not Set node",
      "Use HTTP Request with Header Auth instead of n8n node"
    ],
    "node_flow": [
      "Schedule Trigger (daily)",
      "HTTP Request (GET /api/v1/workflows?limit=250)",
      "Split Out (data array)",
      "HTTP Request (GET /api/v1/workflows/{id})",
      "Filter (check tags for target tag)",
      "Code (transform + format arrays)",
      "Postgres (upsert to registry)",
      "Aggregate Results",
      "Build Summary",
      "Log Activity"
    ],
    "sql_upsert_pattern": "INSERT ... ON CONFLICT (workflow_id) DO UPDATE SET ..."
  }'::jsonb,
  ARRAY['workflow-sync', 'registry', 'tag-filter', 'supabase'],
  ARRAY['n8n', 'supabase'],
  ARRAY['scheduleTrigger', 'httpRequest', 'splitOut', 'filter', 'code', 'postgres', 'aggregate', 'set'],
  'schedule',
  'ZYmDHUgDKNbqfjRO',
  'Workflow Registry Sync - Business OS',
  'Built 2026-01-18. Key insight: n8n list API does not include tags, must fetch each workflow individually.',
  1
)
ON CONFLICT DO NOTHING;

-- ============================================
-- PREFERENCE: Workflow tagging convention
-- ============================================

INSERT INTO n8n_brain.preferences (category, key, value)
VALUES (
  'workflow_management',
  'dashboard_tag',
  '{
    "tag_name": "business-os",
    "purpose": "Tag workflows with this to include them in the Business OS dashboard",
    "sync_workflow_id": "ZYmDHUgDKNbqfjRO",
    "sync_schedule": "Daily at 6 AM"
  }'::jsonb
)
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================
-- LOG: Successful learning session
-- ============================================

INSERT INTO n8n_brain.confidence_log (
  task_description,
  services_involved,
  node_types_involved,
  confidence_score,
  confidence_factors,
  recommendation,
  action_taken,
  outcome,
  outcome_notes
) VALUES (
  'Build workflow to sync tagged n8n workflows to Supabase registry',
  ARRAY['n8n', 'supabase'],
  ARRAY['httpRequest', 'splitOut', 'filter', 'code', 'postgres'],
  85,
  '{
    "pattern_match": false,
    "credentials_known": true,
    "errors_encountered": 4,
    "errors_resolved": 4,
    "iterations_to_success": 5
  }'::jsonb,
  'do_and_verify',
  'created_workflow',
  'success',
  'Built working workflow after resolving: (1) n8n node 404 error, (2) missing tags in list API, (3) pagination limit, (4) array serialization in SQL. All fixes documented in error_fixes table.'
);
