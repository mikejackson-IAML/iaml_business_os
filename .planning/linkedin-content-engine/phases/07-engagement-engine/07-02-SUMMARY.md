---
phase: 07-engagement-engine
plan: 02
subsystem: dashboard
tags: [nextjs, supabase, engagement, network-crud, digest, roi, react]

# Dependency graph
requires:
  - phase: 07-engagement-engine
    plan: 01
    provides: engagement_digests table, EngagementDigestDb type, anon grants
  - phase: 05-content-generation-drafts
    plan: 02
    provides: Dashboard patterns (optimistic updates, API routes, mutations)
provides:
  - API routes for engagement digest, network CRUD
  - Query functions: getTodayDigest, getEngagementNetworkFull, getEngagementROIMetrics
  - Mutation functions: createNetworkContact, updateNetworkContact, deactivateNetworkContact, updateDigestItemStatus
  - Fully interactive Engagement tab with digest display, network management, ROI metrics
affects: [dashboard-daily-workflow]

# Tech tracking
tech-stack:
  patterns:
    - ".schema('linkedin_engine').from('table') for non-public schema access"
    - "Grid layout with responsive sidebar (col-span-8/4 on lg, full width on mobile)"
    - "Optimistic updates with rollback for all CRUD operations"
    - "Copy-to-clipboard for comment suggestions"

key-files:
  created:
    - dashboard/src/app/api/linkedin-content/engagement/route.ts
    - dashboard/src/app/api/linkedin-content/engagement/[id]/status/route.ts
    - dashboard/src/app/api/linkedin-content/network/route.ts
    - dashboard/src/app/api/linkedin-content/network/[id]/route.ts
  modified:
    - dashboard/src/lib/api/linkedin-content-queries.ts
    - dashboard/src/lib/api/linkedin-content-mutations.ts
    - dashboard/src/app/dashboard/marketing/linkedin-content/linkedin-content.tsx

key-decisions:
  - "Reversed dot notation decision: .schema('linkedin_engine').from('table') instead of .from('linkedin_engine.table')"
  - "Dot notation was silently failing all queries (PostgREST treated it as table name in public schema)"
  - "Add Contact modal with full form fields (name, URL, headline, follower count, tier, category, notes)"
  - "Three-section layout: digest (main), network sidebar (right), ROI metrics (bottom)"

patterns-established:
  - "Supabase schema() method for non-public schema access via PostgREST"
  - "Network CRUD pattern: list + add modal + inline edit + soft delete"
  - "Digest status management with optimistic updates"

# Metrics
duration: ~20min
completed: 2026-02-15
---

# Phase 7 Plan 2: Engagement Dashboard Summary

**Dashboard Engagement tab overhaul: API routes for digest and network CRUD, query/mutation functions with schema-correct Supabase access, and a fully interactive three-section UI with digest display, network management, and ROI metrics**

## Performance

- **Duration:** ~20 min (including human-verify checkpoint and bug fix)
- **Started:** 2026-02-16T03:00:32Z
- **Completed:** 2026-02-16T03:40:00Z
- **Tasks:** 2 + checkpoint + bug fix
- **Files modified:** 7

## Accomplishments
- 3 new query functions: getTodayDigest, getEngagementNetworkFull, getEngagementROIMetrics
- 4 new mutation functions: createNetworkContact, updateNetworkContact, deactivateNetworkContact, updateDigestItemStatus
- 4 new API route files with validation and error handling
- Engagement tab redesigned with three sections: Today's Digest, Network CRUD, ROI Metrics
- Warming alert banner on publish days (Tue-Fri)
- Copy-to-clipboard for AI comment suggestions
- Add Contact modal with full form validation
- Network contact list with tier/category filters, inline edit, soft delete
- Critical bug fix: all 23 Supabase queries across both files were silently failing due to dot notation

## Task Commits

Each task was committed atomically:

1. **Task 1: API routes + query/mutation functions** - `203a658d` (feat)
2. **Task 2: Engagement tab UI redesign** - `b5ac7739` (feat)
3. **Bug fix: Schema access pattern** - `cec69290` (fix)

## Files Created/Modified
- `dashboard/src/app/api/linkedin-content/engagement/route.ts` - GET today's digest
- `dashboard/src/app/api/linkedin-content/engagement/[id]/status/route.ts` - PATCH digest item status
- `dashboard/src/app/api/linkedin-content/network/route.ts` - GET all contacts + POST new contact
- `dashboard/src/app/api/linkedin-content/network/[id]/route.ts` - PATCH update + DELETE deactivate
- `dashboard/src/lib/api/linkedin-content-queries.ts` - 3 new query functions + schema fix (12 occurrences)
- `dashboard/src/lib/api/linkedin-content-mutations.ts` - 4 new mutation functions + schema fix (11 occurrences)
- `dashboard/src/app/dashboard/marketing/linkedin-content/linkedin-content.tsx` - Engagement tab redesign

## Decisions Made
- **Reversed dot notation decision:** The previous decision (Phase 4) to use `.from('linkedin_engine.table')` was wrong. PostgREST interprets this as a literal table name `linkedin_engine.table` in the `public` schema, not as `table` in the `linkedin_engine` schema. All queries were silently returning empty arrays. Fixed to `.schema('linkedin_engine').from('table')` which correctly sets Accept-Profile/Content-Profile headers.
- **Three-section responsive layout:** Digest takes 8 columns, network sidebar takes 4 columns on large screens, everything stacks on mobile.

## Deviations from Plan
- **Bug fix added:** The plan specified dot notation for Supabase schema access (matching prior phases). During human-verify checkpoint, Add Contact failed with "Internal server error". Investigation revealed ALL queries in both files were broken. Fixed all 23 occurrences.

## Issues Encountered
- **All Supabase queries silently failing:** The dot notation pattern `.from('linkedin_engine.table_name')` was broken for all LinkedIn Content Engine queries from Phase 4 onward. Queries returned empty arrays (caught by error handling), inserts/updates threw errors. Root cause: PostgREST looks for a table literally named `linkedin_engine.table_name` in the `public` schema when using dot notation. The `.schema()` method properly sets the `Accept-Profile`/`Content-Profile` HTTP headers.

## User Feedback (Deferred)
- **Simplified Add Contact:** User wants future version to only require LinkedIn URL, tier, category, and notes. A workflow would auto-populate name, headline, follower count via Apify scraping. This is a future enhancement, not current scope.

---
*Phase: 07-engagement-engine*
*Completed: 2026-02-15*
