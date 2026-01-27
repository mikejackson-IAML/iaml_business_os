-- Speed Audit Schema for Weekly Optimization Cycle
-- Migration: Create speed_audits and speed_audit_items tables
-- Date: 2026-01-17

-- ============================================
-- SPEED AUDITS TABLE
-- Master record for each weekly audit
-- ============================================
CREATE TABLE IF NOT EXISTS speed_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_date DATE NOT NULL,
  audit_week TEXT GENERATED ALWAYS AS (TO_CHAR(audit_date, 'IYYY-"W"IW')) STORED,

  -- Aggregate scores
  avg_pagespeed_mobile INTEGER,
  avg_pagespeed_desktop INTEGER,
  avg_lcp_ms INTEGER,
  avg_cls NUMERIC(5,3),
  avg_fid_ms INTEGER,
  avg_fcp_ms INTEGER,
  avg_ttfb_ms INTEGER,
  avg_speed_index INTEGER,

  -- Issue counts by severity
  critical_issues INTEGER DEFAULT 0,
  high_issues INTEGER DEFAULT 0,
  medium_issues INTEGER DEFAULT 0,
  low_issues INTEGER DEFAULT 0,

  -- Week-over-week comparison
  mobile_score_delta INTEGER,          -- Positive = improvement
  desktop_score_delta INTEGER,
  lcp_delta_ms INTEGER,                -- Negative = improvement
  cls_delta NUMERIC(5,3),

  -- Previous audit reference
  previous_audit_id UUID REFERENCES speed_audits(id),

  -- Raw data storage
  page_results JSONB DEFAULT '[]',     -- Per-page detailed results
  code_analysis JSONB DEFAULT '{}',    -- Static code analysis findings
  recommendations JSONB DEFAULT '[]',  -- Generated recommendations

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'partial', 'executed', 'deferred', 'completed')),
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  executed_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,

  -- Execution tracking
  prd_generated_at TIMESTAMPTZ,
  prd_file_path TEXT,
  ralph_session_id TEXT,

  -- Notification tracking
  slack_sent_at TIMESTAMPTZ,
  email_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for speed_audits
CREATE INDEX idx_speed_audits_date ON speed_audits(audit_date DESC);
CREATE INDEX idx_speed_audits_week ON speed_audits(audit_week);
CREATE INDEX idx_speed_audits_status ON speed_audits(status);
-- ============================================
-- SPEED AUDIT ITEMS TABLE
-- Individual issues/recommendations per audit
-- ============================================
CREATE TABLE IF NOT EXISTS speed_audit_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES speed_audits(id) ON DELETE CASCADE,

  -- Issue identification
  item_code TEXT NOT NULL,             -- 'SPEED-001', etc.
  issue_type TEXT NOT NULL,            -- 'blocking_script', 'large_image', 'no_preconnect', 'unoptimized_image', 'no_lazy_load', 'render_blocking_css', 'unused_css', 'unused_js', 'large_dom', 'long_task', 'main_thread_work'
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low')),

  -- Location
  page_url TEXT,                       -- Affected page URL
  file_path TEXT,                      -- Source file in codebase
  line_number INTEGER,                 -- Optional: specific line

  -- Issue details
  title TEXT NOT NULL,
  description TEXT,
  fix_suggestion TEXT,
  estimated_impact TEXT,               -- 'High', 'Medium', 'Low'
  estimated_savings_ms INTEGER,        -- Estimated time savings
  estimated_savings_bytes INTEGER,     -- Estimated byte savings

  -- For Ralph PRD generation
  acceptance_criteria TEXT[],
  affected_files TEXT[],
  dependencies TEXT[],

  -- Approval workflow
  approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,
  deferred BOOLEAN DEFAULT FALSE,
  deferred_reason TEXT,

  -- Execution tracking
  executed BOOLEAN DEFAULT FALSE,
  executed_at TIMESTAMPTZ,
  execution_notes TEXT,

  -- Validation
  validated BOOLEAN DEFAULT FALSE,
  validated_at TIMESTAMPTZ,
  improvement_measured_ms INTEGER,
  improvement_measured_bytes INTEGER,
  validation_notes TEXT,

  -- Priority for ordering
  priority_score INTEGER GENERATED ALWAYS AS (
    CASE severity
      WHEN 'critical' THEN 100
      WHEN 'high' THEN 75
      WHEN 'medium' THEN 50
      WHEN 'low' THEN 25
    END +
    CASE estimated_impact
      WHEN 'High' THEN 25
      WHEN 'Medium' THEN 15
      WHEN 'Low' THEN 5
      ELSE 0
    END
  ) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for speed_audit_items
