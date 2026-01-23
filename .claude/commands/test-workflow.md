---
name: test-workflow
description: Automated n8n workflow testing with diagnosis and self-repair. Use this skill to test n8n workflows, diagnose failures, apply fixes automatically, and learn from resolutions. Invoked via /test-workflow <workflow_id_or_name>.
---

# Test Workflow Skill

> Automated n8n workflow testing with diagnosis and self-repair capabilities.

## Invocation

```
/test-workflow <workflow_id_or_name> [options]
```

## Options

- `--test-case <name>` - Run a specific test case only
- `--all` - Run all test cases in the spec
- `--create-spec` - Interactive test specification creation
- `--dry-run` - Validate spec and show plan without executing
- `--verbose` - Show detailed execution logs

## Examples

```bash
# Test a workflow by ID
/test-workflow HnZQopXL7xjZnX3O

# Test by name
/test-workflow "Airtable to GHL Sync"

# Run specific test case
/test-workflow HnZQopXL7xjZnX3O --test-case happy_path

# Create a new test spec interactively
/test-workflow --create-spec

# Dry run to validate
/test-workflow HnZQopXL7xjZnX3O --dry-run
```

---

## Orchestration Instructions

When this skill is invoked, follow this orchestration flow:

<orchestration>

### Step 1: Parse Arguments

Extract from the user's command:
- `workflow_id_or_name`: The target workflow identifier
- `test_case`: Specific test case to run (optional)
- `create_spec`: Whether to create a new spec
- `dry_run`: Whether to skip execution
- `verbose`: Detailed logging flag

### Step 2: Load MCP Tools

First, load the required MCP tools:

```
MCPSearch: select:mcp__n8n__get_workflow
MCPSearch: select:mcp__n8n__list_workflows
MCPSearch: select:mcp__n8n__update_workflow
MCPSearch: select:mcp__n8n__run_webhook
MCPSearch: select:mcp__n8n__list_executions
MCPSearch: select:mcp__n8n__get_execution
MCPSearch: select:mcp__n8n-brain__lookup_error_fix
MCPSearch: select:mcp__n8n-brain__store_error_fix
MCPSearch: select:mcp__n8n-brain__calculate_confidence
MCPSearch: select:mcp__n8n-brain__record_action
MCPSearch: select:mcp__n8n-brain__get_credential
```

### Step 3: Resolve Workflow

If `workflow_id_or_name` looks like an ID (alphanumeric, ~16 chars):
1. Call `mcp__n8n__get_workflow(workflowId=id)`
2. Extract workflow details

If it looks like a name:
1. Call `mcp__n8n__list_workflows()`
2. Find workflow by name (case-insensitive match)
3. Get the workflow ID

Store: `workflow_id`, `workflow_name`, `workflow_json`

### Step 4: Load or Create Test Specification

Check for existing spec:
```bash
ls -la ".planning/workflow-tests/specs/${workflow_id}.yaml" 2>/dev/null || \
ls -la ".planning/workflow-tests/specs/${workflow_name// /-}.yaml" 2>/dev/null
```

**If spec exists:**
- Read and parse the YAML spec
- Validate against schema

**If no spec and `--create-spec` flag:**
- Run interactive spec creation (see Step 4a)

**If no spec and no flag:**
- Output error with instructions:
```
No test specification found for workflow "{name}"

To create one:
  /test-workflow {id} --create-spec

Or manually create:
  .planning/workflow-tests/specs/{id}.yaml
```

#### Step 4a: Interactive Spec Creation

If creating a new spec:

1. Analyze the workflow JSON to identify:
   - Trigger type (Webhook, Schedule, Manual)
   - Input schema (from webhook or manual trigger node)
   - Services used (from node types)
   - Critical nodes (HTTP Request, database, external API nodes)

2. Ask user for test cases:
   - Prompt for happy path input data
   - Prompt for edge cases
   - Prompt for expected outputs

3. Generate YAML spec:

```yaml
# Test specification for: {workflow_name}
# Generated: {date}
# Workflow ID: {workflow_id}

workflow_id: "{workflow_id}"
workflow_name: "{workflow_name}"
execution_method: "{webhook|poll_history|manual}"

test_cases:
  - name: "happy_path"
    description: "Standard successful execution"
    input:
      # Generated from workflow analysis
    expected:
      status: "success"

  - name: "{edge_case_name}"
    description: "{user provided}"
    input:
      # User provided
    expected:
      status: "{success|error}"

max_fix_iterations: 5
timeout_seconds: 60

critical_nodes:
  # Identified from workflow analysis
```

4. Write spec to `.planning/workflow-tests/specs/{workflow_id}.yaml`

