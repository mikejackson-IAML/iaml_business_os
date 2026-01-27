---
phase: 02-pipeline-view
plan: 01
subsystem: dashboard-ui
tags: [kanban, dnd-kit, drag-and-drop, pipeline, server-actions]
requires: [01-04]
provides: [pipeline-board, project-cards, status-drag-drop]
affects: [02-02, 03-01]
tech-stack:
  added: []
  patterns: [optimistic-updates, dnd-kit-kanban, server-actions]
key-files:
  created:
    - dashboard/src/app/dashboard/planning/actions.ts
    - dashboard/src/app/dashboard/planning/components/pipeline-board.tsx
    - dashboard/src/app/dashboard/planning/components/pipeline-column.tsx
    - dashboard/src/app/dashboard/planning/components/project-card.tsx
  modified:
    - dashboard/src/app/dashboard/planning/page.tsx
    - dashboard/src/app/dashboard/planning/planning-content.tsx
decisions:
  - id: 02-01-01
    decision: "rectIntersection collision detection for Kanban columns"
    rationale: "Better for column-based layouts than closestCenter"
  - id: 02-01-02
    decision: "Title-only Link for navigation, card body for drag handle"
    rationale: "Avoids click-vs-drag conflict; title is clickable, card is draggable"
  - id: 02-01-03
    decision: "Inline formatRelativeTime helper in project-card"
    rationale: "Simple utility, no need for shared module yet"
metrics:
  duration: "~2 minutes"
  completed: "2026-01-27"
---

# Phase 02 Plan 01: Pipeline Board with Drag-and-Drop Summary

Kanban pipeline board with 5 status columns, draggable project cards, optimistic status updates via server actions, and incubation visual indicators.

## What Was Built

### Server Actions (actions.ts)
- `updateProjectStatusAction` -- updates project status in planning_studio schema, revalidates path
- `createProjectAction` -- inserts new project as idea in capture phase

### Page Data Flow (page.tsx + planning-content.tsx)
- page.tsx is now an async server component calling `getPlanningDashboardData()`
- Data passed as prop to PlanningContent, which renders PipelineBoard

### Pipeline Board (pipeline-board.tsx)
- DndContext with PointerSensor (8px distance constraint) and KeyboardSensor
- rectIntersection collision detection for column-based drops
- Optimistic state updates on drag end; reverts on server failure with toast error
- DragOverlay renders a rotated shadow clone of the dragged card
- Syncs local state with prop changes via useEffect

### Pipeline Column (pipeline-column.tsx)
- useDroppable with status ID
- Color-coded status dot, label, count badge
- Visual drop feedback (ring + background highlight)
- Fixed 280px width, flex-shrink-0 for horizontal scroll

### Project Card (project-card.tsx)
- useDraggable with project ID and status data
- Displays: title (linked), one-liner, phase badge, progress bar, relative time
- Incubating state: dimmed opacity, Lock icon, countdown badge
- Drag state: reduced opacity; overlay: shadow + rotation

## Decisions Made

| ID | Decision | Rationale |
|----|----------|-----------|
| 02-01-01 | rectIntersection collision detection | Better for column-based layouts |
| 02-01-02 | Title-only Link, card body as drag handle | Avoids click-vs-drag conflict |
| 02-01-03 | Inline formatRelativeTime in project-card | Simple utility, shared module not needed yet |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] node_modules missing for @dnd-kit packages**
- **Found during:** Task 2 verification
- **Issue:** @dnd-kit/core was in package.json but not installed in node_modules
- **Fix:** Ran `npm install` to restore all dependencies
- **Commit:** Part of Task 2 (no file changes, just local install)

## Verification Results

1. TypeScript compiles -- only pre-existing schema type errors (planning_studio not in generated DB types), no new errors from our code
2. All 5 status columns defined (idea, planning, ready_to_build, building, shipped)
3. Archived column excluded from display (by design)
4. Drag-and-drop wired with optimistic updates and error rollback

## Next Phase Readiness

Ready for Plan 02-02 (Quick Capture Modal + Search/Filter). The PipelineBoard component is structured to accept additional UI elements. The `createProjectAction` server action is already built for the capture modal.
