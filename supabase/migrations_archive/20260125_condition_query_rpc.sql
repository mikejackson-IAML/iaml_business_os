-- RPC function to safely execute condition queries
-- Only allows SELECT queries for security

CREATE OR REPLACE FUNCTION action_center.execute_condition_query(
  p_query TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSONB;
  v_normalized_query TEXT;
BEGIN
  -- Normalize query for checking
  v_normalized_query := UPPER(TRIM(p_query));

  -- Security: Only allow SELECT queries
  IF NOT v_normalized_query LIKE 'SELECT%' THEN
    RAISE EXCEPTION 'Only SELECT queries are allowed';
  END IF;

  -- Security: Block dangerous keywords
  IF v_normalized_query ~ '(INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE|GRANT|REVOKE)' THEN
    RAISE EXCEPTION 'Query contains forbidden keywords';
  END IF;

  -- Execute and return as JSON array
  EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t)), ''[]''::jsonb) FROM (%s) t', p_query)
  INTO v_result;

  RETURN v_result;
END;
$$;

-- Grant execute to service role
GRANT EXECUTE ON FUNCTION action_center.execute_condition_query(TEXT) TO service_role;

COMMENT ON FUNCTION action_center.execute_condition_query IS
  'Safely execute a SELECT query and return results as JSONB array. Used by condition-based task rules.';
