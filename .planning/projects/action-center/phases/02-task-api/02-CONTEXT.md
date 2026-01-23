# Phase 2: Task API - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Full task CRUD API with filtering, actions (complete/dismiss), comments, and activity tracking. This phase delivers the backend endpoints that Phase 4 (Task UI - List) will consume. Does not include workflow APIs, SOP APIs, or UI.

</domain>

<decisions>
## Implementation Decisions

### Filter & Pagination
- Default sort: Priority first (critical→low), then by due date (soonest first) within each priority
- Pagination style: Claude's discretion (cursor-based recommended for dynamic lists)
- Filter combination logic: Claude's discretion (AND is standard)

### Task Actions
- Completion note: Optional (not required)
- Dismiss reason: Required (free text, must provide why)
- Undo behavior: Completed/dismissed tasks can be reopened within 7 days, then locked
- Dismiss cascade: If task has dependents, auto-create a decision task asking what to do with them

### Error Responses
- Format: Simple JSON — `{ "error": "Task not found", "code": "NOT_FOUND" }`
- Validation messages: User-friendly verbose — "Priority must be one of: critical, high, medium, low"
- Debug info: Stack traces in development only, generic errors in production

### Comments & Activity
- Comments fetch: Included in task detail response (not separate endpoint)
- Activity depth: Claude's discretion (last 10 events inline recommended, "load more" for full history)
- Comment editing: Editable within 5 minutes of posting, then locked

### Claude's Discretion
- Pagination style (cursor vs offset/limit)
- Filter combination logic (AND vs OR vs mixed)
- Activity history depth inline with task detail
- Specific HTTP status codes for error scenarios
- Rate limiting approach (if any)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-task-api*
*Context gathered: 2026-01-22*
