-- Sales Navigator Profile Scraper Schema and RPC Functions
-- Migration: 20260140
-- Converts direct Postgres queries to REST API-compatible RPC functions

-- ============================================
-- TABLE: sales_nav_searches
-- Queue for Sales Navigator profile scraping
-- ============================================
CREATE TABLE IF NOT EXISTS public.sales_nav_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Search details
  search_name TEXT NOT NULL,
  search_url TEXT NOT NULL,
  requested_by TEXT,
  source_workflow TEXT,

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  -- Apify integration
  apify_run_id TEXT,
  apify_dataset_id TEXT,
  cost_per_search NUMERIC(10,2) DEFAULT 0.50,
  cost_per_result NUMERIC(10,4) DEFAULT 0.01,

  -- Results
  result_count INTEGER,
  total_cost NUMERIC(10,2),

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  queued_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_sales_nav_status ON public.sales_nav_searches(status);
CREATE INDEX IF NOT EXISTS idx_sales_nav_queued ON public.sales_nav_searches(queued_at);

-- ============================================
-- FUNCTION: queue_sales_nav_search
-- Insert a new search into the queue
-- ============================================
CREATE OR REPLACE FUNCTION public.queue_sales_nav_search(
  p_search_name TEXT,
  p_search_url TEXT,
  p_requested_by TEXT DEFAULT NULL,
  p_source_workflow TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_result RECORD;
BEGIN
  INSERT INTO public.sales_nav_searches (
    search_name,
    search_url,
    requested_by,
    source_workflow,
    status,
    metadata
  ) VALUES (
    p_search_name,
    p_search_url,
    p_requested_by,
    p_source_workflow,
    'pending',
    '{}'::jsonb
  )
  RETURNING id, search_name, search_url, status, created_at INTO v_result;

  RETURN json_build_object(
    'id', v_result.id,
    'search_name', v_result.search_name,
    'search_url', v_result.search_url,
    'status', v_result.status,
    'created_at', v_result.created_at
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: get_next_pending_search
-- Get the next search to process (if no active processing)
-- ============================================
CREATE OR REPLACE FUNCTION public.get_next_pending_search()
RETURNS JSON AS $$
DECLARE
  v_result RECORD;
BEGIN
  SELECT id, search_name, search_url, requested_by
  INTO v_result
  FROM public.sales_nav_searches
  WHERE status = 'pending'
    AND NOT EXISTS (
      SELECT 1 FROM public.sales_nav_searches
      WHERE status = 'processing'
        AND started_at > NOW() - INTERVAL '5 minutes'
    )
  ORDER BY queued_at ASC
  LIMIT 1;

  IF v_result.id IS NULL THEN
    RETURN json_build_object('found', false);
  END IF;

  RETURN json_build_object(
    'found', true,
    'id', v_result.id,
    'search_name', v_result.search_name,
    'search_url', v_result.search_url,
    'requested_by', v_result.requested_by
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: mark_search_processing
-- Mark a search as currently processing
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_search_processing(
  p_search_id UUID
)
RETURNS JSON AS $$
DECLARE
  v_result RECORD;
BEGIN
  UPDATE public.sales_nav_searches
  SET
    status = 'processing',
    started_at = NOW(),
    updated_at = NOW()
  WHERE id = p_search_id
  RETURNING id, search_url INTO v_result;

  RETURN json_build_object(
    'success', true,
    'id', v_result.id,
    'search_url', v_result.search_url
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: update_search_apify_info
-- Update search with Apify run information
-- ============================================
CREATE OR REPLACE FUNCTION public.update_search_apify_info(
  p_search_id UUID,
  p_apify_run_id TEXT,
  p_apify_dataset_id TEXT
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.sales_nav_searches
  SET
    apify_run_id = p_apify_run_id,
    apify_dataset_id = p_apify_dataset_id,
    cost_per_search = 0.50,
    cost_per_result = 0.01,
    updated_at = NOW()
  WHERE id = p_search_id;

  RETURN json_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: mark_search_failed
-- Mark a search as failed with error info
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_search_failed(
  p_search_id UUID,
  p_error TEXT
)
RETURNS JSON AS $$
BEGIN
  UPDATE public.sales_nav_searches
  SET
    status = 'failed',
    metadata = jsonb_set(COALESCE(metadata, '{}'::jsonb), '{error}', to_jsonb(p_error)),
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_search_id;

  RETURN json_build_object('success', true, 'status', 'failed');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- FUNCTION: mark_search_completed
-- Mark a search as completed with results
-- ============================================
CREATE OR REPLACE FUNCTION public.mark_search_completed(
  p_search_id UUID,
  p_result_count INTEGER DEFAULT 0
)
RETURNS JSON AS $$
DECLARE
  v_cost NUMERIC;
BEGIN
  -- Calculate total cost
  SELECT (cost_per_search + (COALESCE(p_result_count, 0) * cost_per_result))
  INTO v_cost
  FROM public.sales_nav_searches
  WHERE id = p_search_id;

  UPDATE public.sales_nav_searches
  SET
    status = 'completed',
    result_count = p_result_count,
    total_cost = v_cost,
    completed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_search_id;

  RETURN json_build_object(
    'success', true,
    'status', 'completed',
    'result_count', p_result_count,
    'total_cost', v_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.queue_sales_nav_search(TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_next_pending_search() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_search_processing(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.update_search_apify_info(UUID, TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_search_failed(UUID, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.mark_search_completed(UUID, INTEGER) TO anon, authenticated, service_role;

-- Grant table access
GRANT SELECT, INSERT, UPDATE ON public.sales_nav_searches TO anon, authenticated, service_role;
