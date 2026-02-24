-- Web Intel Data Cleanup RPCs
-- Used by: Web Intel - Data Cleanup (ZPnv8S51kJEWLncb)
-- Replaces direct Postgres DELETE queries with RPC functions callable via Supabase REST API

-- ============================================
-- TRENDS TABLE (missing from original schema)
-- ============================================

CREATE TABLE IF NOT EXISTS web_intel.trends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    keyword TEXT,
    trend_type TEXT,
    direction TEXT CHECK (direction IN ('up', 'down', 'stable')),
    magnitude NUMERIC(10,2),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE web_intel.trends ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow authenticated read" ON web_intel.trends;
CREATE POLICY "Allow authenticated read" ON web_intel.trends FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Allow service role full access" ON web_intel.trends;
CREATE POLICY "Allow service role full access" ON web_intel.trends FOR ALL TO service_role USING (true) WITH CHECK (true);
GRANT SELECT ON web_intel.trends TO authenticated;
GRANT ALL ON web_intel.trends TO service_role;

CREATE INDEX IF NOT EXISTS idx_trends_is_active ON web_intel.trends(is_active);
CREATE INDEX IF NOT EXISTS idx_trends_detected_at ON web_intel.trends(detected_at DESC);

-- ============================================
-- ADD started_at COLUMN TO collection_log IF MISSING
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'web_intel' AND table_name = 'collection_log' AND column_name = 'started_at'
    ) THEN
        ALTER TABLE web_intel.collection_log ADD COLUMN started_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'web_intel' AND table_name = 'collection_log' AND column_name = 'completed_at'
    ) THEN
        ALTER TABLE web_intel.collection_log ADD COLUMN completed_at TIMESTAMPTZ;
    END IF;
END $$;

-- ============================================
-- ADD generated_at COLUMN TO ai_insights IF MISSING
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'web_intel' AND table_name = 'ai_insights' AND column_name = 'generated_at'
    ) THEN
        ALTER TABLE web_intel.ai_insights ADD COLUMN generated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- CLEANUP RPCS
-- ============================================

-- 1) Cleanup old collection logs (> 90 days)
CREATE OR REPLACE FUNCTION web_intel.cleanup_old_logs(p_days INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM web_intel.collection_log
    WHERE created_at < NOW() - (p_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN json_build_object('deleted_count', v_count, 'table', 'collection_log');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Cleanup old acknowledged alerts (> 90 days)
CREATE OR REPLACE FUNCTION web_intel.cleanup_old_alerts(p_days INTEGER DEFAULT 90)
RETURNS JSON AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM web_intel.alerts
    WHERE created_at < NOW() - (p_days || ' days')::INTERVAL
      AND acknowledged_at IS NOT NULL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN json_build_object('deleted_count', v_count, 'table', 'alerts');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) Cleanup dismissed AI insights (> 30 days)
CREATE OR REPLACE FUNCTION web_intel.cleanup_dismissed_insights(p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM web_intel.ai_insights
    WHERE status = 'dismissed'
      AND created_at < NOW() - (p_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN json_build_object('deleted_count', v_count, 'table', 'ai_insights');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) Cleanup old inactive trends (> 60 days)
CREATE OR REPLACE FUNCTION web_intel.cleanup_old_trends(p_days INTEGER DEFAULT 60)
RETURNS JSON AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM web_intel.trends
    WHERE is_active = FALSE
      AND detected_at < NOW() - (p_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN json_build_object('deleted_count', v_count, 'table', 'trends');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5) Cleanup year-old page traffic (> 365 days)
CREATE OR REPLACE FUNCTION web_intel.cleanup_old_page_traffic(p_days INTEGER DEFAULT 365)
RETURNS JSON AS $$
DECLARE
    v_count INTEGER;
BEGIN
    DELETE FROM web_intel.page_traffic
    WHERE collected_date < NOW() - (p_days || ' days')::INTERVAL;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN json_build_object('deleted_count', v_count, 'table', 'page_traffic');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6) Log cleanup result (wrapper around insert_collection_log)
CREATE OR REPLACE FUNCTION web_intel.log_cleanup_result(
    p_total_deleted INTEGER
)
RETURNS JSON AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO web_intel.collection_log (
        workflow_id,
        workflow_name,
        status,
        records_processed,
        completed_at
    )
    VALUES (
        'ZPnv8S51kJEWLncb',
        'Data Cleanup',
        'success',
        p_total_deleted,
        NOW()
    )
    RETURNING id INTO v_id;

    RETURN json_build_object('id', v_id, 'success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GRANTS
-- ============================================

GRANT EXECUTE ON FUNCTION web_intel.cleanup_old_logs(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.cleanup_old_alerts(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.cleanup_dismissed_insights(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.cleanup_old_trends(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.cleanup_old_page_traffic(INTEGER) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION web_intel.log_cleanup_result(INTEGER) TO authenticated, service_role;

-- ============================================
-- PUBLIC WRAPPERS FOR POSTGREST
-- ============================================

DROP FUNCTION IF EXISTS public.cleanup_old_logs(INTEGER);
CREATE OR REPLACE FUNCTION public.cleanup_old_logs(p_days INTEGER DEFAULT 90)
RETURNS JSON AS $$ SELECT web_intel.cleanup_old_logs($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.cleanup_old_logs(INTEGER) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.cleanup_old_alerts(INTEGER);
CREATE OR REPLACE FUNCTION public.cleanup_old_alerts(p_days INTEGER DEFAULT 90)
RETURNS JSON AS $$ SELECT web_intel.cleanup_old_alerts($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.cleanup_old_alerts(INTEGER) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.cleanup_dismissed_insights(INTEGER);
CREATE OR REPLACE FUNCTION public.cleanup_dismissed_insights(p_days INTEGER DEFAULT 30)
RETURNS JSON AS $$ SELECT web_intel.cleanup_dismissed_insights($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.cleanup_dismissed_insights(INTEGER) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.cleanup_old_trends(INTEGER);
CREATE OR REPLACE FUNCTION public.cleanup_old_trends(p_days INTEGER DEFAULT 60)
RETURNS JSON AS $$ SELECT web_intel.cleanup_old_trends($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.cleanup_old_trends(INTEGER) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.cleanup_old_page_traffic(INTEGER);
CREATE OR REPLACE FUNCTION public.cleanup_old_page_traffic(p_days INTEGER DEFAULT 365)
RETURNS JSON AS $$ SELECT web_intel.cleanup_old_page_traffic($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.cleanup_old_page_traffic(INTEGER) TO authenticated, service_role;

DROP FUNCTION IF EXISTS public.log_cleanup_result(INTEGER);
CREATE OR REPLACE FUNCTION public.log_cleanup_result(p_total_deleted INTEGER)
RETURNS JSON AS $$ SELECT web_intel.log_cleanup_result($1); $$ LANGUAGE sql SECURITY DEFINER;
GRANT EXECUTE ON FUNCTION public.log_cleanup_result(INTEGER) TO authenticated, service_role;
