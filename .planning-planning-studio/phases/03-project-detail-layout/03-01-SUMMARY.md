---
phase: 03-project-detail-layout
plan: 01
subsystem: ui
tags: [next.js, server-components, stepper, tooltip, lucide, shadcn]

requires:
  - phase: 01-database-foundation
    provides: TypeScript types, helper functions, query layer
  - phase: 02-pipeline-view
    provides: Planning navigation, project routes
provides:
  - Project detail page layout with header, progress bar, grid
  - PhaseProgressBar reusable component
  - getProjectResearch query function
  - getApproximateIncubationTime helper
affects: [03-02, 03-03, 04-conversation-engine, 05-phase-transitions]

tech-stack:
  added: []
  patterns:
    - "Server component data fetching with client sub-components"
    - "Phase stepper with tooltip hover info"

key-files:
  created:
    - dashboard/src/app/dashboard/planning/[projectId]/components/phase-progress-bar.tsx
  modified:
    - dashboard/src/app/dashboard/planning/[projectId]/project-content.tsx
    - dashboard/src/lib/api/planning-queries.ts
    - dashboard/src/dashboard-kit/types/departments/planning.ts

key-decisions:
  - "Server component for project-content (Option C) - matches Suspense wrapper in page.tsx"
  - "Approximate incubation time over exact countdown - warm tone per context"

patterns-established:
  - "Phase progress bar as horizontal stepper with connector lines"
  - "Server-fetched data passed as props to client components"

duration: 12min
completed: 2026-01-27
---

# Phase 3 Plan 1: Project Detail Layout Shell Summary

**Server component layout with 6-phase progress stepper, status header, and 4-column grid for sidebar/conversation panels**

## Performance

- **Duration:** 12 min
- **Started:** 2026-01-27
- **Completed:** 2026-01-27
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Added getProjectResearch query and getApproximateIncubationTime helper
- Built PhaseProgressBar with completed/current/incubating/not-started visual states and tooltips
- Converted project-content.tsx from placeholder client component to server component with full data fetching
- Established 4-column grid layout matching skeleton blueprint

## Task Commits

1. **Task 1: Add getProjectResearch query and getApproximateIncubationTime helper** - `3eb35fb` (feat)
2. **Task 2: Build phase progress bar and rewire project-content layout** - `b1c8b97` (feat)

## Files Created/Modified
- `dashboard/src/app/dashboard/planning/[projectId]/components/phase-progress-bar.tsx` - 6-phase horizontal stepper with tooltips, click callbacks, incubation display
- `dashboard/src/app/dashboard/planning/[projectId]/project-content.tsx` - Server component with data fetching, header, progress bar, grid layout
- `dashboard/src/lib/api/planning-queries.ts` - Added getProjectResearch following existing pattern
- `dashboard/src/dashboard-kit/types/departments/planning.ts` - Added getApproximateIncubationTime helper

## Decisions Made
- Used Option C (server component) for project-content.tsx -- removes 'use client', fetches all data server-side, passes to client sub-components via props. Works with existing Suspense wrapper in page.tsx.
- Approximate incubation time uses friendly language ("Available tomorrow morning") per context requirements.
- Badge variant mapping for status uses existing shadcn badge variants (healthy, warning, info, etc.)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- Grid layout has placeholder sidebar panels ready for Plan 02 (sessions, documents, research panels)
- Conversation area placeholder ready for Plan 03
- PhaseProgressBar accepts onPhaseClick callback, ready to wire filtering

---
*Phase: 03-project-detail-layout*
*Completed: 2026-01-27*
