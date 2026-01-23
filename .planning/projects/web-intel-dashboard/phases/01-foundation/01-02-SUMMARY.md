---
phase: 01-foundation
plan: 02
subsystem: api
tags: [supabase, typescript, web-intel, seo, analytics, data-layer]

# Dependency graph
requires:
  - phase: none
    provides: web_intel schema exists in Supabase (from migration 20260121)
provides:
  - Supabase query functions for all web_intel tables
  - Type definitions for database and frontend models
  - Transform functions for snake_case to camelCase
  - Health score calculation for web intel
  - Metrics builder for dashboard KPIs
  - Main data fetcher getWebIntelDashboardData()
affects: [01-03, 01-04, phase-2-traffic, phase-3-rankings, phase-4-technical]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Query pattern: getServerClient() + schema prefix + error handling"
    - "Transform pattern: DB interface (snake_case) + frontend interface (camelCase)"
    - "Promise.all pattern: Parallel data fetching for dashboard"

key-files:
  created:
    - dashboard/src/lib/api/web-intel-queries.ts
  modified: []

key-decisions:
  - "Used web_intel. schema prefix for all queries (matches migration)"
  - "Separated DB types from frontend types for clean transformation"
  - "Health score weighted equally across 4 components (25% each)"

patterns-established:
  - "Query function naming: get[Entity](params) returning Promise<EntityDb[]>"
  - "Transform function naming: transform[Entity](data) returning Entity[]"
  - "Error handling: console.error + return empty array/null"

# Metrics
duration: 8min
completed: 2026-01-23
---

# Phase 1 Plan 02: Supabase Queries Summary

**Supabase query layer with 11 individual queries, type transformations, and main data fetcher for web_intel schema**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-23T14:25:00Z
- **Completed:** 2026-01-23T14:33:00Z
- **Tasks:** 3
- **Files created:** 1

## Accomplishments
- Created 11 individual query functions for all major web_intel tables
- Defined raw database interfaces (snake_case) and frontend types (camelCase)
- Built transform functions for all data types
- Implemented health score calculation based on CWV, rankings, index coverage, alerts
- Created metrics builder for dashboard KPIs
- Main getWebIntelDashboardData() fetches all data in parallel with Promise.all

## Task Commits

Each task was committed as a single atomic unit:

1. **Tasks 1-3: Complete queries file** - `0b0be33` (feat)
   - Raw database type interfaces
   - 11 Supabase query functions
   - Transform functions and main data fetcher

## Files Created/Modified
- `dashboard/src/lib/api/web-intel-queries.ts` - Complete query layer for web_intel schema

## Query Functions Created

| Function | Table | Returns |
|----------|-------|---------|
| getDailyTraffic | daily_traffic | DailyTrafficDb[] |
| getTopPages | page_traffic | PageTrafficDb[] |
| getTrackedKeywords | tracked_keywords | TrackedKeywordDb[] |
| getDailyRankings | daily_rankings | DailyRankingDb[] |
| getRankingChanges | ranking_change_events | RankingChangeEventDb[] |
| getCoreWebVitals | core_web_vitals | CoreWebVitalsDb[] |
| getIndexCoverage | index_coverage | IndexCoverageDb | null |
| getSearchPerformance | search_performance | SearchPerformanceDb[] |
| getContentDecay | content_decay | ContentDecayDb[] |
| getBacklinkProfile | backlink_profile | BacklinkProfileDb | null |
| getWebIntelAlerts | alerts | WebIntelAlertDb[] |

## Decisions Made
- **Schema prefix**: Used `web_intel.` prefix for all Supabase queries to match the schema setup
- **Type separation**: Defined separate DB types (snake_case) and frontend types (camelCase) for clean transformation layer
- **Health score weighting**: Equal 25% weight across CWV status, ranking stability, index coverage, and alert status
- **Error handling**: All queries log errors and return empty arrays/null to prevent page crashes

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - implementation straightforward following lead-intelligence-queries.ts pattern.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Query functions ready for use by page components
- 01-03 (dashboard types) can now import and extend these types
- 01-04 (navigation) independent of this plan
- UI phases can call getWebIntelDashboardData() for all dashboard data

---
*Phase: 01-foundation*
*Plan: 02*
*Completed: 2026-01-23*
