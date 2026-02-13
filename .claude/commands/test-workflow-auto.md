---
name: test-workflow-auto
description: Autonomous n8n workflow testing with self-repair. Tests, diagnoses, fixes, and verifies workflows.
allowed-tools: [Read, Write, Bash, Grep, Glob, mcp__n8n-mcp__*, mcp__n8n-brain__*]
---

# Autonomous Workflow Testing

Test, diagnose, fix, and verify n8n workflows. Only returns after actual execution.

## Usage
```
/test-workflow-auto <workflow_id>   # Test specific workflow
/test-workflow-auto next            # Get next from queue
/test-workflow-auto confirm         # Mark verified
/test-workflow-auto broken          # Mark broken
```

---

<instructions>

## ⚠️ MANDATORY: ACTUALLY CALL MCP TOOLS ⚠️

You MUST invoke MCP tools, not describe them. Every response requires:
- Actual execution ID from n8n
- Actual execution status (success/error)
- Actual node data or error messages

**If MCP tools fail:** Tell user immediately: "Cannot access n8n MCP tools. Check if n8n-mcp server is running."

---

## EXECUTION FLOW

### Step 1: Health Check
Call these tools NOW and show results:

1. `mcp__n8n-mcp__n8n_list_workflows` with `limit: 1`
   - If fails: STOP. Tell user to check MCP server.

2. `mcp__n8n-brain__get_preferences`
   - If fails: Continue without brain (note: `brain_available = false`)

### Step 2: Load Workflow
Call `mcp__n8n-mcp__n8n_get_workflow` with:
- `id`: workflow ID
- `mode`: "structure"

Extract from ACTUAL response:
- workflow_name, active status
- Trigger type (webhook/schedule/manual)
- All nodes and connections
- Decision nodes (IF/Switch) = branches to test

### Step 3: Check History (Optional)
If workflow has recent executions, call `mcp__n8n-mcp__n8n_executions`:
- `action`: "list"
- `workflowId`: the ID
- `limit`: 3

If errors exist, get details with `action: "get"`, `mode: "error"`.

### Step 4: Execute Test ⚠️ CRITICAL
**This is the actual test. You MUST call this tool.**

For webhook-triggered workflows, call `mcp__n8n-mcp__n8n_test_workflow`:
- `workflowId`: the ID
- `data`: appropriate test payload
- `timeout`: 60000
- `waitForResponse`: true

**You MUST receive an actual execution ID. No execution ID = not tested.**

For scheduled workflows: check recent executions instead.

### Step 5: Get Results
Call `mcp__n8n-mcp__n8n_executions`:
- `action`: "get"
- `id`: execution ID from Step 4
- `mode`: "preview" (success) or "error" (failure)

### Step 6: Fix Errors (If Any)
If execution failed:

1. **Check brain first** (if available):
   Call `mcp__n8n-brain__lookup_error_fix` with error_message and node_type.
   If fix found with `times_succeeded > 0`: apply it.

2. **Apply fix:**
   Call `mcp__n8n-mcp__n8n_update_partial_workflow` with appropriate operations.

3. **Re-test:** Go back to Step 4.

4. **Max 5 fix attempts.** After that, escalate to human.

### Step 7: Update Registry
```bash
cd "/Users/mike/IAML Business OS" && source .env.local && \
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -d '{"test_status": "tested", "tested_by": "test-workflow-auto"}'
```

### Step 8: Present Results
**Only after you have actual execution data:**

```
## Workflow Tested: {actual_name}

**ID:** {actual_id}
**URL:** https://n8n.realtyamp.ai/workflow/{actual_id}

### Execution Results
- **Execution ID:** {actual_exec_id}
- **Status:** {actual_status}
- **Nodes Run:** {actual_node_count}

### Fixes Applied
{list actual fixes or "None needed"}

---
**Verify:** Open workflow, check Executions tab for ID {actual_exec_id}

Reply: `confirm` | `broken` | `skip`
```

---

## COMMON ERROR FIXES

| Error Pattern | Fix |
|--------------|-----|
| `Cannot read property X of undefined` | Update expression path using `n8n_update_partial_workflow` |
| `No items to process` | Enable `alwaysOutputData: true` on node |
| `ECONNREFUSED` | Credential issue - check with `n8n-brain__get_credential` |
| `401/403` | Cannot fix via API - escalate to human |
| `Invalid JSON` | Fix expression syntax |

---

## HANDLE USER RESPONSE

**confirm:**
```bash
cd "/Users/mike/IAML Business OS" && source .env.local && \
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -d '{"test_status": "verified", "tested_by": "mike"}'
```
Then add "verified" tag via `n8n_update_partial_workflow`.

**broken:** Update registry with `test_status: "broken"`.

**skip/next:** Fetch next untested workflow from registry.

---

## EXECUTION GATE

Before responding to user, verify:
- [ ] Called `n8n_list_workflows` - got response
- [ ] Called `n8n_get_workflow` - have workflow data
- [ ] Called `n8n_test_workflow` or checked executions - have execution ID
- [ ] Called `n8n_executions` get - have status/results

**Missing any? Do not present results. Call the tools first.**

Signs you did NOT test:
- No execution ID in your response
- Using phrases like "would call" or "should test"
- Placeholder values like `{workflow_id}`

---

## UNFIXABLE (Escalate to Human)

- Credential secrets (API cannot access)
- External service down
- Business logic unclear
- n8n permission issues

Everything else: **fix it.**

</instructions>
