---
name: test-workflow
description: Automated n8n workflow testing with full coverage. Tests unverified workflows from registry. Delegates to test-workflow-auto for single-workflow testing.
allowed-tools: [Read, Write, Bash, Grep, Glob, Skill, mcp__n8n-mcp__*, mcp__n8n-brain__*]
---

# Test Workflow Command

> Automated n8n workflow testing with Supabase integration. Only tests workflows that haven't been verified. For single workflows, delegates to `/test-workflow-auto` for full node/branch coverage.

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

**Before doing ANYTHING else**, set the terminal tab title. This is the FIRST command you run.

```bash
echo -ne "\033]0;Testing: (queue)\007"
```

**When testing is complete** (success, failure, or any exit), reset the tab:

```bash
echo -ne "\033]0;Claude Code\007"
```

---

### CORE PRINCIPLE: Full Coverage Testing

Every workflow must achieve 100% node coverage and 100% branch coverage. This means:
- Every node executes at least once
- Every IF/Switch/Filter branch is triggered
- Error handling chains are tested
- Seed data is generated to exercise all paths

**For single workflow testing:** Delegate to `/test-workflow-auto` which handles the full coverage protocol.

**For bulk testing:** Orchestrate multiple `/test-workflow-auto` runs.

---

### Step 1: Supabase Connection

**CRITICAL:** All workflow selection MUST come from Supabase, not n8n directly.

Query unverified workflows:

```bash
cd "/Users/mikejackson/Documents/IAML/iaml_business_os" && source .env.local && \
curl -s "${SUPABASE_URL}/rest/v1/workflow_registry?test_status=neq.verified&order=test_status.asc,is_active.desc,workflow_name.asc&limit=20&select=workflow_id,workflow_name,test_status,is_active,category" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Accept-Profile: n8n_brain"
```

If the workflow_registry table is empty or missing workflows, sync from n8n first using `n8n_brain.register_workflow()`.

### Step 2: Parse Arguments

Extract from the user's command:
- `workflow_id_or_name`: Target workflow (optional if using --bulk)
- `bulk_count`: Number of workflows to test (from --bulk N)
- `test_case`: Specific test case to run (optional)
- `create_spec`: Whether to create a new spec
- `dry_run`: Whether to skip execution
- `verbose`: Detailed logging flag

### Step 3: Route to Appropriate Handler

**If single workflow (by ID or name):**

Delegate directly to `/test-workflow-auto`:
```
Invoke the Skill tool: test-workflow-auto with args: "{workflow_id}"
```

This runs the full 8-phase coverage protocol: analyze → seed data → compliance → execute → coverage → gaps → learn → report.

**If `--bulk N`:**

1. Query Supabase for N unverified workflows (prioritized):
   ```sql
   SELECT workflow_id, workflow_name, test_status, is_active, category
   FROM n8n_brain.workflow_registry
   WHERE test_status IN ('untested', 'broken', 'needs_review', 'in_progress')
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

2. Display the queue:
   ```
   Found {N} workflows to test:

   | # | Workflow | Status | Category |
   |---|----------|--------|----------|
   | 1 | {name} | {status} | {category} |
   ...
   ```

3. For each workflow, run `/test-workflow-auto {id}` sequentially.

4. After all complete, generate a bulk summary.

**If `--dry-run`:**

Show what would be tested without executing:
```
DRY RUN: Would test {N} workflows:

| # | Workflow | Current Status | Trigger Type | Est. Scenarios |
|---|----------|---------------|-------------|----------------|
| 1 | {name} | untested | webhook | ~3 |
...

Run without --dry-run to execute.
```

### Step 4: Bulk Summary (after all workflows tested)

```markdown
## Bulk Testing Complete

**Workflows Tested:** {total}
**Passed (verified):** {passed}
**Needs Review:** {review}
**Broken:** {broken}

### Coverage Summary

| Workflow | Node Coverage | Branch Coverage | Status | Fixes |
|----------|-------------|----------------|--------|-------|
| {name} | 14/14 (100%) | 6/6 (100%) | verified | 1 |
| {name} | 10/12 (83%) | 3/4 (75%) | needs_review | 0 |

### Aggregate Stats
- Total nodes tested: {N}
- Total branches tested: {N}
- Total executions run: {N}
- Total fixes applied: {N}
- New error fixes stored in brain: {N}

### Next Steps
{If any need review, list specific actions}
```

---

### Handling --create-spec

Interactive test specification creation mode:

1. Load the workflow structure
2. Walk user through defining test cases:
   - What payload triggers the happy path?
   - What payload triggers each branch?
   - What are the expected outputs?
3. Generate YAML spec and save to `.planning/workflow-tests/specs/{id}.yaml`
4. Offer to run the spec immediately

---

### Handling --test-case

Run a specific test case from an existing spec:

1. Load spec from `.planning/workflow-tests/specs/{id}.yaml`
2. Find the named test case
3. Execute only that scenario
4. Report coverage for just that case

</orchestration>

---

## Test Status Values

| Status | Meaning | After Test |
|--------|---------|------------|
| `untested` | Never tested | First in queue |
| `in_progress` | Currently testing | Set during test |
| `tested` | Tested, not prod-verified | Nightly mode |
| `verified` | Confirmed working | 100% coverage + human approval |
| `needs_review` | Coverage gaps or issues | < 90% node coverage |
| `broken` | Known broken | Failed after max fix attempts |

---

## Coverage Thresholds

| Node Coverage | Branch Coverage | Result |
|--------------|----------------|--------|
| 100% | 100% | Mark as `verified` |
| >= 90% | >= 80% | Mark as `tested`, document gaps |
| < 90% | < 80% | Mark as `needs_review` |

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
  'verified',
  'claude',
  'Node coverage: 14/14 (100%). Branch coverage: 6/6 (100%).'
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
  true,
  true,
  true
);
```

---

## Related

- Full coverage protocol: @.claude/commands/test-workflow-auto.md
- Architecture: @business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md
- n8n-brain: @mcp-servers/n8n-brain/
- Workflow Registry Schema: @supabase/migrations/20260111_create_n8n_brain_schema.sql
