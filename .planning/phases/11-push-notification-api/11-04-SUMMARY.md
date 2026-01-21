---
phase: 11-push-notification-api
plan: 04
subsystem: api
tags: [apns, push-notifications, n8n, webhooks, next.js]

# Dependency graph
requires:
  - phase: 11-02
    provides: sendToAllDevices function, quiet hours logic, APNs provider
  - phase: 11-03
    provides: Device registration endpoint with active tokens in database
provides:
  - POST /api/mobile/notifications/send endpoint for n8n and internal use
  - Dual authentication (X-API-Key + X-Webhook-Secret)
  - Critical alert bypass of quiet hours
affects: [12-push-notification-ui, n8n-workflows]

# Tech tracking
tech-stack:
  added: []
  patterns: [dual-auth-endpoint, notification-type-routing]

key-files:
  created:
    - dashboard/src/app/api/mobile/notifications/send/route.ts
  modified: []

key-decisions:
  - "Dual auth allows both mobile app (X-API-Key) and n8n (X-Webhook-Secret) to send notifications"
  - "critical_alert type automatically bypasses quiet hours without explicit flag"
  - "Category set to type.toUpperCase() for iOS notification grouping"

patterns-established:
  - "Webhook secret auth: X-Webhook-Secret header for n8n workflow calls"
  - "Response includes sent/failed/skipped counts for operational visibility"

# Metrics
duration: 3min
completed: 2026-01-21
---

# Phase 11 Plan 04: Notification Send Endpoint Summary

**POST /api/mobile/notifications/send with dual auth for n8n webhooks and critical alerts**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-21T06:10:07Z
- **Completed:** 2026-01-21T06:13:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Created notification send endpoint for n8n workflow completion notifications
- Implemented dual authentication supporting both mobile app and n8n webhook calls
- Critical alert type automatically bypasses quiet hours for urgent notifications
- Response includes sent/failed/skipped counts for monitoring and debugging

## Task Commits

Each task was committed atomically:

1. **Task 1: Create notification send endpoint** - `b56ee59` (feat)

## Files Created/Modified

- `dashboard/src/app/api/mobile/notifications/send/route.ts` - POST endpoint accepting notifications from n8n and internal calls

## Decisions Made

- **Dual authentication**: Accepts both X-API-Key (mobile app) and X-Webhook-Secret (n8n) headers for flexibility
- **Critical alert auto-flag**: critical_alert type sets isCritical=true automatically, no explicit flag needed
- **iOS grouping**: Category set to notification type (WORKFLOW_COMPLETE, CRITICAL_ALERT, DIGEST) for iOS notification grouping

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Environment variable needed for n8n integration:**

Add `N8N_WEBHOOK_SECRET` to the dashboard environment to allow n8n workflows to send notifications:

```bash
# .env.local or Vercel environment variables
N8N_WEBHOOK_SECRET=your-secret-here
```

n8n workflows should include this header when calling the endpoint:
```
X-Webhook-Secret: your-secret-here
```

## Next Phase Readiness

- Phase 11 (Push Notification API) is now complete
- Ready for Phase 12 (Push Notification UI) - iOS notification handling and settings UI
- n8n workflows can now trigger push notifications via webhook

---
*Phase: 11-push-notification-api*
*Completed: 2026-01-21*
