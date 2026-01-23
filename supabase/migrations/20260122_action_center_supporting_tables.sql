-- Action Center: Supporting Tables
-- Migration: Create task_rules, workflow_templates, task_comments, task_activity
-- Date: 2026-01-22
-- Depends on: 20260122_action_center_schema.sql

-- ============================================
-- TASK RULES TABLE
-- Rules for automatic task generation
-- ============================================
CREATE TABLE action_center.task_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,
  description TEXT,

  -- Rule type
  rule_type TEXT NOT NULL CHECK (rule_type IN (
    'recurring',    -- Runs on schedule (daily, weekly, etc.)
    'event',        -- Triggered by database event
    'condition'     -- Checked daily, fires when condition is true
  )),

  -- Schedule (for recurring rules)
  schedule_type TEXT CHECK (schedule_type IN ('daily', 'weekly', 'monthly', 'cron')),
  schedule_config JSONB,  -- {day_of_week: 1, time: '09:00'} or {cron: '0 9 * * 1'}

  -- Event trigger (for event rules)
  trigger_event TEXT,  -- 'program_instance.created', 'contact.updated', etc.
  trigger_conditions JSONB,  -- {format: 'in-person', status: 'confirmed'}

  -- Condition (for condition rules)
  condition_query TEXT,  -- SQL query that returns rows to process

  -- Task template (what task to create)
  task_template JSONB NOT NULL,  -- {title, description, type, priority, department, sop_template_id, ...}

  -- Due date calculation
  due_date_field TEXT,  -- Field from trigger record to use as reference
  due_date_offset_days INTEGER DEFAULT 0,  -- Days before/after reference date

  -- Deduplication
  dedupe_key_template TEXT,  -- Template for generating dedupe_key, e.g., 'daily-check-{date}'

  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  last_run_result TEXT,
  run_count INTEGER DEFAULT 0,

  -- Audit columns
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_rules_type ON action_center.task_rules(rule_type);
CREATE INDEX idx_task_rules_enabled ON action_center.task_rules(is_enabled);
CREATE INDEX idx_task_rules_event ON action_center.task_rules(trigger_event) WHERE trigger_event IS NOT NULL;
CREATE INDEX idx_task_rules_schedule ON action_center.task_rules(schedule_type) WHERE schedule_type IS NOT NULL;

-- ============================================
-- WORKFLOW TEMPLATES TABLE
-- Templates for creating workflows with tasks
-- ============================================
CREATE TABLE action_center.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identity
  name TEXT NOT NULL,
  description TEXT,
  workflow_type TEXT,  -- 'program_prep', 'onboarding', etc.
  department TEXT,

  -- Trigger configuration
  trigger_event TEXT NOT NULL,  -- 'program_instance.created', etc.
  trigger_conditions JSONB,  -- {format: 'in-person', ...}

  -- Due date reference
  due_date_field TEXT,  -- Field from trigger to use as target date
  target_date_offset_days INTEGER DEFAULT 0,  -- Offset from due_date_field

  -- Task templates (ordered array)
  -- Each: {order, title, description, type, priority, days_before_due, sop_template_id, depends_on_orders[], role}
  task_templates JSONB NOT NULL DEFAULT '[]',

  -- Variable mapping (map trigger fields to template variables)
  -- {program_name: 'trigger.program.name', ...}
  variable_mapping JSONB DEFAULT '{}',

  -- Status
  is_enabled BOOLEAN DEFAULT TRUE,
  times_used INTEGER DEFAULT 0,
  last_used_at TIMESTAMPTZ,

  -- Audit columns
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_workflow_templates_event ON action_center.workflow_templates(trigger_event);
CREATE INDEX idx_workflow_templates_enabled ON action_center.workflow_templates(is_enabled);
CREATE INDEX idx_workflow_templates_type ON action_center.workflow_templates(workflow_type);
CREATE INDEX idx_workflow_templates_department ON action_center.workflow_templates(department);

