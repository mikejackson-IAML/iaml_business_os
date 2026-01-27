# Summary 09-01: Core Utilities

## Status: COMPLETE

## What Was Built

Created `dashboard/src/lib/action-center/template-utils.ts` with four categories of utility functions that both workflow templates and task rules will depend on.

### Condition Evaluation
- `getValueByPath()` - Extract values from nested objects using dot-notation paths
- `evaluateCondition()` - Evaluate single condition against payload
- `evaluateConditions()` - Evaluate all conditions with AND logic

**Supported Operators:**
| Operator | Description |
|----------|-------------|
| `equals` | Exact match |
| `not_equals` | Not exact match |
| `in` | Value in array |
| `not_in` | Value not in array |
| `exists` | Value is not null/undefined |
| `not_exists` | Value is null/undefined |

### Variable Substitution
- `substituteVariables()` - Replace `${varName}` placeholders using mapping + payload
- `validateVariables()` - Check which variables cannot be resolved

### Due Date Calculation
- `calculateDueDate()` - Calculate due date from reference field + offset (calendar days)
- `calculateTaskDueDate()` - Calculate task due date relative to workflow target date

### Dedupe Key Generation
- `generateDedupeKey()` - Generate dedupe key from template with placeholders
- `workflowTemplateDedupeKey()` - Default format: `wt:{templateId}:{entityId}:{taskOrder}`
- `taskRuleDedupeKey()` - Default format: `tr:{ruleId}:{entityId}:{date}`

### Type Guards
- `isConditionArray()` - Type guard for `Condition[]`
- `isVariableMapping()` - Type guard for `VariableMapping`

## Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/lib/action-center/template-utils.ts` | Core utility functions |

## Verification

- [x] File exists at `dashboard/src/lib/action-center/template-utils.ts`
- [x] TypeScript compiles without errors (`npx tsc --noEmit`)
- [x] All 15 exports present (2 types, 2 interfaces, 11 functions)

## Must Haves Satisfied

- [x] `evaluateConditions()` supports all 6 operators
- [x] `substituteVariables()` replaces `${varName}` placeholders using variable mapping and payload
- [x] `calculateDueDate()` parses reference date from payload path and adds `offset_days`
- [x] `generateDedupeKey()` creates unique keys from templates with placeholder substitution

## Commit

```
5b313a2 feat(09-01): add template-utils with condition, variable, due date, and dedupe utilities
```
