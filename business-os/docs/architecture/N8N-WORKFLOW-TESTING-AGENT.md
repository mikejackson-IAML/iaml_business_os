# N8N Workflow Testing Agent

> **CEO Summary:** An automated system that tests n8n workflows, diagnoses failures using the n8n-brain learning layer, applies fixes, and learns from each resolution to prevent the same errors in the future.

---

## Architecture Overview

The Testing Agent orchestrates existing MCP tools to create an autonomous test-diagnose-fix loop:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TESTING AGENT ORCHESTRATOR                       │
│                                                                          │
│  ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐     │
│  │  Test           │    │  Diagnosis      │    │  Fix            │     │
│  │  Specification  │───▶│  Engine         │───▶│  Applier        │     │
│  │  Parser         │    │                 │    │                 │     │
│  └─────────────────┘    └─────────────────┘    └─────────────────┘     │
│           │                      │                      │               │
└───────────┼──────────────────────┼──────────────────────┼───────────────┘
            │                      │                      │
            ▼                      ▼                      ▼
    ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
    │   n8n MCP     │      │  n8n-brain    │      │   n8n MCP     │
    │               │      │               │      │               │
    │ • run_webhook │      │ • lookup_     │      │ • update_     │
    │ • get_exec    │      │   error_fix   │      │   workflow    │
    │ • list_exec   │      │ • store_      │      │ • activate    │
    │ • get_workflow│      │   error_fix   │      │               │
    └───────────────┘      │ • calculate_  │      └───────────────┘
                           │   confidence  │
                           └───────────────┘
```

---

## Core Components

### 1. Test Specification Schema

Each workflow requires a test specification (stored in `.planning/workflow-tests/`):

```yaml
# test-spec.yaml
workflow_id: "HnZQopXL7xjZnX3O"
workflow_name: "Airtable to GHL Contact Sync"
execution_method: "webhook"  # or "poll_history" for scheduled workflows

# Test cases
test_cases:
  - name: "happy_path"
    description: "Standard contact with all fields"
    input:
      firstName: "John"
      lastName: "Doe"
      email: "john@example.com"
      phone: "555-1234"
    expected:
      status: "success"
      output_contains:
        contactId: "string"

  - name: "missing_optional_field"
    description: "Contact without phone number"
    input:
      firstName: "Jane"
      lastName: "Smith"
      email: "jane@example.com"
    expected:
      status: "success"

  - name: "invalid_email"
    description: "Should handle gracefully"
    input:
      firstName: "Bad"
      lastName: "Email"
      email: "not-an-email"
    expected:
      status: "error"
      error_contains: "invalid email"

# Execution settings
max_fix_iterations: 5
timeout_seconds: 60

# Critical nodes that must succeed
critical_nodes:
  - "GHL Create Contact"
  - "Airtable Trigger"
```

### 2. Execution Methods

#### Method A: Webhook Execution (Direct)

For workflows with Webhook trigger nodes:

```
1. n8n.run_webhook(workflowName, testData)
2. n8n.get_execution(executionId) → detailed results
```

#### Method B: Poll History (Scheduled/Manual)

For scheduled or manual trigger workflows:

```
1. Activate workflow: n8n.activate_workflow(id)
2. Trigger externally (manual click, wait for schedule)
3. Poll: n8n.list_executions(workflowId, status="*")
4. Wait for new execution to appear
5. n8n.get_execution(executionId) → detailed results
```

#### Method C: Test Harness (Recommended for Complex Testing)

Create a test harness workflow that:
1. Accepts test payload via webhook
2. Calls target workflow via Execute Workflow node
3. Returns results directly

This enables testing ANY workflow type via webhook.

### 3. Diagnosis Engine

When execution fails, the diagnosis engine:

```
┌─────────────────────────────────────────────────────────────────────┐
│                      DIAGNOSIS FLOW                                  │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │ Extract Error Context  │
                 │ • error_message        │
                 │ • failed_node          │
                 │ • input_data           │
                 │ • upstream_outputs     │
                 └────────────────────────┘
                              │
                              ▼
                 ┌────────────────────────┐
                 │ n8n-brain:             │
                 │ lookup_error_fix()     │
                 └────────────────────────┘
                              │
              ┌───────────────┴───────────────┐
              │                               │
        KNOWN FIX                       NO KNOWN FIX
              │                               │
              ▼                               ▼
     ┌────────────────┐           ┌────────────────────┐
     │ Apply Known    │           │ Pattern Matching   │
     │ Fix            │           │ Diagnosis          │
     └────────────────┘           └────────────────────┘
                                              │
                                              ▼
                                  ┌────────────────────┐
                                  │ Generate Fix or    │
                                  │ ESCALATE           │
                                  └────────────────────┘
