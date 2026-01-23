---
phase: 01-foundation
plan: 01
subsystem: types
tags: [typescript, web-intel, dashboard, supabase]

# Dependency graph
requires: []
provides:
  - TypeScript type definitions for web_intel schema
  - DailyTraffic, PageTraffic, TrafficSource interfaces
  - TrackedKeyword, DailyRanking, RankingChangeEvent interfaces
  - IndexCoverage, CoreWebVitals, SearchPerformance interfaces
  - ContentInventory, ContentDecay interfaces
  - Competitor, CompetitorRanking, SerpShare interfaces
  - BacklinkProfile, BacklinkItem interfaces
  - WebIntelMetrics and WebIntelDashboardData interfaces
  - webIntelDepartmentConfig export
affects:
  - 01-02 (queries will use these types)
  - 01-03 (navigation references web-intel department)
  - Phase 2+ (all UI components use these types)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Department types file pattern (matches lead-intelligence.ts)
    - Metric interfaces following MetricValue pattern
    - DashboardData aggregate type pattern

key-files:
  created:
    - dashboard/src/dashboard-kit/types/departments/web-intel.ts

key-decisions:
  - "46 interfaces/types covering all web_intel schema tables"
  - "Used camelCase for TypeScript properties matching snake_case DB columns"
  - "Nullable fields use `| null` union type pattern"

patterns-established:
  - "Web Intel types file at departments/web-intel.ts"
  - "Type naming: singular for single records (DailyTraffic), plural for collections"

# Metrics
duration: 3min
completed: 2026-01-23
---

# Phase 1 Plan 01: Web Intel Types Summary

**TypeScript type definitions for 45+ interfaces matching web_intel Supabase schema with department configuration export**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-23T20:27:47Z
- **Completed:** 2026-01-23T20:31:46Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments

- Created comprehensive TypeScript types matching all web_intel schema tables
- Defined WebIntelMetrics with 8 key dashboard metrics
- Defined WebIntelDashboardData aggregating all data structures
- Exported webIntelDepartmentConfig with dashboard configuration, key metrics, quick actions, and status indicators

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Web Intel type definitions file** - `fa96644` (feat)

## Files Created

- `dashboard/src/dashboard-kit/types/departments/web-intel.ts` - TypeScript types for Web Intel dashboard (669 lines)

### Types Defined

**Traffic Types (4):**
- DailyTraffic, PageTraffic, TrafficSource, TrafficGeo

**Rankings Types (5):**
- TrackedKeyword, CompetitorPosition, DailyRanking, RankingChangeEvent
- KeywordPriority, KeywordStatus, RankingChangeType (enums)

**Technical/GSC Types (8):**
- IndexCoverage, IndexError, CoreWebVitals, SearchPerformance
- CrawlStats, MobileUsability, SitemapStatus
- DeviceType, CwvStatus (enums)

**Content Types (6):**
- ContentInventory, ContentDecay, ThinContent, ContentGap, InternalLink
- ContentStatus, ContentHealthStatus, DecaySeverity, ContentCoverage (enums)

**Competitor Types (4):**
- Competitor, CompetitorRanking, CompetitorTraffic, SerpShare

**Backlink Types (3):**
- BacklinkProfile, BacklinkItem, LinkOpportunity, LinkOpportunityStatus

**AI/Reports Types (2):**
- AiInsight, Recommendation, RecommendationStatus

**Alert/Log Types (2):**
- WebIntelAlert, CollectionLog, AlertSeverity, CollectionStatus

**Dashboard Types (2):**
- WebIntelMetrics, WebIntelDashboardData

**Configuration (1):**
- webIntelDepartmentConfig

## Decisions Made

- Followed lead-intelligence.ts pattern for consistent department type structure
- Used union types with `| null` for nullable database columns
- Included all SERP feature flags in DailyRanking (has_featured_snippet, has_local_pack, etc.)
- Set refresh interval to 3600 seconds (1 hour) for web intel data which changes less frequently than lead intel

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Types are ready for use in query functions (01-02-PLAN.md)
- WebIntelDashboardData provides the complete data shape for API responses
- webIntelDepartmentConfig ready for navigation integration (01-03-PLAN.md)

---
*Phase: 01-foundation*
*Completed: 2026-01-23*
