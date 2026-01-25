# Phase 9: Workflow Templates & Rules - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Automatic generation of tasks and workflows based on event triggers, schedules, and conditions. Templates define what to create, rules define when to create them. This phase builds the engine that listens for events, evaluates conditions, and creates tasks/workflows from templates.

</domain>

<decisions>
## Implementation Decisions

### Trigger matching
- Event names use **entity.action format** (e.g., `program_instance.created`, `payment.failed`, `registration.completed`)
- One event can trigger **multiple templates** — all matching templates fire, not just the first
- Events received via **webhook endpoint** (POST /api/action-center/events with {event_type, entity_id, payload})
- **Exact match only** for event types — no wildcards or glob patterns

### Condition filtering
- Conditions use **JSON path checks**: `{ "field": "payload.program_type", "operator": "equals", "value": "in_person" }`
- **Basic operators only**: equals, not_equals, in, not_in, exists, not_exists
- Multiple conditions combine with **AND logic** — all must match for template to fire
- Conditions check **payload only** — no database lookups during condition evaluation

### Timing & scheduling
- Relative due dates use **days offset from reference**: `{ "reference": "payload.program_date", "offset_days": -7 }`
- Offset calculation uses **calendar days** (not business days) by default
- Reference date comes from **payload field path** (e.g., `payload.program_date`)
- Recurring rules use **cron expressions**: `schedule: '0 7 * * 1'` (Monday 7am)

### Deduplication
- Dedupe key format: **template_id + entity_id** (e.g., `{template_id}:{entity_id}`)
- Deduplication checks **all time** — if any task exists with same dedupe_key, don't create
- When source entity is deleted, generated tasks are **auto-dismissed** with reason "Source entity deleted"
- **Force flag** available in event payload to bypass deduplication for regeneration

### Claude's Discretion
- Internal data structures for template storage
- Query optimization for event processing
- Error handling and retry logic
- Logging and observability approach

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

*Phase: 09-workflow-templates-rules*
*Context gathered: 2026-01-25*
