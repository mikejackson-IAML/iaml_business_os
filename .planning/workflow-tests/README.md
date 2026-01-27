# Workflow Tests

> **CEO Summary:** Automated testing infrastructure for n8n workflows that catches errors before they impact operations and learns from each fix.

---

## Quick Start

```bash
# Test a workflow
/test-workflow HnZQopXL7xjZnX3O

# Create test spec for a new workflow
/test-workflow "My Workflow Name" --create-spec

# Run specific test case
/test-workflow HnZQopXL7xjZnX3O --test-case happy_path
```

---

## Directory Structure

```
.planning/workflow-tests/
├── README.md                    # This file
├── STATE.json                   # Current testing state
├── DIAGNOSIS-PATTERNS.md        # Error diagnosis reference
├── specs/                       # Test specifications
│   ├── EXAMPLE.yaml             # Template spec
│   └── {workflow-id}.yaml       # Your workflow specs
├── results/                     # Test execution results
│   └── {date}/
│       └── {workflow-id}-result.json
└── escalations/                 # Human escalation reports
    └── {date}/
        └── {workflow-id}-escalation.md
```

---

## How It Works

### 1. Test Specification

Each workflow needs a test spec (YAML file) that defines:
- Test cases with input data
- Expected outcomes
- Critical nodes that must succeed

See `specs/EXAMPLE.yaml` for a complete template.

### 2. Test Execution

The testing agent:
1. Loads the workflow and test spec
2. Executes each test case
3. Compares results against expectations
4. If test fails → diagnose and attempt fix
5. Loop until success or max iterations

### 3. Diagnosis

When a test fails, the agent:
1. Checks n8n-brain for known fixes
2. Runs pattern-based diagnosis
3. Generates a fix
4. Updates the workflow
5. Retries the test

### 4. Learning

After successful fixes:
- Error→fix mappings stored in n8n-brain
- Workflow registry updated
- Fix success rates tracked

---

## Creating Test Specifications

### Minimal Spec

```yaml
workflow_id: "HnZQopXL7xjZnX3O"
workflow_name: "My Workflow"
execution_method: "webhook"

test_cases:
  - name: "happy_path"
    input:
      key: "value"
    expected:
      status: "success"
```

### Full Spec Options

```yaml
workflow_id: "HnZQopXL7xjZnX3O"
workflow_name: "My Workflow"
execution_method: "webhook"  # or "poll_history"

test_cases:
  - name: "test_name"
    description: "What this tests"
    input: { data: "here" }
    expected:
      status: "success"  # or "error"
      output_contains:
        field: "expected_type"
      error_contains: "expected message"

max_fix_iterations: 5
timeout_seconds: 60
critical_nodes:
  - "Important Node"
skip_learning: false
```

---

## Execution Methods

| Method | When to Use |
|--------|-------------|
| `webhook` | Workflow has Webhook trigger node |
| `poll_history` | Scheduled or manual trigger workflows |

For `poll_history`, the agent monitors execution history for new completions.

---

## Escalation

The agent escalates to human when:
- Authentication/credential errors occur
- Max fix iterations reached
- Same error repeats (circular fix)
- Pattern diagnosis fails

Escalation reports are saved to `escalations/` with full context for investigation.

---

## Related

- Skill: `.claude/skills/test-workflow.md`
- Architecture: `business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md`
- n8n-brain: `mcp-servers/n8n-brain/`
- Workflow Registry: See CLAUDE.md
