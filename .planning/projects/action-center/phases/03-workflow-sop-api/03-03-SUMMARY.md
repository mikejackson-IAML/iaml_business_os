# 03-03 Summary: Task Rule Types and Validation

## What Was Built

TypeScript type definitions and validation utilities for the Task Rules API, following the same patterns established in the Task API (Phase 2).

## Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/lib/api/task-rule-types.ts` | Type definitions for task rules |
| `dashboard/src/lib/api/task-rule-validation.ts` | Request validation helpers |

## Type Definitions (task-rule-types.ts)

### Enums
- `RuleType`: 'recurring' | 'event' | 'condition'
- `ScheduleType`: 'daily' | 'weekly' | 'monthly' | 'cron'

### Config Types
- `ScheduleConfig`: Schedule configuration with time, day_of_week, day_of_month, cron
- `TaskTemplate`: Template for tasks to create (title, description, task_type, priority, etc.)

### Core Entity
- `TaskRule`: Full task rule entity with all database fields

### Request/Response Types
- `TaskRuleListFilters`: Filter options for listing rules
- `TaskRuleListParams`: Pagination and sorting params
- `TaskRuleListResponse`: Paginated response format
- `CreateTaskRuleRequest`: Create rule request body
- `UpdateTaskRuleRequest`: Update rule request body

## Validation Logic (task-rule-validation.ts)

### Exported Constants
- `VALID_RULE_TYPES`: ['recurring', 'event', 'condition']
- `VALID_SCHEDULE_TYPES`: ['daily', 'weekly', 'monthly', 'cron']
- `VALID_TASK_TYPES`: ['standard', 'approval', 'decision', 'review']
- `VALID_PRIORITIES`: ['critical', 'high', 'normal', 'low']

### Validation Functions
- `validateCreateTaskRule(body)`: Validates create request with conditional requirements
- `validateUpdateTaskRule(body)`: Validates update request (all fields optional)
- `createErrorResponse(message, code, details)`: Builds error response
- `createValidationError(errors)`: Builds validation error response

### Conditional Validation Rules
| Rule Type | Required Fields |
|-----------|-----------------|
| recurring | schedule_type + schedule_config |
| event | trigger_event |
| condition | condition_query |

### Schedule Config Validation
| Schedule Type | Required Fields |
|---------------|-----------------|
| daily | time (HH:MM) |
| weekly | time (HH:MM), day_of_week (1-7) |
| monthly | time (HH:MM), day_of_month (1-31) |
| cron | cron expression |

### Task Template Validation
- `title`: Required, max 500 chars
- `task_type`: Optional, must be valid enum
- `priority`: Optional, must be valid enum
- `assignee_id`: Optional, must be valid UUID
- `sop_template_id`: Optional, must be valid UUID

## Commits

1. `feat(03-03): add Task Rule type definitions` - 372dc4e
2. `feat(03-03): add Task Rule validation utilities` - b101fef

## Must Have Verification

- [x] TypeScript types exist for: RuleType, ScheduleType, ScheduleConfig, TaskTemplate, TaskRule, TaskRuleListFilters, CreateTaskRuleRequest, UpdateTaskRuleRequest
- [x] Validation functions exist for: validateCreateTaskRule, validateUpdateTaskRule
- [x] Conditional validation: recurring rules require schedule_type + schedule_config, event rules require trigger_event, condition rules require condition_query
- [x] TaskTemplate validation requires title and validates optional task_type, priority, UUIDs

## Next Steps

These types and validators will be used by:
- Plan 03-06: Task Rule Queries & Mutations (Wave 2)
- Plan 03-09: Task Rules CRUD Endpoints (Wave 5)
