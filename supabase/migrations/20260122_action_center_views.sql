-- Action Center: Views
-- Migration: Create tasks_extended, user_task_summary, department_task_summary views
-- Date: 2026-01-22
-- Depends on: 20260122_action_center_schema.sql, 20260122_action_center_user_mastery.sql

-- ============================================
-- VIEW: tasks_extended
-- Extended task view with computed fields and joins
-- ============================================
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

  -- Computed: is overdue
  CASE
    WHEN t.status IN ('done', 'dismissed') THEN FALSE
    WHEN t.due_date IS NULL THEN FALSE
    WHEN t.due_date < CURRENT_DATE THEN TRUE
    WHEN t.due_date = CURRENT_DATE AND t.due_time IS NOT NULL AND t.due_time < CURRENT_TIME THEN TRUE
    ELSE FALSE
  END AS is_overdue,

  -- Computed: due date category
  CASE
    WHEN t.due_date IS NULL THEN 'no_date'
    WHEN t.due_date < CURRENT_DATE THEN 'overdue'
    WHEN t.due_date = CURRENT_DATE THEN 'today'
    WHEN t.due_date <= CURRENT_DATE + INTERVAL '7 days' THEN 'this_week'
    ELSE 'later'
  END AS due_category,

  -- Computed: is blocked (has incomplete dependencies)
  CASE
    WHEN t.depends_on IS NULL OR t.depends_on = '{}' THEN FALSE
    ELSE EXISTS (
      SELECT 1 FROM action_center.tasks dep
      WHERE dep.id = ANY(t.depends_on)
        AND dep.status NOT IN ('done', 'dismissed')
    )
  END AS is_blocked,

  -- Computed: incomplete dependency count
  (
    SELECT COUNT(*)::INTEGER FROM action_center.tasks dep
    WHERE dep.id = ANY(COALESCE(t.depends_on, '{}'))
      AND dep.status NOT IN ('done', 'dismissed')
  ) AS blocked_by_count,

  -- Computed: tasks this blocks count
  (
    SELECT COUNT(*)::INTEGER FROM action_center.tasks blocker
    WHERE t.id = ANY(COALESCE(blocker.depends_on, '{}'))
      AND blocker.status NOT IN ('done', 'dismissed')
  ) AS blocking_count,

  -- Joined: workflow name
  w.name AS workflow_name,
  w.status AS workflow_status,

  -- Joined: SOP template name
  s.name AS sop_name,
  s.category AS sop_category,

  -- Joined: assignee name
  p.full_name AS assignee_name,
  p.email AS assignee_email

FROM action_center.tasks t
LEFT JOIN action_center.workflows w ON t.workflow_id = w.id
LEFT JOIN action_center.sop_templates s ON t.sop_template_id = s.id
LEFT JOIN public.profiles p ON t.assignee_id = p.id;

COMMENT ON VIEW action_center.tasks_extended IS 'Extended task view with computed fields (is_overdue, is_blocked, due_category) and joined data (workflow, SOP, assignee)';
