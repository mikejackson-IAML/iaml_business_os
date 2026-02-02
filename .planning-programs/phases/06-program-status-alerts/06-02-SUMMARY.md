---
phase: 06-program-status-alerts
plan: 02
subsystem: ui
tags: [react, lucide-react, alerts, badges, tailwind]

# Dependency graph
requires:
  - phase: 06-01
    provides: Alert calculation utility with threshold constants
provides:
  - Updated ProgramStatusBadge with "(N)" format
  - AlertCountBadge component for warning/critical display
  - Programs list with real alert calculations
affects: [06-03-program-detail-alerts, testing]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Alert count display with severity icons
    - Conditional rendering for on-demand/completed programs

key-files:
  created:
    - dashboard/src/app/dashboard/programs/components/alert-count-badge.tsx
  modified:
    - dashboard/src/app/dashboard/programs/components/program-status-badge.tsx
    - dashboard/src/app/dashboard/programs/programs-content.tsx

key-decisions:
  - "Badge format changed from pipe to parentheses: 'GO (8)' not 'GO | 8'"
  - "Alert thresholds checked: instructor 30/45d, venue 60/90d, materials 30/45d, registrations 30/45d"
  - "Completed programs show 'Completed' badge, no status calculation"
  - "On-demand programs show 'N/A' for both Status and Logistics columns"

patterns-established:
  - "AlertCountBadge: returns null when no alerts, shows criticals first then warnings"
  - "getLogisticsStats: returns { completed, total, warnings, criticals } for flexible display"

# Metrics
duration: 2min
completed: 2026-02-02
---

# Phase 06 Plan 02: Status Badge UI Summary

**AlertCountBadge component with warning/critical icons and programs list showing real-time alert calculations based on threshold rules**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-02T16:20Z
- **Completed:** 2026-02-02T16:22Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Updated ProgramStatusBadge to use parentheses format "GO (8)" per CONTEXT.md
- Created AlertCountBadge component showing critical (red circle) and warning (amber triangle) counts
- Integrated real alert calculations into programs list based on threshold rules
- Properly handle on-demand (N/A) and completed (badge) programs

## Task Commits

Each task was committed atomically:

1. **Task 1: Update ProgramStatusBadge Format** - `f75f8621` (feat)
2. **Task 2: Create AlertCountBadge Component** - `88b8e3ee` (feat)
3. **Task 3: Update Programs List with Alerts** - `3fe680a0` (feat)

## Files Created/Modified

- `dashboard/src/app/dashboard/programs/components/program-status-badge.tsx` - Badge format from "GO | 8" to "GO (8)"
- `dashboard/src/app/dashboard/programs/components/alert-count-badge.tsx` - New component for warning/critical display
- `dashboard/src/app/dashboard/programs/programs-content.tsx` - Alert integration with real threshold calculations

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Critical icons shown before warnings | More important alerts first |
| getLogisticsStats returns criticals field | AlertCountBadge needs both warning and critical counts |
| Registration threshold uses <6 enrolled | Matches GO/CLOSE/NEEDS logic (6+ = GO) |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all tasks completed successfully.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- AlertCountBadge ready for reuse in program detail page (06-03)
- Threshold calculations match program-alerts.ts constants
- Ready to integrate full AlertBreakdown on detail page

---
*Phase: 06-program-status-alerts*
*Completed: 2026-02-02*
