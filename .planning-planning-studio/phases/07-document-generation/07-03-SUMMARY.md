---
phase: 07-document-generation
plan: 03
subsystem: ui, api
tags: [sse, claude, markers, doc-generation, react]

requires:
  - phase: 07-document-generation (07-01)
    provides: doc-templates.ts, doc-generation.ts with marker detection and generation
  - phase: 07-document-generation (07-02)
    provides: API routes for document generate and retrieval
provides:
  - Chat-to-document integration via GENERATE_DOC markers
  - SSE doc_suggestion events from chat route
  - Inline DocSuggestionCard approval UI
  - Phase-specific document generation instructions in system prompts
affects: [07-04, 07-05]

tech-stack:
  added: []
  patterns:
    - "GENERATE_DOC marker detection in chat SSE pipeline"
    - "Inline approval card pattern for AI-suggested actions"

key-files:
  created:
    - "dashboard/src/app/dashboard/planning/[projectId]/components/doc-suggestion-card.tsx"
  modified:
    - "dashboard/src/lib/planning/system-prompts.ts"
    - "dashboard/src/app/api/planning/chat/route.ts"
    - "dashboard/src/lib/planning/doc-generation.ts"
    - "dashboard/src/app/dashboard/planning/[projectId]/components/conversation-shell.tsx"

key-decisions:
  - "detectAllDocGenerateMarkers returns array for multi-marker support"
  - "Doc suggestions rendered between message list and chat input"
  - "Router.refresh() used to update DocumentsPanel after generation"

patterns-established:
  - "Doc marker detection follows same pattern as phase completion markers"
  - "Inline approval cards for AI-suggested actions with idle/loading/success/error states"

duration: 8min
completed: 2026-01-27
---

# Phase 7 Plan 3: Chat-to-Document Integration Summary

**GENERATE_DOC markers in system prompts with SSE event emission and inline approval cards for document generation**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-27T22:46:51Z
- **Completed:** 2026-01-27T22:55:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- System prompts instruct Claude when to suggest documents per phase (discover, define, develop, package)
- Chat route detects GENERATE_DOC markers and emits doc_suggestion SSE events
- DocSuggestionCard provides inline approval with generate/dismiss/retry/success states
- Conversation shell handles doc_suggestion events and refreshes sidebar on generation

## Task Commits

Each task was committed atomically:

1. **Task 1: System prompts + chat route marker detection** - `607b7678` (feat)
2. **Task 2: Doc suggestion card and conversation shell wiring** - `47b5632e` (feat)

## Files Created/Modified
- `dashboard/src/lib/planning/system-prompts.ts` - Added GENERATE_DOC instructions to discover, define, develop, package prompts
- `dashboard/src/app/api/planning/chat/route.ts` - Doc marker detection and SSE event emission
- `dashboard/src/lib/planning/doc-generation.ts` - Added detectAllDocGenerateMarkers for multi-marker support
- `dashboard/src/app/dashboard/planning/[projectId]/components/doc-suggestion-card.tsx` - New inline approval card component
- `dashboard/src/app/dashboard/planning/[projectId]/components/conversation-shell.tsx` - Doc suggestion state and SSE handler

## Decisions Made
- Added detectAllDocGenerateMarkers (returns array) alongside existing single-match function for multi-marker support
- Doc suggestion cards rendered between message list and chat input for natural flow
- Router.refresh() triggers sidebar DocumentsPanel update after successful generation

## Deviations from Plan
None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Full chat-to-document flow is wired: Claude suggests -> SSE event -> card appears -> user approves -> document generated -> sidebar updates
- Ready for 07-04 (documents panel enhancements) and 07-05 (end-to-end verification)

---
*Phase: 07-document-generation*
*Completed: 2026-01-27*
