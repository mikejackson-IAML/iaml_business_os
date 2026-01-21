---
phase: 11-push-notification-api
plan: 03
subsystem: api
tags: [next.js, apns, device-token, upsert, api-key-auth]

# Dependency graph
requires:
  - phase: 11-01
    provides: mobile_device_tokens table schema, RegisterTokenRequest/Response types
provides:
  - POST /api/mobile/notifications/register endpoint
  - Device token validation (64 hex chars)
  - IANA timezone validation
  - Upsert-based registration with bounce recovery
affects: [11-04, 12-push-notification-ui]

# Tech tracking
tech-stack:
  added: []
  patterns: [api-key-auth, upsert-on-conflict]

key-files:
  created:
    - dashboard/src/app/api/mobile/notifications/register/route.ts
  modified: []

key-decisions:
  - "Token format validation: 64 hex chars catches obvious APNs token errors"
  - "Upsert with bounce recovery: Re-registering reactivates bounced tokens"
  - "Timezone validation: Lenient regex accepts Area/Location and 2-4 char abbreviations"

patterns-established:
  - "Notification API pattern: X-API-Key auth + typed request/response"

# Metrics
duration: 1min
completed: 2026-01-21
---

# Phase 11 Plan 03: Device Registration Endpoint Summary

**POST /api/mobile/notifications/register with X-API-Key auth, token validation, and upsert to mobile_device_tokens**

## Performance

- **Duration:** 1 min
- **Started:** 2026-01-21T06:03:23Z
- **Completed:** 2026-01-21T06:04:23Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments

- Device token registration endpoint accepting APNs tokens
- Input validation for token format (64 hex characters) and IANA timezone
- Upsert behavior that updates existing tokens and reactivates bounced tokens
- Consistent error handling with 400/401/500 responses

## Task Commits

Each task was committed atomically:

1. **Task 1: Create device token registration endpoint** - `baecfe3` (feat)

## Files Created/Modified

- `dashboard/src/app/api/mobile/notifications/register/route.ts` - Device token registration endpoint with validation and upsert

## Decisions Made

- **Token format validation:** 64 hex character regex catches malformed APNs tokens before database insert
- **Upsert with bounce recovery:** When a device re-registers after uninstall/reinstall, the endpoint reactivates any previously bounced token by clearing bounce_reason/bounced_at and setting status to 'active'
- **Timezone validation:** Accepts both Area/Location format (America/Chicago) and short abbreviations (UTC, EST) - lenient to avoid false rejections

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Registration endpoint ready for iOS app integration
- Types from 11-01 working correctly with endpoint
- Ready for 11-04: Send Notification Endpoint

---
*Phase: 11-push-notification-api*
*Completed: 2026-01-21*
