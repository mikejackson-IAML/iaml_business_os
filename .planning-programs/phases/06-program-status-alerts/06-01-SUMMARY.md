---
phase: 06-program-status-alerts
plan: 01
subsystem: api
tags: [alerts, typescript, thresholds, logistics]

# Dependency graph
requires:
  - phase: 04-logistics-tab
    provides: ProgramLogistics type and logistics fields
  - phase: 02-program-detail
    provides: ProgramDetail type with days_until_start
provides:
  - Alert calculation utility with threshold constants
  - calculateProgramAlerts function for severity-tagged alerts
  - calculateLogisticsReadiness function for completed/total/warnings
  - TypeScript types for alerts (ProgramAlert, AlertSummary, LogisticsReadiness)
affects: [06-02, 06-03, 07-smart-dashboard]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Alert threshold constants as const for type safety"
    - "Rolled-up payment alerts per program (not per invoice)"
    - "Early return pattern for on-demand and completed programs"

key-files:
  created:
    - dashboard/src/lib/api/program-alerts.ts
  modified: []

key-decisions:
  - "11 alert thresholds from PROG-60 requirements"
  - "In-person total = 10 items, virtual = 6 items"
  - "On-demand programs return empty AlertSummary"
  - "Payment alerts rolled up to program level with count"

patterns-established:
  - "Alert calculation in TypeScript utility (not SQL views)"
  - "Severity determined by <= comparison to days_until_start"
  - "Logistics readiness counted from timestamps/boolean flags"

# Metrics
duration: 1min
completed: 2026-02-02
---

# Phase 6 Plan 1: Alert Calculation Utility Summary

**TypeScript alert calculation with 11 threshold pairs, calculateProgramAlerts for warning/critical detection, and calculateLogisticsReadiness for X/10 or X/6 format**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-02T16:15:16Z
- **Completed:** 2026-02-02T16:16:45Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created centralized alert threshold constants matching all PROG-60 requirements
- Implemented calculateProgramAlerts with proper edge case handling (on-demand, completed, virtual)
- Implemented calculateLogisticsReadiness with dynamic totals (10 in-person / 6 virtual)
- Payment alerts roll up to program level ("3 invoices 14+ days past due")

## Task Commits

Each task was committed atomically:

1. **Task 1: Create Alert Calculation Utility** - `d18a946c` (feat)

## Files Created/Modified

- `dashboard/src/lib/api/program-alerts.ts` - Alert calculation utility with thresholds and functions

## Decisions Made

- Used `<=` comparison for threshold checks per requirements (not `<`)
- On-demand programs return empty AlertSummary with no calculations
- Completed programs (days_until_start < 0) return empty AlertSummary
- Payment alerts calculate days from due date and roll up by severity

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Alert utility ready for use in UI components (Plan 06-02)
- All types exported for import into badge and progress components
- No blockers for proceeding

---
*Phase: 06-program-status-alerts*
*Completed: 2026-02-02*
