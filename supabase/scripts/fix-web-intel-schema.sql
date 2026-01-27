-- Fix Web Intel Schema Issues
-- Run this in Supabase SQL Editor
-- SAFE TO RUN MULTIPLE TIMES

-- ============================================
-- FIX 1: Add source_breakdown column to daily_traffic
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'web_intel'
    AND table_name = 'daily_traffic'
    AND column_name = 'source_breakdown'
  ) THEN
    ALTER TABLE web_intel.daily_traffic
    ADD COLUMN source_breakdown JSONB DEFAULT '{}';
    RAISE NOTICE 'Added source_breakdown column to daily_traffic';
  ELSE
    RAISE NOTICE 'source_breakdown column already exists';
  END IF;
END $$;

-- ============================================
-- FIX 2: Update insert_collection_log to accept error_message
-- ============================================
CREATE OR REPLACE FUNCTION public.insert_collection_log(
  p_workflow_id TEXT,
  p_workflow_name TEXT,
  p_status TEXT,
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
    collected_at
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
-- FIX 3: Ensure collection_log table has error_message column
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'web_intel'
    AND table_name = 'collection_log'
    AND column_name = 'error_message'
  ) THEN
    ALTER TABLE web_intel.collection_log
    ADD COLUMN error_message TEXT;
    RAISE NOTICE 'Added error_message column to collection_log';
  ELSE
    RAISE NOTICE 'error_message column already exists';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGE
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '✅ Schema fixes applied successfully!';
  RAISE NOTICE 'Fixed:';
  RAISE NOTICE '  - source_breakdown column on daily_traffic';
  RAISE NOTICE '  - insert_collection_log now accepts p_error_message';
  RAISE NOTICE '  - error_message column on collection_log';
END $$;
