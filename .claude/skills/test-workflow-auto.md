---
name: test-workflow-auto
description: Fully autonomous n8n workflow testing with self-repair. Diagnoses errors, fixes them, tests all branches, verifies output, ensures error handling, and learns from every fix. Only presents to user after workflow is working.
---

# Autonomous Workflow Testing Agent

This agent FIXES workflows, not just reports on them. It diagnoses errors, applies fixes, tests all branches, verifies output, and only asks for human verification after the workflow is actually working.

## Usage

```
/test-workflow-auto <workflow_id>    # Test and fix a specific workflow
/test-workflow-auto next             # Get next untested workflow from queue
/test-workflow-auto confirm          # Confirm previous workflow is verified
/test-workflow-auto broken           # Mark previous as broken (agent couldn't fix)
/test-workflow-auto skip             # Skip to next workflow
```

---

<instructions>

## PHILOSOPHY

**This agent FIXES things. It does not just report problems.**

- If there's a database connection error → diagnose and fix the credential
- If there's a missing property → update the expression
- If there's missing error handling → add the canary pattern
- If a branch hasn't been tested → generate test data that exercises it

Only escalate to the human AFTER you've tried everything AND the workflow is either:
1. Working (ready for human verification)
2. Truly unfixable (credential secrets needed, external service down, etc.)

---

## CONFIGURATION

```
MAX_FIX_ATTEMPTS = 5
BRANCH_TEST_REQUIRED = true
ERROR_HANDLING_REQUIRED = true
OUTPUT_VERIFICATION_REQUIRED = true
```

## CONTEXT EFFICIENCY

To prevent context exhaustion during multi-iteration fixes:

**Iteration 1-2:** Use standard modes (structure, error)
**Iteration 3+:** If still failing, use minimal modes:
- Skip re-fetching workflow structure (already known)
- Use `errorItemsLimit: 2` instead of 5
- Focus only on the specific failing node

**If approaching iteration 5:**
Before attempting final fix, summarize what's been tried and escalate with clear diagnosis rather than continuing to consume context.

## TOOLS AVAILABLE

You have full access to:
- `mcp__n8n-mcp__*` - All n8n operations (get/update workflows, test, executions)
- `mcp__n8n-brain__*` - Learning layer (patterns, error fixes, credentials)
- `Bash` with Supabase CLI - Database operations, credential verification
- `Read/Write/Edit` - File operations for specs and reports

---

## PHASE 1: LOAD AND ANALYZE WORKFLOW

### 1.1 Fetch Workflow

```tool
mcp__n8n-mcp__n8n_get_workflow({
  id: "<workflow_id>",
  mode: "structure"
})
```

**Note:** Using `mode: "structure"` saves ~35KB vs `mode: "details"`. We only need nodes, connections, and trigger type for initial analysis. Full parameter details are fetched only when actively fixing a specific node.

Extract and store:
- `workflow_id`, `workflow_name`
- `active` status
- All nodes (name, type, position)
- All connections (flow map)
- Trigger type (webhook, schedule, manual)
- Credentials used

### 1.2 Map the Workflow Structure

Build a mental model:

```
TRIGGER → Node1 → Node2 → IF Node
                            ├─ TRUE → Node3 → Final1
                            └─ FALSE → Node4 → Final2
```

Identify:
- **Trigger nodes**: How is this workflow invoked?
- **Decision nodes**: IF, Switch, Filter (these create branches)
- **Terminal nodes**: Nodes with no outgoing connections (these produce output)
- **Database nodes**: Postgres, Supabase (may have credential issues)
- **HTTP nodes**: External API calls (may have auth issues)

### 1.3 Check for Error Handling Pattern

Look for these nodes:
- `n8n-nodes-base.errorTrigger` - Required for error catching
- A Postgres node logging to `n8n_brain.workflow_runs` or `web_intel.collection_log`
- A Slack/HTTP node sending error alerts

**If ANY of these are missing, flag for PHASE 6 (Add Error Handling).**

---

## PHASE 2: CHECK EXECUTION HISTORY

### 2.1 Get Recent Executions

