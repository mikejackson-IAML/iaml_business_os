# N8N Workflow Testing Agent

> **CEO Summary:** An automated system that tests n8n workflows with full node and branch coverage — every single node must execute, every IF/Switch branch must be triggered, and every error path must be verified. It generates seed data, runs multiple executions, diagnoses and fixes failures using the n8n-brain learning layer, and produces a coverage report so thorough that you only need to glance and approve.

---

## Architecture Overview

The Testing Agent orchestrates MCP tools to create an autonomous test loop with full coverage tracking:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     FULL COVERAGE TESTING AGENT                          │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐ │
│  │  Workflow     │  │  Seed Data   │  │  Coverage    │  │  Fix       │ │
│  │  Analyzer    │──▶│  Generator  │──▶│  Tracker    │──▶│  Engine    │ │
│  │              │  │              │  │              │  │            │ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘ │
│         │                 │                 │                 │         │
└─────────┼─────────────────┼─────────────────┼─────────────────┼─────────┘
          │                 │                 │                 │
          ▼                 ▼                 ▼                 ▼
  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐  ┌──────────┐
  │   n8n MCP     │  │  n8n MCP      │  │  n8n MCP      │  │ n8n MCP  │
  │               │  │               │  │               │  │          │
  │ • get_workflow│  │ • test_       │  │ • executions  │  │ • update │
  │ • validate   │  │   workflow    │  │   (get full)  │  │   _work  │
  │              │  │ • run_webhook │  │               │  │   flow   │
  └───────────────┘  └───────────────┘  └───────────────┘  └──────────┘
                                               │
                                               ▼
                                       ┌───────────────┐
                                       │  n8n-brain    │
                                       │               │
                                       │ • lookup_fix  │
                                       │ • store_fix   │
                                       │ • confidence  │
                                       │ • patterns    │
                                       └───────────────┘
