---
name: test-workflow-auto
description: Autonomous n8n workflow testing with full node/branch coverage, seed data generation, and self-repair.
allowed-tools: [Read, Write, Bash, Grep, Glob, mcp__n8n-mcp__*, mcp__n8n-brain__*]
---

# Autonomous Workflow Testing — Full Coverage

Test, diagnose, fix, and verify n8n workflows with 100% node and branch coverage.
Every node must execute. Every branch must be tested.

## Usage
```
/test-workflow-auto <workflow_id>
/test-workflow-auto next
/test-workflow-auto confirm
/test-workflow-auto broken
```

<instructions>

## MANDATORY: Call real MCP tools. Every response needs actual execution IDs.

If MCP tools fail: Tell user "Cannot access n8n MCP tools. Check if n8n-mcp server is running."

## SUCCESS CRITERIA

Workflow is fully tested when:
- Every node has executed at least once (across all test runs)
- Every branch of every IF/Switch/Filter has been triggered
- Error handling chain has been tested (if present)
- No unresolved errors remain

---

## PHASE 1: HEALTH CHECK + ANALYZE

### Step 1: Verify MCP access

Call `mcp__n8n-mcp__n8n_list_workflows` with `limit: 1`. If fails → STOP.
Call `mcp__n8n-brain__get_preferences`. If fails → continue without brain.

### Step 2: Run analysis script

This script pre-computes everything — nodes, branches, conditions, seed data, compliance issues.
It replaces hundreds of tokens of manual JSON parsing.

```bash
cd "/Users/mikejackson/Documents/IAML/iaml_business_os" && \
  node scripts/n8n-testing/analyze-workflow.js WORKFLOW_ID_HERE
```

The output is JSON with these fields:
- `workflow_name`, `trigger_type`, `active`
- `totals`: node count, branch count, branch points
- `nodes[]`: id, name, type, flags (branch/error/db)
- `branches[]`: node name, type, outputs, conditions
- `seed_data[]`: scenario name, description, payload, expected branches
- `compliance`: missing error handling, tags, alwaysOutputData issues

**Read this output carefully.** It's your test plan.

### Step 3: Set terminal tab

```bash
echo -ne "\033]0;Testing: WORKFLOW_NAME\007"
```

---

## PHASE 2: STRUCTURAL COMPLIANCE (Auto-Fix)

Check the `compliance` section from the analysis. Fix issues in this order:

1. **Missing error handling** → Check n8n-brain for pattern, add if missing:
   ```
   mcp__n8n-brain__find_similar_patterns({ description: "error handling", tags: ["error-handling"] })
   ```

2. **Missing business-os tag** → Add via `n8n_update_partial_workflow`

3. **Postgres nodes without alwaysOutputData** → Fix each one listed in `compliance.postgresWithoutAlwaysOutput`

4. **Validate** → `mcp__n8n-mcp__n8n_validate_workflow` with strict profile

**Before every fix**, check brain first:
```
mcp__n8n-brain__lookup_error_fix({ error_message: "<issue>", node_type: "<type>" })
```
If brain has a fix with `times_succeeded > 0` → apply it directly.

---

## PHASE 3: EXECUTE TEST SCENARIOS

Use the `seed_data[]` array from the analysis as your test plan.

### For each scenario:

1. **Execute:**
   ```
   mcp__n8n-mcp__n8n_test_workflow({
     workflowId: "WORKFLOW_ID",
     data: SCENARIO_PAYLOAD,
     timeout: 60000,
     waitForResponse: true
   })
   ```
   For scheduled/manual workflows (payload is null): call with no data, just `workflowId`.

2. **Record the execution ID** — you'll need all of them for coverage check.

3. **If execution errors:**
   - Check brain: `mcp__n8n-brain__lookup_error_fix({ error_message: "...", node_type: "..." })`
   - Apply fix via `n8n_update_partial_workflow`
   - Re-execute (max 5 attempts per scenario)
   - After successful fix: store in brain via `store_error_fix`

4. **Collect all execution IDs** as a comma-separated list.

---

## PHASE 4: CHECK COVERAGE

Run the coverage script with ALL execution IDs:

```bash
cd "/Users/mikejackson/Documents/IAML/iaml_business_os" && \
  node scripts/n8n-testing/check-coverage.js WORKFLOW_ID "EXEC_ID_1,EXEC_ID_2,EXEC_ID_3"
```

The output includes:
- `node_coverage`: covered/total with percentage
- `branch_coverage`: covered/total with percentage
- `recommended_status`: verified/tested/needs_review
- `uncovered_nodes[]`: nodes that never executed
- `uncovered_branches[]`: branches never taken
- `node_map[]`: every node with covered status and which execution covered it
- `branch_map[]`: every branch with covered status
- `executions_detail[]`: per-execution results including errors

