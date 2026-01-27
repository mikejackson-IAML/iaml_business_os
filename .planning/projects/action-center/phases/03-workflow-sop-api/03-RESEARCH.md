# Phase 3: Workflow & SOP API - Research

**Researched:** 2026-01-22
**Status:** Complete

## Database Schema Details

### Workflows Table (`action_center.workflows`)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Auto-generated |
| name | TEXT | Workflow name |
| description | TEXT | Workflow description |
| workflow_type | TEXT | 'program_prep', 'onboarding', etc. |
| department | TEXT | Department scope |
| status | ENUM | 'not_started', 'in_progress', 'blocked', 'completed' |
| related_entity_type | TEXT | Generic link type |
| related_entity_id | UUID | Generic link ID |
| template_id | UUID FK | References workflow_templates |
| total_tasks | INTEGER | Progress tracking |
| completed_tasks | INTEGER | Progress tracking |
| started_at | TIMESTAMPTZ | When workflow began |
| completed_at | TIMESTAMPTZ | When workflow finished |
| target_completion_date | DATE | Target deadline |
| created_by, updated_by | TEXT | Audit |
| created_at, updated_at | TIMESTAMPTZ | Audit |

**Indexes:** status, department, workflow_type, related_entity, created_at

### SOP Templates Table (`action_center.sop_templates`)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Auto-generated |
| name | TEXT | SOP name |
| description | TEXT | SOP description |
| category | TEXT | Categorization |
| department | TEXT | Department scope |
| steps | JSONB | Array of step objects |
| version | INTEGER | Auto-increment on save |
| is_active | BOOLEAN | Enable/disable |
| times_used | INTEGER | Usage tracking |
| last_used_at | TIMESTAMPTZ | Usage tracking |
| variables | JSONB | Template substitution vars |
| created_by, updated_by | TEXT | Audit |
| created_at, updated_at | TIMESTAMPTZ | Audit |

**Step object structure:**
```json
{
  "order": 1,
  "title": "Step title",
  "description": "Step details",
  "estimated_minutes": 10,
  "links": ["https://..."],
  "notes": "Additional notes"
}
```

**Indexes:** category, department, is_active, name (full text search)

### Task Rules Table (`action_center.task_rules`)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID PK | Auto-generated |
| name | TEXT | Rule name |
| description | TEXT | Rule description |
| rule_type | ENUM | 'recurring', 'event', 'condition' |
| schedule_type | TEXT | 'daily', 'weekly', 'monthly', 'cron' |
| schedule_config | JSONB | Schedule details |
| trigger_event | TEXT | 'program_instance.created', etc. |
| trigger_conditions | JSONB | Conditions for event triggers |
| condition_query | TEXT | SQL for condition-based rules |
| task_template | JSONB | Task to create |
| due_date_field | TEXT | Reference field for due date calc |
| due_date_offset_days | INTEGER | Days offset from reference |
| dedupe_key_template | TEXT | Template for deduplication |
| is_enabled | BOOLEAN | Enable/disable |
| last_run_at | TIMESTAMPTZ | Last execution |
| last_run_result | TEXT | Last execution result |
| run_count | INTEGER | Total runs |
| created_by, updated_by | TEXT | Audit |
| created_at, updated_at | TIMESTAMPTZ | Audit |

**Task template structure:**
```json
{
  "title": "Task title",
  "description": "Task description",
  "type": "standard",
  "priority": "normal",
  "department": "Operations",
  "sop_template_id": "uuid or null"
}
```

**Indexes:** rule_type, is_enabled, trigger_event, schedule_type

## Join Relationships

- **Workflow → Tasks:** `tasks.workflow_id` FK to `workflows.id`
- **Workflow → Template:** `workflows.template_id` FK to `workflow_templates.id`
- **Task → SOP:** `tasks.sop_template_id` FK to `sop_templates.id`
- **Task Rule → creates Tasks:** Based on `task_template` JSONB

## Task API Patterns to Reuse

### Authentication
- `X-API-Key` header validated against `MOBILE_API_KEY`
- Helper: `validateApiKey(request)` from `lib/api/task-auth.ts`
- Early 401 return if invalid

### Type System
- Define types in `lib/api/[entity]-types.ts`
- Validation enums at top
- Separate API request/response types from database entity types
- Use `null` instead of `undefined` for nullable fields

### Validation
- Create `lib/api/[entity]-validation.ts` with validators
- Return `ValidationResult<T>` with `success`, `data`, `errors`
- UUID regex: `/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i`
- User-friendly verbose error messages
- Cannot PATCH certain fields (use action endpoints)

