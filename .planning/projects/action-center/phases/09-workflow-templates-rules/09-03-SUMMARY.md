# Summary 09-03: Event Webhook Endpoint

## Completed

Created the event webhook endpoint that receives events from external systems and routes them to matching workflow templates and task rules.

## Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/app/api/action-center/events/route.ts` | Event webhook endpoint with POST and GET handlers |

## Implementation Details

### POST /api/action-center/events

Receives events with the following structure:
```json
{
  "event_type": "program_instance.created",
  "entity_id": "pi_123",
  "payload": { ... },
  "force": false,
  "timestamp": "2026-01-25T10:00:00Z"
}
```

Processing flow:
1. Authenticates using `x-api-key` header (same as other action-center endpoints)
2. Validates input using `eventPayloadSchema` from Zod validation
3. Queries `workflow_templates` and `task_rules` by `trigger_event`
4. Evaluates conditions using `evaluateConditions()` from template-utils
5. Dynamically imports and calls instantiation functions (09-04, 09-05)
6. Returns detailed results including counts and any errors

Response structure:
```json
{
  "success": true,
  "event_type": "program_instance.created",
  "entity_id": "pi_123",
  "templates_matched": 2,
  "templates_executed": 1,
  "rules_matched": 1,
  "rules_executed": 1,
  "workflows_created": ["wf-uuid"],
  "tasks_created": ["task-uuid-1", "task-uuid-2"],
  "skipped": [{ "type": "workflow_template", "id": "...", "reason": "condition_not_met" }],
  "errors": []
}
```

### GET /api/action-center/events

Lists registered event types and their handlers:
- Optional `event_type` query parameter to filter
- Returns all active workflow templates and task rules
- Useful for debugging and testing

## Key Decisions

- Uses dynamic imports for `workflow-template-instantiation` and `task-rule-execution` modules (to be implemented in 09-04 and 09-05)
- Casts trigger_conditions to `Condition[]` type for proper type safety
- One event can trigger multiple templates - all matching ones fire
- Force flag passed through to instantiation functions to bypass deduplication

## Verification

- [x] File exists at `dashboard/src/app/api/action-center/events/route.ts`
- [x] Route exports both POST and GET handlers
- [x] ESLint passes with no errors

## Must Haves Satisfied

- [x] POST /api/action-center/events accepts {event_type, entity_id, payload, force?}
- [x] Endpoint queries workflow_templates and task_rules by trigger_event
- [x] Conditions are evaluated using evaluateConditions() from template-utils
- [x] Response includes counts of matched, executed, skipped, and errors

## Commit

```
acc12e0 feat(09-03): add event webhook endpoint for workflow templates and task rules
```
