---
phase: 03-contact-panel
plan: 03
subsystem: api, ui
tags: [smartlead, ghl, ga4, engagement, email-tracking, website-behavior]

# Dependency graph
requires:
  - phase: 03-contact-panel
    plan: 02
    provides: ContactPanel with placeholder for engagement section
provides:
  - SmartLead API integration for cold email engagement
  - GoHighLevel API integration for warm email engagement
  - GA4 API route structure for website behavior (pending user ID tracking)
  - EngagementSection component with expandable cards
  - Graceful degradation for unconfigured integrations
affects: [04-engagement-triggers]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - API graceful degradation with { configured: false, data: null }
    - Parallel API fetching with Promise.all
    - Expandable cards with chevron rotation animation

key-files:
  created:
    - dashboard/src/lib/api/smartlead-queries.ts
    - dashboard/src/lib/api/ghl-queries.ts
    - dashboard/src/lib/api/ga4-queries.ts
    - dashboard/src/app/api/smartlead/engagement/route.ts
    - dashboard/src/app/api/ghl/engagement/route.ts
    - dashboard/src/app/api/ga4/user-behavior/route.ts
    - dashboard/src/app/dashboard/programs/components/contact-panel/engagement-section.tsx
  modified:
    - dashboard/src/app/dashboard/programs/components/contact-panel/contact-panel.tsx

key-decisions:
  - "Graceful degradation: return { configured: false } when API keys missing"
  - "Parallel fetch: load all three integrations simultaneously"
  - "GA4 implementation deferred: requires user ID tracking setup"

patterns-established:
  - "Integration graceful degradation: Check env vars, return null if missing"
  - "Expandable engagement card: button trigger, chevron rotate-180, border-t separator"
  - "Relative date formatting: formatRelativeDate helper for '3 days ago' style"

# Metrics
duration: 3min
completed: 2026-01-31
---

# Phase 03 Plan 03: Engagement Section Summary

**Three API integrations (SmartLead, GHL, GA4) with expandable engagement cards showing email opens, clicks, and website behavior in the Contact Panel**

## Performance

- **Duration:** 3 min
- **Started:** 2026-01-31T22:02:05Z
- **Completed:** 2026-01-31T22:04:40Z
- **Tasks:** 4
- **Files modified:** 8

## Accomplishments

- SmartLead API integration for cold email engagement (opens, clicks, campaigns)
- GoHighLevel API integration for warm email engagement (opens, clicks, conversations)
- GA4 API route structure ready (pending user ID tracking configuration)
- EngagementSection component with expandable cards per integration
- Graceful degradation showing "Not connected" for unconfigured integrations

## Task Commits

Each task was committed atomically:

1. **Task 1: Create SmartLead API route and query functions** - `e8f73571` (feat)
2. **Task 2: Create GHL API route and query functions** - `d9820af2` (feat)
3. **Task 3: Create GA4 API route and query functions** - `cd2f2173` (feat)
4. **Task 4: Create EngagementSection component and integrate** - `0ebdbaa1` (feat)

## Files Created/Modified

- `smartlead-queries.ts` - SmartLead API query with graceful degradation
- `ghl-queries.ts` - GoHighLevel API query with contact search and conversations
- `ga4-queries.ts` - GA4 query structure (pending full implementation)
- `/api/smartlead/engagement/route.ts` - SmartLead engagement endpoint
- `/api/ghl/engagement/route.ts` - GHL engagement endpoint
- `/api/ga4/user-behavior/route.ts` - GA4 user behavior endpoint
- `engagement-section.tsx` - 344-line component with expandable cards
- `contact-panel.tsx` - Added EngagementSection import and usage

## Decisions Made

- Graceful degradation pattern: Check env vars at start, return `{ configured: false, data: null }` when not set
- Parallel fetching: All three API calls run simultaneously via Promise.all for speed
- GA4 implementation deferred: Full query requires user ID tracking to be configured in GA4 property
- 5-minute cache for SmartLead API responses via Next.js `revalidate: 300`
- GHL uses API v2 (v1 is EOL as of Jan 2026)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**External services require manual configuration.** To enable engagement integrations:

### SmartLead
Add to `.env.local`:
```
SMARTLEAD_API_KEY=your_api_key
```

### GoHighLevel
Add to `.env.local`:
```
GHL_ACCESS_TOKEN=your_access_token
GHL_LOCATION_ID=your_location_id
```

### GA4
Add to `.env.local`:
```
GA4_PROPERTY_ID=your_property_id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```
**Note:** GA4 also requires user ID tracking to be configured in the GA4 property settings to query by email.

## Next Phase Readiness

- All three API routes functional with graceful degradation
- EngagementSection displays data from any configured integration
- Phase 03 (Contact Panel) is now complete
- Ready for Phase 04 or Phase 05 development

---
*Phase: 03-contact-panel*
*Completed: 2026-01-31*
