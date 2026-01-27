# Phase 2: Task API - Research

## Existing API Patterns

### Route Structure
The dashboard uses Next.js 13+ App Router with the following conventions:
- Location: `dashboard/src/app/api/[resource]/[action]/route.ts`
- Examples:
  - `/api/mobile/health/route.ts` - GET endpoint
  - `/api/mobile/workflows/trigger/route.ts` - POST endpoint
  - `/api/mobile/notifications/register/route.ts` - POST endpoint

### Authentication Pattern
- Uses custom API key header validation: `X-API-Key` against `process.env.MOBILE_API_KEY`
- Early return with 401 Unauthorized if key missing/invalid
- Pattern: 
  ```typescript
  const apiKey = request.headers.get('X-API-Key');
  const validApiKey = process.env.MOBILE_API_KEY;
  if (!apiKey || !validApiKey || apiKey !== validApiKey) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  ```

### Error Response Format
- Simple JSON format: `{ "error": "message" }` with HTTP status codes
- Uses `NextResponse.json(body, { status: code })`
- Status codes observed: 401 (auth), 400 (validation), 404 (not found), 500 (server error)
- No error code field in current implementations (but Phase 2 spec calls for `{ "error": "...", "code": "..." }`)

### Request Validation
- Parse JSON with try/catch to handle invalid JSON
- Validate required fields with explicit type checks: `typeof body.workflow_id !== 'string'`
- Return 400 with user-friendly error message for validation failures
- Pattern:
  ```typescript
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  if (!body.field || typeof body.field !== 'string') {
    return NextResponse.json({ error: 'field is required' }, { status: 400 });
  }
  ```

### Response Format
- Wrap responses in `NextResponse.json()`
- Include `headers` object for caching directives if applicable: `{ 'Cache-Control': '...' }`
- No wrapper object — response is the data directly

### Error Handling
- Wrap entire handler in try/catch
- Log errors to console: `console.error('Error type:', error)`
- Return generic 500 for unexpected errors: `{ error: 'Internal server error' }`
- No stack traces exposed to client

### Async Pattern
- Use async/await with `await request.json()` and Supabase queries
- Fire-and-forget patterns use AbortController for timeout: `setTimeout(() => controller.abort(), 10000)`

---

## Supabase Client Usage