-- ============================================
-- TASK COMMENTS TABLE
-- Comments/notes on tasks
-- ============================================
CREATE TABLE action_center.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent task
  task_id UUID NOT NULL REFERENCES action_center.tasks(id) ON DELETE CASCADE,

  -- Comment content
  content TEXT NOT NULL,

  -- Author
  author_id UUID,
  author_name TEXT,  -- Denormalized for display

  -- Comment type
  comment_type TEXT DEFAULT 'comment' CHECK (comment_type IN (
    'comment',        -- Regular comment
    'status_change',  -- Auto-generated on status change
    'system'          -- System-generated note
  )),

  -- Metadata for system comments
  metadata JSONB DEFAULT '{}',

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_comments_task ON action_center.task_comments(task_id);
CREATE INDEX idx_task_comments_author ON action_center.task_comments(author_id);
CREATE INDEX idx_task_comments_created ON action_center.task_comments(created_at DESC);

-- ============================================
-- TASK ACTIVITY TABLE
-- Activity log for task events
-- ============================================
CREATE TABLE action_center.task_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Parent task
  task_id UUID NOT NULL REFERENCES action_center.tasks(id) ON DELETE CASCADE,

  -- Activity details
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    -- Lifecycle events
    'created',
    'status_changed',
    'completed',
    'dismissed',
    'reopened',
    -- Updates
    'updated',
    'assigned',
    'unassigned',
    'priority_changed',
    'due_date_changed',
    -- Workflow events
    'added_to_workflow',
    'removed_from_workflow',
    'dependency_added',
    'dependency_removed',
    'blocked',
    'unblocked',
    -- Approval events
    'approved',
    'rejected',
    'modified_and_approved',
    -- Comments
    'comment_added',
    -- AI events
    'ai_suggested',
    'ai_accepted',
    'ai_rejected',
    'ai_modified'
  )),

  -- Actor
  actor_id UUID,
  actor_name TEXT,  -- Denormalized for display
  actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'ai', 'workflow')),

  -- Change details
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',

  -- Timestamp
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_task_activity_task ON action_center.task_activity(task_id);
CREATE INDEX idx_task_activity_type ON action_center.task_activity(activity_type);
CREATE INDEX idx_task_activity_actor ON action_center.task_activity(actor_id);
CREATE INDEX idx_task_activity_created ON action_center.task_activity(created_at DESC);

-- ============================================
-- TRIGGERS
-- ============================================

-- Apply updated_at triggers
CREATE TRIGGER task_rules_updated_at
  BEFORE UPDATE ON action_center.task_rules
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

CREATE TRIGGER workflow_templates_updated_at
  BEFORE UPDATE ON action_center.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();

CREATE TRIGGER task_comments_updated_at
  BEFORE UPDATE ON action_center.task_comments
  FOR EACH ROW EXECUTE FUNCTION action_center.update_updated_at();
-- Note: task_activity doesn't need updated_at trigger (log entries are immutable)

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE action_center.task_rules IS 'Rules for automatic task generation - recurring, event-triggered, or condition-based';
COMMENT ON TABLE action_center.workflow_templates IS 'Templates for creating workflows with multiple tasks from events';
COMMENT ON TABLE action_center.task_comments IS 'Comments and notes on tasks';
COMMENT ON TABLE action_center.task_activity IS 'Activity log tracking all task events for audit trail';

COMMENT ON COLUMN action_center.task_rules.task_template IS 'JSONB template for task creation: {title, description, type, priority, department, ...}';
COMMENT ON COLUMN action_center.task_rules.dedupe_key_template IS 'Template string for generating unique dedupe_key, supports {date}, {entity_id} placeholders';
COMMENT ON COLUMN action_center.workflow_templates.task_templates IS 'JSONB array of task templates: [{order, title, days_before_due, depends_on_orders[], ...}]';
COMMENT ON COLUMN action_center.workflow_templates.variable_mapping IS 'Maps template variables to trigger record fields';
