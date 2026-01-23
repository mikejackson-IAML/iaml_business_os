# Phase 3: Workflow & SOP API - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

REST API endpoints for managing workflows (grouped task collections), SOP templates (standard operating procedures with ordered steps), and task rules (automatic task generation triggers). Full CRUD operations for all three entity types.

Requirements: API-09 to API-20

</domain>

<decisions>
## Implementation Decisions

### Response Structure
- **Pagination:** Claude's discretion — apply cursor pagination where scale warrants it (likely workflows list), simpler responses for bounded collections (SOPs, rules)
- **Related data:** Claude's discretion — include tasks inline for workflow detail (single API call), keep list endpoints lean
- **SOP step management:** Claude's discretion — full replacement on update (simpler, prevents partial state)
- **Bulk operations:** Claude's discretion — single-item operations for v1 (keep API simple)

### Validation Rules
- **Workflow deletion:** Claude's discretion — safest approach (likely archive rather than delete, or block if active tasks)
- **SOP validity:** Claude's discretion — allow empty SOPs for work-in-progress
- **Rule testing:** Claude's discretion — skip dry-run for v1 (complexity not justified)
- **Rule activation:** Claude's discretion — likely future-only (no backfill on enable)

### Authorization Model
- **SOP access:** Claude's discretion — single-user (CEO) for v1, owner has full access
- **Workflow scope:** Department-scoped — workflows belong to a department, users see workflows for their department(s)
- **Task rule scope:** Claude's discretion — likely department-scoped to match workflow pattern
- **Auth method:** Claude's discretion — likely same X-API-Key pattern as Task API for consistency

### Consistency Patterns
- **Code sharing:** Claude's discretion — reuse Task API helpers where sensible (types, auth, validation patterns)
- **Error format:** Claude's discretion — match Task API error response format
- **URL patterns:** Claude's discretion — follow REST conventions and Task API patterns (plural resources: /api/workflows, /api/sops, /api/task-rules)
- **Timestamps:** Claude's discretion — match Task API format (ISO 8601)

### Claude's Discretion
Most technical decisions are delegated to Claude:
- Pagination strategy per endpoint
- Related data inclusion patterns
- Validation complexity level
- Code organization and sharing
- Specific error codes and messages

The one explicit decision:
- **Workflows are department-scoped** — this affects filtering and RLS

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

User indicated unfamiliarity with API design details; Claude has latitude to make sensible technical choices following Task API patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 03-workflow-sop-api*
*Context gathered: 2026-01-22*