### Step 5: Pre-Flight Checks

Before executing tests:

1. **Calculate confidence:**
   ```
   mcp__n8n-brain__calculate_confidence({
     task_description: "Test workflow: {name}",
     services: [{extracted_services}],
     node_types: [{extracted_node_types}]
   })
   ```

   Report confidence level:
   - 0-39: "Low confidence - will ask before making changes"
   - 40-79: "Medium confidence - will test and verify before activating"
   - 80-100: "High confidence - can proceed autonomously"

2. **Check credentials:**
   For each service in the workflow:
   ```
   mcp__n8n-brain__get_credential({service_name: service})
   ```

   Report any missing credential mappings.

3. **Lookup common errors:**
   ```
   mcp__n8n-brain__lookup_error_fix({
     error_message: "common {service} errors",
     node_type: "{node_type}"
   })
   ```

   Pre-load known issues for awareness.

### Step 6: Execute Test Loop

Initialize state:
```json
{
  "iteration": 0,
  "max_iterations": {from_spec},
  "fix_history": [],
  "current_test_case": "{test_case_name}"
}
```

**For each test case:**

#### 6a: Execute Workflow

**If execution_method == "webhook":**
```
mcp__n8n__run_webhook({
  workflowName: "{workflow_name}",
  data: {test_input},
  headers: {}
})
```

Wait for response.

**If execution_method == "poll_history":**
1. Get current execution count:
   ```
   mcp__n8n__list_executions({workflowId: id, limit: 1})
   ```
2. Instruct user to trigger workflow (or wait for schedule)
3. Poll for new execution:
   ```
   mcp__n8n__list_executions({workflowId: id, limit: 5})
   ```
4. When new execution appears, get details:
   ```
   mcp__n8n__get_execution({executionId: new_exec_id})
   ```

#### 6b: Evaluate Results

Parse execution result:
```javascript
execution = {
  status: "success" | "error",
  data: { resultData: { runData: {...} } },
  error: { message: "...", node: {...} }
}
```

Compare against expected:
- Check `status` matches
- Check `output_contains` if specified
- Check `error_contains` if expecting error

**If SUCCESS:**
- Log: "Test case '{name}' PASSED"
- Continue to next test case or finish

**If FAILURE:**
- Proceed to diagnosis (Step 6c)

#### 6c: Diagnose Failure

Extract error context:
```javascript
error_context = {
  error_message: execution.error.message,
  failed_node: execution.error.node.name,
  failed_node_type: execution.error.node.type,
  input_data: // data sent to failed node
}
```

**First: Check n8n-brain for known fix:**
```
mcp__n8n-brain__lookup_error_fix({
  error_message: "{error_message}",
  node_type: "{failed_node_type}"
})
```

**If known fix found:**
- Report: "Found known fix: {fix_description}"
- Apply fix (Step 6d)

**If no known fix:**
- Run pattern diagnosis (Step 6c-patterns)

#### 6c-patterns: Pattern-Based Diagnosis

Analyze error against known patterns:

**Pattern 1: Property Access Error**
```regex
Cannot read propert(y|ies) ['"]?(\w+)['"]? of (undefined|null)
```
Diagnosis: Expression references non-existent field
Fix: Compare expression path to actual input structure

**Pattern 2: Empty Input**
```regex
No items|Nothing to iterate|Items must be
```
Diagnosis: Previous node returned empty array
Fix: Add IF node or "Always Output Data" setting

**Pattern 3: Authentication Error**
```regex
401|403|Unauthorized|Authentication|Invalid (API )?[Kk]ey
```
Diagnosis: Credential issue
Action: **ESCALATE** - requires human intervention

**Pattern 4: JSON Parse Error**
```regex
Unexpected token|Invalid JSON|JSON\.parse
```
Diagnosis: Malformed JSON in expression
Fix: Review and fix JSON syntax

**Pattern 5: Required Field Missing**
```regex
required|mandatory|must (be |have |provide)
```
Diagnosis: Node configuration incomplete
Fix: Check node schema, add missing field

**Pattern 6: Resource Not Found**
```regex
404|not found|does not exist|No (record|contact|item)
```
Diagnosis: Referenced entity doesn't exist
Action: May need to create entity first or fix ID reference

**If pattern matched:**
- Generate fix based on diagnosis
- Report diagnosis and proposed fix

**If no pattern matched:**
- **ESCALATE** with full context

#### 6d: Apply Fix

1. Get current workflow:
   ```
   mcp__n8n__get_workflow({workflowId: id})
   ```

2. Modify workflow JSON based on diagnosis:
   - Update node parameters
   - Fix expressions
   - Add error handling nodes

