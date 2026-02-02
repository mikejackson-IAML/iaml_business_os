---
phase: 07-ai-reporting-chat
plan: 01
subsystem: api
tags: [claude, anthropic, sse, streaming, chat, natural-language, supabase]

# Dependency graph
requires:
  - phase: 01-programs-list
    provides: program_dashboard_summary view for queries
  - phase: 02-program-detail
    provides: registration_dashboard_summary view for queries
provides:
  - SSE streaming chat API endpoint at /api/programs/chat
  - Schema context for Claude to understand program data
  - Query execution via Supabase client methods (no raw SQL)
  - Format detection for table/chart/text responses
affects: [07-02 (Chat UI Panel)]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Claude tool use for structured queries
    - SSE streaming for real-time chat responses
    - Tool result continuation for query interpretation

key-files:
  created:
    - dashboard/src/lib/api/programs-chat.ts
    - dashboard/src/app/api/programs/chat/route.ts
  modified: []

key-decisions:
  - "Claude tool use pattern for database queries"
  - "SSE streaming matches Planning Studio chat pattern"
  - "Format detection based on query params and result shape"
  - "Tool result continuation to get Claude's interpretation"

patterns-established:
  - "Programs chat helper library pattern with SCHEMA_CONTEXT"
  - "Query execution through typed QueryParams interface"
  - "Automatic format detection (table/chart/text)"

# Metrics
duration: 3min
completed: 2026-02-02
---

# Phase 7 Plan 01: Chat API Foundation Summary

**SSE streaming API endpoint for natural language program data queries using Claude tool use and Supabase client**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-02T16:25:00Z
- **Completed:** 2026-02-02T16:28:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created programs-chat helper library with schema context for Claude
- Built SSE streaming API endpoint at POST /api/programs/chat
- Implemented Claude tool use for safe database queries (no raw SQL)
- Added automatic format detection for table/chart/text responses

## Task Commits

Each task was committed atomically:

1. **Task 1: Create programs-chat helper library** - `607c754c` (feat)
2. **Task 2: Create SSE streaming chat API route** - `1e38280d` (feat)

## Files Created/Modified

- `dashboard/src/lib/api/programs-chat.ts` - Schema context, query execution, format detection
- `dashboard/src/app/api/programs/chat/route.ts` - SSE streaming endpoint with Claude tool use

## Decisions Made

1. **Claude tool use pattern** - Claude interprets natural language and generates structured query parameters via the query_programs tool. This ensures safe, typed queries through Supabase client methods.

2. **SSE streaming** - Followed the same pattern as Planning Studio chat for consistency. Text deltas stream in real-time, data results stream as structured JSON.

3. **Format detection** - formatQueryResult analyzes query parameters and result shape to determine display format:
   - Aggregations with groupBy -> chart
   - Single values -> text
   - Lists -> table

4. **Tool result continuation** - When Claude uses the query_programs tool, we execute the query and then continue the conversation with the results so Claude can provide natural language interpretation.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- API endpoint ready for UI integration in plan 07-02
- Chat panel can stream messages and display data results
- Format hints (table/chart/text) ready for UI rendering

---
*Phase: 07-ai-reporting-chat*
*Completed: 2026-02-02*
