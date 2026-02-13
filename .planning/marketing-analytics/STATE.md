# Project State

## Project Reference

See: .planning/marketing-analytics/PROJECT.md (updated 2026-02-11)

**Core value:** Open the dashboard and immediately know which campaigns and channels are producing registrations, at what cost, and whether conversion goals are being hit.
**Current focus:** Phase 2 - SmartLead Ingestion

## Current Position

Phase: 2 of 8 (SmartLead Ingestion)
Plan: 0 of 3 in current phase
Status: Ready to plan
Last activity: 2026-02-13 -- Completed Phase 1 (Schema Foundation) - all 4 plans verified

Progress: [█░░░░░░░░░] 12%

## Performance Metrics

**Velocity:**
- Total plans completed: 4
- Average duration: 2.3 min
- Total execution time: 0.15 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 1 | 4 | 9 min | 2.3 min |

**Recent Trend:**
- Last 5 plans: 01-01 (3 min), 01-02 (3 min), 01-03 (1 min), 01-04 (2 min)
- Trend: Consistently fast (SQL migrations)

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: Layer analytics on existing campaign_tracking tables, not redesign them
- [Roadmap]: 5 materialized views + RPC functions pattern (matching 6+ existing migrations)
- [Roadmap]: SmartLead sync before GHL (2x data volume, MCP server exists)
- [Roadmap]: Tier filter baked into RPC functions from Phase 1 (not bolted on later)
- [01-01]: classify_tier() CASE order checks "director" before "executive" -- "Executive Director" maps to directors
- [01-01]: IMMUTABLE volatility for classify_tier() enables materialized view optimization
- [01-02]: Migration renamed from 20260212 to 20260213001 to avoid Supabase CLI timestamp collision
- [01-02]: Channel scoreboard registrations use conversion_attributed_channel for SCHEMA-06 dedup at view level
- [01-02]: mv_campaign_step_metrics uses LEFT JOINs so steps with no activity still appear
- [01-03]: RPC functions use SECURITY DEFINER for Supabase SSR client access
- [01-03]: SUM()::BIGINT aggregation across tier rows when p_tier IS NULL
- [01-04]: refresh_analytics_views() uses CONCURRENTLY refresh with error-safe logging

### Pending Todos

None yet.

### Blockers/Concerns

- Tier classification accuracy: classify_tier() regex needs validation against real contact job titles
- SmartLead campaign ID mapping: campaign_channels.platform_campaign_id must be populated before sync works
- GHL sub-account dedup settings: Must verify "Allow Duplicate Contact" config before Phase 5
- Gemini reply classification: Verify HeyReach receiver writes reply_sentiment to campaign_activity.metadata
- Migration naming: This repo has multiple files sharing date prefixes, causing Supabase CLI conflicts. Future migrations should use unique timestamps (e.g., YYYYMMDDNNN pattern).

## Session Continuity

Last session: 2026-02-13
Stopped at: Phase 1 complete, ready to plan Phase 2
Resume file: None