```

#### Error Pattern Matching

| Error Pattern | Diagnosis | Auto-Fix Strategy |
|---------------|-----------|-------------------|
| `Cannot read property 'X' of undefined` | Field path mismatch | Compare expression to actual input, suggest correct path |
| `No items to process` | Empty array from previous node | Add IF node with empty check, or use "Always Output Data" |
| `Invalid JSON` | Malformed expression | Parse and fix JSON syntax |
| `401 / 403 Unauthorized` | Credential issue | **ESCALATE** - requires human |
| `Resource not found` | Invalid ID reference | Check ID format, may need lookup |
| `Timeout` | External service slow | Increase timeout setting |
| `Rate limit exceeded` | Too many API calls | Add delay/backoff |
| `Required field missing` | Node config incomplete | Check schema, add missing field |

### 4. State Management

Testing state is tracked in `.planning/workflow-tests/STATE.json`:

```json
{
  "current_test": {
    "workflow_id": "HnZQopXL7xjZnX3O",
    "test_case": "happy_path",
    "iteration": 2,
    "status": "fixing"
  },
  "fix_history": [
    {
      "iteration": 1,
      "error": "Cannot read property 'email' of undefined",
      "fix_applied": "Changed expression from $json.email to $json.contact.email",
      "fix_source": "n8n-brain lookup",
      "result": "still_failing"
    }
  ],
  "learning_queue": []
}
```

---

## Orchestration Flow

### Main Loop (RALPH-Inspired)

```
┌─────────────────────────────────────────────────────────────────────┐
│                          MAIN LOOP                                   │
└─────────────────────────────────────────────────────────────────────┘

STEP 1: INITIALIZE
├── Load test specification
├── Set iteration = 0
├── Initialize fix_history = []
└── Load workflow: n8n.get_workflow(id)

STEP 2: PRE-FLIGHT CHECK
├── n8n-brain.calculate_confidence(task)
├── Validate workflow structure
└── Check credentials: n8n-brain.get_credential(services)

STEP 3: EXECUTE TEST ◄────────────────────────────────────────┐
├── Execute workflow with test payload                         │
├── Wait for completion (webhook) or poll (scheduled)          │
└── n8n.get_execution(id) → detailed results                   │
                                                               │
STEP 4: EVALUATE RESULTS                                       │
├── Parse execution data                                       │
├── Compare against expected outcomes                          │
└── If SUCCESS → STEP 8                                        │
    If FAILURE → STEP 5                                        │
                                                               │
STEP 5: DIAGNOSE FAILURE                                       │
├── Extract: error_message, failed_node, input_data            │
├── n8n-brain.lookup_error_fix(error, node_type)               │
└── If KNOWN FIX → STEP 6                                      │
    If UNKNOWN → Run diagnosis patterns → STEP 6 or ESCALATE   │
                                                               │
STEP 6: APPLY FIX                                              │
├── Generate fixed workflow JSON                               │
├── n8n.update_workflow(id, fixed_json)                        │
├── Add to fix_history                                         │
└── iteration++                                                │
                                                               │
STEP 7: ITERATION CHECK                                        │
├── If iteration >= max_iterations → ESCALATE                  │
├── If same error repeating → ESCALATE (circular fix)          │
└── Else → LOOP BACK TO STEP 3 ────────────────────────────────┘

STEP 8: FINALIZE
├── If fix was applied: n8n-brain.store_error_fix(error, fix)
├── n8n-brain.record_action(outcome)
├── Update workflow registry: mark_workflow_tested()
└── Return SUCCESS report
```

### Escalation Protocol

When the agent cannot resolve an issue:

```markdown
## ESCALATION: Workflow Test Failed

**Workflow:** {name} ({id})
**Test Case:** {test_case_name}
**Iterations Attempted:** {count}

