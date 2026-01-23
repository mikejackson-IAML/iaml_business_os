-- Action Center: Triggers and Functions
-- Migration: Create workflow status, mastery increment, and activity logging triggers
-- Date: 2026-01-22
-- Depends on: All previous action_center migrations

-- ============================================
-- FUNCTION: Update workflow status
-- Computes workflow status from its tasks
-- ============================================
CREATE OR REPLACE FUNCTION action_center.compute_workflow_status(p_workflow_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_in_progress INTEGER;
  v_blocked INTEGER;
  v_status TEXT;
BEGIN
  -- Get task counts
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'done'),
    COUNT(*) FILTER (WHERE status = 'in_progress'),
    COUNT(*) FILTER (WHERE status = 'waiting')
  INTO v_total, v_completed, v_in_progress, v_blocked
  FROM action_center.tasks
  WHERE workflow_id = p_workflow_id;

  -- Determine status
  IF v_total = 0 THEN
    v_status := 'not_started';
  ELSIF v_completed = v_total THEN
    v_status := 'completed';
  ELSIF v_blocked > 0 THEN
    v_status := 'blocked';
  ELSIF v_in_progress > 0 OR v_completed > 0 THEN
    v_status := 'in_progress';
  ELSE
    v_status := 'not_started';
  END IF;

  RETURN v_status;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION action_center.compute_workflow_status IS 'Computes workflow status from task states: not_started, in_progress, blocked, completed';

-- ============================================
-- TRIGGER FUNCTION: Update workflow on task change
-- ============================================
CREATE OR REPLACE FUNCTION action_center.trigger_update_workflow_status()
RETURNS TRIGGER AS $$
DECLARE
  v_new_status TEXT;
  v_workflow_id UUID;
BEGIN
  -- Determine which workflow to update
  IF TG_OP = 'DELETE' THEN
    v_workflow_id := OLD.workflow_id;
  ELSE
    v_workflow_id := COALESCE(NEW.workflow_id, OLD.workflow_id);
  END IF;

  -- Skip if no workflow
  IF v_workflow_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  -- Compute new status
  v_new_status := action_center.compute_workflow_status(v_workflow_id);

  -- Update workflow
  UPDATE action_center.workflows
  SET
    status = v_new_status,
    total_tasks = (SELECT COUNT(*) FROM action_center.tasks WHERE workflow_id = v_workflow_id),
    completed_tasks = (SELECT COUNT(*) FROM action_center.tasks WHERE workflow_id = v_workflow_id AND status = 'done'),
    started_at = CASE
      WHEN v_new_status != 'not_started' AND started_at IS NULL THEN NOW()
      ELSE started_at
    END,
    completed_at = CASE
      WHEN v_new_status = 'completed' AND completed_at IS NULL THEN NOW()
      WHEN v_new_status != 'completed' THEN NULL
      ELSE completed_at
    END,
    updated_at = NOW()
  WHERE id = v_workflow_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_task_workflow_status
  AFTER INSERT OR UPDATE OF status, workflow_id OR DELETE
  ON action_center.tasks
  FOR EACH ROW
  EXECUTE FUNCTION action_center.trigger_update_workflow_status();

COMMENT ON FUNCTION action_center.trigger_update_workflow_status IS 'Trigger function: updates workflow status, progress, and timestamps when tasks change';

-- ============================================
-- TRIGGER FUNCTION: Increment mastery on task completion
-- ============================================
CREATE OR REPLACE FUNCTION action_center.trigger_increment_mastery()
RETURNS TRIGGER AS $$
BEGIN
  -- Only fire when status changes to 'done'
  IF NEW.status = 'done' AND (OLD.status IS NULL OR OLD.status != 'done') THEN
    -- Only if task has an SOP template and an assignee
    IF NEW.sop_template_id IS NOT NULL AND NEW.assignee_id IS NOT NULL THEN
      PERFORM action_center.increment_user_mastery(NEW.assignee_id, NEW.sop_template_id);

      -- Also increment usage count on SOP template
      UPDATE action_center.sop_templates
      SET
        times_used = times_used + 1,
        last_used_at = NOW()
      WHERE id = NEW.sop_template_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_task_mastery_increment
  AFTER UPDATE OF status
  ON action_center.tasks
  FOR EACH ROW
  EXECUTE FUNCTION action_center.trigger_increment_mastery();

COMMENT ON FUNCTION action_center.trigger_increment_mastery IS 'Trigger function: increments user mastery level when task with SOP is completed';