3. Update workflow:
   ```
   mcp__n8n__update_workflow({
     workflowId: id,
     nodes: [modified_nodes],
     connections: {if_changed}
   })
   ```

4. Log fix to history:
   ```javascript
   fix_history.push({
     iteration: current,
     error: error_message,
     diagnosis: diagnosis_type,
     fix_applied: fix_description,
     fix_source: "n8n-brain" | "pattern-match"
   })
   ```

5. Increment iteration and loop back to 6a

#### 6e: Iteration Check

Before looping:
- If `iteration >= max_iterations` → ESCALATE
- If same error 2+ times in a row → ESCALATE (circular fix)
- Otherwise → Continue loop

### Step 7: Finalize

**On SUCCESS (all test cases pass):**

1. Store any new error fixes:
   ```
   mcp__n8n-brain__store_error_fix({
     error_message: "{error}",
     node_type: "{node_type}",
     fix_description: "{what fixed it}",
     fix_example: {example_config}
   })
   ```

2. Record successful action:
   ```
   mcp__n8n-brain__record_action({
     task_description: "Test workflow: {name}",
     services_involved: [{services}],
     outcome: "success",
     outcome_notes: "All {N} test cases passed after {M} fixes"
   })
   ```

3. Update workflow registry (via Supabase if available):
   ```sql
   SELECT n8n_brain.mark_workflow_tested(
     '{workflow_id}',
     'verified',
     'testing-agent',
     'Test cases: {list}. Fixes applied: {count}'
   );
   ```

4. Generate success report:
   ```markdown
   ## Workflow Test Complete

   **Workflow:** {name} ({id})
   **Status:** PASSED
   **Test Cases:** {passed}/{total}

   ### Results
   | Test Case | Status | Notes |
   |-----------|--------|-------|
   | happy_path | PASS | - |
   | edge_case | PASS | Fixed field mapping |

   ### Fixes Applied
   | Error | Fix | Source |
   |-------|-----|--------|
   | {error} | {fix} | {n8n-brain|pattern} |

   ### Learning
   - Stored {N} new error→fix mappings
   - Updated workflow registry status
   ```

**On ESCALATION:**

1. Record failed action:
   ```
   mcp__n8n-brain__record_action({
     task_description: "Test workflow: {name}",
     outcome: "failure",
     outcome_notes: "Escalated after {N} iterations"
   })
   ```

2. Generate escalation report:
   ```markdown
   ## ESCALATION: Workflow Test Failed

   **Workflow:** {name} ({id})
   **Test Case:** {test_case_name}
   **Iterations Attempted:** {count}

   ### Final Error
   ```
   {error_message}
   ```

   ### Failed Node
   **Name:** {node_name}
   **Type:** {node_type}

   ### Input Data to Failed Node
   ```json
   {input_data}
   ```

   ### Fix Attempts
   | # | Error | Fix Attempted | Result |
   |---|-------|---------------|--------|
   {fix_history_table}

   ### Diagnosis
   {Why fixes didn't work or why escalated}

   ### Recommended Investigation
   1. Check {specific things to look at}
   2. Verify {credentials/config}
   3. Consider {alternative approaches}

   ### Files
   - Test spec: .planning/workflow-tests/specs/{id}.yaml
   - Escalation: .planning/workflow-tests/escalations/{date}/{id}.md
   ```

3. Save escalation report to file

</orchestration>

---

## Test Specification Schema

```yaml
# Required fields
workflow_id: string       # n8n workflow ID
workflow_name: string     # Human-readable name
execution_method: string  # "webhook" | "poll_history" | "manual"

# Test cases (at least one required)
test_cases:
  - name: string          # Unique identifier
    description: string   # What this tests
    input: object         # Payload to send
    expected:
      status: string      # "success" | "error"
      output_contains: object  # Optional: fields to check in output
      error_contains: string   # Optional: if expecting error

# Settings
max_fix_iterations: number  # Default: 5
timeout_seconds: number     # Default: 60

# Optional
critical_nodes: string[]    # Nodes that must succeed
skip_learning: boolean      # Don't store fixes (for testing)
```

---

## Common Issues and Resolutions

| Issue | Resolution |
|-------|------------|
| "Workflow not found" | Check ID/name spelling, ensure workflow exists |
| "No webhook trigger" | Use `execution_method: poll_history` or add webhook node |
| "Credential error" | Register credential with n8n-brain first |
| "Timeout" | Increase `timeout_seconds` in spec |
| "Circular fix" | Manual investigation needed - escalation generated |

---

## Related

- Architecture: @business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md
- n8n-brain: @mcp-servers/n8n-brain/
- Workflow Registry: @CLAUDE.md#workflow-testing-registry
