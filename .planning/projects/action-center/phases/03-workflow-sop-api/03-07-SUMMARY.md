# Plan 03-07 Summary: Workflow CRUD Endpoints

## What Was Built

Created the workflow API endpoints following the patterns established in the Task API routes.

## Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/app/api/workflows/route.ts` | GET /api/workflows (list) and POST /api/workflows (create) |
| `dashboard/src/app/api/workflows/[id]/route.ts` | GET /api/workflows/:id (detail) and PATCH /api/workflows/:id (update) |

## API Endpoints Implemented

### GET /api/workflows
Lists workflows with optional filters and cursor-based pagination.

**Query Parameters:**
- `status` - comma-separated list (not_started, in_progress, blocked, completed)
- `department` - department name filter
- `workflow_type` - workflow type filter
- `search` - search in name/description
- `cursor` - pagination cursor
- `limit` - results per page (default 20, max 100)
- `sort_by` - created_at | name | target_completion_date
- `sort_order` - asc | desc

**Response:**
```json
{
  "data": [...WorkflowExtended],
  "meta": {
    "cursor": "string | null",
    "has_more": boolean
  }
}
```

### POST /api/workflows
Creates a new workflow.

**Request Body:**
- `name` (required) - workflow name
- `description` - optional description
- `workflow_type` - optional type
- `department` - optional department
- `related_entity_type` - optional entity type
- `related_entity_id` - optional UUID
- `target_completion_date` - optional ISO date

**Response:** 201 with created WorkflowExtended object

### GET /api/workflows/:id
Returns workflow detail including all tasks.

**Response:** WorkflowDetail with:
- All workflow fields
- `tasks` - array of TaskExtended
- `task_count_by_status` - breakdown by status

### PATCH /api/workflows/:id
Updates workflow properties.

**Request Body (all optional):**
- `name`
- `description`
- `workflow_type`
- `department`
- `target_completion_date`

**Response:** Updated WorkflowExtended object

## Requirements Covered

- API-09: GET /api/workflows - list workflows with filters
- API-10: POST /api/workflows - create workflow
- API-11: GET /api/workflows/:id - get workflow with tasks
- API-12: PATCH /api/workflows/:id - update workflow

## Commits

1. `feat(03-07): add workflow list and create endpoints` - route.ts
2. `feat(03-07): add workflow detail and update endpoints` - [id]/route.ts

## Authentication

All endpoints require X-API-Key header authentication using the same MOBILE_API_KEY pattern established in the Task API.
