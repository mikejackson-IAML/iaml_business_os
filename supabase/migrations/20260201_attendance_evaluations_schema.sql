-- ============================================
-- Phase 5: Attendance & Evaluations Schema
-- ============================================
-- Adds attendance tracking and evaluation storage
-- Migration is idempotent - safe to run multiple times

-- ============================================
-- 1. Attendance tracking on registrations
-- ============================================

-- Add attendance tracking columns to registrations table
ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS attendance_by_block JSONB DEFAULT '{}'::jsonb;

ALTER TABLE registrations
  ADD COLUMN IF NOT EXISTS marked_attended_at TIMESTAMPTZ;

COMMENT ON COLUMN registrations.attendance_by_block IS 'JSONB mapping block_id to attendance boolean, e.g., {"block_1": true, "block_2": false}';
COMMENT ON COLUMN registrations.marked_attended_at IS 'Timestamp when attendance was last recorded';

-- ============================================
-- 2. Evaluation templates table
-- ============================================

CREATE TABLE IF NOT EXISTS evaluation_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  -- Fixed structure per CONTEXT.md decisions (1-5 rating scale)
  rating_categories JSONB NOT NULL DEFAULT '[
    {"key": "instructor", "label": "Instructor Quality", "description": "Knowledge, presentation, responsiveness"},
    {"key": "content", "label": "Content/Materials", "description": "Relevance, clarity, usefulness"},
    {"key": "venue", "label": "Venue/Logistics", "description": "Location, food, facilities", "virtual_skip": true},
    {"key": "overall", "label": "Overall Satisfaction", "description": "Would recommend, met expectations"}
  ]'::jsonb,
  free_text_questions JSONB NOT NULL DEFAULT '[
    {"key": "liked_most", "question": "What did you like most?"},
    {"key": "improvements", "question": "What could be improved?"}
  ]'::jsonb,
  rating_scale_min INTEGER DEFAULT 1,
  rating_scale_max INTEGER DEFAULT 5,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed default template (only if no default exists)
INSERT INTO evaluation_templates (name, description, is_default)
SELECT
  'Standard Post-Program Evaluation',
  'Default evaluation template for all programs',
  true
WHERE NOT EXISTS (
  SELECT 1 FROM evaluation_templates WHERE is_default = true
);

-- ============================================
-- 3. Evaluation responses table
-- ============================================

