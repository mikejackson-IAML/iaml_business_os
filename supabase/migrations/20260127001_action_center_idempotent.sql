-- Action Center: Comprehensive Idempotent Migration
-- Migration: Create action_center schema with all tables, views, triggers, and RLS
-- Date: 2026-01-27
-- Note: This migration is fully idempotent and can be run multiple times safely

-- ============================================
-- SCHEMA
-- ============================================
CREATE SCHEMA IF NOT EXISTS action_center;

-- ============================================
-- UPDATED_AT FUNCTION (needed by triggers)
-- ============================================
CREATE OR REPLACE FUNCTION action_center.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TASKS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'standard' CHECK (task_type IN (
    'standard', 'approval', 'decision', 'review'
  )),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
    'manual', 'alert', 'workflow', 'ai', 'rule'
  )),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open', 'in_progress', 'waiting', 'done', 'dismissed'
  )),
  dismissed_reason TEXT,
  completion_note TEXT,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'critical', 'high', 'normal', 'low'
  )),
  due_date DATE,
  due_time TIME,
  department TEXT,
  assignee_id UUID,
  workflow_id UUID,
  parent_task_id UUID,
  sop_template_id UUID,
  depends_on UUID[] DEFAULT '{}',
  related_entity_type TEXT,
  related_entity_id UUID,
  related_entity_url TEXT,
  recommendation TEXT,
  recommendation_reasoning TEXT,
  approval_outcome TEXT CHECK (approval_outcome IN ('approved', 'modified', 'rejected')),
  approval_modifications TEXT,
  ai_confidence NUMERIC(3,2),
  ai_suggested_at TIMESTAMPTZ,
  dedupe_key TEXT,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add constraints if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dismissed_requires_reason') THEN
    ALTER TABLE action_center.tasks ADD CONSTRAINT dismissed_requires_reason CHECK (
      (status = 'dismissed' AND dismissed_reason IS NOT NULL) OR
      (status != 'dismissed')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'dedupe_key_unique') THEN
    ALTER TABLE action_center.tasks ADD CONSTRAINT dedupe_key_unique UNIQUE (dedupe_key);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'tasks_parent_task_id_fkey') THEN
    ALTER TABLE action_center.tasks ADD CONSTRAINT tasks_parent_task_id_fkey
      FOREIGN KEY (parent_task_id) REFERENCES action_center.tasks(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tasks_status ON action_center.tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON action_center.tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON action_center.tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON action_center.tasks(assignee_id);
CREATE INDEX IF NOT EXISTS idx_tasks_department ON action_center.tasks(department);
CREATE INDEX IF NOT EXISTS idx_tasks_workflow ON action_center.tasks(workflow_id);
CREATE INDEX IF NOT EXISTS idx_tasks_source ON action_center.tasks(source);
CREATE INDEX IF NOT EXISTS idx_tasks_type ON action_center.tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_tasks_created ON action_center.tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_depends_on ON action_center.tasks USING GIN (depends_on);
CREATE INDEX IF NOT EXISTS idx_tasks_related_entity ON action_center.tasks(related_entity_type, related_entity_id);

-- ============================================
-- WORKFLOWS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT,
  department TEXT,
  status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN (
    'not_started', 'in_progress', 'blocked', 'completed'
  )),
  related_entity_type TEXT,
  related_entity_id UUID,
  template_id UUID,
  total_tasks INTEGER DEFAULT 0,
  completed_tasks INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  target_completion_date DATE,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflows_status ON action_center.workflows(status);
