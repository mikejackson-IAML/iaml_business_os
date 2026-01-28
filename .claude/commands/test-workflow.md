---
name: test-workflow
description: Automated n8n workflow testing with diagnosis and self-repair. Tests only unverified workflows from Supabase registry. Updates test status after completion.
allowed-tools: [Read, Write, Bash, Grep, Glob, mcp__n8n-mcp__*, mcp__n8n-brain__*]
---

# Test Workflow Command

> Automated n8n workflow testing with Supabase integration. Only tests workflows that haven't been verified.

## Invocation

```
/test-workflow [workflow_id_or_name] [options]
```

## Options

| Option | Description |
|--------|-------------|
| `--bulk N` | Test N unverified workflows from Supabase registry |
| `--test-case <name>` | Run a specific test case only |
| `--create-spec` | Interactive test specification creation |
| `--dry-run` | Show what would be tested without executing |
| `--verbose` | Show detailed execution logs |

## Examples

```bash
# Test next 5 unverified workflows from registry
/test-workflow --bulk 5

# Test a specific workflow by ID
/test-workflow HnZQopXL7xjZnX3O

# Test by name
/test-workflow "Airtable to GHL Sync"

# Dry run to see what would be tested
/test-workflow --bulk 10 --dry-run
```

---

## Orchestration Instructions

<orchestration>

### PHASE 0: SET TERMINAL TAB NAME (MANDATORY — DO THIS FIRST)

**Before doing ANYTHING else**, set the terminal tab title to the workflow name. This is the FIRST command you run, period.

Once you know the workflow name (from arguments or Supabase query), immediately run:

```bash
echo -ne "\033]0;Testing: WORKFLOW_NAME_HERE\007"
```

Replace `WORKFLOW_NAME_HERE` with the actual workflow name.

**When testing is complete** (success, failure, or any exit), reset the tab:

```bash
echo -ne "\033]0;Claude Code\007"
```

This is non-optional. The user relies on tab names to track which workflow is being tested.

---

### CORE PRINCIPLE: Autonomous Fix-Test-Verify

**ALWAYS apply fixes autonomously.** Never stop to ask the user for permission to fix issues. The testing agent must:

1. **Fix all issues found** — logic bugs, missing error handling, missing tags — without asking
2. **Add standard error handling** if missing (Error Trigger → Parse Error Details → Log Error to DB → Send Error Slack → Mark Error Notified)
3. **Add `business-os` tag** if missing
4. **Validate after every change** using `n8n_validate_workflow` with strict profile
5. **Test ALL branches** — verify both TRUE and FALSE paths of IF nodes, all Switch cases, and the error handling chain
6. **Only return to the user** when all branches are tested and verified, with a complete report showing each branch's test result

If a fix cannot be applied autonomously (e.g., credential issues, external service down), mark as `needs_review` and explain why in the report.

### Step 1: Supabase Connection

**CRITICAL:** All workflow selection MUST come from Supabase, not n8n directly.

Use this SQL via the n8n-brain MCP or direct Supabase query to get unverified workflows:

```sql
-- Get workflows needing testing (prioritized)
SELECT
  workflow_id,
  workflow_name,
  workflow_url,
  category,
  test_status,
  is_active,
  priority
FROM n8n_brain.workflows_needing_attention
WHERE test_status != 'verified'
ORDER BY
  CASE
    WHEN test_status = 'broken' THEN 1
    WHEN test_status = 'needs_review' THEN 2
    WHEN is_active AND test_status = 'untested' THEN 3
    WHEN test_status = 'untested' THEN 4
    ELSE 5
  END
LIMIT {N};
```

If the workflow_registry table is empty or missing workflows, first sync from n8n:

```sql
-- Register a workflow (auto-creates if missing)
SELECT n8n_brain.register_workflow(
  '{workflow_id}'::TEXT,
  '{workflow_name}'::TEXT,
  '{category}'::TEXT,
  '{department}'::TEXT,
  '{trigger_type}'::TEXT,
  '{schedule}'::TEXT,
  '{description}'::TEXT,
  ARRAY[{services}]::TEXT[],
  {has_error_handling}::BOOLEAN,
  {has_slack_alerts}::BOOLEAN,
  {has_dashboard_logging}::BOOLEAN
);
```

### Step 2: Parse Arguments

Extract from the user's command:
- `workflow_id_or_name`: Target workflow (optional if using --bulk)
- `bulk_count`: Number of workflows to test (from --bulk N)
- `test_case`: Specific test case to run (optional)
- `create_spec`: Whether to create a new spec
- `dry_run`: Whether to skip execution
- `verbose`: Detailed logging flag