```

---

## Core Concept: Full Coverage Testing

Unlike basic "does the workflow run?" testing, full coverage testing ensures:

1. **Every node executes** at least once across all test runs
2. **Every branch is triggered** — both sides of IF nodes, all Switch cases, Filter pass/reject
3. **Error handling chains are verified** — the error path is deliberately triggered
4. **Coverage is measured and reported** — with exact node/branch percentages

This is achieved through **seed data generation** — analyzing branch conditions and creating test payloads that exercise each path.

---

## The 8-Phase Protocol

### Phase 1: Health Check
- Verify n8n MCP connection
- Verify n8n-brain connection
- Set terminal tab name for tracking

### Phase 2: Load & Analyze Workflow
- Fetch workflow structure via `n8n_get_workflow`
- Build **node inventory**: every node with ID, name, type, connections
- Identify **branch points**: IF, Switch, Filter, Router nodes
- Map **all execution paths** through the workflow
- Identify trigger type (webhook, schedule, manual, sub-workflow)

### Phase 3: Seed Data Generation
- For each branch point, read the condition from `parameters`
- Generate test payloads that trigger each branch direction:
  - IF nodes: one payload for true, one for false
  - Switch nodes: one payload per case + default
  - Filter nodes: one that passes, one that's filtered
- Handle non-webhook workflows:
  - Scheduled: use manual trigger via `n8n_test_workflow`
  - Sub-workflows: create temporary webhook test harness
  - Error triggers: deliberately cause an error in the parent workflow

### Phase 4: Structural Compliance (Auto-Fix)
- Check error handling chain exists → add if missing
- Check `business-os` tag → add if missing
- Check `alwaysOutputData` on Postgres nodes → enable if missing
- Validate with strict profile → fix any errors
- Brain lookup before every fix attempt

### Phase 5: Execute All Scenarios
- Initialize coverage tracker (all nodes/branches marked uncovered)
- For each seed data scenario:
  1. Execute workflow via `n8n_test_workflow`
  2. Get execution results with node-level data
  3. Parse `resultData.runData` to identify which nodes executed
  4. Update coverage tracker
  5. If error: brain lookup → fix → re-execute (max 5 per scenario)

### Phase 6: Coverage Gap Filling
- If coverage < 100%, analyze gaps
- Generate additional scenarios targeting uncovered nodes/branches
- Execute gap-filling scenarios (max 3 additional rounds)
- Document any items that can't be tested with reasons

### Phase 7: Finalize & Learn
- Update workflow registry with coverage numbers
- Store new error fixes in n8n-brain
- Report fix results for known fixes
- Record action for confidence calibration
- Save test spec YAML for regression testing

### Phase 8: Verification Report
- Comprehensive report with:
  - Node coverage: X/Y (%)
  - Branch coverage: X/Y (%)
  - Execution table with IDs, scenarios, nodes hit
  - Node coverage map (every node, covered by which execution)
  - Branch coverage map (every branch direction, covered by which execution)
  - Fixes applied with source (brain vs. new)
  - Structural compliance checklist
  - Uncovered items with reasons

---

## Seed Data Generation Strategy

### IF Node Analysis (v1)
```json
{
  "parameters": {
    "conditions": {
      "boolean": [{
        "value1": "={{ $json.items.length }}",
        "value2": 0,
        "operation": "notEqual"
      }]
    }
  }
}
```
→ True payload: `{"items": [{"id": 1}]}` (length > 0)
→ False payload: `{"items": []}` (length = 0)

### IF Node Analysis (v2)
```json
{
  "parameters": {
    "conditions": {
      "options": {
        "rules": [{
          "leftValue": "={{ $json.status }}",
          "rightValue": "active",
          "operator": { "type": "string", "operation": "equals" }
        }]
      }
    }
  }
}
```
→ True payload: `{"status": "active"}`
→ False payload: `{"status": "inactive"}`

### Switch Node Analysis
```json
{
  "parameters": {
    "rules": {
      "values": [
        { "outputKey": "email", "conditions": { "options": { "rules": [{ "leftValue": "={{ $json.channel }}", "rightValue": "email" }] } } },
        { "outputKey": "slack", "conditions": { "options": { "rules": [{ "leftValue": "={{ $json.channel }}", "rightValue": "slack" }] } } }
      ]
    }
  }
}
```
→ Case 1 payload: `{"channel": "email"}`
→ Case 2 payload: `{"channel": "slack"}`
→ Default payload: `{"channel": "unknown"}`

### Non-Webhook Workflows

| Type | Strategy |
|------|----------|
| Schedule | Use `n8n_test_workflow` (manual trigger). Workflow pulls its own data. |
| Sub-workflow | Create temp webhook → Execute Workflow → Respond to Webhook. Delete after. |
| Error Trigger | Trigger error in parent workflow. Verify error chain executes. |

---

## Node Coverage Tracking

After each execution, parse the execution data:

```
Execution Data Structure:
{
  "data": {
    "resultData": {
      "runData": {
        "Webhook": [{ "startTime": "...", "executionTime": 5, "data": {...} }],
        "Parse Data": [{ "startTime": "...", "executionTime": 12, "data": {...} }],
        "IF Check": [{ "startTime": "...", "executionTime": 1, "data": {...} }],
        "Process Items": [{ "startTime": "...", "executionTime": 45, "data": {...} }]
      }
    }
  }
}
```

Every key in `runData` = a node that executed. Compare against the total node list from the workflow definition to calculate coverage.

For branch tracking: check the connection metadata and `sourceOutputIndex` to determine which output of a branch node was taken.

---

## Coverage Thresholds

| Node Coverage | Branch Coverage | Result Status |
|--------------|----------------|--------------|
| 100% | 100% | `verified` (interactive) / `tested` (nightly) |
| >= 90% | >= 80% | `tested` with gaps documented |
| < 90% | < 80% | `needs_review` |

Acceptable reasons for < 100% coverage:
- External service dependencies that can't be mocked
- Destructive operations with no test data
- Rate-limited APIs
- Sub-workflows requiring complex setup

All gaps must be explicitly documented.

---

## Integration Points

### n8n-brain Learning Loop

```
BEFORE TESTING:
├── find_similar_patterns(services) → Reuse proven templates
├── lookup_error_fix(common_errors) → Pre-load known issues
└── calculate_confidence(task) → Determine autonomy level