CREATE INDEX IF NOT EXISTS idx_workflows_department ON action_center.workflows(department);
CREATE INDEX IF NOT EXISTS idx_workflows_type ON action_center.workflows(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflows_related_entity ON action_center.workflows(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_workflows_created ON action_center.workflows(created_at DESC);

-- ============================================
-- SOP TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.sop_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  department TEXT,
  steps JSONB NOT NULL DEFAULT '[]',
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT TRUE,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  variables JSONB DEFAULT '{}',
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sop_templates_category ON action_center.sop_templates(category);
CREATE INDEX IF NOT EXISTS idx_sop_templates_department ON action_center.sop_templates(department);
CREATE INDEX IF NOT EXISTS idx_sop_templates_active ON action_center.sop_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_sop_templates_name ON action_center.sop_templates USING GIN (to_tsvector('english', name));

-- Add foreign keys to tasks after all tables exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_workflow') THEN
    ALTER TABLE action_center.tasks ADD CONSTRAINT fk_tasks_workflow
      FOREIGN KEY (workflow_id) REFERENCES action_center.workflows(id) ON DELETE SET NULL;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'fk_tasks_sop_template') THEN
    ALTER TABLE action_center.tasks ADD CONSTRAINT fk_tasks_sop_template
      FOREIGN KEY (sop_template_id) REFERENCES action_center.sop_templates(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================
-- TASK RULES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.task_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  rule_type TEXT NOT NULL CHECK (rule_type IN ('recurring', 'event', 'condition')),
  schedule_type TEXT CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  schedule_config JSONB,
  trigger_event TEXT,
  trigger_conditions JSONB,
  condition_query TEXT,
  task_template JSONB NOT NULL,
  due_date_field TEXT,
  due_date_offset_days INTEGER DEFAULT 0,
  dedupe_key_template TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_run_result TEXT,
  run_count INTEGER DEFAULT 0,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_rules_type ON action_center.task_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_task_rules_enabled ON action_center.task_rules(is_enabled);
CREATE INDEX IF NOT EXISTS idx_task_rules_event ON action_center.task_rules(trigger_event) WHERE trigger_event IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_task_rules_schedule ON action_center.task_rules(schedule_type) WHERE schedule_type IS NOT NULL;

-- ============================================
-- WORKFLOW TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT,
  department TEXT,
  trigger_event TEXT NOT NULL,
  trigger_conditions JSONB,
  due_date_field TEXT,
  target_date_offset_days INTEGER DEFAULT 0,
  task_templates JSONB NOT NULL DEFAULT '[]',
  variable_mapping JSONB DEFAULT '{}',
  is_enabled BOOLEAN DEFAULT TRUE,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_workflow_templates_event ON action_center.workflow_templates(trigger_event);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_enabled ON action_center.workflow_templates(is_enabled);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_type ON action_center.workflow_templates(workflow_type);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_department ON action_center.workflow_templates(department);

-- ============================================
-- TASK COMMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES action_center.tasks(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  author_id UUID,
  author_name TEXT,
  comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN ('comment', 'status_change', 'system')),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_comments_task ON action_center.task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_author ON action_center.task_comments(author_id);
CREATE INDEX IF NOT EXISTS idx_task_comments_created ON action_center.task_comments(created_at DESC);

-- ============================================
-- TASK ACTIVITY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES action_center.tasks(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'created', 'status_changed', 'completed', 'dismissed', 'reopened',
    'updated', 'assigned', 'unassigned', 'priority_changed', 'due_date_changed',
    'added_to_workflow', 'removed_from_workflow', 'dependency_added', 'dependency_removed', 'blocked', 'unblocked',
    'approved', 'rejected', 'modified_and_approved',
    'comment_added',
    'ai_suggested', 'ai_accepted', 'ai_rejected', 'ai_modified'
  )),
  actor_id UUID,
  actor_name TEXT,
  actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'ai', 'workflow')),
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_task_activity_task ON action_center.task_activity(task_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_type ON action_center.task_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_task_activity_actor ON action_center.task_activity(actor_id);
CREATE INDEX IF NOT EXISTS idx_task_activity_created ON action_center.task_activity(created_at DESC);

-- ============================================
-- USER MASTERY TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS action_center.user_sop_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  sop_template_id UUID NOT NULL REFERENCES action_center.sop_templates(id) ON DELETE CASCADE,
  times_completed INTEGER DEFAULT 0,
  average_completion_minutes NUMERIC(10,2),
  fastest_completion_minutes NUMERIC(10,2),
  last_completed_at TIMESTAMPTZ,
  mastery_level TEXT DEFAULT 'novice' CHECK (mastery_level IN ('novice', 'learning', 'proficient', 'expert')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint if not exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_sop_mastery_user_sop_unique') THEN
    ALTER TABLE action_center.user_sop_mastery ADD CONSTRAINT user_sop_mastery_user_sop_unique UNIQUE(user_id, sop_template_id);
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_sop_mastery_user ON action_center.user_sop_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sop_mastery_sop ON action_center.user_sop_mastery(sop_template_id);
CREATE INDEX IF NOT EXISTS idx_user_sop_mastery_level ON action_center.user_sop_mastery(mastery_level);

-- ============================================
-- TRIGGERS (Drop and recreate for idempotency)
-- ============================================
DROP TRIGGER IF EXISTS tasks_updated_at ON action_center.tasks;
CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON action_center.tasks
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

DROP TRIGGER IF EXISTS workflows_updated_at ON action_center.workflows;
CREATE TRIGGER workflows_updated_at
  BEFORE UPDATE ON action_center.workflows
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

DROP TRIGGER IF EXISTS sop_templates_updated_at ON action_center.sop_templates;
CREATE TRIGGER sop_templates_updated_at
  BEFORE UPDATE ON action_center.sop_templates
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

DROP TRIGGER IF EXISTS task_rules_updated_at ON action_center.task_rules;
CREATE TRIGGER task_rules_updated_at
  BEFORE UPDATE ON action_center.task_rules
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

DROP TRIGGER IF EXISTS workflow_templates_updated_at ON action_center.workflow_templates;
CREATE TRIGGER workflow_templates_updated_at
  BEFORE UPDATE ON action_center.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

DROP TRIGGER IF EXISTS task_comments_updated_at ON action_center.task_comments;
CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON action_center.task_comments
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

DROP TRIGGER IF EXISTS user_sop_mastery_updated_at ON action_center.user_sop_mastery;
CREATE TRIGGER user_sop_mastery_updated_at
  BEFORE UPDATE ON action_center.user_sop_mastery
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

-- ============================================
-- VIEWS (CREATE OR REPLACE for idempotency)
-- ============================================

-- Extended tasks view
CREATE OR REPLACE VIEW action_center.tasks_extended AS
SELECT
  t.id,
  t.title,
  t.description,
  t.task_type,
  t.source,
  t.status,
  t.dismissed_reason,
  t.completion_note,
  t.completed_at,
  t.dismissed_at,
  t.priority,
  t.due_date,
  t.due_time,
  t.department,
  t.assignee_id,
  t.workflow_id,
  t.parent_task_id,
  t.sop_template_id,
  t.depends_on,
  t.related_entity_type,
  t.related_entity_id,
  t.related_entity_url,
  t.recommendation,
  t.recommendation_reasoning,
  t.approval_outcome,
  t.approval_modifications,
  t.ai_confidence,
  t.ai_suggested_at,
  t.dedupe_key,
  t.created_by,
  t.updated_by,
  t.created_at,
  t.updated_at,
  CASE
    WHEN t.status IN ('done', 'dismissed') THEN FALSE
    WHEN t.due_date IS NULL THEN FALSE
    WHEN t.due_date < CURRENT_DATE THEN TRUE
    WHEN t.due_date = CURRENT_DATE AND t.due_time IS NOT NULL AND t.due_time < CURRENT_TIME THEN TRUE
    ELSE FALSE
  END AS is_overdue,
  CASE
    WHEN t.due_date IS NULL THEN 'no_date'
    WHEN t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.due_date = CURRENT_DATE THEN 'today'
    WHEN t.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'this_week'
    ELSE 'later'
  END AS due_category,
  CASE
    WHEN t.depends_on IS NULL OR t.depends_on = '{}' THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM action_center.tasks dep
      WHERE dep.id = ANY(t.depends_on)
        AND dep.status NOT IN ('done', 'dismissed')
    )
  END AS is_blocked,
  (
    SELECT COUNT(*)::INTEGER FROM action_center.tasks dep
    WHERE dep.id = ANY(COALESCE(t.depends_on, '{}'))
      AND dep.status NOT IN ('done', 'dismissed')
  ) AS blocked_by_count,
  (
    SELECT COUNT(*)::INTEGER FROM action_center.tasks blocker
    WHERE t.id = ANY(COALESCE(blocker.depends_on, '{}'))
      AND blocker.status NOT IN ('done', 'dismissed')
  ) AS blocking_count,
  w.name AS workflow_name,
  w.status AS workflow_status,
  s.name AS sop_name,
  s.category AS sop_category,
  p.full_name AS assignee_name,
  p.email AS assignee_email
FROM action_center.tasks t
LEFT JOIN action_center.workflows w ON t.workflow_id = w.id
LEFT JOIN action_center.sop_templates s ON t.sop_template_id = s.id
LEFT JOIN public.profiles p ON t.assignee_id = p.id;

-- User task summary view
CREATE OR REPLACE VIEW action_center.user_task_summary AS
SELECT
  p.id AS user_id,
  p.email,
  p.full_name,
  COUNT(*) FILTER (WHERE t.status = 'open') AS open_count,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE t.status = 'waiting') AS waiting_count,
  COUNT(*) FILTER (WHERE t.status = 'done') AS done_count,
  COUNT(*) FILTER (WHERE t.status = 'dismissed') AS dismissed_count,
  COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress')) AS actionable_count,
  COUNT(*) FILTER (WHERE t.status NOT IN ('done', 'dismissed') AND t.due_date < CURRENT_DATE) AS overdue_count,
  COUNT(*) FILTER (WHERE t.status NOT IN ('done', 'dismissed') AND t.due_date = CURRENT_DATE) AS due_today_count,
  COUNT(*) FILTER (WHERE t.status NOT IN ('done', 'dismissed') AND t.due_date > CURRENT_DATE AND t.due_date <= CURRENT_DATE + INTERVAL '7 days') AS due_this_week_count,
  COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress') AND t.priority = 'critical') AS critical_count,
  COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress') AND t.priority = 'high') AS high_priority_count,
  COUNT(*) FILTER (WHERE t.status = 'done' AND t.completed_at >= DATE_TRUNC('week', CURRENT_DATE)) AS completed_this_week,
  COUNT(*) FILTER (WHERE t.status = 'done' AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days') AS completed_last_7_days,
  ROUND(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 86400) FILTER (WHERE t.status = 'done' AND t.completed_at >= CURRENT_DATE - INTERVAL '30 days')::NUMERIC, 1) AS avg_completion_days_30d
