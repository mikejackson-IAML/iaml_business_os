---
phase: 09-ready-to-build-queue-prioritization
plan: 03
subsystem: planning-studio-prioritization
tags: [claude-api, priority-scoring, batch-calculation, queue]
dependency-graph:
  requires: ["09-01", "09-02"]
  provides: ["AI priority calculation API", "refresh button", "stale priorities detection"]
  affects: ["09-04"]
tech-stack:
  added: []
  patterns: ["batch AI scoring", "stale data detection banner"]
key-files:
  created:
    - dashboard/src/app/api/planning/prioritize/route.ts
  modified:
    - dashboard/src/app/dashboard/planning/queue/queue-content.tsx
    - dashboard/src/app/dashboard/planning/queue/page.tsx
    - dashboard/src/app/dashboard/planning/actions.ts
    - dashboard/src/dashboard-kit/types/departments/planning.ts
decisions:
  - id: "09-03-01"
    decision: "Regex JSON extraction from Claude response"
    rationale: "Claude may wrap JSON in markdown code blocks; regex extraction handles both cases"
  - id: "09-03-02"
    decision: "Stale banner over auto-recalc"
    rationale: "Simpler UX, gives user control over when to spend API credits on recalculation"
metrics:
  duration: "~10 min"
  completed: "2026-01-28"
---

# Phase 9 Plan 3: AI Priority Calculation Summary

> Claude-powered batch priority scoring (0-100) with refresh button and stale-goals detection banner

## What Was Built

### Task 1: Priority Calculation API Route
Created `POST /api/planning/prioritize` that:
- Fetches all ready_to_build projects, active goals, and document counts
- Sends batch prompt to Claude (claude-sonnet-4-20250514) with scoring factors: Goal Alignment 40%, Doc Completeness 25%, Effort Estimate 20%, Recency 15%
- Parses JSON array response with score, reasoning, and goal_alignment per project
- Updates priority_score, priority_reasoning, priority_updated_at on each project
- Returns `{ success: true, updated: N }`

### Task 2: Refresh Button and Stale Detection
- Wired "Refresh Priorities" button with loading spinner (animate-spin on RefreshCw icon)
- Added stale priorities amber banner when goals updated after oldest priority_updated_at
- Goal CRUD actions now revalidate `/dashboard/planning/queue` path
- Added priority_updated_at to QueueProject type
- Error state displayed on calculation failure

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Regex JSON extraction from Claude response | Handles both raw JSON and markdown-wrapped responses |
| Stale banner over auto-recalc | User controls when to spend API credits; simpler than server-action-to-API chaining |

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| a2f158ba | feat(09-03): add priority calculation API route |
| 01b1e884 | feat(09-03): wire refresh button and stale priorities banner |
