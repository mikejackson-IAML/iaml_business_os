-- n8n-brain: Store knowledge about self-hosted n8n limitations
-- Run this in Supabase SQL editor

-- Store preference: Self-hosted n8n cannot use environment variables in the same way
INSERT INTO n8n_brain.preferences (category, key, value)
VALUES (
  'environment',
  'self_hosted_env_vars',
  '{
    "description": "Self-hosted n8n cannot easily configure environment variables like cloud-hosted n8n",
    "workaround": "Use hardcoded values directly in nodes, or use a Code/Set node to define variables that can be referenced later in the workflow",
    "affected_nodes": ["httpRequest", "any node using $env"],
    "example_fix": "Replace {{$env.VARIABLE_NAME}} with the actual value or use a Set node to define it",
    "learned_from": "Supabase to HeyReach Exporter workflow - January 2026"
  }'::jsonb
)
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Also store as an error fix pattern for future reference
INSERT INTO n8n_brain.error_fixes (
  error_message,
  error_code,
  node_type,
  operation,
  fix_description,
  fix_example
)
VALUES (
  'Environment variable resolves to empty/undefined in self-hosted n8n',
  'ENV_VAR_EMPTY',
  'n8n-nodes-base.httpRequest',
  'any',
  'Self-hosted n8n does not support environment variables in the same way as cloud-hosted n8n. Replace $env.VARIABLE_NAME with the actual value, or use a Set/Code node to define a workflow-level variable.',
  '{
    "before": "https://api.example.com/{{$env.API_KEY}}/endpoint",
    "after_option_1": "https://api.example.com/your-actual-api-key/endpoint",
    "after_option_2": "Use a Set node before the HTTP Request to define: { \"api_key\": \"your-actual-api-key\" }, then reference as {{$json.api_key}}"
  }'::jsonb
)
ON CONFLICT DO NOTHING;

-- Verify the inserts
SELECT 'Preferences:' as section, category, key, value->>'description' as description
FROM n8n_brain.preferences
WHERE category = 'environment'
UNION ALL
SELECT 'Error Fixes:' as section, node_type, error_message, fix_description
FROM n8n_brain.error_fixes
WHERE error_code = 'ENV_VAR_EMPTY';