CREATE INDEX idx_speed_audit_items_audit ON speed_audit_items(audit_id);
CREATE INDEX idx_speed_audit_items_severity ON speed_audit_items(severity);
CREATE INDEX idx_speed_audit_items_type ON speed_audit_items(issue_type);
CREATE INDEX idx_speed_audit_items_approved ON speed_audit_items(approved) WHERE approved = TRUE;
CREATE INDEX idx_speed_audit_items_executed ON speed_audit_items(executed);
CREATE INDEX idx_speed_audit_items_priority ON speed_audit_items(priority_score DESC);
-- ============================================
-- SPEED AUDIT PAGE RESULTS TABLE
-- Per-page metrics for detailed tracking
-- ============================================
CREATE TABLE IF NOT EXISTS speed_audit_page_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id UUID NOT NULL REFERENCES speed_audits(id) ON DELETE CASCADE,

  -- Page identification
  page_url TEXT NOT NULL,
  page_name TEXT,                      -- Friendly name like 'Homepage', 'Employment Law Update'

  -- PageSpeed scores
  pagespeed_mobile INTEGER,
  pagespeed_desktop INTEGER,

  -- Core Web Vitals
  lcp_ms INTEGER,
  cls NUMERIC(5,3),
  fid_ms INTEGER,
  inp_ms INTEGER,
  fcp_ms INTEGER,
  ttfb_ms INTEGER,
  speed_index INTEGER,
  total_blocking_time_ms INTEGER,

  -- Resource metrics
  total_requests INTEGER,
  total_bytes INTEGER,
  html_bytes INTEGER,
  css_bytes INTEGER,
  js_bytes INTEGER,
  image_bytes INTEGER,
  font_bytes INTEGER,

  -- Lighthouse category scores
  performance_score INTEGER,
  accessibility_score INTEGER,
  best_practices_score INTEGER,
  seo_score INTEGER,

  -- Week-over-week for this page
  previous_mobile_score INTEGER,
  previous_desktop_score INTEGER,
  mobile_delta INTEGER,
  desktop_delta INTEGER,

  -- Raw Lighthouse data
  lighthouse_data JSONB,
  opportunities JSONB DEFAULT '[]',    -- Lighthouse opportunities
  diagnostics JSONB DEFAULT '[]',      -- Lighthouse diagnostics

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Indexes for page results
CREATE INDEX idx_speed_audit_page_results_audit ON speed_audit_page_results(audit_id);
CREATE INDEX idx_speed_audit_page_results_url ON speed_audit_page_results(page_url);
CREATE INDEX idx_speed_audit_page_results_mobile ON speed_audit_page_results(pagespeed_mobile);
-- ============================================
-- SPEED OPTIMIZATION PATTERNS TABLE
-- Track successful optimizations for learning
-- ============================================
CREATE TABLE IF NOT EXISTS speed_optimization_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Pattern identification
  pattern_name TEXT NOT NULL,
  issue_type TEXT NOT NULL,            -- Matches speed_audit_items.issue_type

  -- The fix
  description TEXT NOT NULL,
  fix_code_before TEXT,                -- Example before code
  fix_code_after TEXT,                 -- Example after code
  files_typically_affected TEXT[],

  -- Effectiveness
  times_applied INTEGER DEFAULT 1,
  avg_improvement_ms INTEGER,
  avg_improvement_bytes INTEGER,
  success_rate NUMERIC(3,2),           -- 0.00 to 1.00

  -- From audit items
  source_audit_item_ids UUID[],

  -- Integration with n8n-brain
  n8n_brain_pattern_id UUID,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