```tool
mcp__n8n-mcp__n8n_executions({
  action: "list",
  workflowId: "<workflow_id>",
  limit: 3,
  status: "error"
})
```

**Note:** Limiting to 3 failed executions saves ~7KB. We only need recent failures for diagnosis.

Categorize:
- How many succeeded?
- How many failed?
- What's the most recent status?

### 2.2 If Failures Exist, Get Error Details

```tool
mcp__n8n-mcp__n8n_executions({
  action: "get",
  id: "<most_recent_failed_execution_id>",
  mode: "error",
  includeExecutionPath: true,
  errorItemsLimit: 5
})
```

Extract:
- `primaryError.message` - The actual error
- `primaryError.nodeName` - Which node failed
- `primaryError.nodeType` - What type of node
- `upstreamContext` - Data that was flowing into the failed node
- `executionPath` - Which nodes ran before failure

---

## PHASE 3: DIAGNOSE AND FIX ERRORS

**This is where we actually FIX things, not just report them.**

### 3.1 Check n8n-brain for Known Fix

```tool
mcp__n8n-brain__lookup_error_fix({
  error_message: "<error_message>",
  node_type: "<node_type>"
})
```

If a known fix exists with high success rate → Apply it immediately (skip to 3.3)

### 3.1.5 Get Failing Node Details (Only When Needed)

If you need the full configuration of the failing node:

```tool
mcp__n8n-mcp__n8n_get_workflow({
  id: "<workflow_id>",
  mode: "full"
})
```

Then extract ONLY the failing node's parameters. Do NOT store the full workflow JSON - immediately discard after extracting the needed node config.

For simpler property access fixes, you often don't need this - the error context from `mode: "error"` includes enough upstream data.

### 3.2 Pattern-Match and Diagnose

#### CONNECTION ERRORS (ECONNREFUSED, ETIMEDOUT, ENOTFOUND)

**DO NOT ESCALATE. FIX IT.**

1. **Identify the credential being used:**
   - Check the failing node's `credentials` property
   - Note the credential ID and type

2. **Diagnose the connection issue:**
   ```bash
   # Test if Supabase is reachable from your machine
   cd "/Users/mike/IAML Business OS" && source .env.local && \
   psql "${DATABASE_URL}" -c "SELECT 1 as connected;" 2>&1
   ```

3. **Check what credential n8n should be using:**
   ```tool
   mcp__n8n-brain__get_credential({
     service_name: "supabase"
   })
   ```

4. **Common fixes:**
   - Wrong host (using direct IP instead of pooler)
   - Wrong port (5432 vs 6543 for pooler)
   - SSL mode issues
   - Connection string format

5. **If credential needs updating in n8n:**
   - Note: Cannot update credential SECRETS via API (security)
   - But CAN identify exactly what's wrong
   - Provide specific fix instructions for the credential

6. **Store the diagnosis:**
   ```tool
   mcp__n8n-brain__store_error_fix({
     error_message: "connect ECONNREFUSED",
     node_type: "n8n-nodes-base.postgres",
     fix_description: "Supabase connection refused - credential using wrong host. Should use pooler connection (port 6543) or direct connection (port 5432) with correct IP.",
     fix_example: {
       "issue": "IP address in credential is outdated or incorrect",
       "solution": "Update Postgres credential to use Supabase connection pooler: db.xxx.supabase.co:6543"
     }
   })
   ```

#### PROPERTY ACCESS ERRORS (Cannot read property X of undefined)

**FIX IT:**

1. Extract the property name from error
2. Check `upstreamContext.sampleItems` for actual data structure
3. Find the correct path
4. Update the node:

```tool
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: "<workflow_id>",
  operations: [{
    type: "updateNode",
    nodeName: "<failing_node>",
    updates: {
      "parameters.value": "={{ $json?.correct?.path ?? 'default' }}"
    }
  }]
})
```

#### EMPTY INPUT ERRORS (No items, empty array)

**FIX IT:**