### Step 3: Get Workflows to Test

**If `--bulk N` specified:**

1. Query Supabase for N unverified workflows:
   ```sql
   SELECT workflow_id, workflow_name, test_status, is_active, category
   FROM n8n_brain.workflows_needing_attention
   WHERE test_status IN ('untested', 'broken', 'needs_review', 'in_progress')
   LIMIT {N};
   ```

2. If no workflows found in registry, inform user:
   ```
   No unverified workflows found in registry.

   To populate the registry, either:
   1. Run the workflow sync: /sync-workflows
   2. Manually register: SELECT n8n_brain.register_workflow(...)
   ```

3. Display the queue:
   ```
   Found {N} workflows to test:

   | # | Workflow | Status | Priority |
   |---|----------|--------|----------|
   | 1 | {name} | {status} | {priority} |
   ...
   ```

**If specific workflow provided:**

1. First check if it exists in Supabase registry:
   ```sql
   SELECT workflow_id, workflow_name, test_status
   FROM n8n_brain.workflow_registry
   WHERE workflow_id = '{id}' OR workflow_name ILIKE '%{name}%';
   ```

2. If not in registry, register it first from n8n data

3. Verify it's not already verified:
   ```
   Workflow "{name}" is already verified (tested {date}).
   Use --force to re-test, or choose an unverified workflow.
   ```

### Step 4: Mark Test In Progress

Before testing each workflow, update Supabase:

```sql
SELECT n8n_brain.mark_workflow_tested(
  '{workflow_id}',
  'in_progress',
  'claude-testing-agent',
  'Test started at {timestamp}'
);
```

### Step 5: Load or Create Test Specification

Check for existing spec in `.planning/workflow-tests/specs/`:

```bash
ls -la ".planning/workflow-tests/specs/${workflow_id}.yaml" 2>/dev/null
```

**If spec exists:**
- Read and parse the YAML spec
- Validate against schema

**If no spec:**
- Auto-generate basic spec from workflow structure
- Or run interactive creation with `--create-spec`

### Step 6: Execute Test

1. Get workflow from n8n:
   ```
   mcp__n8n-mcp__n8n_get_workflow({ id: "{workflow_id}" })
   ```

2. Identify trigger type and test accordingly:

   **Webhook triggers:**
   ```
   mcp__n8n-mcp__n8n_test_workflow({
     workflowId: "{workflow_id}",
     data: {test_payload},
     waitForResponse: true
   })
   ```

   **Schedule/Manual triggers:**
   - Check recent executions
   - Analyze last execution for success/failure

3. Get execution result:
   ```
   mcp__n8n-mcp__n8n_executions({
     action: "list",
     workflowId: "{workflow_id}",
     limit: 1
   })
   ```

### Step 6b: Structural Analysis (Always Run)

Even if the workflow executes successfully, perform structural analysis:

1. **Verify IF/Switch branch wiring** — Check that TRUE/FALSE branches connect to the correct nodes by analyzing node names, purposes, and the condition logic. Fix swapped branches autonomously.
2. **Check for error handling** — If missing, add the standard error handling pattern from n8n-brain (pattern ID `235e56be-d444-4c62-a2c4-9ae3e8db279b`). Replace `{{WORKFLOW_NAME}}` and `{{WORKFLOW_ID}}` with actual values.
3. **Check for `business-os` tag** — Add if missing.
4. **Validate** — Run `n8n_validate_workflow` with strict profile. Fix any errors found.
5. **Record all fixes** to n8n-brain via `store_error_fix` for future learning.

### Step 6c: MANDATORY Brain Lookup Before Debugging

**If any errors were found in Step 6 or 6b, you MUST consult the brain BEFORE attempting any fix:**

```
mcp__n8n-brain__lookup_error_fix({
  error_message: "<the error message>",
  node_type: "<the node type>"
})
```

**Decision tree:**
- Brain returns fix with `times_succeeded > 0` → **Apply it immediately**, log: `[BRAIN] Applied known fix: {fix_description} (id: {id}, success: {times_succeeded}/{times_applied})`
- Brain returns fix with `times_succeeded == 0` → Note it, diagnose fresh
- No results → Reason from scratch

This is non-optional. Every error must be checked against the brain first.

### Step 7: Evaluate Results

Parse execution result and determine status:

| Execution Status | Test Result | Next Action |
|------------------|-------------|-------------|
| Success + structure OK | PASS | Mark verified |
| Success + structure fixed | PASS | Apply fixes, validate, mark verified |
| Error (brain fix available) | RETRY | Apply brain fix, re-test |
| Error (fixable) | RETRY | Generate fix, apply, re-test (up to 5 iterations) |
| Error (unfixable) | FAIL | Mark broken, include diagnosis in report |
| Timeout | FAIL | Mark needs_review |

### Step 8: Update Supabase with Results

**On SUCCESS:**

```sql
SELECT n8n_brain.mark_workflow_tested(
  '{workflow_id}',
  'verified',
  'claude-testing-agent',
  'Test passed: {summary}. Execution ID: {exec_id}'
);
```

**On FAILURE:**

```sql
SELECT n8n_brain.mark_workflow_tested(
  '{workflow_id}',
  'broken',
  'claude-testing-agent',
  'Test failed: {error_message}. Node: {failed_node}'
);
```

**On PARTIAL (needs human review):**

```sql
SELECT n8n_brain.mark_workflow_tested(
  '{workflow_id}',
  'needs_review',
  'claude-testing-agent',
  'Requires manual verification: {reason}'
);
```

### Step 9: Record to n8n-brain

Store the action for confidence calibration:

```
mcp__n8n-brain__record_action({
  task_description: "Test workflow: {name}",
  services_involved: [{services}],
  node_types_involved: [{node_types}],
  outcome: "{success|failure|partial}",
  outcome_notes: "{summary}"
})
```

If errors were fixed, store the fix:

```
mcp__n8n-brain__store_error_fix({
  error_message: "{error}",
  node_type: "{node_type}",
  fix_description: "{what fixed it}",
  fix_example: {example_config}
})
```

### Step 10: Generate Report

After testing all workflows, output summary with **branch-level detail**:

```markdown
## Workflow Testing Complete

**Tested:** {total} workflows
**Passed:** {passed}
**Failed:** {failed}
**Needs Review:** {review}

### Results

| Workflow | Status | Notes |
|----------|--------|-------|
| {name} | PASS | Verified |
| {name} | FAIL | {error} |

### Branch Coverage

For each workflow with IF/Switch nodes, show branch test results:

| Workflow | Branch | Tested | Result |
|----------|--------|--------|--------|
| {name} | IF "Has Issues?" → TRUE | Yes | Slack Alert fires correctly |
| {name} | IF "Has Issues?" → FALSE | Yes | All OK reached |
| {name} | Error Handling Chain | Yes | Error Trigger → Parse → Log → Slack → Mark all connected |

### Fixes Applied

| Workflow | Fix | Source |
|----------|-----|--------|
| {name} | Swapped IF branches | Structural analysis |
| {name} | Added error handling pattern | n8n-brain pattern 235e... |
| {name} | Added business-os tag | Compliance check |

### Supabase Updated
- {N} workflows marked as verified
- {N} workflows marked as broken
- {N} workflows marked as needs_review

### n8n-brain Updated
- {N} error fixes stored
- {N} actions recorded

### Next Steps
{If failures, list recommended actions}
```

</orchestration>

---

## Test Status Values

| Status | Meaning | After Test |
|--------|---------|------------|
| `untested` | Never tested | First in queue |
| `in_progress` | Currently testing | Set during test |
| `tested` | Tested, not prod-verified | Rare |
| `verified` | Confirmed working | Success |
| `needs_review` | Needs human check | Partial/unclear |
| `broken` | Known broken | Failed |

---

## Supabase Queries Reference

### Get unverified workflows
```sql
SELECT * FROM n8n_brain.workflows_needing_attention LIMIT 10;
```

### Get test summary
```sql
SELECT * FROM n8n_brain.workflow_test_summary;
```

### Mark workflow tested
```sql
SELECT n8n_brain.mark_workflow_tested(
  'workflow_id',
  'verified',  -- or 'broken', 'needs_review'
  'claude',
  'Test notes here'
);
```

### Register new workflow
```sql
SELECT n8n_brain.register_workflow(
  'workflow_id',
  'Workflow Name',
  'category',
  'department',
  'webhook',
  NULL,
  'Description',
  ARRAY['service1', 'service2'],
  true,  -- has_error_handling
  true,  -- has_slack_alerts
  true   -- has_dashboard_logging
);
```

---

## Related

- Architecture: @business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md
- n8n-brain: @mcp-servers/n8n-brain/
- Workflow Registry Schema: @supabase/migrations/20260111_create_n8n_brain_schema.sql