FROM public.profiles p
LEFT JOIN action_center.tasks t ON t.assignee_id = p.id
GROUP BY p.id, p.email, p.full_name;

-- Department task summary view
CREATE OR REPLACE VIEW action_center.department_task_summary AS
SELECT
  t.department,
  COUNT(*) FILTER (WHERE t.status = 'open') AS open_count,
  COUNT(*) FILTER (WHERE t.status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE t.status = 'waiting') AS waiting_count,
  COUNT(*) FILTER (WHERE t.status = 'done') AS done_count,
  COUNT(*) FILTER (WHERE t.status = 'dismissed') AS dismissed_count,
  COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress')) AS actionable_count,
  COUNT(*) FILTER (WHERE t.status NOT IN ('done', 'dismissed') AND t.due_date < CURRENT_DATE) AS overdue_count,
  COUNT(*) FILTER (WHERE t.status NOT IN ('done', 'dismissed') AND t.due_date = CURRENT_DATE) AS due_today_count,
  COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress') AND t.priority = 'critical') AS critical_count,
  COUNT(*) FILTER (WHERE t.status IN ('open', 'in_progress') AND t.priority = 'high') AS high_priority_count,
  COUNT(*) FILTER (WHERE t.created_at >= CURRENT_DATE - INTERVAL '7 days') AS created_last_7_days,
  COUNT(*) FILTER (WHERE t.status = 'done' AND t.completed_at >= CURRENT_DATE - INTERVAL '7 days') AS completed_last_7_days,
  ROUND((COUNT(*) FILTER (WHERE t.status = 'done' AND t.completed_at >= CURRENT_DATE - INTERVAL '30 days')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE t.created_at >= CURRENT_DATE - INTERVAL '30 days'), 0)) * 100, 1) AS completion_rate_30d,
  ROUND(AVG(EXTRACT(EPOCH FROM (t.completed_at - t.created_at)) / 86400) FILTER (WHERE t.status = 'done' AND t.completed_at >= CURRENT_DATE - INTERVAL '30 days')::NUMERIC, 1) AS avg_completion_days_30d
