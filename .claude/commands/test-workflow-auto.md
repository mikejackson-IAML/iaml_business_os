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

## CRITICAL: RELIABILITY REQUIREMENTS

**This command MUST execute reliably every single time.** Follow these mandatory patterns:

### MCP Tool Call Protocol

**EVERY MCP tool call MUST follow this pattern:**

1. **Pre-call delay**: Wait 2 seconds before each n8n-mcp tool call
2. **Retry on failure**: If a tool call fails, wait 5 seconds and retry up to 3 times
3. **Post-call delay**: Wait 1 second after each successful call before the next

**Implementation:** Before calling any `mcp__n8n-mcp__*` tool:
```bash
sleep 2
```

**If a tool call returns an error or times out:**
1. Output: `[RETRY 1/3] Tool call failed, waiting 5s...`
2. Wait 5 seconds: `sleep 5`
3. Retry the same call
4. If still failing after 3 retries, output error and continue to next phase

### Rate Limiting Protection

n8n has API rate limits. These delays are MANDATORY:

| Operation | Delay Before | Delay After |
|-----------|--------------|-------------|
| Get workflow | 2s | 1s |
| List executions | 2s | 1s |
| Get execution | 2s | 1s |
| Test workflow | 3s | 5s |
| Update workflow | 3s | 2s |

---

## MID-PHASE HEALTH CHECKS (CRITICAL)

**After EVERY major phase, run a health check to detect connection loss early.**

### Health Check Pattern

Use this lightweight check between phases:

```bash
echo "[HEALTH] Verifying n8n connection..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_list_workflows({
  limit: 1
})
```

**If health check fails:**
1. Output: `[CONNECTION LOST] n8n-mcp stopped responding after Phase X`
2. Wait 10 seconds: `sleep 10`
3. Retry the health check once
4. If still failing:
   - Output current progress summary
   - Mark workflow as `needs_review` with note: "Testing interrupted - connection lost after Phase X"
   - **STOP** and inform user: `[FATAL] Lost connection to n8n. Progress saved. Run /test-workflow-auto <id> to resume.`

### When to Run Health Checks

| After Phase | Health Check Required |
|-------------|----------------------|
| Phase 1 (Load) | YES |
| Phase 2 (History) | YES |
| Phase 3 (Diagnose/Fix) | YES - especially important |
| Phase 4 (Test Branches) | YES - after EACH branch test |
| Phase 5 (Verify Output) | YES |
| Phase 6 (Error Handling) | YES |
| Phase 7+ | NO - these are just registry updates |

---

## PHASE 0: HEALTH CHECK (MANDATORY - DO NOT SKIP)

**Before ANY workflow testing, verify all systems are operational.**

### 0.1 Verify n8n-mcp Server

Test the connection with a simple call:

```bash
echo "[HEALTH CHECK] Testing n8n-mcp connection..."
sleep 2
```

Then call:
```tool
mcp__n8n-mcp__n8n_list_workflows({
  limit: 1
})
```

**If this fails:**
1. Output: `[ERROR] n8n-mcp server not responding`
2. Wait 10 seconds and retry once
3. If still failing: `[FATAL] Cannot connect to n8n. Please check MCP server status.`
4. **STOP - do not proceed**

**If successful:** Output `[OK] n8n-mcp connected`

### 0.2 Verify n8n-brain Server

```bash
sleep 2
```

```tool
mcp__n8n-brain__get_preferences()
```

**If this fails:**
1. Output: `[WARN] n8n-brain not responding - will continue without learning features`
2. Set flag: `brain_available = false`

**If successful:** Output `[OK] n8n-brain connected`

### 0.3 Set Terminal Context

```bash
echo -ne "\033]0;Testing: ${WORKFLOW_NAME}\007"
```

---

## PHASE 1: LOAD AND ANALYZE WORKFLOW

### 1.1 Fetch Workflow (WITH RETRY)

```bash
echo "[PHASE 1] Loading workflow..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_get_workflow({
  id: "<workflow_id>",
  mode: "structure"
})
```

**If this fails after 3 retries:**
- Output: `[ERROR] Cannot fetch workflow <id>. Verify the ID is correct.`
- **STOP**

**On success:**
```bash
sleep 1
echo "[OK] Loaded: <workflow_name>"
```

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