-- Index for patterns
CREATE INDEX idx_speed_patterns_type ON speed_optimization_patterns(issue_type);
CREATE INDEX idx_speed_patterns_success ON speed_optimization_patterns(success_rate DESC);
-- ============================================
-- VIEWS
-- ============================================

-- Current audit status view
CREATE OR REPLACE VIEW speed_audit_summary AS
SELECT
  sa.id,
  sa.audit_date,
  sa.audit_week,
  sa.avg_pagespeed_mobile,
  sa.avg_pagespeed_desktop,
  sa.avg_lcp_ms,
  sa.avg_cls,
  sa.mobile_score_delta,
  sa.desktop_score_delta,
  sa.critical_issues,
  sa.high_issues,
  sa.medium_issues,
  sa.low_issues,
  (sa.critical_issues + sa.high_issues + sa.medium_issues + sa.low_issues) as total_issues,
  sa.status,
  COALESCE(approved.count, 0) as items_approved,
  COALESCE(executed.count, 0) as items_executed,
  COALESCE(validated.count, 0) as items_validated,
  sa.created_at
FROM speed_audits sa
LEFT JOIN (
  SELECT audit_id, COUNT(*) as count
  FROM speed_audit_items
  WHERE approved = TRUE
  GROUP BY audit_id
) approved ON approved.audit_id = sa.id
LEFT JOIN (
  SELECT audit_id, COUNT(*) as count
  FROM speed_audit_items
  WHERE executed = TRUE
  GROUP BY audit_id
) executed ON executed.audit_id = sa.id
LEFT JOIN (
  SELECT audit_id, COUNT(*) as count
  FROM speed_audit_items
  WHERE validated = TRUE
  GROUP BY audit_id
) validated ON validated.audit_id = sa.id
ORDER BY sa.audit_date DESC;
-- Week-over-week trend view
CREATE OR REPLACE VIEW speed_audit_trends AS
SELECT
  audit_week,
  audit_date,
  avg_pagespeed_mobile,
  avg_pagespeed_desktop,
  avg_lcp_ms,
  avg_cls,
  mobile_score_delta,
  desktop_score_delta,
  (critical_issues + high_issues + medium_issues + low_issues) as total_issues,
  LAG(avg_pagespeed_mobile) OVER (ORDER BY audit_date) as prev_mobile,
  LAG(avg_pagespeed_desktop) OVER (ORDER BY audit_date) as prev_desktop
FROM speed_audits
WHERE status != 'pending'
ORDER BY audit_date DESC
LIMIT 12;
-- Last 12 weeks

-- Pending items for approval view
CREATE OR REPLACE VIEW speed_audit_pending_items AS
SELECT
  sai.id,
  sai.item_code,
  sai.issue_type,
  sai.severity,
  sai.title,
  sai.description,
  sai.fix_suggestion,
  sai.estimated_impact,
  sai.estimated_savings_ms,
  sai.page_url,
  sai.file_path,
  sai.priority_score,
  sa.audit_date,
  sa.audit_week
FROM speed_audit_items sai
JOIN speed_audits sa ON sa.id = sai.audit_id
WHERE sa.status = 'pending'
  AND sai.approved = FALSE
  AND sai.deferred = FALSE
ORDER BY sai.priority_score DESC;
-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Update timestamps trigger
CREATE OR REPLACE FUNCTION update_speed_audit_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Apply triggers
DROP TRIGGER IF EXISTS speed_audits_updated_at ON speed_audits;
CREATE TRIGGER speed_audits_updated_at
  BEFORE UPDATE ON speed_audits
  FOR EACH ROW EXECUTE FUNCTION update_speed_audit_updated_at();
DROP TRIGGER IF EXISTS speed_audit_items_updated_at ON speed_audit_items;
CREATE TRIGGER speed_audit_items_updated_at
  BEFORE UPDATE ON speed_audit_items
  FOR EACH ROW EXECUTE FUNCTION update_speed_audit_updated_at();
DROP TRIGGER IF EXISTS speed_patterns_updated_at ON speed_optimization_patterns;
CREATE TRIGGER speed_patterns_updated_at
  BEFORE UPDATE ON speed_optimization_patterns
  FOR EACH ROW EXECUTE FUNCTION update_speed_audit_updated_at();