### Database Operations
- Queries in `lib/api/[entity]-queries.ts`
- Mutations in `lib/api/[entity]-mutations.ts`
- Use `getServerClient()` from `lib/supabase/server.ts`
- Handle Supabase error codes: `PGRST116` = not found, `23505` = unique constraint
- Cursor-based pagination: fetch limit+1, return cursor if has_more

### Error Handling
- ErrorCode type: 'VALIDATION_ERROR', 'NOT_FOUND', 'UNAUTHORIZED', 'CONFLICT', 'INTERNAL_ERROR'
- Format: `{ error: string, code: ErrorCode, details?: Record<string, string[]> }`
- Status codes: 400, 401, 404, 409, 500

### Routes
- `app/api/[resource]/route.ts` for list/create
- `app/api/[resource]/[id]/route.ts` for detail/update
- `app/api/[resource]/[id]/[action]/route.ts` for actions

## Recommended Response Structures

### Workflow List Response
```typescript
{
  data: Workflow[],
  meta: {
    cursor: string | null,
    has_more: boolean
  }
}
```

### Workflow Detail Response
Include tasks array from `tasks_extended` view with computed fields:
- is_overdue, due_category, is_blocked
- blocked_by_count, blocking_count
- assignee_name, workflow_name, sop_name

Optional summary: `task_count_by_status`

### SOP List Response
Include: `steps_count`, `version`, `times_used`, `last_used_at`

### Task Rule List Response
Include: `is_enabled`, `last_run_at`, `run_count`

## Validation Rules

### Workflows
- Cannot DELETE workflow with incomplete tasks
- Cannot PATCH status directly (computed from tasks)
- `target_completion_date` >= today if set

### SOPs
- Steps cannot be empty if `is_active = true`
- Version auto-increments on save
- Cannot delete SOP referenced by active task rules

### Task Rules
- `rule_type = 'recurring'` requires `schedule_type` and `schedule_config`
- `rule_type = 'event'` requires `trigger_event`
- `rule_type = 'condition'` requires `condition_query`
- Task template must include at least `title`
- Cannot enable rule without valid template

## Files to Create

### Types
- `dashboard/src/lib/api/workflow-types.ts`
- `dashboard/src/lib/api/sop-types.ts`
- `dashboard/src/lib/api/task-rule-types.ts`

### Validation
- `dashboard/src/lib/api/workflow-validation.ts`
- `dashboard/src/lib/api/sop-validation.ts`
- `dashboard/src/lib/api/task-rule-validation.ts`

### Queries
- `dashboard/src/lib/api/workflow-queries.ts`
- `dashboard/src/lib/api/sop-queries.ts`
- `dashboard/src/lib/api/task-rule-queries.ts`

### Mutations
- `dashboard/src/lib/api/workflow-mutations.ts`
- `dashboard/src/lib/api/sop-mutations.ts`
- `dashboard/src/lib/api/task-rule-mutations.ts`

### Routes
- `dashboard/src/app/api/workflows/route.ts` (GET list, POST create)
- `dashboard/src/app/api/workflows/[id]/route.ts` (GET detail, PATCH update)
- `dashboard/src/app/api/workflows/[id]/tasks/route.ts` (POST add task)
- `dashboard/src/app/api/sops/route.ts` (GET list, POST create)
- `dashboard/src/app/api/sops/[id]/route.ts` (GET detail, PATCH update)
- `dashboard/src/app/api/task-rules/route.ts` (GET list, POST create)
- `dashboard/src/app/api/task-rules/[id]/route.ts` (PATCH update)

## Planning Recommendations

### Wave 1 (Foundation - no dependencies)
- Types for all three entities (can be parallel)
- Validation for all three entities (can be parallel)

### Wave 2 (Database Operations - depends on types)
- Query functions for all three entities
- Mutation functions for all three entities

### Wave 3 (Workflow API - depends on queries/mutations)
- GET /api/workflows (list)
- POST /api/workflows (create)
- GET /api/workflows/:id (detail with tasks)
- PATCH /api/workflows/:id (update)

### Wave 4 (Workflow Actions + SOP API - depends on workflow API)
- POST /api/workflows/:id/tasks (add task to workflow)
- GET /api/sops (list)
- POST /api/sops (create)
- GET /api/sops/:id (detail)
- PATCH /api/sops/:id (update)

### Wave 5 (Task Rules API - depends on SOP API for validation)
- GET /api/task-rules (list)
- POST /api/task-rules (create)
- PATCH /api/task-rules/:id (update/enable/disable)

---

*Research completed: 2026-01-22*
