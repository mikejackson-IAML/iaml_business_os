-- Add GRANT permissions for Branch C RPC functions
-- Migration: 20260142

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_branch_c_contacts() TO anon, authenticated, service_role;

-- Also ensure assign_ghl_branch is accessible (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'assign_ghl_branch') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION public.assign_ghl_branch(UUID, TEXT, TEXT) TO anon, authenticated, service_role';
  END IF;
END $$;