Option A - Enable "Always Output Data":
```tool
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: "<workflow_id>",
  operations: [{
    type: "updateNode",
    nodeName: "<failing_node>",
    updates: {
      "alwaysOutputData": true
    }
  }]
})
```

Option B - Add IF node to check for empty:
```tool
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: "<workflow_id>",
  operations: [
    {
      type: "addNode",
      node: {
        name: "Check Has Data",
        type: "n8n-nodes-base.if",
        typeVersion: 2,
        position: [<calculated_position>],
        parameters: {
          conditions: {
            options: { caseSensitive: true, leftValue: "", typeValidation: "strict" },
            conditions: [{
              id: "has-data",
              leftValue: "={{ $input.all().length > 0 }}",
              rightValue: true,
              operator: { type: "boolean", operation: "equals" }
            }]
          }
        }
      }
    },
    // Rewire connections
  ]
})
```

#### JSON/EXPRESSION ERRORS

**FIX IT:**

1. Identify the malformed expression
2. Fix syntax (missing quotes, unescaped chars, template literal issues)
3. Update via partial workflow update

#### AUTHENTICATION ERRORS (401, 403, Invalid Key)

**CANNOT FIX VIA API - but diagnose fully:**

1. Identify which credential is failing
2. Check if credential exists in n8n-brain registry
3. Document exactly what needs to be updated
4. This is one of the few cases where human intervention is truly needed

### 3.3 Apply the Fix

Use `mcp__n8n-mcp__n8n_update_partial_workflow` to apply fixes.

After applying:
```tool
mcp__n8n-brain__store_error_fix({
  error_message: "<original_error>",
  node_type: "<node_type>",
  fix_description: "<what we fixed>",
  fix_example: { "before": "...", "after": "..." }
})
```

### 3.4 Verify Fix Worked

Re-test the workflow (see PHASE 4).

If same error occurs again:
- Increment attempt counter
- If attempts >= MAX_FIX_ATTEMPTS → Flag for human review
- If different error → diagnose the new error

---

## PHASE 4: TEST ALL BRANCHES

**A workflow isn't verified until ALL branches are tested.**

### 4.1 Identify All Branches

For each decision node (IF, Switch, Filter):
- Determine what conditions trigger each branch
- Generate test data that exercises each path

### 4.2 Generate Branch-Specific Test Payloads

Example for an IF node checking severity:
```javascript
// Test payload for TRUE branch (critical error)
const criticalTest = {
  workflow_id: "test-critical",
  workflow_name: "Test Workflow",
  error_message: "authentication failed - invalid credentials",
  error_type: "auth_error"
};

// Test payload for FALSE branch (warning)
const warningTest = {
  workflow_id: "test-warning",
  workflow_name: "Test Workflow",
  error_message: "timeout after 30 seconds",
  error_type: "timeout_error"
};
```

### 4.3 Execute Tests for Each Branch

For webhook-triggered workflows:
```tool
mcp__n8n-mcp__n8n_test_workflow({
  workflowId: "<workflow_id>",
  data: <test_payload>,
  timeout: 60000,
  waitForResponse: true
})
```

### 4.4 Track Branch Coverage

After each test, get execution details. Use `mode: "error"` for failed executions (80% smaller):

```tool
// For FAILED executions - optimized for debugging
mcp__n8n-mcp__n8n_executions({
  action: "get",
  id: "<execution_id>",
  mode: "error",
  errorItemsLimit: 3
})

// For SUCCESSFUL executions - minimal check
mcp__n8n-mcp__n8n_executions({
  action: "get",
  id: "<execution_id>",
  mode: "preview"
})
```

Build coverage map:
```
| Node | Branch | Tested | Items |
|------|--------|--------|-------|
| Is Critical? | TRUE | YES | 1 |
| Is Critical? | FALSE | YES | 1 |
| Alert Critical | - | YES | 1 |
| Alert Warning | - | YES | 1 |

Coverage: 100% (all branches executed)
```

### 4.5 Iterate Until Full Coverage

If any branch hasn't been tested:
1. Analyze what input would trigger that branch
2. Generate appropriate test payload
3. Execute and verify

---

## PHASE 5: VERIFY OUTPUT

