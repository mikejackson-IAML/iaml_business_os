---
phase: 07-document-generation
plan: 02
subsystem: api
tags: [nextjs, api-routes, supabase, document-generation, versioning]

requires:
  - phase: 07-document-generation/01
    provides: doc-generation.ts library (generateDocument, saveDocumentVersion, loadDocGenerationContext)
provides:
  - POST /api/planning/documents/generate endpoint
  - GET /api/planning/documents/[docId] endpoint (single, version list, specific version)
  - PUT /api/planning/documents/[docId] endpoint (new version creation)
affects: [07-document-generation/03, 07-document-generation/04]

tech-stack:
  added: []
  patterns: [versioned document CRUD with immutable rows]

key-files:
  created:
    - dashboard/src/app/api/planning/documents/generate/route.ts
    - dashboard/src/app/api/planning/documents/[docId]/route.ts
  modified: []

key-decisions:
  - "Next.js 15 Promise<params> pattern for dynamic route params"
  - "Version list returns id/version/created_at only (no content) for efficiency"

patterns-established:
  - "Document versioning: PUT creates new row, never updates existing"
  - "Query param modes: version=all for list, version=N for specific"

duration: 5min
completed: 2026-01-27
---

# Phase 7 Plan 2: Document API Routes Summary

**POST/GET/PUT API routes for document generation, retrieval by ID/version, and edit-as-new-version persistence**

## Performance

- **Duration:** 5 min
- **Started:** 2026-01-27T22:40:18Z
- **Completed:** 2026-01-27T22:45:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments
- Document generation endpoint that validates docType, loads context, calls Claude, and persists
- Flexible GET endpoint supporting single doc fetch, version list, and specific version queries
- PUT endpoint that creates new version rows (immutable document history)

## Task Commits

Each task was committed atomically:

1. **Task 1: Document generation endpoint** - `027ed77c` (feat)
2. **Task 2: Document fetch and update endpoint** - `87a8eeeb` (feat)

## Files Created/Modified
- `dashboard/src/app/api/planning/documents/generate/route.ts` - POST endpoint for Claude-powered document generation
- `dashboard/src/app/api/planning/documents/[docId]/route.ts` - GET/PUT endpoints for document retrieval and versioned editing

## Decisions Made
- Used Next.js 15 `Promise<params>` pattern for dynamic route params (consistency with existing routes)
- Version list mode returns only id/version/created_at (no content) to keep responses lightweight

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- API routes ready for UI integration (Plan 03/04)
- Imports from doc-generation.ts will resolve once Plan 01 completes
- Both plans are Wave 1, so resolution order is handled by the build system

---
*Phase: 07-document-generation*
*Completed: 2026-01-27*
