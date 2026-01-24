# 08-04 Summary: AI Title Transformation

## Completed

Added Claude AI integration to transform alert titles into action-oriented task titles and generate concise task descriptions in the Alert-to-Task n8n workflow.

## What Changed

### Modified
- `business-os/workflows/alert-to-task.json` - Replaced placeholder nodes with full AI transformation pipeline

### Nodes Added

1. **Transform with Claude** - HTTP request to Anthropic API
   - Uses Claude 3 Haiku for fast, cost-effective transformation
   - Prompts for action-oriented title + 2-3 sentence description
   - 30 second timeout, continueOnFail enabled

2. **Parse Claude Response** - Code node
   - Extracts JSON from Claude response
   - Handles markdown code blocks in response
   - Sets `ai_transform_success` flag for routing

3. **AI Transform Successful?** - If node
   - Routes to merge (success) or fallback (failure)

4. **Fallback Transform** - Code node
   - Maps alert types to action verbs (e.g., ssl_expiry -> "Renew")
   - Generates basic action-oriented title
   - Sets `used_fallback: true` flag

5. **Merge Transform Paths** - Merge node
   - Combines AI success and fallback paths

6. **Map Department** - Code node
   - Maps alert types to default departments (Digital, Operations, Programs)
   - Uses config department if set
   - Calculates due date/time based on priority:
     - critical: 4 hours from now
     - high: end of next business day (17:00)
     - normal: 3 days
     - low: 7 days

7. **Create Task** - Postgres node
   - Direct INSERT into action_center.tasks
   - Includes all required fields: title, description, priority, due_date, due_time, department, source, related_entity fields, dedupe_key, status

8. **Create Task Response** - Set node (updated)
   - Returns actual task_id from database
   - Includes task_title, task_priority, occurrence_id
   - Includes ai_transformed boolean flag

## Connections Updated

```
Route by Action (create)
  -> Transform with Claude
  -> Parse Claude Response
  -> AI Transform Successful?
    -> (true) Merge Transform Paths
    -> (false) Fallback Transform -> Merge Transform Paths
  -> Map Department
  -> Create Task
  -> Create Task Response
```

## Must-Have Verification

| Requirement | Status |
|-------------|--------|
| Claude API call transforms alert title to action-oriented format | DONE |
| Fallback transformation exists for when AI fails | DONE |
| Task created via Supabase with all required fields including dedupe_key | DONE |
| Department mapped from config or default mapping | DONE |

## Notes

- Anthropic API credential needs to be configured in n8n as `httpHeaderAuth` with name "Anthropic API"
- The credential should have the x-api-key header set
- Fallback covers 8 alert types with action verbs; defaults to "Address:" for unknown types
- Due date calculation uses simple logic; Phase 08-06 will add proper business hours calculation
