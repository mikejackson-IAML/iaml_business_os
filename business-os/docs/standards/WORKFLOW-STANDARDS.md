# Workflow Standards

> **CEO Summary:** Every n8n workflow must have standard error handling and a business-os tag to ensure visibility into failures and connection with our dashboard.

---

## Mandatory Requirements

All n8n workflows in the Business OS must have:

### 1. `business-os` Tag

Every workflow must be tagged with `business-os` to:
- Identify it as part of the managed Business OS
- Enable filtering and reporting
- Track testing status in the workflow registry

### 2. Standard Error Handling Pattern

Every workflow must include the error handling pattern that:
- Catches all errors
- Logs to database (dashboard visibility)
- Sends Slack notification
- Marks notification as sent

---

## Error Handling Pattern

The pattern consists of 5 nodes connected in sequence:

```
Error Trigger → Parse Error Details → Log Error to DB → Send Error Slack → Mark Error Notified
```

### Node Details

#### 1. Error Trigger
- **Type:** `n8n-nodes-base.errorTrigger`
- **Purpose:** Catches any workflow error

#### 2. Parse Error Details
- **Type:** `n8n-nodes-base.code`
- **Purpose:** Extracts error information into structured format
- **Code:**
```javascript
const error = $input.first().json;
const staticData = $getWorkflowStaticData('global');
const runId = staticData.run_id || null;

const errorData = {
  run_id: runId,
  workflow_name: '{{WORKFLOW_NAME}}',  // Replace with actual name
  workflow_id: '{{WORKFLOW_ID}}',       // Replace with actual ID
  execution_id: $execution.id,
  error_message: error.message || error.error?.message || 'Unknown error',
  error_node: error.node?.name || error.workflow?.lastNodeExecuted || 'Unknown',
  error_node_type: error.node?.type || 'unknown',
  error_details: JSON.stringify(error),
  timestamp: new Date().toISOString()
};

return [{ json: errorData }];
```

#### 3. Log Error to DB
- **Type:** `n8n-nodes-base.postgres`
- **Credential:** Supabase Postgres (ID: `EgmvZHbvINHsh6PR`)
- **Query:**
```sql
SELECT * FROM n8n_brain.log_workflow_error(
  {{ $json.run_id ? "'" + $json.run_id + "'::uuid" : 'NULL' }},
  '{{ $json.error_message.replace(/'/g, "''") }}',
  '{{ $json.error_node }}',
  '{{ $json.error_node_type }}',
  '{{ $json.error_details }}'::jsonb
);
```
- **Settings:** `continueOnFail: true`

#### 4. Send Error Slack
- **Type:** `n8n-nodes-base.httpRequest`
- **URL:** `https://hooks.slack.com/services/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`
- **Settings:** `continueOnFail: true`

#### 5. Mark Error Notified
- **Type:** `n8n-nodes-base.postgres`
- **Credential:** Supabase Postgres
- **Query:**
```sql
SELECT n8n_brain.mark_notifications_sent(
  '{{ $json.run_id }}'::uuid,
  true,
  false
);
```
- **Settings:** `continueOnFail: true`

---

## Retrieving the Pattern

The pattern is stored in n8n-brain and can be retrieved:

```
mcp__n8n-brain__find_similar_patterns({
  description: "error handling",
  tags: ["error-handling"]
})
```

Pattern ID: `235e56be-d444-4c62-a2c4-9ae3e8db279b`

---

## Adding to a Workflow

### Option 1: Manual
1. Open the workflow in n8n
2. Add the 5 nodes as described above
3. Replace `{{WORKFLOW_NAME}}` and `{{WORKFLOW_ID}}`
4. Connect Error Trigger to the first node
5. Add `business-os` tag

### Option 2: Via Testing Agent
When running `/test-workflow`, the agent will:
1. Check if error handling pattern exists
2. Check if `business-os` tag exists
3. Report missing components
4. Add tag automatically (error handling requires manual addition due to complexity)

---

## Nightly Testing

Workflows are tested nightly using:

```bash
./scripts/test-workflows-nightly.sh
```

The script:
1. Tests 3 priority workflows by default
2. Verifies error handling pattern
3. Adds `business-os` tag if missing
4. Runs test cases if spec exists
5. Generates summary report

Results are saved to: `.planning/workflow-tests/results/{date}/`

---

## Compliance Checklist

Before marking a workflow as production-ready:

- [ ] Has `business-os` tag
- [ ] Has Error Trigger node
- [ ] Has Parse Error Details code node
- [ ] Has Log Error to DB postgres node
- [ ] Has Send Error Slack HTTP node
- [ ] Has Mark Error Notified postgres node
- [ ] Error handling chain is fully connected
- [ ] Registered in workflow registry
- [ ] Test specification created (optional but recommended)

---

## Related

- Error Handling Pattern in n8n-brain: Pattern ID `235e56be-d444-4c62-a2c4-9ae3e8db279b`
- Testing Agent: `.claude/skills/test-workflow.md`
- Nightly Script: `scripts/test-workflows-nightly.sh`
- Workflow Registry: `supabase/migrations/20260111_create_n8n_brain_schema.sql`