### Client Initialization
- Location: `dashboard/src/lib/supabase/server.ts`
- Uses `createClient<Database>(url, serviceKey, options)` from `@supabase/supabase-js`
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`
- Service role key for full database access (no RLS restrictions)
- Singleton pattern: `getServerClient()` returns cached client instance

### Database Types
- Location: `dashboard/src/lib/supabase/types.ts`
- Exports `Database` type with full schema definition
- Tables typed as `Database['public']['Tables']['table_name']`
- Supports Row/Insert/Update types for each table
- Types generated from actual schema (includes contacts, campaigns, etc.)

### Query Pattern
- Use `getServerClient()` to get client instance
- Call `.from('table_name').select(...).where(...)`
- Common patterns:
  ```typescript
  const { data, error } = await supabase
    .from('table_name')
    .select('col1, col2, col3')
    .eq('field', value)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error('Query failed');
  ```
- `.single()` for queries expecting one row (returns PGRST116 error code if not found)
- Error handling: Check `error` before using `data`

### Common Operations
- `select()` - specify columns to fetch
- `eq()`, `neq()`, `gt()`, `lt()`, `gte()`, `lte()` - filters
- `in()` - filter where column in array
- `order()` - sorting with `{ ascending: boolean }`
- `limit()`, `offset()` - pagination
- `not()` - null checks: `.not('webhook_url', 'is', null)`
- `.single()` - expect one row

---

## Action Center Schema Reference

### Core Tables (from Phase 1 migrations)

#### tasks table
Key columns for API:
- `id` UUID PRIMARY KEY
- `title`, `description` TEXT - Task content
- `task_type` - 'standard', 'approval', 'decision', 'review'
- `source` - 'manual', 'alert', 'workflow', 'ai', 'rule'
- `status` - 'open', 'in_progress', 'waiting', 'done', 'dismissed'
- `dismissed_reason` TEXT - Required if status='dismissed'
- `completion_note` TEXT - Optional completion note
- `completed_at`, `dismissed_at` TIMESTAMPTZ
- `priority` - 'critical', 'high', 'normal', 'low'
- `due_date` DATE, `due_time` TIME
- `department` TEXT
- `assignee_id` UUID - References profiles(id)
- `workflow_id` UUID - References workflows(id)
- `parent_task_id` UUID - References tasks(id)
- `sop_template_id` UUID - References sop_templates(id)
- `depends_on` UUID[] - Array of blocking task IDs
- `related_entity_type`, `related_entity_id`, `related_entity_url` - Generic links
- Approval fields: `recommendation`, `recommendation_reasoning`, `approval_outcome`, `approval_modifications`
- AI fields: `ai_confidence` (0.00-1.00), `ai_suggested_at`
- `dedupe_key` TEXT UNIQUE - Deduplication
- Audit: `created_by`, `updated_by`, `created_at`, `updated_at`

Indexes: status, priority, due_date, assignee_id, department, workflow_id, source, type, created_at (DESC), depends_on (GIN), related_entity

CHECK constraints:
- `status` IN ('open', 'in_progress', 'waiting', 'done', 'dismissed')
- `dismissed_requires_reason`: (status='dismissed' AND dismissed_reason IS NOT NULL) OR status!='dismissed'
- `approval_outcome` IN ('approved', 'modified', 'rejected') or NULL

#### workflows table
- `id` UUID PRIMARY KEY
- `name`, `description` TEXT
- `workflow_type` TEXT - e.g., 'program_prep', 'onboarding'
- `department` TEXT
- `status` - 'not_started', 'in_progress', 'blocked', 'completed'
- `related_entity_type`, `related_entity_id` UUID
- `template_id` UUID - References workflow_templates
- `total_tasks`, `completed_tasks` INTEGER
- `started_at`, `completed_at`, `target_completion_date` TIMESTAMPTZ/DATE
- Audit: `created_by`, `updated_by`, `created_at`, `updated_at`

#### sop_templates table
- `id` UUID PRIMARY KEY
- `name`, `description`, `category`, `department` TEXT
- `steps` JSONB - Array of step objects
- `version` INTEGER
- `is_active` BOOLEAN
- `times_used` INTEGER, `last_used_at` TIMESTAMPTZ
- `variables` JSONB - Variable definitions
- Audit: `created_by`, `updated_by`, `created_at`, `updated_at`

#### task_comments table (from supporting_tables)
- `id` UUID PRIMARY KEY
- `task_id` UUID - References tasks(id)
- `author_id` UUID - References profiles(id)
- `content` TEXT
- `is_edited` BOOLEAN DEFAULT FALSE
- `edited_at` TIMESTAMPTZ
- `created_at`, `updated_at` TIMESTAMPTZ
- Constraint: editable only within 5 minutes (check in application logic)

#### task_activity table (from supporting_tables)
- `id` UUID PRIMARY KEY
- `task_id` UUID - References tasks(id)
- `activity_type` TEXT - 'created', 'status_changed', 'assigned', 'commented', 'completed', etc.
- `user_id` UUID - References profiles(id)
- `old_value`, `new_value` JSONB - For tracking changes
- `metadata` JSONB - Additional context
- `created_at` TIMESTAMPTZ

### Views (from views migration)

#### tasks_extended view
Includes all task columns PLUS computed fields:
- `is_overdue` BOOLEAN - Computed from due_date vs current date/time
- `due_category` TEXT - 'no_date', 'overdue', 'today', 'this_week', 'later'
- `is_blocked` BOOLEAN - Has incomplete dependencies
- `blocked_by_count` INTEGER - Count of incomplete dependencies
- `assignee_name` TEXT - From joined profiles table
- `workflow_name` TEXT - From joined workflows table
- `sop_name` TEXT - From joined sop_templates table
- `parent_title` TEXT - From self-join on parent_task_id
- `dependency_count` INTEGER - Total count of depends_on array

#### user_task_summary view
- `assignee_id`, `assignee_name`
- `total_tasks`, `open_tasks`, `in_progress_tasks`, `waiting_tasks`, `done_tasks`, `dismissed_tasks` - Counts
- `overdue_count`, `due_today_count`, `due_this_week_count`
- `critical_open`, `high_open`

#### department_task_summary view
- `department`
- Status counts and due date breakdowns by department

---

## Reusable Patterns

### Query Utilities (Not Currently Exported)
The codebase uses direct Supabase queries in lib files. Common patterns to establish:
- Filter parsing from query strings
- Sort order parsing (priority + due_date combination)
- Pagination (cursor-based preferred per requirements)
- Error mapping

### Type Patterns
- Request body interfaces defined in route.ts: `interface TriggerRequestBody { ... }`
- Response interfaces in lib files (e.g., `interface QuickAction { ... }`)
- Database types imported from `@/lib/supabase/types`
- Types use null instead of optional for nullable fields

### API Response Pattern to Establish
Current codebase returns data directly, but Phase 2 spec requests error codes. Recommended wrapper:
```typescript
interface ErrorResponse {
  error: string;
  code?: string;  // 'VALIDATION_ERROR', 'NOT_FOUND', etc.
  details?: Record<string, string[]>;  // For validation errors
}

