# Phase 9: Workflow Templates & Rules - Research

**Researched:** 2026-01-25
**Status:** Complete

## What's Already Built

### Database Schema (100% Complete)

**workflow_templates table:**
- `id`, `name`, `description`
- `trigger_event` - event type like `program_instance.created`
- `trigger_conditions` - JSONB array of condition objects
- `task_templates` - JSONB array of task definitions with relative timing
- `variable_mapping` - JSONB mapping local names to payload paths
- `target_date_field` - payload field for workflow due date reference
- `target_date_offset_days` - offset from reference date
- `department` - department assignment
- `is_active` - enable/disable flag
- Indexes on `trigger_event`, `is_active`

**task_rules table:**
- `id`, `name`, `description`
- `rule_type` - 'recurring', 'event', 'condition'
- `schedule` - cron expression for recurring rules
- `trigger_event` - for event-triggered rules
- `trigger_conditions` - JSONB conditions array
- `condition_query` - SQL query for condition-based rules
- `task_template` - JSONB task definition
- `dedupe_key_template` - template for generating dedupe keys
- `is_active` - enable/disable flag
- Indexes on `rule_type`, `trigger_event`, `is_active`

**tasks table supports:**
- `dedupe_key` - UNIQUE constraint for deduplication
- `source` - supports 'rule', 'workflow', 'alert', 'manual', 'ai'
- `source_id` - reference to originating rule/template
- `entity_type`, `entity_id` - related entity tracking
- `workflow_id` - workflow association
- `depends_on` - UUID array for dependencies

### Task/Workflow APIs (Complete)

**Task creation API (`/api/action-center/tasks`):**
- POST accepts all fields including dedupe_key, source, depends_on
- Validation via Zod schemas
- Activity logging on creation

**Workflow creation API (`/api/action-center/workflows`):**
- POST creates workflow with tasks
- Status computed from task statuses
- Add task to workflow endpoint exists

**Existing functions in `website/lib/action-center/`:**
- `createTask()` - full task creation with validation
- `createWorkflow()` - workflow creation
- `addTaskToWorkflow()` - associate task with workflow

### Existing Patterns

**Alert-to-Task (Phase 8):**
- Webhook receives alert → transforms → creates task
- Deduplication via `check_alert_dedupe()` function
- Priority escalation pattern
- Business hours due date calculation

**Event handling pattern:**
```typescript
// Webhook structure from alerts
{
  event_type: string,
  entity_id: string,
  payload: Record<string, any>,
  timestamp: string
}
```

## What Needs to Be Built

### 1. Event Webhook Endpoint

**Location:** `/api/action-center/events/route.ts`

**Function:**
1. Receive event with `{event_type, entity_id, payload, force?}`
2. Query `workflow_templates` where `trigger_event = event_type` AND `is_active = true`
3. Query `task_rules` where `trigger_event = event_type` AND `rule_type = 'event'` AND `is_active = true`
4. For each match: evaluate conditions → create task/workflow if conditions pass

### 2. Condition Evaluation Logic

**Input:** conditions array + payload
**Output:** boolean (all conditions must pass)

```typescript
interface Condition {
  field: string;      // "payload.program_type"
  operator: string;   // "equals" | "not_equals" | "in" | "not_in" | "exists" | "not_exists"
  value?: any;        // comparison value
}

function evaluateConditions(conditions: Condition[], payload: any): boolean
```

### 3. Variable Substitution

**Template syntax:** `${variable_name}`

**Process:**
1. Read `variable_mapping` from template
2. For each variable, extract value from payload using path
3. Replace `${var}` in title, description, and other string fields

```typescript
function substituteVariables(
  text: string,
  mapping: Record<string, string>,
  payload: any
): string
```

### 4. Due Date Calculation

**For workflows:**
- Parse `payload[target_date_field]`
- Add `target_date_offset_days` calendar days

**For tasks within workflow:**
- Start from workflow target_completion_date
- Add `days_before_due` (negative = before, positive = after)

### 5. Task Rules Execution

**Recurring rules (RULE-01, RULE-04):**
- n8n workflow runs on schedule (e.g., daily 7am)
- Queries `task_rules` where `rule_type = 'recurring'` and schedule matches
- Creates tasks with dedupe_key including date component

**Condition-based rules (RULE-03, RULE-05):**
- n8n workflow runs daily
- For each active condition rule, execute `condition_query`
- Each result row triggers task creation with row data as payload

### 6. Deduplication

**Dedupe key templates:**
- `{rule_id}:{date}` - for daily recurring
- `{rule_id}:{entity_id}` - for event-triggered
- `{template_id}:{entity_id}:{task_order}` - for workflow tasks

**Check before create:**
```sql
SELECT id FROM action_center.tasks WHERE dedupe_key = $1
```

### 7. n8n Workflows Needed

**Recurring Rules Executor:**
- Schedule: configurable (default daily 7am CT)
- Query active recurring rules where schedule matches
- Execute each rule's task creation

**Condition Rules Executor:**
- Schedule: daily
- Query active condition rules
- For each: run condition_query, create tasks for results

## API Endpoints Needed

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/action-center/events` | POST | Receive events, trigger matching templates/rules |
| `/api/action-center/task-rules` | GET | List rules with filters |
| `/api/action-center/task-rules` | POST | Create rule |
| `/api/action-center/task-rules/:id` | GET | Get rule detail |
| `/api/action-center/task-rules/:id` | PATCH | Update rule |
| `/api/action-center/task-rules/:id/toggle` | POST | Enable/disable rule |
| `/api/action-center/task-rules/:id/test` | POST | Test rule execution (dry run) |
| `/api/action-center/workflow-templates` | GET | List templates |
| `/api/action-center/workflow-templates` | POST | Create template |
| `/api/action-center/workflow-templates/:id` | GET | Get template detail |
| `/api/action-center/workflow-templates/:id` | PATCH | Update template |
| `/api/action-center/workflow-templates/:id/toggle` | POST | Enable/disable |
| `/api/action-center/workflow-templates/:id/test` | POST | Test with sample payload |

## Key Implementation Notes

1. **Role-based assignment (TMPL-07):** Schema has `department` but not `assignee_role`. For v1, assign to department only. Role-based assignment can be added later.

2. **Dependency mapping (TMPL-06):** Task templates include `depends_on_order` field that maps to other tasks by their order in the template (0-indexed).

3. **Source tracking:** All auto-generated tasks use:
   - `source = 'rule'` for task rules
   - `source = 'workflow'` for workflow templates
   - `source_id` = the rule/template UUID

4. **Error handling:** On variable substitution failure:
   - Log error with template and payload details
   - Skip task creation (don't create partial)
   - Consider creating error notification task

5. **Testing endpoints:** Allow dry-run execution that returns what would be created without actually creating.

## Files to Reference

- `supabase/migrations/20260122_action_center_schema.sql` - Full schema
- `website/lib/action-center/tasks.ts` - Task mutations
- `website/lib/action-center/workflows.ts` - Workflow mutations
- `website/app/api/action-center/tasks/route.ts` - Task API pattern
- `business-os/workflows/alert-to-task.json` - Event→task n8n pattern

---

*Research complete: 2026-01-25*