### Error Summary
{final_error_message}

### Failed Node
**Node:** {node_name}
**Type:** {node_type}
**Input Data:**
```json
{input_data}
```

### Fix Attempts
| # | Error | Fix Attempted | Result |
|---|-------|---------------|--------|
| 1 | ... | ... | ... |

### Diagnosis
{Why fixes didn't work}

### Recommended Action
{Suggested manual investigation}

### Context Files
- Workflow JSON: {path}
- Execution data: {path}
```

---

## Integration with Existing Systems

### n8n-brain Learning Loop

```
┌─────────────────────────────────────────────────────────────────────┐
│                    LEARNING INTEGRATION                              │
└─────────────────────────────────────────────────────────────────────┘

BEFORE TESTING:
├── find_similar_patterns(services) → Check for existing templates
├── lookup_error_fix(common_errors) → Pre-load known issues
└── calculate_confidence(task) → Determine autonomy level

DURING TESTING:
├── lookup_error_fix(error) → Check for known solution
└── get_credential(service) → Get correct credential ID

AFTER SUCCESS:
├── store_error_fix(error, fix) → Save for future use
├── report_fix_result(fix_id, worked=true) → Update success rate
├── record_action(task, outcome="success") → Log for confidence calibration
└── store_pattern(workflow) → If novel pattern worth saving

AFTER FAILURE (escalation):
├── record_action(task, outcome="failure") → Log for analysis
└── store_error_fix(error, attempted_fixes) → Even failed fixes are useful
```

### GSD Integration

The testing agent follows GSD patterns:

| GSD Pattern | Testing Agent Equivalent |
|-------------|-------------------------|
| STATE.md | `.planning/workflow-tests/STATE.json` |
| SUMMARY.md | Test execution report |
| Checkpoint protocol | Escalation to human |
| Deviation rules | Auto-fix vs escalate logic |
| Wave execution | Multiple test cases in parallel |

### Workflow Registry Integration

After successful testing, update the registry:

```sql
SELECT n8n_brain.mark_workflow_tested(
  'HnZQopXL7xjZnX3O',
  'verified',
  'testing-agent',
  'All 3 test cases passed. Fixed field mapping issue.'
);
```

---

## Implementation Plan

### Phase 1: Core Infrastructure

1. **Test specification parser** - YAML/JSON schema validation
2. **Execution wrapper** - Handle webhook vs poll methods
3. **Result comparator** - Match execution output against expectations

### Phase 2: Diagnosis Engine

1. **Error extraction** - Parse execution data structure
2. **Pattern matcher** - Implement diagnosis rules
3. **Fix generator** - Create corrected workflow JSON

### Phase 3: Orchestration Loop

1. **Main loop** - Implement iteration control
2. **State tracking** - Persist progress across retries
3. **Escalation** - Format reports for human review

### Phase 4: Learning Integration

1. **n8n-brain hooks** - Connect lookup/store at right points
2. **Confidence scoring** - Use scores to adjust autonomy
3. **Pattern storage** - Save successful workflows

---

## File Structure

```
.planning/
└── workflow-tests/
    ├── STATE.json              # Current testing state
    ├── specs/                  # Test specifications
    │   ├── airtable-to-ghl.yaml
    │   └── smartlead-sync.yaml
    ├── results/                # Test execution results
    │   └── 2026-01-20/
    │       └── airtable-to-ghl-result.json
    └── escalations/            # Escalation reports
        └── 2026-01-20/
            └── smartlead-sync-escalation.md
```

---

## Skill Entry Point

The testing agent is invoked via skill:

```
/test-workflow <workflow_id_or_name> [--test-case <name>] [--all]
```

Options:
- `workflow_id_or_name`: Target workflow
- `--test-case`: Run specific test case
- `--all`: Run all test cases
- `--create-spec`: Interactive test spec creation
- `--dry-run`: Validate without executing

---

## Success Criteria

The testing agent is complete when:

1. ✅ Can execute workflows via webhook or poll
2. ✅ Diagnoses failures using n8n-brain lookups
3. ✅ Applies fixes and retries automatically
4. ✅ Learns from successful fixes
5. ✅ Escalates appropriately when stuck
6. ✅ Integrates with workflow registry
7. ✅ Follows GSD patterns for state management
