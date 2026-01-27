---
phase: 08-deep-research-integration
plan: 01
subsystem: api
tags: [perplexity, research, markers, system-prompts, sse]

requires:
  - phase: 07-document-generation
    provides: doc-generation marker pattern used as template for research markers
provides:
  - POST /api/planning/research endpoint with Perplexity integration
  - GET /api/planning/research for fetching research records
  - research-markers.ts library (detectResearchMarkers, stripResearchMarkers)
  - System prompts with RESEARCH marker instructions
affects: [08-02 chat wiring, 08-03 research UI, 08-04 research panel]

tech-stack:
  added: [perplexity-api]
  patterns: [research-markers matching doc-generation-markers pattern, soft-limits for rate control]

key-files:
  created:
    - dashboard/src/lib/planning/research-markers.ts
    - dashboard/src/app/api/planning/research/route.ts
  modified:
    - dashboard/src/lib/planning/system-prompts.ts

key-decisions:
  - "Synchronous Perplexity call (await, not fire-and-forget) per RESEARCH.md serverless guidance"
  - "Soft limits 10/session 50/project enforced server-side with 429 responses"
  - "Research marker instructions added to all 6 phase prompts"

patterns-established:
  - "Research markers: <!-- RESEARCH: query --> matching doc generation marker convention"
  - "Soft rate limits: count-based checks returning 429 with user-friendly messages"

duration: 8min
completed: 2026-01-27
---

# Phase 8 Plan 1: Research Backend Summary

**Perplexity API route with sonar-pro model, research marker detection library, and system prompt updates across all phases**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-27T23:37:54Z
- **Completed:** 2026-01-27T23:46:00Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- POST /api/planning/research creates record, calls Perplexity sonar-pro, persists results with citations
- GET /api/planning/research fetches by id, projectId, or conversationId
- research-markers.ts detects and strips `<!-- RESEARCH: query -->` markers
- All 6 phase prompts now instruct Claude to suggest research with markers
- Soft limits enforced: 10/session, 50/project

## Task Commits

1. **Task 1: Research markers library and type updates** - `dccdbfda` (feat)
2. **Task 2: Research API route and system prompt update** - `06b4a768` (feat)

## Files Created/Modified
- `dashboard/src/lib/planning/research-markers.ts` - Marker detection and stripping functions
- `dashboard/src/app/api/planning/research/route.ts` - POST (trigger research) and GET (fetch records) endpoints
- `dashboard/src/lib/planning/system-prompts.ts` - Added RESEARCH marker instructions to all phase prompts

## Decisions Made
- Synchronous Perplexity call per RESEARCH.md guidance (avoids serverless timeout issues)
- Soft limits at 10/session and 50/project with 429 responses
- Research marker instructions added to all 6 phases (not just discover)
- Types already had ResearchStatus and ResearchType with 'custom' -- no changes needed

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
PERPLEXITY_API_KEY environment variable must be set for the research API to function. Without it, research requests will fail with a descriptive error.

## Next Phase Readiness
- Research API ready for chat route wiring (08-02)
- Markers ready for detection in SSE stream (08-02)
- System prompts will trigger Claude to emit markers (08-02)

---
*Phase: 08-deep-research-integration*
*Completed: 2026-01-27*