### 1.4 Mid-Phase Health Check

```bash
echo "[HEALTH] Verifying connection after Phase 1..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_list_workflows({ limit: 1 })
```

**If fails:** Follow the "Health Check Pattern" recovery steps above.

**If succeeds:** `[OK] Connection stable - proceeding to Phase 2`

---

## PHASE 2: CHECK EXECUTION HISTORY

### 2.1 Get Recent Executions (WITH RETRY)

```bash
echo "[PHASE 2] Checking execution history..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_executions({
  action: "list",
  workflowId: "<workflow_id>",
  limit: 3,
  status: "error"
})
```

```bash
sleep 1
```

Categorize:
- How many succeeded?
- How many failed?
- What's the most recent status?

### 2.2 If Failures Exist, Get Error Details

```bash
sleep 2
```

```tool
mcp__n8n-mcp__n8n_executions({
  action: "get",
  id: "<most_recent_failed_execution_id>",
  mode: "error",
  includeExecutionPath: true,
  errorItemsLimit: 5
})
```

```bash
sleep 1
```

Extract:
- `primaryError.message` - The actual error
- `primaryError.nodeName` - Which node failed
- `primaryError.nodeType` - What type of node
- `upstreamContext` - Data that was flowing into the failed node
- `executionPath` - Which nodes ran before failure

### 2.3 Mid-Phase Health Check

```bash
echo "[HEALTH] Verifying connection after Phase 2..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_list_workflows({ limit: 1 })
```

**If fails:** Follow the "Health Check Pattern" recovery steps above.

**If succeeds:** `[OK] Connection stable - proceeding to Phase 3`

---

## PHASE 3: DIAGNOSE AND FIX ERRORS

**This is where we actually FIX things, not just report them.**

### 3.0 MANDATORY: Check n8n-brain FIRST (Non-Optional)

**Before ANY debugging or reasoning, always consult the brain (if available).**

```bash
sleep 2
```

```tool
mcp__n8n-brain__lookup_error_fix({
  error_message: "<error_message>",
  node_type: "<node_type>"
})
```

**Decision tree based on brain response:**

| Brain Result | Action |
|-------------|--------|
| Fix found with `times_succeeded > 0` | **Apply immediately** — skip to 3.3. Log: "Applied brain fix (id: X, success rate: Y%)" |
| Fix found with `times_succeeded == 0` | Note it but diagnose fresh — previous fix didn't work |
| No results | Proceed to 3.1 for manual diagnosis |

**Logging:** When a brain fix is applied, always output:
```
[BRAIN] Applied known fix: {fix_description} (id: {error_fix_id}, success: {times_succeeded}/{times_applied})
```

### 3.1 Pattern-Match and Diagnose (Only if Brain Had No Fix)

If the brain had no relevant fix, diagnose the error manually using the patterns below.

### 3.1.5 Get Failing Node Details (Only When Needed)

If you need the full configuration of the failing node:

```bash
sleep 2
```

```tool
mcp__n8n-mcp__n8n_get_workflow({
  id: "<workflow_id>",
  mode: "full"
})
```

Then extract ONLY the failing node's parameters. Do NOT store the full workflow JSON - immediately discard after extracting the needed node config.

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
   ```bash
   sleep 2
   ```
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
   ```bash
   sleep 2
   ```
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

```bash
sleep 3
```

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

```bash
sleep 2
echo "[OK] Node updated"
```

#### EMPTY INPUT ERRORS (No items, empty array)

**FIX IT:**

Option A - Enable "Always Output Data":
```bash
sleep 3
```
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

**ALWAYS include delays:**
```bash
sleep 3
echo "[APPLYING FIX] <description>"
```

After applying:
```bash
sleep 2
```
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

### 3.5 Mid-Phase Health Check (CRITICAL - After Fixes)

**This is the most important health check - fixes involve write operations that can stress the connection.**

```bash
echo "[HEALTH] Verifying connection after Phase 3 (fix operations)..."
sleep 3
```

```tool
mcp__n8n-mcp__n8n_list_workflows({ limit: 1 })
```

**If fails:** Follow the "Health Check Pattern" recovery steps above. Note which fixes were applied before connection loss.

**If succeeds:** `[OK] Connection stable - proceeding to Phase 4`

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

### 4.3 Execute Tests for Each Branch (WITH MANDATORY DELAYS)

