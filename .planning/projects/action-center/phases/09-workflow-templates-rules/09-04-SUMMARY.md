# Summary 09-04: Workflow Template Instantiation

## What Was Built

Created workflow template instantiation logic that converts templates into actual workflows and tasks.

## Files Created

| File | Purpose |
|------|---------|
| `dashboard/src/lib/action-center/workflow-template-instantiation.ts` | Core instantiation logic |

## Key Functions

### instantiateWorkflowTemplate()

Main function that creates a workflow and all its tasks from a template:

```typescript
export async function instantiateWorkflowTemplate(
  supabase: SupabaseClient,
  template: WorkflowTemplate,
  entityId: string,
  payload: Record<string, unknown>,
  force: boolean = false
): Promise<InstantiationResult>
```

**Features:**
- Creates workflow with substituted name/description
- Creates all tasks from task templates
- Calculates due dates relative to workflow target date
- Maps dependencies from template order to actual task IDs
- Generates dedupe keys for each task
- Supports force flag to bypass deduplication

### dryRunWorkflowTemplate()

Preview what would be created without making database changes:

```typescript
export async function dryRunWorkflowTemplate(
  template: WorkflowTemplate,
  payload: Record<string, unknown>
): Promise<DryRunResult>
```

**Returns:**
- `would_create_workflow` - Workflow details that would be created
- `would_create_tasks` - Array of task details
- `validation_errors` - Any issues found (unresolved variables, invalid dates)

## Implementation Details

### Deduplication Strategy

1. **Workflow level**: Checks for existing workflow with same `source_id` (template ID) and `entity_id`
2. **Task level**: Uses dedupe key format `wt:{templateId}:{entityId}:{taskOrder}`
3. **Force flag**: Bypasses all deduplication checks when `true`

### Dependency Mapping

Tasks are processed in order to ensure dependencies are created first:

```typescript
const sortedTemplates = [...template.task_templates].sort((a, b) => a.order - b.order);
const orderToTaskId: Map<number, string> = new Map();

// After creating each task:
orderToTaskId.set(taskTemplate.order, task.id);

// When mapping dependencies:
dependsOn = taskTemplate.depends_on_order
  .map(order => orderToTaskId.get(order))
  .filter((id): id is string => id !== undefined);
```

### Entity Type Extraction

Entity type derived from event type:
```typescript
function getEntityTypeFromEvent(eventType: string): string {
  return eventType.split('.')[0];
}
// "program_instance.created" -> "program_instance"
```

## Verification

```bash
# TypeScript compiles
cd dashboard && npx tsc --noEmit src/lib/action-center/workflow-template-instantiation.ts

# Exports verified
grep -E "^export (async function|interface)" dashboard/src/lib/action-center/workflow-template-instantiation.ts
# Output:
# export async function instantiateWorkflowTemplate(
# export interface DryRunResult {
# export async function dryRunWorkflowTemplate(
```

## Must Haves Satisfied

- [x] instantiateWorkflowTemplate() creates workflow and all tasks from template
- [x] Variable substitution applies to workflow name, description, task titles, and task descriptions
- [x] Task due dates calculated relative to workflow target_completion_date
- [x] Dependencies mapped from template order to actual task IDs
- [x] Deduplication checks prevent duplicate workflows/tasks unless force=true

## Commit

```
feat(09-04): add workflow template instantiation logic
```
