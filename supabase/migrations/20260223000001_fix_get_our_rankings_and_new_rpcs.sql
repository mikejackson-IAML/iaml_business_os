-- Fix get_our_rankings ambiguous column + create all missing RPCs/tables/views

-- ============================================
-- FIX: get_our_rankings ambiguous keyword_id
-- ============================================

CREATE OR REPLACE FUNCTION web_intel.get_our_rankings()
RETURNS TABLE (
    keyword_id UUID,
    keyword TEXT,
    our_position INTEGER,
    our_url TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tk.id AS keyword_id,
        tk.keyword,
        dr.position AS our_position,
        dr.ranking_url AS our_url
    FROM web_intel.tracked_keywords tk
    LEFT JOIN LATERAL (
        SELECT d.position, d.ranking_url
        FROM web_intel.daily_rankings d
        WHERE d.keyword_id = tk.id
        ORDER BY d.collected_date DESC
        LIMIT 1
    ) dr ON TRUE
    WHERE tk.status = 'active';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fix public wrapper too
CREATE OR REPLACE FUNCTION public.get_our_rankings()
RETURNS TABLE (keyword_id UUID, keyword TEXT, our_position INTEGER, our_url TEXT)
AS $$ SELECT * FROM web_intel.get_our_rankings(); $$ LANGUAGE sql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION web_intel.get_our_rankings() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_our_rankings() TO authenticated, service_role, anon;