-- Function to calculate week-over-week deltas
CREATE OR REPLACE FUNCTION calculate_speed_audit_deltas(p_audit_id UUID)
RETURNS VOID AS $$
DECLARE
  v_audit_date DATE;
  v_prev_audit_id UUID;
  v_prev_mobile INTEGER;
  v_prev_desktop INTEGER;
  v_prev_lcp INTEGER;
  v_prev_cls NUMERIC(5,3);
BEGIN
  -- Get current audit date
  SELECT audit_date INTO v_audit_date
  FROM speed_audits WHERE id = p_audit_id;

  -- Find previous audit
  SELECT id, avg_pagespeed_mobile, avg_pagespeed_desktop, avg_lcp_ms, avg_cls
  INTO v_prev_audit_id, v_prev_mobile, v_prev_desktop, v_prev_lcp, v_prev_cls
  FROM speed_audits
  WHERE audit_date < v_audit_date
    AND status NOT IN ('pending')
  ORDER BY audit_date DESC
  LIMIT 1;

  -- Update with deltas
  UPDATE speed_audits
  SET
    previous_audit_id = v_prev_audit_id,
    mobile_score_delta = CASE WHEN v_prev_mobile IS NOT NULL THEN avg_pagespeed_mobile - v_prev_mobile ELSE NULL END,
    desktop_score_delta = CASE WHEN v_prev_desktop IS NOT NULL THEN avg_pagespeed_desktop - v_prev_desktop ELSE NULL END,
    lcp_delta_ms = CASE WHEN v_prev_lcp IS NOT NULL THEN avg_lcp_ms - v_prev_lcp ELSE NULL END,
    cls_delta = CASE WHEN v_prev_cls IS NOT NULL THEN avg_cls - v_prev_cls ELSE NULL END
  WHERE id = p_audit_id;
END;
$$ LANGUAGE plpgsql;
-- Function to approve all items by severity
CREATE OR REPLACE FUNCTION approve_speed_audit_items(
  p_audit_id UUID,
  p_min_severity TEXT DEFAULT 'low',
  p_approved_by TEXT DEFAULT 'system'
)
RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
  v_severities TEXT[];
BEGIN
  -- Determine which severities to approve
  v_severities := CASE p_min_severity
    WHEN 'critical' THEN ARRAY['critical']
    WHEN 'high' THEN ARRAY['critical', 'high']
    WHEN 'medium' THEN ARRAY['critical', 'high', 'medium']
    ELSE ARRAY['critical', 'high', 'medium', 'low']
  END;

  UPDATE speed_audit_items
  SET
    approved = TRUE,
    approved_at = NOW(),
    approved_by = p_approved_by
  WHERE audit_id = p_audit_id
    AND approved = FALSE
    AND deferred = FALSE
    AND severity = ANY(v_severities);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  -- Update audit status if items were approved
  IF v_count > 0 THEN
    UPDATE speed_audits
    SET
      status = 'approved',
      approved_at = NOW(),
      approved_by = p_approved_by
    WHERE id = p_audit_id;
  END IF;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql;
-- Function to generate next item code
CREATE OR REPLACE FUNCTION get_next_speed_item_code(p_audit_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) + 1 INTO v_count
  FROM speed_audit_items
  WHERE audit_id = p_audit_id;

  RETURN 'SPEED-' || LPAD(v_count::TEXT, 3, '0');
END;
$$ LANGUAGE plpgsql;
-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE speed_audits IS 'Weekly speed audit master records with aggregate metrics and status tracking';
COMMENT ON TABLE speed_audit_items IS 'Individual optimization items per audit with approval and execution workflow';
COMMENT ON TABLE speed_audit_page_results IS 'Per-page detailed metrics from each audit';
COMMENT ON TABLE speed_optimization_patterns IS 'Successful optimization patterns for learning and reuse';
COMMENT ON VIEW speed_audit_summary IS 'Summary view of audits with item counts';
COMMENT ON VIEW speed_audit_trends IS 'Week-over-week performance trends';
COMMENT ON VIEW speed_audit_pending_items IS 'Items awaiting approval from current pending audit';
