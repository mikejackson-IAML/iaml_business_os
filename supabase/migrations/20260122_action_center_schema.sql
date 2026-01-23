-- Action Center: Unified Task Management System
-- Migration: Create action_center schema and core tables
-- Date: 2026-01-22

-- Create dedicated schema
CREATE SCHEMA IF NOT EXISTS action_center;

-- ============================================
-- TASKS TABLE
-- Central table for all actionable items
-- ============================================
CREATE TABLE action_center.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core identity
  title TEXT NOT NULL,
  description TEXT,

  -- Classification
  task_type TEXT NOT NULL DEFAULT 'standard' CHECK (task_type IN (
    'standard',    -- Normal task
    'approval',    -- Requires approve/reject decision
    'decision',    -- Requires choice between options
    'review'       -- Review and acknowledge
  )),
  source TEXT NOT NULL DEFAULT 'manual' CHECK (source IN (
    'manual',      -- Created by user
    'alert',       -- Created from system alert
    'workflow',    -- Created as part of workflow
    'ai',          -- Suggested by AI
    'rule'         -- Created by task rule
  )),

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN (
    'open',        -- Not started
    'in_progress', -- Being worked on
    'waiting',     -- Blocked by dependencies or manually paused
    'done',        -- Completed
    'dismissed'    -- Dismissed with reason
  )),
  dismissed_reason TEXT,
  completion_note TEXT,
  completed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  -- Priority and timing
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN (
    'critical',    -- Must do immediately
    'high',        -- Important, do soon
    'normal',      -- Standard priority
    'low'          -- Can wait
  )),
  due_date DATE,
  due_time TIME,

  -- Assignment
  department TEXT,
  assignee_id UUID,  -- References public.profiles(id)

  -- Relationships
  workflow_id UUID,  -- References action_center.workflows(id), added after workflows table
  parent_task_id UUID REFERENCES action_center.tasks(id) ON DELETE SET NULL,
  sop_template_id UUID,  -- References action_center.sop_templates(id), added after sop_templates table
  depends_on UUID[] DEFAULT '{}',  -- Array of task IDs this depends on

  -- Related entity (generic link to source record)
  related_entity_type TEXT,  -- 'alert', 'program_instance', 'contact', etc.
  related_entity_id UUID,
  related_entity_url TEXT,

  -- Approval-specific fields
  recommendation TEXT,       -- For approval tasks: what AI/system recommends
  recommendation_reasoning TEXT,
  approval_outcome TEXT CHECK (approval_outcome IN ('approved', 'modified', 'rejected')),
  approval_modifications TEXT,

  -- AI-specific fields
  ai_confidence NUMERIC(3,2),  -- 0.00 to 1.00
  ai_suggested_at TIMESTAMPTZ,

  -- Deduplication
  dedupe_key TEXT,  -- Unique key to prevent duplicate tasks

  -- Audit columns
  created_by UUID,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT dismissed_requires_reason CHECK (
    (status = 'dismissed' AND dismissed_reason IS NOT NULL) OR
    (status != 'dismissed')
  ),
  CONSTRAINT dedupe_key_unique UNIQUE (dedupe_key)
);

-- Indexes for common query patterns
CREATE INDEX idx_tasks_status ON action_center.tasks(status);
CREATE INDEX idx_tasks_priority ON action_center.tasks(priority);
CREATE INDEX idx_tasks_due_date ON action_center.tasks(due_date);
CREATE INDEX idx_tasks_assignee ON action_center.tasks(assignee_id);
CREATE INDEX idx_tasks_department ON action_center.tasks(department);
CREATE INDEX idx_tasks_workflow ON action_center.tasks(workflow_id);
CREATE INDEX idx_tasks_source ON action_center.tasks(source);
CREATE INDEX idx_tasks_type ON action_center.tasks(task_type);
CREATE INDEX idx_tasks_created ON action_center.tasks(created_at DESC);
CREATE INDEX idx_tasks_depends_on ON action_center.tasks USING GIN (depends_on);
CREATE INDEX idx_tasks_related_entity ON action_center.tasks(related_entity_type, related_entity_id);