interface SuccessResponse<T> {
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    cursor?: string;
  };
}
```

### Validation Pattern to Establish
```typescript
// Parse and validate request
const { value, error: parseError } = validateRequest(body, schema);
if (parseError) {
  return NextResponse.json(
    { error: 'Validation failed', code: 'VALIDATION_ERROR', details: parseError },
    { status: 400 }
  );
}
```

---

## Recommendations

### API Organization
1. **Create lib utilities** for common operations:
   - `lib/api/task-queries.ts` - All task SELECT queries
   - `lib/api/task-mutations.ts` - All task CREATE/UPDATE/DELETE queries
   - `lib/api/task-filters.ts` - Parse and apply filter params
   - `lib/api/task-validation.ts` - Validate request bodies

2. **Create API routes**:
   - `app/api/tasks/route.ts` - GET (list) and POST (create)
   - `app/api/tasks/[id]/route.ts` - GET (detail), PATCH (update)
   - `app/api/tasks/[id]/complete/route.ts` - POST (complete)
   - `app/api/tasks/[id]/dismiss/route.ts` - POST (dismiss)
   - `app/api/tasks/[id]/comments/route.ts` - POST (add comment)
   - `app/api/tasks/[id]/activity/route.ts` - GET (activity log)

### Filter Implementation
- Use `?status=open,in_progress&assignee_id=uuid&priority=critical,high&due_date_from=2026-01-22&due_date_to=2026-01-28`
- Parse with simple URL params parsing:
  ```typescript
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const statuses = params.status?.split(',') || [];
  ```
- Use Supabase `in()` for array filters:
  ```typescript
  if (statuses.length > 0) {
    query = query.in('status', statuses);
  }
  ```

### Pagination Approach (Recommended)
- **Cursor-based**: More efficient for dynamic lists where items change between requests
- Store `id` as cursor: `?cursor=uuid-of-last-item&limit=20`
- Response includes: `{ data: [...], meta: { cursor: 'next-cursor-id' } }`

### Sorting Implementation
- Default: `priority DESC` (critical first), then `due_date ASC` (soonest first)
- Use Supabase `.order()` chaining:
  ```typescript
  .order('priority', { 
    ascending: false,
    foreignTable: undefined,
    nullsFirst: false
  })
  .order('due_date', { ascending: true, nullsFirst: true })
  ```

### Error Handling Enhancement
- Add error code enum for consistency:
  ```typescript
  enum ErrorCode {
    VALIDATION_ERROR = 'VALIDATION_ERROR',
    NOT_FOUND = 'NOT_FOUND',
    UNAUTHORIZED = 'UNAUTHORIZED',
    CONFLICT = 'CONFLICT',
    INTERNAL_ERROR = 'INTERNAL_ERROR'
  }
  ```
- Helper function for error responses:
  ```typescript
  function errorResponse(message: string, code: ErrorCode, status: number) {
    return NextResponse.json({ error: message, code }, { status });
  }
  ```

### Comments & Activity Implementation
- Include last 10 activities inline with task detail by default
- Use `.limit(10).order('created_at', { ascending: false })`
- Optional `?full_activity=true` to get all 500+

### Testing Against Schema
Key validations to implement:
- `status` must be one of the 5 values (CHECK constraint validates)
- `priority` must be one of 4 values (CHECK constraint validates)
- `dismissed_reason` required if status='dismissed' (CHECK constraint validates)
- `dedupe_key` must be unique (UNIQUE constraint validates)
- `approval_outcome` only valid for approval tasks (validation logic)
- `due_date` should be >= today for new tasks (business logic)

### Response Consistency
- Always include: `id`, `created_at`, `updated_at`
- Include assignee info: `assignee_id` + `assignee_name` (from view)
- Include status: `is_overdue`, `due_category`, `is_blocked`, `blocked_by_count` (from view)
- Comments: array of comment objects with author info
- Activity: limited to last 10 by default

---

## Known Gotchas & Notes

1. **Supabase `.single()` error code**: Returns `PGRST116` when no rows found (not a general 404)
2. **Null handling**: Use `.not('column', 'is', null)` for NOT NULL checks
3. **Array operations**: Use `.in('id', array_of_ids)` and `.contains('depends_on', [id])` for arrays
4. **RLS note**: Currently using service role, so RLS policies don't apply. Phase 4 UI will need authenticated user client.
5. **Type generation**: Database types in types.ts match actual schema (includes action_center tables)

