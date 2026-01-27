-- RNK-02: Change Detector RPCs
-- Run this in Supabase SQL Editor before testing RNK-02 workflow
-- Creates: get_ranking_changes(), insert_collection_log()

-- ============================================
-- get_ranking_changes()
-- Returns significant ranking changes (not stable, not no_data)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_ranking_changes()
RETURNS TABLE (
  keyword_id UUID,
  keyword TEXT,
  priority TEXT,
  category TEXT,
  target_url TEXT,
  today_position INTEGER,
  today_url TEXT,
  yesterday_position INTEGER,
  yesterday_url TEXT,
  change_type TEXT,
  position_change INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    tk.id as keyword_id,
    tk.keyword,
    tk.priority,
    tk.category,
    tk.target_url,
    t.position as today_position,
    t.ranking_url as today_url,
    y.position as yesterday_position,
    y.ranking_url as yesterday_url,
    CASE
      WHEN y.position IS NULL AND t.position IS NOT NULL THEN 'new_ranking'
      WHEN y.position IS NOT NULL AND t.position IS NULL THEN 'lost_ranking'
      WHEN t.position IS NOT NULL AND y.position IS NOT NULL THEN
        CASE
          WHEN t.position - y.position > 10 THEN 'major_drop'
          WHEN t.position - y.position > 3 THEN 'drop'
          WHEN t.position - y.position < -5 THEN 'major_gain'
          WHEN t.position - y.position < -2 THEN 'gain'
          ELSE 'stable'
        END
      ELSE 'no_data'
    END as change_type,
    (COALESCE(t.position, 0) - COALESCE(y.position, 0))::INTEGER as position_change
  FROM web_intel.tracked_keywords tk
  LEFT JOIN web_intel.daily_rankings t
    ON tk.id = t.keyword_id
    AND t.collected_date = CURRENT_DATE
  LEFT JOIN web_intel.daily_rankings y
    ON tk.id = y.keyword_id
    AND y.collected_date = CURRENT_DATE - INTERVAL '1 day'
  WHERE tk.status = 'active'
    AND (
      -- Filter out stable and no_data
      (y.position IS NULL AND t.position IS NOT NULL) OR  -- new_ranking
      (y.position IS NOT NULL AND t.position IS NULL) OR  -- lost_ranking
      (t.position IS NOT NULL AND y.position IS NOT NULL AND
        (t.position - y.position > 3 OR t.position - y.position < -2))  -- significant change
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_ranking_changes() TO service_role;

-- ============================================
-- insert_collection_log()
-- Logs workflow execution status
-- ============================================
CREATE OR REPLACE FUNCTION public.insert_collection_log(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_status TEXT DEFAULT 'success',
  p_records_processed INTEGER DEFAULT 0,
  p_error_message TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO web_intel.collection_log (
    workflow_id,
    workflow_name,
    status,
    records_processed,
    error_message,
    completed_at
  ) VALUES (
    p_workflow_id,
    p_workflow_name,
    p_status,
    p_records_processed,
    p_error_message,
    NOW()
  )
  RETURNING id INTO v_id;

  RETURN jsonb_build_object(
    'success', true,
    'id', v_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.insert_collection_log TO service_role;

-- ============================================
-- VERIFICATION
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'RNK-02 RPCs created successfully:';
  RAISE NOTICE '  - get_ranking_changes()';
  RAISE NOTICE '  - insert_collection_log()';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE 'Now test the workflow in n8n:';
  RAISE NOTICE 'https://n8n.realtyamp.ai/workflow/wQ0U9uUSHnIX0sdL';
END $$;
