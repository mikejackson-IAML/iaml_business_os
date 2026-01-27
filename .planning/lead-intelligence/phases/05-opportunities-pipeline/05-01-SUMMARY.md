---
phase: 05-opportunities-pipeline
plan: 01
subsystem: api
tags: [supabase, opportunities, pipeline, file-upload, storage]

requires:
  - phase: 01-data-foundation
    provides: opportunities, opportunity_contacts, opportunity_attachments tables
provides:
  - Opportunities CRUD API (list, create, read, update, delete)
  - Stage advancement with pipeline-type validation
  - Opportunity contact management with role validation
  - File attachment upload/download via Supabase Storage with signed URLs
affects: [05-02, 05-03, 05-04]

tech-stack:
  added: []
  patterns: [supabase-storage-signed-urls, pipeline-stage-validation]

key-files:
  created:
    - dashboard/src/lib/api/lead-intelligence-opportunities-types.ts
    - dashboard/src/lib/api/lead-intelligence-opportunities-validation.ts
    - dashboard/src/lib/api/lead-intelligence-opportunities-queries.ts
    - dashboard/src/lib/api/lead-intelligence-opportunities-mutations.ts
    - dashboard/src/app/api/lead-intelligence/opportunities/route.ts
    - dashboard/src/app/api/lead-intelligence/opportunities/[id]/route.ts
    - dashboard/src/app/api/lead-intelligence/opportunities/[id]/advance-stage/route.ts
    - dashboard/src/app/api/lead-intelligence/opportunities/[id]/contacts/route.ts
    - dashboard/src/app/api/lead-intelligence/opportunities/[id]/attachments/route.ts
  modified: []

key-decisions:
  - "Signed URLs (1hr) for attachments instead of public URLs - proposals/contracts are sensitive"
  - "Store storage path in file_url, generate signed URL on read"
  - "Auto-create storage bucket on first upload attempt"

patterns-established:
  - "Pipeline-type validation: stage must belong to correct pipeline (in_house vs individual)"
  - "Supabase Storage pattern: upload buffer, store path, signed URL on read"

duration: 8min
completed: 2026-01-27
---

# Phase 5 Plan 1: Opportunities API Summary

**Complete opportunities CRUD API with dual-pipeline stage validation, contact role management, and Supabase Storage file attachments with signed URLs**

## Performance

- **Duration:** ~8 min
- **Tasks:** 2
- **Files created:** 9

## Accomplishments
- Full CRUD for opportunities with paginated list, filters (type, stage, company, search)
- Stage advancement validates against correct pipeline (in_house: 7 stages, individual: 5 stages)
- Opportunity contacts junction with 5 role types and validation
- File attachments via Supabase Storage with 10MB limit, signed URLs (1hr), auto-bucket creation

## Task Commits

1. **Task 1: Types, validation, queries, and mutations** - `a7619cec` (feat)
2. **Task 2: API route handlers** - `e8681acb` (feat)

## Files Created/Modified
- `lead-intelligence-opportunities-types.ts` - Interfaces, stage constants, role constants
- `lead-intelligence-opportunities-validation.ts` - Create/update/stage validation
- `lead-intelligence-opportunities-queries.ts` - Paginated list, by-id, contacts, attachments
- `lead-intelligence-opportunities-mutations.ts` - CRUD + stage + contacts + attachments
- `opportunities/route.ts` - GET list + POST create
- `opportunities/[id]/route.ts` - GET detail + PATCH + DELETE
- `opportunities/[id]/advance-stage/route.ts` - POST stage advancement
- `opportunities/[id]/contacts/route.ts` - GET/POST/DELETE contacts
- `opportunities/[id]/attachments/route.ts` - GET/POST/DELETE with Storage

## Decisions Made
- Signed URLs (not public) for attachments since they contain proposals/contracts
- Store storage path in DB, generate signed URL on read (1hr expiry)
- Auto-create bucket programmatically on first upload

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API layer complete, ready for UI plans (05-02 through 05-04)
- All endpoints follow established contacts pattern

---
*Phase: 05-opportunities-pipeline*
*Completed: 2026-01-27*
