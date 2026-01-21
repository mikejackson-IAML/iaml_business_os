---
phase: 10-workflow-api-quick-actions
plan: 02
subsystem: api
tags: [next.js, api-routes, supabase, webhooks, n8n]

# Dependency graph
requires:
  - phase: 10-01
    provides: workflow_registry quick action columns (webhook_url, quick_action_icon, risk_level, quick_action_enabled)
  - phase: 07-01
    provides: mobile API authentication pattern (X-API-Key)
provides:
  - GET /api/mobile/workflows endpoint for listing quick actions
  - POST /api/mobile/workflows/trigger endpoint for firing webhooks
  - workflow-triggers.ts library with triggerWorkflow, getAvailableWorkflows, getWorkflowById
affects: [10-03 (iOS networking), 10-04 (quick actions UI), 08-chat (trigger_workflow tool)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Fire-and-forget webhook triggering with 10s timeout
    - QuickAction type mapping from database to iOS-friendly format

key-files:
  created:
    - dashboard/src/lib/api/workflow-triggers.ts
    - dashboard/src/app/api/mobile/workflows/route.ts
    - dashboard/src/app/api/mobile/workflows/trigger/route.ts
  modified: []

key-decisions:
  - "10-second timeout for webhook calls with graceful timeout handling (success=true if timeout)"
  - "Fire-and-forget pattern: return immediately, don't wait for workflow completion"
  - "QuickAction type with camelCase for iOS consumption (riskLevel, canTrigger)"

patterns-established:
  - "Webhook trigger library pattern: triggerWorkflow(id, url, params?) returns TriggerResult"
  - "Mobile API route pattern: validate X-API-Key, call library function, return JSON"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 10 Plan 02: Workflow API Endpoints Summary

**REST API endpoints for listing triggerable workflows and firing n8n webhooks via POST requests**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T05:15:00Z
- **Completed:** 2026-01-21T05:18:00Z
- **Tasks:** 2
- **Files created:** 3

## Accomplishments
- GET /api/mobile/workflows returns enabled quick actions with proper type mapping
- POST /api/mobile/workflows/trigger fires webhook URL with fire-and-forget pattern
- workflow-triggers.ts library provides reusable functions for any endpoint

## Task Commits

Each task was committed atomically:

1. **Task 1: Create workflow trigger library** - `ed83108` (feat)
2. **Task 2: Create workflow list and trigger API endpoints** - `df64ec7` (feat)

## Files Created/Modified
- `dashboard/src/lib/api/workflow-triggers.ts` - Trigger library with 3 exported functions
- `dashboard/src/app/api/mobile/workflows/route.ts` - GET endpoint for workflow list
- `dashboard/src/app/api/mobile/workflows/trigger/route.ts` - POST endpoint for triggering

## Decisions Made
- **10-second timeout with graceful handling:** If webhook times out, we still return success=true since fire-and-forget pattern means workflow is likely still running
- **QuickAction type mapping:** Database uses snake_case (risk_level), API returns camelCase (riskLevel) for iOS consumption
- **canTrigger computed field:** Set based on webhook_url presence for clear UI enablement logic

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API endpoints ready for iOS NetworkManager integration in 10-03
- Endpoints follow same X-API-Key pattern as health endpoint
- Trigger endpoint can be called by Phase 8's trigger_workflow tool after updating placeholder

---
*Phase: 10-workflow-api-quick-actions*
*Completed: 2026-01-21*
