-- ============================================================================
-- MIGRATION: Faculty Scheduler Phase 6 - Response Tracking
-- ============================================================================
-- Adds view tracking to notifications:
-- - viewed_at column on notifications table
-- - record_notification_view() helper function
-- - Updated not_responded_instructors view with viewed_at
-- - Updated dashboard_summary_stats with viewed_count
--
-- Date: 2026-01-22
-- ============================================================================

-- ============================================================================
-- ADD VIEWED_AT COLUMN TO NOTIFICATIONS
-- ============================================================================
ALTER TABLE faculty_scheduler.notifications
ADD COLUMN IF NOT EXISTS viewed_at TIMESTAMPTZ;

-- Index for filtering viewed vs not-viewed notifications
CREATE INDEX IF NOT EXISTS idx_notifications_viewed_at
ON faculty_scheduler.notifications(viewed_at);

COMMENT ON COLUMN faculty_scheduler.notifications.viewed_at IS
  'Timestamp when instructor first clicked the magic link (NULL = not yet viewed)';
