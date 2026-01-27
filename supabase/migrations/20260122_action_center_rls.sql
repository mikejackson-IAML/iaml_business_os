-- Action Center: Row-Level Security Policies
-- Migration: Enable RLS and create permissive policies for authenticated users
-- Date: 2026-01-22
-- Depends on: All previous action_center migrations

-- ============================================
-- ENABLE ROW-LEVEL SECURITY
-- ============================================
ALTER TABLE action_center.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.task_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.task_activity ENABLE ROW LEVEL SECURITY;
-- ============================================
-- TASKS TABLE POLICIES
-- v1: Authenticated users can do everything
-- ============================================

-- SELECT: Authenticated users can read all tasks
CREATE POLICY "Authenticated users can read tasks"
  ON action_center.tasks
  FOR SELECT
  TO authenticated
  USING (true);
-- INSERT: Authenticated users can create tasks
CREATE POLICY "Authenticated users can create tasks"
  ON action_center.tasks
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
-- UPDATE: Authenticated users can update tasks
CREATE POLICY "Authenticated users can update tasks"
  ON action_center.tasks
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
-- DELETE: Authenticated users can delete tasks
CREATE POLICY "Authenticated users can delete tasks"
  ON action_center.tasks
  FOR DELETE
  TO authenticated
  USING (true);
-- ============================================
-- WORKFLOWS TABLE POLICIES
-- ============================================

CREATE POLICY "Authenticated users can read workflows"
  ON action_center.workflows
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Authenticated users can create workflows"
  ON action_center.workflows
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated users can update workflows"
  ON action_center.workflows
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Authenticated users can delete workflows"
  ON action_center.workflows
  FOR DELETE
  TO authenticated
  USING (true);
-- ============================================
-- SOP TEMPLATES TABLE POLICIES
-- ============================================

CREATE POLICY "Authenticated users can read sop_templates"
  ON action_center.sop_templates
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Authenticated users can create sop_templates"
  ON action_center.sop_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated users can update sop_templates"
  ON action_center.sop_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Authenticated users can delete sop_templates"
  ON action_center.sop_templates
  FOR DELETE
  TO authenticated
  USING (true);
-- ============================================
-- TASK RULES TABLE POLICIES
-- ============================================

CREATE POLICY "Authenticated users can read task_rules"
  ON action_center.task_rules
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Authenticated users can create task_rules"
  ON action_center.task_rules
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated users can update task_rules"
  ON action_center.task_rules
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Authenticated users can delete task_rules"
  ON action_center.task_rules
  FOR DELETE
  TO authenticated
  USING (true);
-- ============================================
-- WORKFLOW TEMPLATES TABLE POLICIES
-- ============================================

CREATE POLICY "Authenticated users can read workflow_templates"
  ON action_center.workflow_templates
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Authenticated users can create workflow_templates"
  ON action_center.workflow_templates
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated users can update workflow_templates"
  ON action_center.workflow_templates
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Authenticated users can delete workflow_templates"
  ON action_center.workflow_templates
  FOR DELETE
  TO authenticated
  USING (true);
-- ============================================
-- TASK COMMENTS TABLE POLICIES
-- ============================================

CREATE POLICY "Authenticated users can read task_comments"
  ON action_center.task_comments
  FOR SELECT
  TO authenticated
  USING (true);
CREATE POLICY "Authenticated users can create task_comments"
  ON action_center.task_comments
  FOR INSERT
  TO authenticated
  WITH CHECK (true);
CREATE POLICY "Authenticated users can update task_comments"
  ON action_center.task_comments
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
CREATE POLICY "Authenticated users can delete task_comments"
  ON action_center.task_comments
  FOR DELETE
  TO authenticated
  USING (true);
-- ============================================
-- TASK ACTIVITY TABLE POLICIES
-- Read-only for users (system writes via triggers)
-- ============================================

CREATE POLICY "Authenticated users can read task_activity"
  ON action_center.task_activity
  FOR SELECT
  TO authenticated
  USING (true);
-- Note: INSERT/UPDATE/DELETE not needed for regular users
-- Activity is written by triggers using SECURITY DEFINER
-- But allow for system/service role access
CREATE POLICY "Service role can insert task_activity"
  ON action_center.task_activity
  FOR INSERT
  TO service_role
  WITH CHECK (true);
-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant schema usage
GRANT USAGE ON SCHEMA action_center TO authenticated;
GRANT USAGE ON SCHEMA action_center TO service_role;
-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.sop_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.task_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.workflow_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.task_comments TO authenticated;
GRANT SELECT ON action_center.task_activity TO authenticated;
-- Grant view permissions
GRANT SELECT ON action_center.tasks_extended TO authenticated;
GRANT SELECT ON action_center.user_task_summary TO authenticated;
GRANT SELECT ON action_center.department_task_summary TO authenticated;
GRANT SELECT ON action_center.system_task_summary TO authenticated;
-- Grant full access to service role (for n8n, background jobs)
GRANT ALL ON action_center.tasks TO service_role;
GRANT ALL ON action_center.workflows TO service_role;
GRANT ALL ON action_center.sop_templates TO service_role;
GRANT ALL ON action_center.task_rules TO service_role;
GRANT ALL ON action_center.workflow_templates TO service_role;
GRANT ALL ON action_center.task_comments TO service_role;
GRANT ALL ON action_center.task_activity TO service_role;
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON POLICY "Authenticated users can read tasks" ON action_center.tasks IS 'v1 permissive policy: all authenticated users can read all tasks';
COMMENT ON POLICY "Authenticated users can create tasks" ON action_center.tasks IS 'v1 permissive policy: all authenticated users can create tasks';
COMMENT ON POLICY "Authenticated users can update tasks" ON action_center.tasks IS 'v1 permissive policy: all authenticated users can update tasks';
COMMENT ON POLICY "Authenticated users can delete tasks" ON action_center.tasks IS 'v1 permissive policy: all authenticated users can delete tasks';
-- Note for future: When multi-user support is added, policies should be updated to:
-- - Users can only see tasks they created or are assigned to (unless admin)
-- - Users can only update tasks assigned to them (unless admin)
-- - Only admins can delete tasks
-- - Department-based visibility rules;