FROM action_center.tasks t
WHERE t.department IS NOT NULL
GROUP BY t.department;

-- System task summary view
CREATE OR REPLACE VIEW action_center.system_task_summary AS
SELECT
  COUNT(*) FILTER (WHERE status = 'open') AS open_count,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
  COUNT(*) FILTER (WHERE status = 'waiting') AS waiting_count,
  COUNT(*) FILTER (WHERE status = 'done') AS done_count,
  COUNT(*) FILTER (WHERE status = 'dismissed') AS dismissed_count,
  COUNT(*) FILTER (WHERE status IN ('open', 'in_progress')) AS actionable_count,
  COUNT(*) FILTER (WHERE status NOT IN ('done', 'dismissed') AND due_date < CURRENT_DATE) AS overdue_count,
  COUNT(*) FILTER (WHERE status NOT IN ('done', 'dismissed') AND due_date = CURRENT_DATE) AS due_today_count,
  COUNT(*) FILTER (WHERE status IN ('open', 'in_progress') AND priority = 'critical') AS critical_count,
  COUNT(*) FILTER (WHERE status IN ('open', 'in_progress') AND priority = 'high') AS high_priority_count,
  COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') AS created_last_7_days,
  COUNT(*) FILTER (WHERE status = 'done' AND completed_at >= CURRENT_DATE - INTERVAL '7 days') AS completed_last_7_days,
  ROUND((COUNT(*) FILTER (WHERE status = 'done' AND completed_at >= CURRENT_DATE - INTERVAL '7 days')::NUMERIC / NULLIF(COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days'), 0)) * 100, 1) AS completion_rate_7d
FROM action_center.tasks;

-- ============================================
-- ROW-LEVEL SECURITY
-- ============================================
ALTER TABLE action_center.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.sop_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.task_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.task_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE action_center.user_sop_mastery ENABLE ROW LEVEL SECURITY;

-- Tasks policies
DROP POLICY IF EXISTS "Authenticated users can read tasks" ON action_center.tasks;
CREATE POLICY "Authenticated users can read tasks" ON action_center.tasks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create tasks" ON action_center.tasks;
CREATE POLICY "Authenticated users can create tasks" ON action_center.tasks FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update tasks" ON action_center.tasks;
CREATE POLICY "Authenticated users can update tasks" ON action_center.tasks FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete tasks" ON action_center.tasks;
CREATE POLICY "Authenticated users can delete tasks" ON action_center.tasks FOR DELETE TO authenticated USING (true);

-- Workflows policies
DROP POLICY IF EXISTS "Authenticated users can read workflows" ON action_center.workflows;
CREATE POLICY "Authenticated users can read workflows" ON action_center.workflows FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create workflows" ON action_center.workflows;
CREATE POLICY "Authenticated users can create workflows" ON action_center.workflows FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update workflows" ON action_center.workflows;
CREATE POLICY "Authenticated users can update workflows" ON action_center.workflows FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete workflows" ON action_center.workflows;
CREATE POLICY "Authenticated users can delete workflows" ON action_center.workflows FOR DELETE TO authenticated USING (true);

-- SOP templates policies
DROP POLICY IF EXISTS "Authenticated users can read sop_templates" ON action_center.sop_templates;
CREATE POLICY "Authenticated users can read sop_templates" ON action_center.sop_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create sop_templates" ON action_center.sop_templates;
CREATE POLICY "Authenticated users can create sop_templates" ON action_center.sop_templates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update sop_templates" ON action_center.sop_templates;
CREATE POLICY "Authenticated users can update sop_templates" ON action_center.sop_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete sop_templates" ON action_center.sop_templates;
CREATE POLICY "Authenticated users can delete sop_templates" ON action_center.sop_templates FOR DELETE TO authenticated USING (true);

-- Task rules policies
DROP POLICY IF EXISTS "Authenticated users can read task_rules" ON action_center.task_rules;
CREATE POLICY "Authenticated users can read task_rules" ON action_center.task_rules FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create task_rules" ON action_center.task_rules;
CREATE POLICY "Authenticated users can create task_rules" ON action_center.task_rules FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update task_rules" ON action_center.task_rules;
CREATE POLICY "Authenticated users can update task_rules" ON action_center.task_rules FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete task_rules" ON action_center.task_rules;
CREATE POLICY "Authenticated users can delete task_rules" ON action_center.task_rules FOR DELETE TO authenticated USING (true);

-- Workflow templates policies
DROP POLICY IF EXISTS "Authenticated users can read workflow_templates" ON action_center.workflow_templates;
CREATE POLICY "Authenticated users can read workflow_templates" ON action_center.workflow_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create workflow_templates" ON action_center.workflow_templates;
CREATE POLICY "Authenticated users can create workflow_templates" ON action_center.workflow_templates FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update workflow_templates" ON action_center.workflow_templates;
CREATE POLICY "Authenticated users can update workflow_templates" ON action_center.workflow_templates FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete workflow_templates" ON action_center.workflow_templates;
CREATE POLICY "Authenticated users can delete workflow_templates" ON action_center.workflow_templates FOR DELETE TO authenticated USING (true);

-- Task comments policies
DROP POLICY IF EXISTS "Authenticated users can read task_comments" ON action_center.task_comments;
CREATE POLICY "Authenticated users can read task_comments" ON action_center.task_comments FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create task_comments" ON action_center.task_comments;
CREATE POLICY "Authenticated users can create task_comments" ON action_center.task_comments FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update task_comments" ON action_center.task_comments;
CREATE POLICY "Authenticated users can update task_comments" ON action_center.task_comments FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can delete task_comments" ON action_center.task_comments;
CREATE POLICY "Authenticated users can delete task_comments" ON action_center.task_comments FOR DELETE TO authenticated USING (true);

-- Task activity policies
DROP POLICY IF EXISTS "Authenticated users can read task_activity" ON action_center.task_activity;
CREATE POLICY "Authenticated users can read task_activity" ON action_center.task_activity FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Service role can insert task_activity" ON action_center.task_activity;
CREATE POLICY "Service role can insert task_activity" ON action_center.task_activity FOR INSERT TO service_role WITH CHECK (true);

-- User SOP mastery policies
DROP POLICY IF EXISTS "Authenticated users can read user_sop_mastery" ON action_center.user_sop_mastery;
CREATE POLICY "Authenticated users can read user_sop_mastery" ON action_center.user_sop_mastery FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Authenticated users can create user_sop_mastery" ON action_center.user_sop_mastery;
CREATE POLICY "Authenticated users can create user_sop_mastery" ON action_center.user_sop_mastery FOR INSERT TO authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "Authenticated users can update user_sop_mastery" ON action_center.user_sop_mastery;
CREATE POLICY "Authenticated users can update user_sop_mastery" ON action_center.user_sop_mastery FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- ============================================
-- GRANTS
-- ============================================
GRANT USAGE ON SCHEMA action_center TO authenticated;
GRANT USAGE ON SCHEMA action_center TO service_role;
GRANT USAGE ON SCHEMA action_center TO anon;

-- Table permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.workflows TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.sop_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.task_rules TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.workflow_templates TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON action_center.task_comments TO authenticated;
GRANT SELECT ON action_center.task_activity TO authenticated;
GRANT SELECT, INSERT, UPDATE ON action_center.user_sop_mastery TO authenticated;

-- View permissions
GRANT SELECT ON action_center.tasks_extended TO authenticated;
GRANT SELECT ON action_center.user_task_summary TO authenticated;
GRANT SELECT ON action_center.department_task_summary TO authenticated;
GRANT SELECT ON action_center.system_task_summary TO authenticated;

-- Service role full access
GRANT ALL ON action_center.tasks TO service_role;
GRANT ALL ON action_center.workflows TO service_role;
GRANT ALL ON action_center.sop_templates TO service_role;
GRANT ALL ON action_center.task_rules TO service_role;
GRANT ALL ON action_center.workflow_templates TO service_role;
GRANT ALL ON action_center.task_comments TO service_role;
GRANT ALL ON action_center.task_activity TO service_role;
GRANT ALL ON action_center.user_sop_mastery TO service_role;

-- Anon read access to views
GRANT SELECT ON action_center.tasks_extended TO anon;
GRANT SELECT ON action_center.system_task_summary TO anon;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON SCHEMA action_center IS 'Unified task management system for the IAML Business OS';
COMMENT ON TABLE action_center.tasks IS 'Central table for all actionable items - alerts, approvals, manual tasks, AI suggestions';
COMMENT ON TABLE action_center.workflows IS 'Groups of related tasks with dependencies and progress tracking';
COMMENT ON TABLE action_center.sop_templates IS 'Standard Operating Procedure templates with ordered steps';
COMMENT ON TABLE action_center.task_rules IS 'Rules for automatic task generation';
COMMENT ON TABLE action_center.workflow_templates IS 'Templates for creating workflows with multiple tasks';
COMMENT ON TABLE action_center.task_comments IS 'Comments and notes on tasks';
COMMENT ON TABLE action_center.task_activity IS 'Activity log tracking all task events';
COMMENT ON TABLE action_center.user_sop_mastery IS 'Tracks user proficiency with SOPs';
COMMENT ON VIEW action_center.tasks_extended IS 'Extended task view with computed fields and joined data';
