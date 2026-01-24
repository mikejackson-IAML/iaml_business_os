-- Alert Integration: Alert Resolution Trigger
-- Migration: Auto-resolve alerts when tasks complete
-- Date: 2026-01-24

-- ============================================
-- STEP 1: Add 'alert_resolved' to activity_type enum
-- The existing constraint needs to be updated
-- ============================================
ALTER TABLE action_center.task_activity
  DROP CONSTRAINT IF EXISTS task_activity_activity_type_check;

ALTER TABLE action_center.task_activity
  ADD CONSTRAINT task_activity_activity_type_check CHECK (activity_type IN (
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
    'ai_modified',
    -- Alert events (NEW)
    'alert_resolved',
    'alert_escalation'
  ));

-- ============================================
-- FUNCTION: Resolve Alert on Task Completion
-- Called by trigger when task status changes to 'done'
-- ============================================
CREATE OR REPLACE FUNCTION action_center.resolve_alert_on_task_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Only process if status changed to 'done' and task is from alert source
  IF NEW.status = 'done' AND OLD.status != 'done' AND NEW.source = 'alert' THEN
    -- Try to update faculty_scheduler alerts if table exists
    -- This is a graceful no-op if the table doesn't exist yet
    IF NEW.related_entity_type IN ('tier_ending', 'vip_non_response') THEN
      BEGIN
        EXECUTE format(
          'UPDATE faculty_scheduler.alerts SET status = $1, resolved_at = $2 WHERE id::TEXT = $3 AND status = $4'
        ) USING 'resolved', NOW(), NEW.related_entity_id, 'active';
      EXCEPTION WHEN undefined_table THEN
        -- faculty_scheduler.alerts doesn't exist yet, skip silently
        NULL;
      END;
    END IF;

    -- Mark occurrences as resolved
    UPDATE action_center.alert_occurrences
    SET task_created = TRUE
    WHERE task_id = NEW.id;

    -- Log activity
    INSERT INTO action_center.task_activity (
      task_id,
      activity_type,
      actor_type,
      metadata
    ) VALUES (
      NEW.id,
      'alert_resolved',
      'system',
      jsonb_build_object(
        'related_entity_type', NEW.related_entity_type,
        'related_entity_id', NEW.related_entity_id
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGER: On Task Status Change
-- ============================================
DROP TRIGGER IF EXISTS task_alert_resolution ON action_center.tasks;
CREATE TRIGGER task_alert_resolution
  AFTER UPDATE OF status ON action_center.tasks
  FOR EACH ROW
  WHEN (NEW.status = 'done' AND OLD.status IS DISTINCT FROM 'done')
  EXECUTE FUNCTION action_center.resolve_alert_on_task_completion();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON FUNCTION action_center.resolve_alert_on_task_completion IS
  'Automatically resolves the source alert when the associated task is completed';