For webhook-triggered workflows:

```bash
echo "[PHASE 4] Testing workflow execution..."
sleep 3
```

```tool
mcp__n8n-mcp__n8n_test_workflow({
  workflowId: "<workflow_id>",
  data: <test_payload>,
  timeout: 60000,
  waitForResponse: true
})
```

**CRITICAL: Wait for n8n to process the execution:**
```bash
echo "[WAIT] Allowing n8n to complete execution..."
sleep 5
```

### 4.4 Track Branch Coverage

After each test, get execution details. Use `mode: "error"` for failed executions (80% smaller):

```bash
sleep 2
```

```tool
// For FAILED executions - optimized for debugging
mcp__n8n-mcp__n8n_executions({
  action: "get",
  id: "<execution_id>",
  mode: "error",
  errorItemsLimit: 3
})
```

```bash
sleep 1
```

```tool
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

### 4.6 Health Check After EACH Branch Test

**Run a health check after each individual branch test, not just at end of Phase 4.**

After each `n8n_test_workflow` call and result fetch:

```bash
echo "[HEALTH] Verifying connection after branch test..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_list_workflows({ limit: 1 })
```

**If fails:**
- Note which branches were successfully tested
- Save progress: "Tested X/Y branches before connection loss"
- Follow recovery steps

**If succeeds:** Continue to next branch or Phase 5

---

## PHASE 5: VERIFY OUTPUT

**A workflow that runs without errors can still produce wrong output.**

### 5.1 Identify Terminal Nodes

Terminal nodes = nodes with no outgoing connections. These produce the workflow's "output."

### 5.2 Get Output from Each Terminal Node

```bash
sleep 2
```

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

### 5.5 Mid-Phase Health Check

```bash
echo "[HEALTH] Verifying connection after Phase 5..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_list_workflows({ limit: 1 })
```

**If fails:** Follow recovery steps. Note output verification results before loss.

**If succeeds:** `[OK] Connection stable - proceeding to Phase 6`

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
```bash
sleep 2
```
```tool
mcp__n8n-brain__find_similar_patterns({
  description: "error handling canary pattern",
  tags: ["error-handling"]
})
```

### 6.3 Get Credential ID for Error Handling

```bash
sleep 2
```
```tool
mcp__n8n-brain__get_credential({
  service_name: "supabase"
})
```

Use the returned credential ID in the Postgres node.

### 6.4 Mid-Phase Health Check (Final Check Before Learning/Registry)

```bash
echo "[HEALTH] Final connection check before completing test..."
sleep 2
```

```tool
mcp__n8n-mcp__n8n_list_workflows({ limit: 1 })
```

**If fails:**
- All major testing is complete at this point
- Save current results
- Mark as `tested` (not `verified`) since learning/registry update couldn't complete
- Follow recovery steps

**If succeeds:** `[OK] Connection stable - proceeding to learning and registry update`

---

## PHASE 7: LEARN FROM FIXES

**Every fix gets stored in n8n-brain.**

### 7.1 Store New Error Fixes

For each error that was fixed:
```bash
sleep 2
```
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
```bash
sleep 2
```
```tool
mcp__n8n-brain__report_fix_result({
  error_fix_id: "<fix_id>",
  worked: true  // or false
})
```

### 7.3 Record the Action

```bash
sleep 2
```
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
cd "/Users/mike/IAML Business OS" && source .env.local && \
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -d "{
    \"test_status\": \"tested\",
    \"tested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"tested_by\": \"test-workflow-auto\",
    \"test_notes\": \"Automated testing complete\"
  }"
```

Note: Use `tested` not `verified` - human still needs to confirm.

---

## PHASE 9: PRESENT TO HUMAN

**Only after ALL of the above is complete:**

```bash
echo -ne "\033]0;Claude Code\007"
```

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

---

## YOUR TURN: Manual Verification

Please verify:
1. Open: https://n8n.realtyamp.ai/workflow/<workflow_id>
2. Check the Executions tab - confirm recent runs look correct

**When done, reply:**
- `confirm` → Mark as **verified**
- `broken` → Mark as **broken** (describe what's wrong)
- `skip` → Move to next workflow
```

---

## PHASE 10: HANDLE USER RESPONSE

### On "confirm":

```bash
cd "/Users/mike/IAML Business OS" && source .env.local && \
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -d "{
    \"test_status\": \"verified\",
    \"tested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"tested_by\": \"mike\",
    \"test_notes\": \"Human verified after automated testing\"
  }"
