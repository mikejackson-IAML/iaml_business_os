# Plan 02-05 Summary: PATCH /api/tasks/:id - Update Task

## Completed: 2026-01-22

## What Was Built

Implemented the task update endpoint `PATCH /api/tasks/:id` that allows modifying allowed fields on an existing task.

## Changes Made

### Task 1: Add PATCH Handler
**File:** `dashboard/src/app/api/tasks/[id]/route.ts`

Added:
- Import statements for `getCurrentUserId`, `updateTask`, `validateUpdateTask`, and `createValidationError`
- Full PATCH handler implementation with:
  - API key authentication
  - UUID format validation
  - Task existence check
  - Status conflict detection (cannot update done/dismissed tasks)
  - JSON body parsing with error handling
  - Request validation using existing validation utilities
  - Empty update detection
  - User ID extraction for activity logging
  - Standard error response format

## API Endpoint

```
PATCH /api/tasks/:id
```

### Request Headers
- `X-API-Key`: Required for authentication

### Request Body (all optional)
```typescript
{
  title?: string;           // Non-empty, max 500 chars
  description?: string;
  status?: 'open' | 'in_progress' | 'waiting';  // Not 'done' or 'dismissed'
  priority?: 'critical' | 'high' | 'normal' | 'low';
  due_date?: string | null; // ISO date
  due_time?: string | null; // HH:MM
  department?: string;
  assignee_id?: string | null;  // UUID
  workflow_id?: string | null;  // UUID
}
```

### Response Codes
- `200`: Task updated successfully (returns updated task)
- `400`: Validation error (invalid UUID, invalid JSON, invalid fields, no fields to update, status='dismissed')
- `401`: Unauthorized (missing/invalid API key)
- `404`: Task not found
- `409`: Conflict (task is already done or dismissed)
- `500`: Internal server error

## Must Haves Satisfied

| Requirement | Status |
|-------------|--------|
| API-04: PATCH /api/tasks/:id updates allowed fields | Satisfied |
| Cannot update status to 'dismissed' via PATCH (returns validation error) | Satisfied |
| Cannot update completed or dismissed tasks (returns 409 Conflict) | Satisfied |
| Returns 404 for non-existent task | Satisfied |

## Commits

1. `feat(02-05): implement PATCH /api/tasks/:id endpoint` - 03b771c
