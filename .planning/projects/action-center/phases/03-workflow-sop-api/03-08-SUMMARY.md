# Plan 03-08 Summary: Workflow Tasks Endpoint + SOP CRUD

## Completed

### API Endpoints Created

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/workflows/:id/tasks` | POST | Add an existing task to a workflow |
| `/api/sops` | GET | List SOP templates with filters and pagination |
| `/api/sops` | POST | Create a new SOP template |
| `/api/sops/:id` | GET | Get SOP template detail |
| `/api/sops/:id` | PATCH | Update SOP template (auto-increments version) |

### Files Created

1. **`dashboard/src/app/api/workflows/[id]/tasks/route.ts`**
   - POST endpoint to add a task to a workflow
   - Validates both workflow and task exist (returns 404 if not)
   - Updates workflow task counts after adding

2. **`dashboard/src/app/api/sops/route.ts`**
   - GET endpoint with filters: category, department, is_active, search
   - Cursor-based pagination (limit 20 default, max 100)
   - Sort options: created_at, name, times_used
   - POST endpoint for creating new SOP templates
   - Returns 201 with full SOP object on create

3. **`dashboard/src/app/api/sops/[id]/route.ts`**
   - GET endpoint returns full SOP detail including steps array
   - PATCH endpoint for updating SOP properties
   - Auto-increments version on any update
   - Returns 404 if SOP not found

## Requirements Fulfilled

| ID | Requirement | Status |
|----|-------------|--------|
| API-13 | POST /api/workflows/:id/tasks adds task, 404 if not found | DONE |
| API-14 | GET /api/sops paginated list with filters | DONE |
| API-15 | POST /api/sops creates template, returns 201 | DONE |
| API-16 | GET /api/sops/:id returns full detail with steps | DONE |
| API-17 | PATCH /api/sops/:id updates and auto-increments version | DONE |

## API Authentication

All endpoints require `X-API-Key` header matching `MOBILE_API_KEY` environment variable.

## Commits

1. `feat(03-08): add task to workflow endpoint` - Workflow tasks POST
2. `feat(03-08): SOP list and create endpoints` - SOP GET/POST
3. `feat(03-08): SOP get and update endpoints` - SOP detail GET/PATCH

## Notes

- Workflow mutation uses `action-center-workflow-mutations.ts` (not `workflow-mutations.ts`) to avoid conflicts with n8n workflow files
- SOP update always increments version number regardless of which fields change
- Existing TypeScript errors in the codebase are unrelated to these new endpoints (Supabase type generation issues)