---

## PHASE 5: GAP FILLING (if coverage < 100%)

If `uncovered_nodes` or `uncovered_branches` are not empty:

1. **Analyze each gap** — what input would cause that node/branch to execute?
2. **Generate additional payload** targeting the gap
3. **Execute and re-check** coverage (run check-coverage.js again with ALL execution IDs including new ones)
4. **Max 3 gap-filling rounds**

For **error handling chains** that are uncovered: deliberately send malformed data or data that causes a downstream node to fail.

Acceptable reasons for < 100%:
- External service dependency (can't mock)
- Destructive operation (no test data)
- Rate-limited API
- Sub-workflow requiring complex setup

Document every gap with its reason.

---

## PHASE 6: FINALIZE

### 6.1: Update registry

```bash
cd "/Users/mikejackson/Documents/IAML/iaml_business_os" && source .env.local && \
curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.WORKFLOW_ID" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Content-Profile: n8n_brain" \
  -d '{"test_status": "STATUS", "tested_at": "TIMESTAMP", "tested_by": "test-workflow-auto", "test_notes": "Node: X/Y (Z%). Branch: X/Y (Z%). Execs: N. Fixes: N."}'
```

### 6.2: Store learnings

For each NEW error fix: `mcp__n8n-brain__store_error_fix({...})`
For known fixes used: `mcp__n8n-brain__report_fix_result({ error_fix_id: "...", worked: true })`
Record action: `mcp__n8n-brain__record_action({...})`

### 6.3: Save test spec

Write YAML to `.planning/workflow-tests/specs/{workflow_id}.yaml` with the scenarios, execution IDs, and coverage data for regression testing.

---

## PHASE 7: REPORT

Use the coverage script output to build the report. Keep it compact:

```markdown
## Tested: {workflow_name}

**ID:** {id} | **URL:** https://n8n.realtyamp.ai/workflow/{id}
**Status:** {recommended_status}

### Coverage
| Metric | Result |
|--------|--------|
| Nodes | {node_coverage.display} |
| Branches | {branch_coverage.display} |
| Executions | {N} |
| Fixes | {N} |

### Executions
| # | Scenario | Exec ID | Status | Nodes Hit |
|---|----------|---------|--------|-----------|
(one row per execution from executions_detail)

### Uncovered (if any)
| Item | Type | Reason |
|------|------|--------|
(from uncovered_nodes/uncovered_branches, or "None — 100% coverage")

### Fixes Applied
(list fixes or "None needed")

Reply: `confirm` | `broken` | `skip`
```

---

## HANDLE USER RESPONSE

**confirm:** Update registry to `verified`, tested_by `mike`. Add verified tag if possible.
**broken:** Update registry to `broken` with reason.
**skip/next:** Fetch next untested workflow.

---

## NIGHTLY MODE

When prompt contains "nightly test":
- Use `tested` not `verified`
- Do NOT wait for user response
- Append this block at the very end:

```
---NIGHTLY-RESULT---
WORKFLOW_ID: {id}
WORKFLOW_NAME: {name}
STATUS: {status}
NODE_COVERAGE: {X/Y}
BRANCH_COVERAGE: {X/Y}
EXECUTIONS: {N}
FIXES: {N}
SUMMARY: {one-line}
---END-RESULT---
```

---

## EXECUTION GATE

Before presenting results, verify:
- [ ] Ran analyze-workflow.js — have node/branch inventory
- [ ] Executed test scenarios — have execution IDs
- [ ] Ran check-coverage.js — have actual coverage numbers
- [ ] If < 100%: ran gap-filling OR documented why

Missing any? Complete it first. No guessing coverage numbers.

---

## UNFIXABLE → ESCALATE

- Credential issues (401/403)
- External service down
- Business logic unclear
- Destructive operations with no test data

Everything else: fix it.

---

## CLEANUP

When done (any exit path):
```bash
echo -ne "\033]0;Claude Code\007"
```

</instructions>

## Coverage Thresholds

| Nodes | Branches | Status |
|-------|----------|--------|
| 100% | 100% | verified (or tested in nightly) |
| >= 90% | >= 80% | tested, gaps documented |
| < 90% | < 80% | needs_review |

## Related

- Helper scripts: `scripts/n8n-testing/analyze-workflow.js`, `scripts/n8n-testing/check-coverage.js`
- Architecture: `business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md`
- n8n-brain: `mcp-servers/n8n-brain/`
- Test specs: `.planning/workflow-tests/specs/`