-- ============================================
-- TRIGGER FUNCTION: Log task activity
-- ============================================
CREATE OR REPLACE FUNCTION action_center.trigger_log_task_activity()
RETURNS TRIGGER AS $$
DECLARE
  v_activity_type TEXT;
  v_old_value TEXT;
  v_new_value TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    -- Log creation
    INSERT INTO action_center.task_activity (
      task_id, activity_type, actor_id, actor_type, metadata
    ) VALUES (
      NEW.id, 'created', NEW.created_by, 'user',
      jsonb_build_object('source', NEW.source)
    );

  ELSIF TG_OP = 'UPDATE' THEN
    -- Log status changes
    IF OLD.status IS DISTINCT FROM NEW.status THEN
      v_activity_type := CASE NEW.status
        WHEN 'done' THEN 'completed'
        WHEN 'dismissed' THEN 'dismissed'
        ELSE 'status_changed'
      END;

      INSERT INTO action_center.task_activity (
        task_id, activity_type, actor_id, actor_type,
        old_value, new_value, metadata
      ) VALUES (
        NEW.id, v_activity_type, NEW.updated_by, 'user',
        OLD.status, NEW.status,
        CASE
          WHEN NEW.status = 'done' THEN jsonb_build_object('completion_note', NEW.completion_note)
          WHEN NEW.status = 'dismissed' THEN jsonb_build_object('dismissed_reason', NEW.dismissed_reason)
          ELSE '{}'
        END
      );
    END IF;

    -- Log priority changes
    IF OLD.priority IS DISTINCT FROM NEW.priority THEN
      INSERT INTO action_center.task_activity (
        task_id, activity_type, actor_id, actor_type,
        old_value, new_value
      ) VALUES (
        NEW.id, 'priority_changed', NEW.updated_by, 'user',
        OLD.priority, NEW.priority
      );
    END IF;

    -- Log assignee changes
    IF OLD.assignee_id IS DISTINCT FROM NEW.assignee_id THEN
      v_activity_type := CASE
        WHEN NEW.assignee_id IS NULL THEN 'unassigned'
        ELSE 'assigned'
      END;

      INSERT INTO action_center.task_activity (
        task_id, activity_type, actor_id, actor_type,
        old_value, new_value
      ) VALUES (
        NEW.id, v_activity_type, NEW.updated_by, 'user',
        OLD.assignee_id::TEXT, NEW.assignee_id::TEXT
      );
    END IF;

    -- Log due date changes
    IF OLD.due_date IS DISTINCT FROM NEW.due_date THEN
      INSERT INTO action_center.task_activity (
        task_id, activity_type, actor_id, actor_type,
        old_value, new_value
      ) VALUES (
        NEW.id, 'due_date_changed', NEW.updated_by, 'user',
        OLD.due_date::TEXT, NEW.due_date::TEXT
      );
    END IF;

    -- Log workflow changes
    IF OLD.workflow_id IS DISTINCT FROM NEW.workflow_id THEN
      v_activity_type := CASE
        WHEN NEW.workflow_id IS NULL THEN 'removed_from_workflow'
        ELSE 'added_to_workflow'
      END;

      INSERT INTO action_center.task_activity (
        task_id, activity_type, actor_id, actor_type,
        old_value, new_value
      ) VALUES (
        NEW.id, v_activity_type, NEW.updated_by, 'user',
        OLD.workflow_id::TEXT, NEW.workflow_id::TEXT
      );
    END IF;

    -- Log approval outcomes
    IF OLD.approval_outcome IS DISTINCT FROM NEW.approval_outcome AND NEW.approval_outcome IS NOT NULL THEN
      INSERT INTO action_center.task_activity (
        task_id, activity_type, actor_id, actor_type,
        new_value, metadata
      ) VALUES (
        NEW.id, NEW.approval_outcome, NEW.updated_by, 'user',
        NEW.approval_outcome,
        CASE
          WHEN NEW.approval_modifications IS NOT NULL
          THEN jsonb_build_object('modifications', NEW.approval_modifications)
          ELSE '{}'
        END
      );
    END IF;

  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_task_activity_log
  AFTER INSERT OR UPDATE
  ON action_center.tasks
  FOR EACH ROW
  EXECUTE FUNCTION action_center.trigger_log_task_activity();

COMMENT ON FUNCTION action_center.trigger_log_task_activity IS 'Trigger function: automatically logs task activity for audit trail';

-- ============================================
-- FUNCTION: Check if task should be waiting
-- ============================================
CREATE OR REPLACE FUNCTION action_center.check_task_blocked(p_task_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_depends_on UUID[];
  v_blocked_count INTEGER;
BEGIN
  -- Get dependencies
  SELECT depends_on INTO v_depends_on
  FROM action_center.tasks
  WHERE id = p_task_id;

  -- If no dependencies, not blocked
  IF v_depends_on IS NULL OR v_depends_on = '{}' THEN
    RETURN FALSE;
  END IF;

  -- Count incomplete dependencies
  SELECT COUNT(*) INTO v_blocked_count
  FROM action_center.tasks
  WHERE id = ANY(v_depends_on)
    AND status NOT IN ('done', 'dismissed');

  RETURN v_blocked_count > 0;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================
-- TRIGGER FUNCTION: Update waiting status when dependencies complete
-- ============================================
CREATE OR REPLACE FUNCTION action_center.trigger_update_dependent_tasks()
RETURNS TRIGGER AS $$
BEGIN
  -- Only run when a task is completed or dismissed
  IF NEW.status IN ('done', 'dismissed') AND OLD.status NOT IN ('done', 'dismissed') THEN
    -- Update any tasks that were waiting on this one
    -- Move them from 'waiting' to 'open' if all deps are now satisfied
    UPDATE action_center.tasks
    SET
      status = 'open',
      updated_at = NOW()
    WHERE NEW.id = ANY(depends_on)
      AND status = 'waiting'
      AND NOT action_center.check_task_blocked(id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_dependency_completion
  AFTER UPDATE OF status
  ON action_center.tasks
  FOR EACH ROW
  EXECUTE FUNCTION action_center.trigger_update_dependent_tasks();

COMMENT ON FUNCTION action_center.check_task_blocked IS 'Returns TRUE if task has incomplete dependencies';
COMMENT ON FUNCTION action_center.trigger_update_dependent_tasks IS 'Trigger function: unblocks waiting tasks when their dependencies complete';

-- ============================================
-- FINAL COMMENTS
-- ============================================
COMMENT ON TRIGGER trigger_task_workflow_status ON action_center.tasks IS 'Updates workflow status when task status changes';
COMMENT ON TRIGGER trigger_task_mastery_increment ON action_center.tasks IS 'Increments user mastery when task with SOP is completed';
COMMENT ON TRIGGER trigger_task_activity_log ON action_center.tasks IS 'Logs all task changes to activity table';
COMMENT ON TRIGGER trigger_dependency_completion ON action_center.tasks IS 'Unblocks dependent tasks when blocking task completes';
