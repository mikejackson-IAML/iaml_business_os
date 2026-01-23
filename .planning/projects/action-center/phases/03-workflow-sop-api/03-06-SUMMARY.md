# 03-06 Summary: Task Rule Queries and Mutations

## What Was Built

Database query and mutation functions for task rules, following the patterns established in task-queries.ts and task-mutations.ts from Phase 2.

## Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/lib/api/task-rule-queries.ts` | Database query functions for task rules |
| `dashboard/src/lib/api/task-rule-mutations.ts` | Database mutation functions for task rules |

## Query Functions (task-rule-queries.ts)

### listTaskRules(params: TaskRuleListParams)
Lists task rules with cursor-based pagination and filters.

**Filters:**
- `rule_type`: Filter by rule type (recurring/event/condition)
- `is_enabled`: Filter by enabled status
- `search`: Search in name and description

**Sorting:**
- Default: name ASC
- Supports: created_at, name, last_run_at
- Order: asc or desc

**Returns:** `{ rules: TaskRule[], cursor: string | null, has_more: boolean }`

### getTaskRuleById(id: string)
Fetches a single task rule by ID.

**Returns:** `TaskRule | null`

### getEnabledRulesByType(ruleType: 'recurring' | 'event' | 'condition')
Fetches all enabled rules of a specific type. Used by n8n workflows to find rules to execute.

**Returns:** `TaskRule[]`

### getRulesByTriggerEvent(triggerEvent: string)
Fetches all enabled event rules that match a specific trigger event. Used when events fire to find matching rules.

**Returns:** `TaskRule[]`

## Mutation Functions (task-rule-mutations.ts)

### createTaskRule(data, createdBy?)
Creates a new task rule.

**Key behaviors:**
- Defaults `is_enabled` to `false` (rules start disabled)
- Sets `run_count` to 0
- Returns the created rule with all fields

### updateTaskRule(id, data, updatedBy?)
Updates an existing task rule.

**Key behaviors:**
- Supports partial updates (only provided fields are updated)
- Throws `RULE_NOT_FOUND` error if rule doesn't exist
- Returns the updated rule with all fields

### recordRuleRun(id, result, details?)
Records rule execution for tracking.

**Updates:**
- `last_run_at`: Current timestamp
- `last_run_result`: result string, optionally with details
- `run_count`: Incremented by 1

**Result values:** 'success' | 'error' | 'no_matches'

### enableRule(id, updatedBy?)
Convenience function to enable a rule.

### disableRule(id, updatedBy?)
Convenience function to disable a rule.

## Commits

1. `feat(03-06): add task rule query functions` - 887f5df
2. `feat(03-06): add task rule mutation functions` - d7689a1

## Must Have Verification

- [x] Query functions exist: listTaskRules, getTaskRuleById, getEnabledRulesByType, getRulesByTriggerEvent
- [x] Mutation functions exist: createTaskRule, updateTaskRule, recordRuleRun, enableRule, disableRule
- [x] listTaskRules supports cursor-based pagination with filters for rule_type, is_enabled, search
- [x] New rules default to is_enabled: false
- [x] recordRuleRun updates last_run_at, last_run_result, and increments run_count

## TypeScript Note

The files have TypeScript errors related to Supabase client types not recognizing the `task_rules` table. This is consistent with other action_center API files (task-mutations.ts, sop-mutations.ts) and will be resolved when Supabase types are regenerated to include the action_center schema.

## Next Steps

These query and mutation functions will be used by:
- Plan 03-09: Task Rules CRUD Endpoints (Wave 5)