**A workflow that runs without errors can still produce wrong output.**

### 5.1 Identify Terminal Nodes

Terminal nodes = nodes with no outgoing connections. These produce the workflow's "output."

### 5.2 Get Output from Each Terminal Node

```tool
mcp__n8n-mcp__n8n_executions({
  action: "get",
  id: "<execution_id>",
  mode: "filtered",
  nodeNames: ["<terminal_node_1>", "<terminal_node_2>"],
  itemsLimit: 5
})
```

### 5.3 Verify Output Against Expected Behavior

Based on workflow name and structure, verify:

| Workflow Type | Expected Output |
|---------------|-----------------|
| Error Handler | Error logged to DB, Slack notification sent |
| Data Sync | Records inserted/updated in destination |
| Alert/Notification | HTTP 200 from Slack/email service |
| Report Generator | Report data structure complete |

Check:
- [ ] Output is not empty
- [ ] Expected fields are present
- [ ] Data types are correct
- [ ] Values are reasonable (not null where shouldn't be)
- [ ] External calls returned success (200, "ok", etc.)

### 5.4 Flag Output Issues

If output doesn't match expectations:
- Document what's wrong
- Attempt to fix if it's a data transformation issue
- Flag for human review if unclear

---

## PHASE 6: ENSURE ERROR HANDLING

**Every workflow MUST have the standard error handling pattern.**

### 6.1 Check for Error Handling Nodes

Required pattern:
1. `n8n-nodes-base.errorTrigger` - Catches any error in workflow
2. Code node - Parses error details
3. Postgres node - Logs to database
4. HTTP node - Sends Slack alert

### 6.2 If Missing, Add Error Handling

Get the standard error handling pattern:
```tool
mcp__n8n-brain__find_similar_patterns({
  description: "error handling canary pattern",
  tags: ["error-handling"]
})
```

Or construct it manually:

```tool
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: "<workflow_id>",
  operations: [
    {
      type: "addNode",
      node: {
        id: "error-trigger",
        name: "Error Trigger",
        type: "n8n-nodes-base.errorTrigger",
        typeVersion: 1,
        position: [0, 400],
        parameters: {}
      }
    },
    {
      type: "addNode",
      node: {
        id: "parse-error",
        name: "Parse Error",
        type: "n8n-nodes-base.code",
        typeVersion: 2,
        position: [220, 400],
        parameters: {
          jsCode: "const error = $input.first().json;\nconst execution = $execution;\n\nreturn [{\n  json: {\n    workflow_id: $workflow.id,\n    workflow_name: $workflow.name,\n    execution_id: execution.id,\n    error_message: error.message || 'Unknown error',\n    error_node: error.node?.name || 'Unknown',\n    timestamp: new Date().toISOString()\n  }\n}];"
        }
      }
    },
    {
      type: "addNode",
      node: {
        id: "log-error-db",
        name: "Log Error to DB",
        type: "n8n-nodes-base.postgres",
        typeVersion: 2.5,
        position: [440, 400],
        parameters: {
          operation: "insert",
          schema: "n8n_brain",
          table: "workflow_runs",
          columns: {
            mappingMode: "defineBelow",
            value: {
              "workflow_id": "={{ $json.workflow_id }}",
              "workflow_name": "={{ $json.workflow_name }}",
              "execution_id": "={{ $json.execution_id }}",
              "status": "error",
              "error_message": "={{ $json.error_message }}",
              "completed_at": "={{ $json.timestamp }}"
            }
          }
        },
        credentials: {
          postgres: {
            id: "<supabase_credential_id>",
            name: "Supabase Postgres"
          }
        }
      }
    },
    {
      type: "addNode",
      node: {
        id: "alert-slack",
        name: "Alert Slack",
        type: "n8n-nodes-base.httpRequest",
        typeVersion: 4.2,
        position: [660, 400],
        parameters: {
          method: "POST",
          url: "https://hooks.slack.com/services/YOUR_WEBHOOK",
          sendBody: true,
          specifyBody: "json",
          jsonBody: "={\"text\": \":rotating_light: *Workflow Error*\\n*Workflow:* {{ $json.workflow_name }}\\n*Error:* {{ $json.error_message }}\\n*Node:* {{ $json.error_node }}\"}"
        }
      }
    },
    {
      type: "addConnection",
      from: "Error Trigger",
      to: "Parse Error"
    },
    {
      type: "addConnection",
      from: "Parse Error",
      to: "Log Error to DB"
    },
    {
      type: "addConnection",
      from: "Log Error to DB",
      to: "Alert Slack"
    }
  ]
})
```

### 6.3 Get Credential ID for Error Handling

```tool
mcp__n8n-brain__get_credential({
  service_name: "supabase"
})
```

Use the returned credential ID in the Postgres node.

---

## PHASE 7: LEARN FROM FIXES

**Every fix gets stored in n8n-brain.**

### 7.1 Store New Error Fixes

For each error that was fixed:
```tool
mcp__n8n-brain__store_error_fix({
  error_message: "<original_error>",
  error_code: "<error_code_if_any>",
  node_type: "<node_type>",
  operation: "<operation_if_relevant>",
  fix_description: "<what fixed it>",
  fix_example: {
    "before": "<original_config>",
    "after": "<fixed_config>"
  }
})
```

### 7.2 Report Fix Success

If we used an existing fix from n8n-brain:
```tool
mcp__n8n-brain__report_fix_result({
  error_fix_id: "<fix_id>",
  worked: true  // or false
})
```

### 7.3 Record the Action

```tool
mcp__n8n-brain__record_action({
  task_description: "Test and fix workflow: <workflow_name>",
  services_involved: ["<services>"],
  node_types_involved: ["<node_types>"],
  confidence_score: 85,
  recommendation: "autonomous",
  action_taken: "Fixed <N> errors, tested <N> branches, verified output",
  outcome: "success",
  outcome_notes: "<summary>"
})
```

---

## PHASE 8: UPDATE REGISTRY

### 8.1 Mark as Tested (Pending Human Verification)

```bash
cd "/Users/mike/IAML Business OS" && npx supabase db execute --db-url "$DATABASE_URL" \
  "SELECT n8n_brain.mark_workflow_tested(
    '${WORKFLOW_ID}',
    'tested',
    'test-workflow-auto',
    'Automated testing complete: ${SUMMARY}'
  );"
```

Note: Use `tested` not `verified` - human still needs to confirm.

### 8.2 Add Verified Tag in n8n (if all checks pass)

This requires manual action or a separate workflow. Note for human.

---

## PHASE 9: PRESENT TO HUMAN

**Only after ALL of the above is complete:**

```markdown
## Workflow Ready for Verification: <workflow_name>

**ID:** <workflow_id>
**URL:** https://n8n.realtyamp.ai/workflow/<workflow_id>

### Automated Testing Summary

| Check | Status | Details |
|-------|--------|---------|
| Execution | PASS | No errors |
| Branch Coverage | PASS | 2/2 branches tested (100%) |
| Output Verification | PASS | All terminal nodes produced expected output |
| Error Handling | PASS | Canary pattern present |

### Actions Taken

1. **Fixed:** ECONNREFUSED error - identified credential using wrong host
2. **Tested:** Critical error branch (severity=critical → Slack alert)
3. **Tested:** Warning branch (severity=warning → Slack alert)
4. **Verified:** Database insert succeeded
5. **Verified:** Slack webhook returned 200 OK

### Branch Coverage

| Branch | Test Payload | Result |
|--------|--------------|--------|
| Critical Error | `{error_message: "authentication failed"}` | Alert sent |
| Warning Error | `{error_message: "timeout"}` | Alert sent |

### Output Verification

**Terminal Node: Alert Critical Error**
- Input: `{text: ":rotating_light: *CRITICAL Web Intel Error*..."}`
- Response: `200 OK`
- Expected: Slack notification sent

**Terminal Node: Alert Warning**
- Input: `{text: ":warning: *Web Intel Error*..."}`
- Response: `200 OK`
- Expected: Slack notification sent

### Fixes Stored in n8n-brain

- Error: `ECONNREFUSED` → Fix: "Update Postgres credential host"

---

## YOUR TURN: Manual Verification

Please verify:
1. Open: https://n8n.realtyamp.ai/workflow/<workflow_id>
2. Check the Executions tab - confirm recent runs look correct
3. Verify the Slack channel received test alerts
4. Test manually if desired

**When done, reply:**
- `confirm` → Mark as **verified**
- `broken` → Mark as **broken** (describe what's wrong)
- `skip` → Move to next workflow
```

---

## PHASE 10: HANDLE USER RESPONSE

### On "confirm":

```bash
cd "/Users/mike/IAML Business OS" && npx supabase db execute --db-url "$DATABASE_URL" \
  "SELECT n8n_brain.mark_workflow_tested(
    '${WORKFLOW_ID}',
    'verified',
    'mike',
    'Human verified after automated testing'
  );"
```

Add verified tag in n8n:
```tool
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: "<workflow_id>",
  operations: [{
    type: "addTag",
    tagName: "verified"
  }]
})
```

Respond: "✓ **<workflow_name>** marked as verified. Ready for next?"

### On "broken":

```bash
cd "/Users/mike/IAML Business OS" && npx supabase db execute --db-url "$DATABASE_URL" \
  "SELECT n8n_brain.mark_workflow_tested(
    '${WORKFLOW_ID}',
    'broken',
    'mike',
    'Human marked as broken: ${USER_NOTES}'
  );"
```

Respond: "✗ **<workflow_name>** marked as broken. Notes saved. What's the issue?"

### On "skip" or "next":

Move to next untested workflow:
```bash
cd "/Users/mike/IAML Business OS" && npx supabase db execute --db-url "$DATABASE_URL" \
  "SELECT workflow_id, workflow_name FROM n8n_brain.workflows_needing_attention
   WHERE test_status != 'verified' LIMIT 1;"
```

---

## TRULY UNFIXABLE SITUATIONS

Only these require human intervention (cannot be fixed via API):

1. **Credential secrets** - API cannot read/write actual passwords/tokens
2. **External service down** - Nothing we can do
3. **Business logic unclear** - Don't know what the workflow SHOULD do
4. **n8n permission issue** - API key doesn't have access

For everything else: **FIX IT.**

---

## STATE TRACKING

Keep in conversation context:
- `current_workflow_id`
- `current_workflow_name`
- `fixes_applied[]`
- `branches_tested[]`
- `outputs_verified[]`
- `error_handling_present: boolean`

---

## EXAMPLE FULL RUN

```
User: /test-workflow-auto 3aUQ6BQkiS5HphxA

Claude:
[PHASE 1] Loading Web Intel - Error Handler...
[PHASE 2] Found 5 failed executions. Most recent error: ECONNREFUSED
[PHASE 3] Diagnosing... Postgres credential using wrong host (3.141.138.47)
         Checking Supabase connection... ✓ Database reachable at db.xxx.supabase.co
         FIX NEEDED: Credential must be updated to use correct host
         (Cannot update credential secrets via API - will note for human)
         Stored error→fix mapping in n8n-brain
[PHASE 4] Testing branches...
         Branch 1 (critical): Sent test payload → Execution failed (same DB error)
         NOTE: Cannot proceed with branch testing until credential is fixed
[PHASE 5] Cannot verify output - workflow failing
[PHASE 6] Error handling pattern: PRESENT ✓
[PHASE 7] Stored 1 error fix in n8n-brain
[PHASE 8] Marked as 'needs_review' - credential fix required

## Workflow Needs Credential Fix: Web Intel - Error Handler

The Postgres credential "Supabase Postgres" (EgmvZHbvINHsh6PR) is configured
with an incorrect host (3.141.138.47).

**To fix:**
1. Open n8n credentials: https://n8n.realtyamp.ai/credentials
2. Edit "Supabase Postgres"
3. Update host to: db.xxxx.supabase.co (check your Supabase dashboard)
4. Test connection
5. Save

Once fixed, reply "fixed" and I'll re-run full testing.
```

</instructions>
