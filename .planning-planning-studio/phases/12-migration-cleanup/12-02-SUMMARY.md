---
phase: 12-migration-cleanup
plan: 02
subsystem: ui
tags: [next.js, redirects, navigation, cleanup]

# Dependency graph
requires:
  - phase: 11-analytics-polish
    provides: Complete Planning Studio UI
provides:
  - Development Dashboard code removed
  - URL redirect /dashboard/development -> /dashboard/planning
  - Updated CEO Dashboard navigation
affects: [none - cleanup plan]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Next.js permanent redirects for deprecated routes

key-files:
  created: []
  modified:
    - dashboard/next.config.ts
    - dashboard/src/app/dashboard/dashboard-content.tsx
  deleted:
    - dashboard/src/app/dashboard/development/ (7 files)
    - dashboard/src/dashboard-kit/types/departments/development.ts
    - dashboard/src/lib/api/development-queries.ts

key-decisions:
  - "Permanent (308) redirect for browser caching"
  - "Redirect sub-paths to planning root (not :path*)"
  - "Removed FolderCode import as no longer needed"

patterns-established:
  - "Use permanent redirects for deprecated routes"

# Metrics
duration: 8min
completed: 2026-01-28
---

# Phase 12 Plan 02: Remove Development Dashboard Summary

**Deleted 9 Development Dashboard files, added permanent redirect to Planning Studio, updated CEO Dashboard navigation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-28T19:45:40Z
- **Completed:** 2026-01-28T19:53:40Z
- **Tasks:** 3
- **Files modified:** 2 modified, 9 deleted

## Accomplishments

- Deleted entire Development Dashboard route and components (7 files)
- Deleted development types and queries (2 files)
- Added permanent 308 redirect from /dashboard/development to /dashboard/planning
- Removed Development link from CEO Dashboard quick links
- Cleaned up unused FolderCode import

## Task Commits

Each task was committed atomically:

1. **Task 1: Delete Old Development Dashboard Files** - `c82b8c59` (chore)
2. **Task 2: Add Redirect and Update Navigation** - `40b41d07` (feat)
3. **Task 3: Verify Clean State** - No commit (verification only)

## Files Created/Modified

**Modified:**
- `dashboard/next.config.ts` - Added redirects() function with permanent redirects
- `dashboard/src/app/dashboard/dashboard-content.tsx` - Removed Development link and FolderCode import

**Deleted:**
- `dashboard/src/app/dashboard/development/page.tsx`
- `dashboard/src/app/dashboard/development/development-content.tsx`
- `dashboard/src/app/dashboard/development/development-skeleton.tsx`
- `dashboard/src/app/dashboard/development/components/ideas-backlog.tsx`
- `dashboard/src/app/dashboard/development/components/launch-modal.tsx`
- `dashboard/src/app/dashboard/development/components/project-card.tsx`
- `dashboard/src/app/dashboard/development/components/roadmap-view.tsx`
- `dashboard/src/dashboard-kit/types/departments/development.ts`
- `dashboard/src/lib/api/development-queries.ts`

## Decisions Made

1. **Permanent (308) redirect** - Browsers cache 308 redirects, reducing server load for repeat visits
2. **Sub-path redirect to root** - /dashboard/development/:path* redirects to /dashboard/planning (not preserving paths) since Development and Planning have different route structures
3. **Removed unused import** - FolderCode icon was only used for Development link, removed to keep imports clean

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

1. **Stale .next cache** - TypeScript check found reference to deleted development/page.js in .next/types/validator.ts. Unable to delete .next folder due to permissions (dev server may be running). Solution: Cleared cache indirectly by running fresh build, which succeeded.

2. **Pre-existing TypeScript errors** - TypeScript check showed many errors in action-center routes (unrelated to Development Dashboard). These are pre-existing issues with Supabase types. The ignoreBuildErrors flag in next.config.ts allows builds to proceed. No new errors introduced by this plan.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Development Dashboard completely removed
- URL redirect active - any bookmarks/links will redirect to Planning Studio
- CEO Dashboard navigation shows Planning link (amber), no Development link
- Ready for 12-03 (E2E Test Suite Setup)

---
*Phase: 12-migration-cleanup*
*Completed: 2026-01-28*