CREATE TABLE IF NOT EXISTS evaluation_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id UUID NOT NULL REFERENCES registrations(id) ON DELETE CASCADE,
  program_instance_id UUID NOT NULL REFERENCES program_instances(id) ON DELETE CASCADE,
  template_id UUID REFERENCES evaluation_templates(id),
  -- Rating responses stored as JSONB
  -- Example: {"instructor": 5, "content": 4, "venue": 3, "overall": 4}
  ratings JSONB NOT NULL DEFAULT '{}'::jsonb,
  -- Free-text responses stored as JSONB
  -- Example: {"liked_most": "Great instructor!", "improvements": "More breaks"}
  free_text_responses JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  -- Ensure one response per registration
  UNIQUE(registration_id)
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_evaluation_responses_program ON evaluation_responses(program_instance_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_responses_registration ON evaluation_responses(registration_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_responses_submitted ON evaluation_responses(submitted_at);

COMMENT ON TABLE evaluation_responses IS 'Stores evaluation survey responses from attendees';
COMMENT ON COLUMN evaluation_responses.ratings IS 'JSONB ratings, e.g., {"instructor": 5, "content": 4, "venue": 3, "overall": 4}';
COMMENT ON COLUMN evaluation_responses.free_text_responses IS 'JSONB free text, e.g., {"liked_most": "Great instructor!", "improvements": "More breaks"}';

-- ============================================
-- 4. Aggregate scores view
-- ============================================

CREATE OR REPLACE VIEW evaluation_aggregate_scores AS
SELECT
  program_instance_id,
  COUNT(*) as response_count,
  ROUND(AVG((ratings->>'instructor')::numeric), 2) as avg_instructor,
  ROUND(AVG((ratings->>'content')::numeric), 2) as avg_content,
  ROUND(AVG((ratings->>'venue')::numeric), 2) as avg_venue,
  ROUND(AVG((ratings->>'overall')::numeric), 2) as avg_overall,
  ROUND(
    (
      COALESCE(AVG((ratings->>'instructor')::numeric), 0) +
      COALESCE(AVG((ratings->>'content')::numeric), 0) +
      COALESCE(AVG((ratings->>'venue')::numeric), 0) +
      COALESCE(AVG((ratings->>'overall')::numeric), 0)
    ) / NULLIF(
      (CASE WHEN AVG((ratings->>'instructor')::numeric) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN AVG((ratings->>'content')::numeric) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN AVG((ratings->>'venue')::numeric) IS NOT NULL THEN 1 ELSE 0 END) +
      (CASE WHEN AVG((ratings->>'overall')::numeric) IS NOT NULL THEN 1 ELSE 0 END)
    , 0)
  , 2) as avg_total
FROM evaluation_responses
GROUP BY program_instance_id;

COMMENT ON VIEW evaluation_aggregate_scores IS 'Aggregated evaluation scores per program instance';

-- ============================================
-- 5. Update registration dashboard view to include attendance
-- ============================================

-- The registration_dashboard_summary view may need updating
-- Check if it exists and recreate with attendance columns
DO $$
BEGIN
  -- Drop and recreate the view to include attendance columns
  -- Note: This assumes the view exists from previous migrations
  IF EXISTS (SELECT 1 FROM pg_views WHERE viewname = 'registration_dashboard_summary') THEN
    DROP VIEW IF EXISTS registration_dashboard_summary CASCADE;

    CREATE VIEW registration_dashboard_summary AS
    SELECT
      r.id,
      r.airtable_id,
      r.first_name,
      r.last_name,
      COALESCE(r.first_name || ' ' || r.last_name, r.first_name, r.last_name) as full_name,
      r.email,
      r.phone,
      r.company_name,
      r.job_title,
      r.registration_date,
      r.registration_status,
      r.registration_code,
      r.payment_status,
      r.payment_method,
      r.final_price,
      r.attendance_type,
      r.selected_blocks,
      r.program_instance_id,
      r.registration_source,
      r.payment_due_date,
      r.cancelled_at,
      r.refund_status,
      r.refund_amount,
      r.linkedin_url,
      r.linkedin_photo_url,
      r.company_industry,
      r.company_employee_count,
      r.company_growth_30d,
      r.company_growth_60d,
      r.company_growth_90d,
      -- Attendance columns (Phase 5)
      r.attendance_by_block,
      r.marked_attended_at,
      -- Program info
      pi.instance_name,
      pi.program_name,
      pi.format,
      pi.start_date,
      pi.end_date,
      pi.city,
      pi.state
    FROM registrations r
    LEFT JOIN program_instances pi ON r.program_instance_id = pi.id;
  END IF;
END $$;

-- ============================================
-- 6. RLS Policies
-- ============================================

-- Enable RLS on new tables
ALTER TABLE evaluation_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE evaluation_responses ENABLE ROW LEVEL SECURITY;

-- evaluation_templates: Read access for authenticated users
DROP POLICY IF EXISTS "evaluation_templates_select" ON evaluation_templates;
CREATE POLICY "evaluation_templates_select" ON evaluation_templates
  FOR SELECT TO authenticated
  USING (true);

-- evaluation_templates: Full access for service role
DROP POLICY IF EXISTS "evaluation_templates_service" ON evaluation_templates;
CREATE POLICY "evaluation_templates_service" ON evaluation_templates
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- evaluation_responses: Read access for authenticated users
DROP POLICY IF EXISTS "evaluation_responses_select" ON evaluation_responses;
CREATE POLICY "evaluation_responses_select" ON evaluation_responses
  FOR SELECT TO authenticated
  USING (true);

-- evaluation_responses: Insert for authenticated (attendees submit evaluations)
DROP POLICY IF EXISTS "evaluation_responses_insert" ON evaluation_responses;
CREATE POLICY "evaluation_responses_insert" ON evaluation_responses
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- evaluation_responses: Full access for service role
DROP POLICY IF EXISTS "evaluation_responses_service" ON evaluation_responses;
CREATE POLICY "evaluation_responses_service" ON evaluation_responses
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Grant access to aggregate view
GRANT SELECT ON evaluation_aggregate_scores TO authenticated;
GRANT SELECT ON evaluation_aggregate_scores TO anon;
GRANT ALL ON evaluation_aggregate_scores TO service_role;

-- ============================================
-- Migration Complete
-- ============================================