DURING TESTING:
├── lookup_error_fix(error) → Check for known fix BEFORE debugging
├── get_credential(service) → Get correct credential ID
└── report_fix_result(fix_id, worked) → Track fix effectiveness

AFTER SUCCESS:
├── store_error_fix(error, fix) → Save new fixes for future use
├── record_action(task, outcome="success") → Calibrate confidence
└── store_pattern(workflow) → Save novel patterns

AFTER FAILURE:
├── record_action(task, outcome="failure") → Track failure patterns
└── store_error_fix(error, attempted_fixes) → Even failed fixes are useful
```

### Workflow Registry Integration

Test results update the registry with coverage data:
```sql
SELECT n8n_brain.mark_workflow_tested(
  'workflow_id',
  'verified',
  'test-workflow-auto',
  'Node coverage: 14/14 (100%). Branch coverage: 6/6 (100%). Executions: 3. Fixes: 1.'
);
```

### Test Spec Persistence

After testing, a YAML spec is saved to `.planning/workflow-tests/specs/{id}.yaml` enabling:
- **Regression testing**: replay exact scenarios on future changes
- **Nightly monitoring**: re-run specs to catch regressions
- **Documentation**: human-readable record of what was tested

---

## Entry Points

| Command | Purpose |
|---------|---------|
| `/test-workflow-auto <id>` | Full coverage test of a single workflow |
| `/test-workflow --bulk N` | Test N workflows from queue |
| `/workflow-queue claim` | Claim next workflow for testing |
| `/test-nightly` | Run nightly batch via script |
| `/test-results` | Morning review of nightly results |
| `/done-testing` | Wrap up and release claim |

---

## File Structure

```
.planning/
└── workflow-tests/
    ├── STATE.json              # Current testing state
    ├── specs/                  # Test specifications (YAML)
    │   ├── EXAMPLE.yaml        # Template
    │   └── {workflow_id}.yaml  # Generated per workflow
    ├── results/                # Test execution results
    │   └── YYYY-MM-DD/
    │       ├── {workflow_id}.md # Full test report
    │       ├── SUMMARY.md      # Aggregated summary
    │       ├── results.json    # Machine-readable results
    │       └── nightly-run-*.log
    └── escalations/            # Escalation reports
        └── YYYY-MM-DD/
```

---

## Diagnosis Patterns

| Priority | Error Pattern | Diagnosis | Auto-Fix |
|----------|--------------|-----------|----------|
| 1 | `401/403 Unauthorized` | Credential issue | NO — escalate |
| 2 | `Cannot read property X` | Expression path wrong | YES — fix path |
| 3 | `No items to process` | Empty array | YES — alwaysOutputData |
| 4 | `Invalid JSON` | Expression syntax | YES — fix syntax |
| 5 | `Required field missing` | Node config | YES — add field |
| 6 | `404 Not Found` | Resource ID wrong | MAYBE — check format |
| 7 | `429 Rate Limit` | Too many calls | YES — add Wait node |
| 8 | `ETIMEDOUT/ECONNREFUSED` | Service down | NO — escalate |
| 9 | `Duplicate key` | Upsert needed | YES — add conflict handler |
| 10 | Missing error handling | No error chain | YES — add standard pattern |

---

## Success Criteria

The testing agent is complete when:

1. Every node in the workflow has executed at least once
2. Every branch of every decision node has been triggered
3. Error handling chain has been verified (if present)
4. All fixes are stored in n8n-brain for future use
5. Coverage report is comprehensive enough for human sign-off without re-testing
6. Test spec is saved for regression testing
7. Workflow registry is updated with coverage numbers
