# Done Testing

Wrap up a workflow testing session with structured reflection and brain learning.

## Usage

```
/done-testing verified              # Workflow works — mark verified
/done-testing broken "reason"       # Workflow broken — mark broken with notes
/done-testing needs_review "reason" # Needs human review
```

---

<instructions>

When the user runs `/done-testing`:

## Step 1: Parse Arguments

- First arg: `status` — one of `verified`, `broken`, `needs_review` (required)
- Remaining args: `notes` (optional free text)

If no args provided, ask:
```
What's the result?
- `verified` — workflow works correctly
- `broken` — workflow has issues I couldn't fix
- `needs_review` — needs human attention
```

## Step 2: Identify Current Workflow

Check conversation context for the workflow being tested. Look for:
- `CURRENT_WORKFLOW_ID` / `CURRENT_WORKFLOW_NAME` from `/workflow-queue claim`
- Or the workflow ID from the most recent `/test-workflow` invocation

If no workflow found in context, ask the user for the workflow ID.

## Step 3: Mark Workflow Status in Supabase

```bash
curl -s -X PATCH "https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -H "Prefer: return=representation" \
  -d '{
    "test_status": "${STATUS}",
    "tested_at": "${ISO_TIMESTAMP}",
    "tested_by": "claude",
    "test_notes": "${NOTES}"
  }'
```

## Step 4: Add Tags to Workflow in n8n (VERIFIED ONLY)

**Only when status is `verified`**, add the `business-os` and `verified` tags to the workflow.

**Tag IDs (pre-existing in n8n):**
- `business-os`: `1zxF5MuBKtthenZd`
- `verified`: `dcZyi1iNPBxPiNM6`

**KNOWN LIMITATION:** The n8n MCP addTag operation does not work (reports success but tags are not applied).

**Workaround - Output manual tag instructions:**

```markdown
### Manual Tag Required

Tags cannot be added via API. Please add these tags manually:

**Workflow:** [${WORKFLOW_NAME}](https://n8n.realtyamp.ai/workflow/${WORKFLOW_ID})

**Tags to add:**
- `business-os`
- `verified`

*Click the workflow link above, then click "Tags" in the top bar to add them.*
```

**Future Enhancement:** Create an n8n workflow with internal API access to add tags via webhook, bypassing MCP limitations.

## Step 5: Release Queue Claim

Release the workflow claim so other sessions can work on it:

```bash
curl -s -X PATCH "https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -d '{"claimed_by": null, "claimed_at": null}'
```

## Step 6: Structured Reflection

Review the testing session and capture learnings. For each error encountered during the session:

### 6a. Check Brain First (Dedup)

Before storing anything, check if the brain already knows about it:

```tool
mcp__n8n-brain__lookup_error_fix({
  error_message: "<error encountered during session>",
  node_type: "<node type if applicable>"
})
```

### 6b. Store NEW Learnings Only

If the brain returned no results (or the fix is different from what's stored):

```tool
mcp__n8n-brain__store_error_fix({
  error_message: "<the error>",
  node_type: "<node type>",
  fix_description: "<what fixed it>",
  fix_example: { "before": "...", "after": "..." }
})
```

If the brain DID have a fix and it worked, report success:

```tool
mcp__n8n-brain__report_fix_result({
  error_fix_id: "<id from lookup>",
  worked: true
})
```

### 6c. Store Patterns

If the session revealed a reusable workflow pattern worth saving:

```tool
mcp__n8n-brain__store_pattern({
  name: "<pattern name>",
  description: "<what it does>",
  workflow_json: {},
  services: ["<services>"],
  node_types: ["<node types>"],
  notes: "<why this is useful>"
})
```

### 6d. Platform Gotchas

Check if any platform-specific gotchas were discovered (e.g., "fetch not available in n8n Code nodes", "Postgres node requires schema prefix for n8n_brain tables"). Store these as error fixes with descriptive messages so future sessions find them.

## Step 7: Record Action

```tool
mcp__n8n-brain__record_action({
  task_description: "Test workflow: ${WORKFLOW_NAME}",
  services_involved: ["<services from workflow>"],
  node_types_involved: ["<node types from workflow>"],
  action_taken: "Tested workflow, marked as ${STATUS}",
  outcome: "${STATUS === 'verified' ? 'success' : STATUS === 'broken' ? 'failure' : 'partial'}",
  outcome_notes: "${NOTES or summary of session}"
})
```

## Step 8: Log Accomplishment

**Only when status is `verified` or `needs_review`** — broken workflows aren't accomplishments.

Determine the impact level:
- `verified` → `"medium"`
- `needs_review` → `"low"`

Build a 1-2 sentence description from conversation context summarizing what the workflow does and what was tested/fixed.

```bash
curl -s -X POST "https://mnkuffgxemfyitcjnjdc.supabase.co/rest/v1/entries" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: accomplishments" \
  -H "Prefer: return=representation" \
  -d '[{
    "title": "Verified workflow: ${WORKFLOW_NAME}",
    "description": "${DESCRIPTION}",
    "impact_category": "efficiency",
    "impact_level": "${IMPACT_LEVEL}",
    "work_date": "${TODAY_DATE}",
    "detection_source": "session_activity",
    "session_metadata": {
      "workflow_id": "${WORKFLOW_ID}",
      "workflow_name": "${WORKFLOW_NAME}",
      "test_status": "${STATUS}",
      "workflow_url": "https://n8n.realtyamp.ai/workflow/${WORKFLOW_ID}"
    }
  }]'
```

## Step 9: Show Summary & Next

Output:

```
## Testing Complete: ${WORKFLOW_NAME}

**Status:** ${STATUS}
**Notes:** ${NOTES}

### Tags (Manual Required)
Add via n8n UI: [Open Workflow](https://n8n.realtyamp.ai/workflow/${WORKFLOW_ID})
- [ ] business-os
- [ ] verified

### Brain Updates
- ${N} error fixes stored (${M} were new)
- ${P} patterns saved
- ${Q} fix results reported

### Accomplishment
- Logged: "Verified workflow: ${WORKFLOW_NAME}" [efficiency/${IMPACT_LEVEL}]

### Queue Status
```

Then show the queue count and provide the command to claim next:

```
**Next:** Run `/workflow-queue claim` to start the next workflow.
```

Reset the terminal tab:

```bash
echo -ne "\033]0;Claude Code\007"
```

</instructions>

## Environment Variables

The skill uses these Supabase credentials (from dashboard/.env.local):
- `SUPABASE_SERVICE_KEY`: Service role key for API access

## Tag Reference

| Tag Name | Tag ID | Purpose |
|----------|--------|---------|
| business-os | 1zxF5MuBKtthenZd | Marks workflow as part of Business OS |
| verified | dcZyi1iNPBxPiNM6 | Marks workflow as tested and verified |
