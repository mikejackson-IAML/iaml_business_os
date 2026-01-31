-- Update program_dashboard_summary view to include virtual block/certificate data
-- This enables:
-- 1. Virtual blocks to show their parent certificate name
-- 2. Virtual certificates to show rollup counts of child blocks
-- Date: 2026-01-31
-- Plan: 01-05 (Gap Closure)

CREATE OR REPLACE VIEW program_dashboard_summary AS
SELECT
  pi.id,
  pi.airtable_id,
  pi.instance_name,
  pi.program_name,
  pi.format,
  pi.start_date,
  pi.end_date,
  pi.city,
  pi.state,
  pi.venue_name,
  pi.current_enrolled,
  pi.min_capacity,
  pi.max_capacity,
  pi.status,
  ROUND((pi.current_enrolled::DECIMAL / NULLIF(pi.min_capacity, 0)) * 100) as enrollment_percent,
  pi.start_date - CURRENT_DATE as days_until_start,
  calculate_readiness_score(pi.id) as readiness_score,
  pr.faculty_confirmed_at IS NOT NULL as faculty_confirmed,
  pr.faculty_brief_sent_at IS NOT NULL as faculty_brief_sent,
  pr.venue_confirmed_at IS NOT NULL as venue_confirmed,
  pr.materials_ordered_at IS NOT NULL as materials_ordered,
  pr.materials_received_at IS NOT NULL as materials_received,
  pr.shrm_approved_at IS NOT NULL as shrm_approved,
  pr.av_ordered_at IS NOT NULL as av_ordered,
  pr.catering_confirmed_at IS NOT NULL as catering_confirmed,
  pr.room_block_active_at IS NOT NULL as room_block_active,
  pr.registration_page_live_at IS NOT NULL as registration_live,
  rb.hotel_name as room_block_hotel,
  rb.rooms_booked,
  rb.block_size,
  ROUND((rb.rooms_booked::DECIMAL / NULLIF(rb.block_size, 0)) * 100) as room_block_percent,
  rb.cutoff_date as room_block_cutoff,
  rb.attrition_date as room_block_attrition,
  -- Virtual block/certificate columns
  pi.parent_program_id,
  parent.instance_name as parent_program_name,
  COALESCE(child_stats.child_count, 0) as child_block_count,
  COALESCE(child_stats.child_enrolled, 0) as child_total_enrolled
FROM program_instances pi
LEFT JOIN program_readiness pr ON pr.program_instance_id = pi.id
LEFT JOIN room_blocks rb ON rb.program_instance_id = pi.id AND rb.status = 'active'
-- Join to get parent program name for virtual blocks
LEFT JOIN program_instances parent ON parent.id = pi.parent_program_id
-- Subquery to get child stats for virtual certificates
LEFT JOIN LATERAL (
  SELECT
    COUNT(*) as child_count,
    COALESCE(SUM(current_enrolled), 0) as child_enrolled
  FROM program_instances child
  WHERE child.parent_program_id = pi.id
) child_stats ON true
WHERE pi.status != 'cancelled'
ORDER BY pi.start_date;

-- Add comment for documentation
COMMENT ON VIEW program_dashboard_summary IS 'Main dashboard view with readiness scores and virtual block/certificate relationships';
