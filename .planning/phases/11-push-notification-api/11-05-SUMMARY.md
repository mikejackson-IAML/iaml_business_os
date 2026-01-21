---
phase: 11-push-notification-api
plan: 05
subsystem: api
tags: [vercel-cron, push-notifications, digest, timezone, apns]

# Dependency graph
requires:
  - phase: 11-02
    provides: APNs integration, sendPushNotification function
provides:
  - Hourly Vercel Cron job for digest delivery
  - Timezone-aware digest scheduling
  - "All quiet" skip behavior for healthy days
  - Digest content aggregation from multiple sources
affects: [12-push-notification-ui, ios-notification-settings]

# Tech tracking
tech-stack:
  added: []
  patterns: [vercel-cron-hourly, timezone-aware-delivery, null-payload-skip]

key-files:
  created:
    - dashboard/src/lib/api/digest.ts
    - dashboard/src/app/api/mobile/notifications/digest/route.ts
    - dashboard/vercel.json
  modified: []

key-decisions:
  - "Hourly cron checks all user timezones to find whose digest_hour matches"
  - "formatDigestNotification returns null for 'all quiet' days (no activity + healthy)"
  - "CRON_SECRET validation in production, no auth required in development"
  - "GET method allowed in development for easy browser testing"

patterns-established:
  - "Vercel Cron pattern: cron calls endpoint, endpoint filters by user context"
  - "Null payload skip: return null to indicate skip, caller handles"

# Metrics
duration: 2min
completed: 2026-01-21
---

# Phase 11 Plan 05: Daily Digest Cron Summary

**Vercel Cron calls digest endpoint hourly, filtering by user timezone to deliver personalized daily summaries with health score, alerts, and workflow activity**

## Performance

- **Duration:** 2 min
- **Started:** 2026-01-21T06:25:00Z
- **Completed:** 2026-01-21T06:27:00Z
- **Tasks:** 3
- **Files created:** 3

## Accomplishments
- Digest content generation pulls health, alerts, and workflow data
- Timezone-aware delivery ensures users receive digest at their configured hour
- "All quiet" detection skips notifications when everything is healthy
- Vercel Cron runs every hour at minute 0

## Task Commits

Each task was committed atomically:

1. **Task 1: Create digest content generation logic** - `eec409f` (feat)
2. **Task 2: Create digest cron endpoint** - `cfbbb12` (feat)
3. **Task 3: Configure Vercel Cron** - `b8e892a` (chore)

## Files Created/Modified
- `dashboard/src/lib/api/digest.ts` - Digest content generation with isDigestTime, generateDigestContent, formatDigestNotification
- `dashboard/src/app/api/mobile/notifications/digest/route.ts` - Cron endpoint with CRON_SECRET auth
- `dashboard/vercel.json` - Cron schedule configuration (0 * * * *)

## Decisions Made
- **Hourly cron over user-specific scheduling**: Simpler architecture - one cron checks all users' timezones rather than scheduling per-user jobs
- **Null return for skip**: formatDigestNotification returns null for "all quiet" days, letting caller decide behavior
- **Development-friendly auth**: GET allowed and no CRON_SECRET required in development for easy testing

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
- TypeScript errors for Supabase queries on tables not in generated types (health_alerts, workflow_runs) - fixed with type assertions and eslint-disable comments

## User Setup Required

**Environment variable needed for production:**
- `CRON_SECRET` - Vercel automatically sets this for cron jobs

**Verification:**
1. After deploying to Vercel, check Vercel Dashboard -> Project -> Settings -> Crons
2. Should see `/api/mobile/notifications/digest` with schedule `0 * * * *`

## Next Phase Readiness
- Push notification API phase complete (4/4 plans done)
- APNs integration, device registration, send endpoints, and digest cron all implemented
- Ready for Phase 12: Push Notification UI (iOS app notification handling)

---
*Phase: 11-push-notification-api*
*Completed: 2026-01-21*
