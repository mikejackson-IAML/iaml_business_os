-- RPC function for CLE Approval Monitor workflow
-- This replaces direct Postgres query with REST API callable function

CREATE OR REPLACE FUNCTION get_cle_status()
RETURNS TABLE (
  program_name TEXT,
  planned_start_date DATE,
  days_until INTEGER,
  state TEXT,
  status TEXT,
  submitted_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  credits_approved NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.name as program_name,
    pi.start_date as planned_start_date,
    (pi.start_date - CURRENT_DATE)::INTEGER as days_until,
    c.state,
    c.status,
    c.submitted_at,
    c.approved_at,
    c.credits_approved
  FROM programs p
  JOIN program_instances pi ON pi.program_name = p.name
  LEFT JOIN program_cle_approvals c ON c.program_id = p.id
  WHERE pi.start_date > CURRENT_DATE
    AND pi.start_date < CURRENT_DATE + INTERVAL '90 days'
  ORDER BY pi.start_date, c.state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute to anon and authenticated for REST API access
GRANT EXECUTE ON FUNCTION get_cle_status() TO anon;
GRANT EXECUTE ON FUNCTION get_cle_status() TO authenticated;

COMMENT ON FUNCTION get_cle_status() IS 'Returns upcoming programs (next 90 days) with their CLE approval status. Used by CLE Approval Monitor workflow.';