```

Add verified tag in n8n:
```bash
sleep 3
```
```tool
mcp__n8n-mcp__n8n_update_partial_workflow({
  id: "<workflow_id>",
  operations: [{
    type: "addTag",
    tagName: "verified"
  }]
})
```

Respond: "**<workflow_name>** marked as verified. Ready for next?"

### On "broken":

```bash
cd "/Users/mike/IAML Business OS" && source .env.local && \
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -d "{
    \"test_status\": \"broken\",
    \"tested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
    \"tested_by\": \"mike\",
    \"test_notes\": \"Human marked as broken\"
  }"
```

Respond: "**<workflow_name>** marked as broken. Notes saved. What's the issue?"

### On "skip" or "next":

Move to next untested workflow by fetching from registry.

---

## CONFIGURATION

```
MAX_FIX_ATTEMPTS = 5
BRANCH_TEST_REQUIRED = true
ERROR_HANDLING_REQUIRED = true
OUTPUT_VERIFICATION_REQUIRED = true

# RELIABILITY SETTINGS
MCP_CALL_DELAY_BEFORE = 2s
MCP_CALL_DELAY_AFTER = 1s
N8N_TEST_DELAY_BEFORE = 3s
N8N_TEST_DELAY_AFTER = 5s
N8N_UPDATE_DELAY_BEFORE = 3s
N8N_UPDATE_DELAY_AFTER = 2s
MAX_RETRIES = 3
RETRY_DELAY = 5s
```

---

## CONTEXT EFFICIENCY

To prevent context exhaustion during multi-iteration fixes:

**Iteration 1-2:** Use standard modes (structure, error)
**Iteration 3+:** If still failing, use minimal modes:
- Skip re-fetching workflow structure (already known)
- Use `errorItemsLimit: 2` instead of 5
- Focus only on the specific failing node

**If approaching iteration 5:**
Before attempting final fix, summarize what's been tried and escalate with clear diagnosis rather than continuing to consume context.

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
- `fix_attempt_count` - how many fixes attempted this session
- `brain_available` - whether n8n-brain is responding
- `last_successful_phase` - track progress for recovery
- `last_health_check_passed` - timestamp of last successful health check
- `connection_failures` - count of health check failures this session

---

## ERROR RECOVERY

### Connection Loss Recovery

If a health check fails mid-testing:

1. **Output progress immediately:**
   ```
   [CONNECTION LOST] n8n-mcp stopped responding

   Progress before connection loss:
   - Phase completed: X
   - Fixes applied: [list]
   - Branches tested: X/Y
   - Output verified: yes/no
   ```

2. **Save state to registry:**
   ```bash
   cd "/Users/mike/IAML Business OS" && source .env.local && \
   curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.${WORKFLOW_ID}" \
     -H "apikey: ${SUPABASE_SERVICE_KEY}" \
     -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
     -H "Content-Type: application/json" \
     -H "Content-Profile: n8n_brain" \
     -d "{
       \"test_status\": \"needs_review\",
       \"tested_at\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
       \"tested_by\": \"test-workflow-auto\",
       \"test_notes\": \"Testing interrupted at Phase X - connection lost. Partial results: [summary]\"
     }"
   ```

3. **Inform user:**
   ```
   [FATAL] Lost connection to n8n after Phase X.

   Progress has been saved. To resume testing:
   /test-workflow-auto <workflow_id>

   Or check MCP server status and try again.
   ```

### Phase Failure Recovery

If any phase fails completely (not connection loss):

1. Log the error clearly: `[ERROR] Phase X failed: <reason>`
2. Try to continue to the next phase if possible
3. At the end, summarize what worked and what didn't
4. Mark workflow as `needs_review` instead of `broken` if some tests passed

### Recovery Checklist

Before giving up on a workflow:

- [ ] Tried 3 retries on failed MCP calls?
- [ ] Waited 10s between retry attempts?
- [ ] Checked if it's a connection issue vs. workflow issue?
- [ ] Saved progress to registry?
- [ ] Informed user with clear next steps?

**Never silently fail.** Always output what happened.

</instructions>
