# Plan 09-05 Summary: Task Rule Execution Logic

## What Was Built

Created the task rule execution engine that transforms rule definitions into actual tasks. Supports three rule types:
1. **Event-triggered rules** - React to events like `payment.failed`
2. **Recurring rules** - Run on schedule via cron expressions
3. **Condition-based rules** - Execute SQL queries to find matching rows

## Files Created/Modified

### Created

| File | Purpose |
|------|---------|
| `dashboard/src/lib/action-center/task-rule-types.ts` | TypeScript interfaces and Zod validation schemas |
| `dashboard/src/lib/action-center/task-rule-execution.ts` | Rule execution functions |

## Key Functions

### task-rule-types.ts

- `RuleTaskTemplate` - Interface defining what task to create (title, priority, department, due date config)
- `TaskRule` - Full rule definition with rule_type, schedule, trigger_event, conditions
- `RuleExecutionResult` - Tracks success/failure/skipped with reason
- `ruleTaskTemplateSchema` - Zod schema for task template validation
- `createTaskRuleSchema` - Zod schema with rule-type-specific refinements

### task-rule-execution.ts

- `executeTaskRule()` - Core execution with deduplication, variable substitution, due date calculation
- `executeRecurringRule()` - For scheduled rules (daily/weekly/monthly via cron)
- `executeConditionRule()` - For SQL query-based rules processing row results
- `dryRunTaskRule()` - Preview what task would be created without persisting

## Deduplication Strategy

- Event rules: `tr:{rule_id}:{entity_id}`
- Recurring rules: `tr:{rule_id}:{date}` (date-based to prevent duplicate daily tasks)
- Custom templates supported via `dedupe_key_template` field

## Due Date Calculation

1. **Event rules** - Calculate from payload reference field + offset (e.g., `payload.program_date - 7 days`)
2. **Recurring rules** - Offset from today (e.g., `+3 days`)
3. **Default fallback** - 7 days from now if no config specified

## Must-Have Verification

| Requirement | Status |
|-------------|--------|
| executeTaskRule() handles event-triggered rules with payload and entityId | PASS |
| executeRecurringRule() creates tasks for scheduled rules with date-based deduplication | PASS |
| executeConditionRule() creates tasks from SQL query results | PASS |
| Deduplication prevents duplicate tasks using dedupe_key | PASS |
| dryRunTaskRule() shows what would be created without making changes | PASS |

## Integration Points

- Uses `template-utils.ts` for:
  - `substituteVariables()` - Variable replacement in title/description
  - `calculateDueDate()` - Due date from reference + offset
  - `taskRuleDedupeKey()` / `generateDedupeKey()` - Dedupe key generation

- Imports types from `task-rule-types.ts`:
  - `TaskRule` - Rule definition
  - `RuleExecutionResult` - Execution result

## Next Steps

- 09-06 will likely add Task Rule API endpoints (CRUD operations for rules)
- 09-07/09-08 will integrate with n8n for scheduled rule execution

---
*Completed: 2026-01-25*
