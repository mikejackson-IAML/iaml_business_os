-- Add unique index on source_url to prevent duplicate research signals
-- Used with PostgREST's "resolution=ignore-duplicates" for silent upsert behavior
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_signals_source_url_unique
ON linkedin_engine.research_signals (source_url);
