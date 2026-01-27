---
phase: 05-phase-transitions-incubation
plan: 01
subsystem: phase-transitions
tags: [phase-transitions, incubation, server-actions, sse-markers]
dependency_graph:
  requires: [04-conversation-engine]
  provides: [phase-transition-logic, incubation-enforcement, marker-detection]
  affects: [05-02, 05-03, 05-04]
tech_stack:
  added: []
  patterns: [marker-based-signaling, sse-event-types, server-action-composition]
key_files:
  created:
    - dashboard/src/lib/planning/phase-transitions.ts
  modified:
    - dashboard/src/app/dashboard/planning/actions.ts
    - dashboard/src/app/api/planning/chat/route.ts
    - dashboard/src/lib/planning/system-prompts.ts
decisions:
  - id: "05-01-01"
    decision: "Markers stored as HTML comments, stripped before DB save"
    rationale: "Invisible to users in markdown rendering, clean DB storage"
  - id: "05-01-02"
    decision: "forceCompletePhaseAction delegates to completePhaseAction"
    rationale: "Readiness checks are conversation-level, not DB constraints"
  - id: "05-01-03"
    decision: "First missing phase gets in_progress status in ensureAllPhasesExist"
    rationale: "Capture phase should auto-start when project is created"
metrics:
  duration: "~10 minutes"
  completed: "2026-01-27"
---

# Phase 5 Plan 1: Phase Transition Backend Logic Summary

**One-liner:** Server-side phase completion, incubation enforcement, and invisible marker detection via SSE events.

## What Was Built

### phase-transitions.ts (new)
- Marker constants: `PHASE_COMPLETE_MARKER`, `READINESS_PASS_MARKER`, `READINESS_FAIL_MARKER_PREFIX`
- Detection functions: `detectCompletionMarker`, `detectReadinessMarker`, `stripMarkers`
- Incubation config: `INCUBATION_DURATIONS` (capture: 24h, discover: 36h, define: 0, develop: 24h, validate: 0, package: 0)
- Readiness transitions: discover->define and develop->validate require checks
- Core functions: `completePhase`, `skipIncubation`, `navigateToPhase`, `ensureAllPhasesExist`

### actions.ts (updated)
- 5 new server actions: `completePhaseAction`, `skipIncubationAction`, `navigateToPhaseAction`, `forceCompletePhaseAction`, `saveIncubationNoteAction`
- `createProjectAction` now calls `ensureAllPhasesExist` to create all 6 phase records upfront

### system-prompts.ts (updated)
- All 6 phase prompts now include completion marker instructions
- Discover and develop prompts include readiness check marker instructions

### chat/route.ts (updated)
- Detects `PHASE_COMPLETE` and readiness markers in Claude's response
- Strips markers before saving to DB
- Emits `phase_complete` and `readiness_result` SSE events before `done`

## Deviations from Plan

None -- plan executed exactly as written.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 70ad4f56 | Phase transition utility module + updated server actions |
| 2 | 504dd230 | Marker instructions in prompts + SSE detection in chat route |

## Next Phase Readiness

Plan 05-02 (transition UI) can now build on these server actions and SSE events to show completion confirmations, incubation overlays, and skip buttons.
