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

### Step 0: Supabase Connection

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

### Step 1: Parse Arguments

Extract from the user's command:
- `workflow_id_or_name`: Target workflow (optional if using --bulk)
- `bulk_count`: Number of workflows to test (from --bulk N)
- `test_case`: Specific test case to run (optional)
- `create_spec`: Whether to create a new spec
- `dry_run`: Whether to skip execution
- `verbose`: Detailed logging flag

### Step 2: Get Workflows to Test

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

### Step 3: Mark Test In Progress

Before testing each workflow, update Supabase:

```sql
SELECT n8n_brain.mark_workflow_tested(
  '{workflow_id}',
  'in_progress',
  'claude-testing-agent',
  'Test started at {timestamp}'
);
```

### Step 4: Load or Create Test Specification

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

### Step 5: Execute Test

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

### Step 6: Evaluate Results

Parse execution result and determine status:

| Execution Status | Test Result | Next Action |
|------------------|-------------|-------------|
| Success | PASS | Mark verified |
| Error (known fix) | RETRY | Apply fix, re-test |
| Error (unknown) | FAIL | Mark broken, escalate |
| Timeout | FAIL | Mark needs_review |

### Step 7: Update Supabase with Results

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

### Step 8: Record to n8n-brain

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

### Step 9: Generate Report

After testing all workflows, output summary:

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

### Supabase Updated
- {N} workflows marked as verified
- {N} workflows marked as broken
- {N} workflows marked as needs_review

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
