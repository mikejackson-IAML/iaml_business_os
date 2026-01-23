---
phase: 01-foundation
plan: 03
subsystem: routing
tags: [nextjs, web-intel, dashboard, routing, suspense]

# Dependency graph
requires:
  - 01-01 (TypeScript types for WebIntelDashboardData)
  - 01-02 (getWebIntelDashboardData query function)
provides:
  - /dashboard/web-intel route
  - WebIntelContent client component with tabs
  - WebIntelSkeleton loading component
  - Server component page with Suspense
affects:
  - 01-04 (navigation now has route to link to)
  - Phase 2+ (content builds on this shell)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server/client component separation pattern (page.tsx server, content client)
    - Suspense with skeleton fallback pattern
    - Tabs-based dashboard layout

key-files:
  created:
    - dashboard/src/app/dashboard/web-intel/page.tsx
    - dashboard/src/app/dashboard/web-intel/web-intel-content.tsx
    - dashboard/src/app/dashboard/web-intel/web-intel-skeleton.tsx

key-decisions:
  - "Import WebIntelDashboardData from queries file, not types file"
  - "Use raw number metrics with helper functions for status calculation"
  - "Health score uses health.score and health.status from queries"
  - "Four-tab structure: Overview, Rankings, Technical, Content"

patterns-established:
  - "Web Intel route pattern matches leads/ for consistency"
  - "Content component uses dashboard-kit components"

# Metrics
duration: 5min
completed: 2026-01-23
---

# Phase 1 Plan 03: Route and Page Structure Summary

**Dashboard route at /dashboard/web-intel with server/client component separation, Suspense loading, and tabbed content layout**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-23T20:34:34Z
- **Completed:** 2026-01-23T20:39:41Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments

- Created `/dashboard/web-intel` route following leads pattern
- Implemented WebIntelSkeleton component for loading states
- Built WebIntelContent client component with 4 tabs (Overview, Rankings, Technical, Content)
- Added key metrics display: Daily Sessions, Avg Position, Indexed Pages, Backlinks
- Integrated HealthScore and alert displays in sidebar
- Set up 1-hour revalidation for server-side caching

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Web Intel skeleton component** - `bb8a2c9` (feat)
2. **Task 2: Create Web Intel content component** - `d63552a` (feat)
3. **Task 3: Create Web Intel page entry point** - `8a3c977` (feat)

## Files Created

- `dashboard/src/app/dashboard/web-intel/page.tsx` - Server component page entry point
- `dashboard/src/app/dashboard/web-intel/web-intel-content.tsx` - Client component with tabs UI
- `dashboard/src/app/dashboard/web-intel/web-intel-skeleton.tsx` - Loading skeleton component

### Page Structure

```
/dashboard/web-intel/
├── page.tsx           (server) - Suspense wrapper, data fetching
├── web-intel-content.tsx (client) - UI with tabs and metrics
└── web-intel-skeleton.tsx - Loading placeholder
```

### Content Component Tabs

| Tab | Purpose | Status |
|-----|---------|--------|
| Overview | Traffic, top pages, health, alerts | Implemented with data |
| Rankings | Keyword ranking positions | Placeholder for Phase 3 |
| Technical | CWV, indexing, crawl stats | Placeholder for Phase 4 |
| Content | Content decay, thin content | Placeholder for Phase 5 |

## Decisions Made

- **Type import source**: Import `WebIntelDashboardData` from `web-intel-queries.ts` (has runtime interface) not from types file (has different structure)
- **Metrics format**: Queries return raw numbers, so added helper functions (`getPositionStatus`) for status calculation
- **Tab structure**: 4 tabs matching future phase content (Rankings=P3, Technical=P4, Content=P5)
- **Revalidation**: 3600 seconds (1 hour) since SEO data changes less frequently than lead data

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Interface mismatch between types and queries**
- **Found during:** Task 2
- **Issue:** Plan code referenced `data.metrics.dailySessions.value` and `data.traffic` but actual `WebIntelDashboardData` from queries has `data.metrics.dailySessions` (raw number) and `data.dailyTraffic`
- **Fix:** Updated component to use correct interface from queries file
- **Files modified:** web-intel-content.tsx

**2. [Rule 1 - Bug] Health property mismatch**
- **Found during:** Task 2
- **Issue:** Plan code referenced `data.overallHealth` but actual interface has `data.health: {score, status}`
- **Fix:** Updated HealthScore component props to use `health.score` and `health.status`
- **Files modified:** web-intel-content.tsx

## Issues Encountered

None beyond the interface fixes above.

## User Setup Required

None - route is accessible once dashboard app is running.

## Next Phase Readiness

- Route is live and accessible at `/dashboard/web-intel`
- Navigation already links to this route (01-04 completed)
- Content tabs ready to be populated in Phases 2-5
- TypeScript compiles without errors for all web-intel files

---
*Phase: 01-foundation*
*Plan: 03*
*Completed: 2026-01-23*
