---
phase: 06-tech-debt-cleanup
plan: 01
subsystem: ui
tags: [react, next.js, tech-debt, cleanup]

# Dependency graph
requires:
  - phase: 05-opportunities
    provides: opportunities module with pipeline management
provides:
  - VIP/DNC toggles wired to API with toast feedback
  - Opportunities page with Suspense + skeleton pattern
  - Clean client-side fetches with no redundant headers
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Suspense + skeleton pattern for all lead-intelligence pages"
    - "toast.promise() for async user actions"

key-files:
  created:
    - dashboard/src/app/dashboard/lead-intelligence/opportunities/opportunities-skeleton.tsx
  modified:
    - dashboard/src/app/dashboard/lead-intelligence/components/contact-row-actions.tsx
    - dashboard/src/app/dashboard/lead-intelligence/contacts/[id]/tabs/company-tab.tsx
    - dashboard/src/app/dashboard/lead-intelligence/companies/[id]/tabs/contacts-tab.tsx
    - dashboard/src/app/dashboard/lead-intelligence/contacts/[id]/contact-profile-content.tsx
    - dashboard/src/app/dashboard/lead-intelligence/opportunities/page.tsx
    - dashboard/src/app/dashboard/lead-intelligence/opportunities/opportunities-content.tsx
    - dashboard/src/app/dashboard/lead-intelligence/companies/[id]/company-profile-content.tsx
    - dashboard/src/app/dashboard/lead-intelligence/companies/[id]/tabs/notes-tab.tsx
    - dashboard/src/app/dashboard/lead-intelligence/opportunities/components/opportunity-detail.tsx
    - dashboard/src/app/dashboard/lead-intelligence/opportunities/components/opportunity-notes-section.tsx
    - dashboard/src/app/dashboard/lead-intelligence/opportunities/components/attachment-upload.tsx
    - dashboard/src/app/dashboard/lead-intelligence/opportunities/components/opportunity-contacts-section.tsx

key-decisions:
  - "None - followed plan as specified"

patterns-established:
  - "VIP/DNC toggles use toast.promise() with immediate list refresh via onContactsChanged callback"

# Metrics
duration: 4min
completed: 2026-01-28
---

# Phase 6 Plan 1: Tech Debt Cleanup Summary

**Wire VIP/DNC toggles to API, remove all "coming soon" stubs, fix breadcrumbs, add Suspense/skeleton to opportunities page, remove 13 x-api-key headers from client fetches**

## Performance

- **Duration:** 4 min
- **Started:** 2026-01-28T16:28:35Z
- **Completed:** 2026-01-28T16:32:57Z
- **Tasks:** 2
- **Files modified:** 13

## Accomplishments
- VIP toggle calls PUT /api/lead-intelligence/contacts/:id with is_vip, shows toast feedback, refreshes list
- DNC toggle calls PUT API with status: do_not_contact, requires window.confirm, shows toast feedback
- Removed all "coming soon" stubs from company-tab and contacts-tab
- Fixed breadcrumb to link to /dashboard/lead-intelligence instead of 404 /contacts
- Opportunities page now uses Suspense + skeleton pattern consistent with other pages
- Inline spinner replaced with skeleton cards matching kanban layout
- All 13 x-api-key: 'internal' headers removed from client-side fetches

## Task Commits

Each task was committed atomically:

1. **Task 1: Wire VIP/DNC toggles, fix stubs, fix breadcrumbs** - `8b882685` (feat)
2. **Task 2: Suspense/skeleton for opportunities page + remove x-api-key headers** - `23e53123` (feat)

## Files Created/Modified
- `opportunities/opportunities-skeleton.tsx` - New skeleton component for opportunities page
- `components/contact-row-actions.tsx` - VIP/DNC toggles now call API with toast feedback
- `contacts/[id]/tabs/company-tab.tsx` - Removed "Link Company" and "Phase 5" stubs
- `companies/[id]/tabs/contacts-tab.tsx` - Removed "Add Contact" and "Bulk actions" stubs
- `contacts/[id]/contact-profile-content.tsx` - Fixed breadcrumb href
- `opportunities/page.tsx` - Added Suspense wrapper with skeleton fallback
- `opportunities/opportunities-content.tsx` - Replaced spinner with skeleton cards
- `companies/[id]/company-profile-content.tsx` - Removed x-api-key header
- `companies/[id]/tabs/notes-tab.tsx` - Removed 2 x-api-key headers
- `opportunities/components/opportunity-detail.tsx` - Removed 4 x-api-key headers
- `opportunities/components/opportunity-notes-section.tsx` - Removed x-api-key header
- `opportunities/components/attachment-upload.tsx` - Removed 2 x-api-key headers
- `opportunities/components/opportunity-contacts-section.tsx` - Removed 2 x-api-key headers

## Decisions Made
None - followed plan as specified

## Deviations from Plan
None - plan executed exactly as written

## Issues Encountered
None

## User Setup Required
None - no external service configuration required

## Next Phase Readiness
- All 5 tech debt items from v1.0 audit resolved
- Lead Intelligence v1.0 milestone complete with clean codebase
- No blockers or concerns

---
*Phase: 06-tech-debt-cleanup*
*Completed: 2026-01-28*
