# GSD Input Required

> **CEO Summary:** Sends Slack notifications when Claude Cloud needs human input during automated project execution, so you never miss a decision point.

## What It Does

When running GSD projects in Claude Cloud, Claude may hit checkpoints requiring human decisions, verification, or authentication. This workflow sends an instant Slack notification to #claude-needs-input so you can respond promptly without constantly monitoring the Claude session.

## Trigger

- **Type:** Webhook (POST)
- **URL:** `https://n8n.realtyamp.ai/webhook/gsd-input`

## Data Flow

1. Claude Cloud POSTs webhook when input is needed
2. Workflow extracts and validates payload
3. Builds formatted Slack message with context
4. Sends to #claude-needs-input channel
5. Returns success response to Claude

## Webhook Payload

```json
{
  "type": "checkpoint|decision|blocked|verification",
  "project": "project-name",
  "phase": "3",
  "plan": "03-02",
  "summary": "UI verification needed - dashboard layout",
  "details": "Visit https://preview.vercel.app and confirm responsive layout",
  "action_needed": "Type 'approved' or describe issues",
  "session_url": "https://claude.ai/chat/abc123"
}
```

### Field Reference

| Field | Required | Description |
|-------|----------|-------------|
| `type` | Yes | Notification type: `checkpoint`, `decision`, `blocked`, `verification` |
| `project` | Yes | Project identifier |
| `phase` | No | Current phase number |
| `plan` | No | Current plan ID (e.g., "03-02") |
| `summary` | Yes | Brief description of what's needed |
| `details` | No | Additional context or instructions |
| `action_needed` | Yes | What the user should do |
| `session_url` | No | Link to Claude session for quick access |

### Notification Types

| Type | Emoji | Description |
|------|-------|-------------|
| `checkpoint` | :pause_button: | Claude hit a task requiring verification or human action |
| `decision` | :thinking_face: | Architectural or implementation choice required |
| `blocked` | :octagonal_sign: | Authentication gate, failure, or dependency issue |
| `verification` | :white_check_mark: | Phase complete, needs human verification |

## Slack Message Format

```
:pause_button: GSD Input Required

Project: my-project
Type: checkpoint

Phase: 3 | Plan: 03-02

Summary:
UI verification needed - dashboard layout

Details:
Visit https://preview.vercel.app and confirm responsive layout

Action needed:
Type 'approved' or describe issues

[Open Claude Session]

---
Received at 2026-01-26T10:30:00Z
```

## Integrations

| Service | Purpose |
|---------|---------|
| Slack | Notification delivery to #claude-needs-input |

## Alerts

- Failed webhook delivery logs error to n8n execution log
- Missing Slack credentials will cause workflow failure

## Setup

### Prerequisites

1. **Slack incoming webhook:** Configure a Slack incoming webhook for your target channel
2. **n8n access:** Access to n8n.realtyamp.ai

### After Importing

1. Update the Slack webhook URL in the "Send to Slack" HTTP Request node
2. Activate the workflow
3. **Register in workflow registry**:
   ```sql
   SELECT n8n_brain.register_workflow(
     'YIr6VqggeG6N0s1Y'::TEXT,
     'GSD Input Required'::TEXT,
     'operations'::TEXT,
     'Operations'::TEXT,
     'webhook'::TEXT,
     NULL::TEXT,
     'Sends Slack notifications when Claude Cloud needs human input during GSD execution'::TEXT,
     ARRAY['slack']::TEXT[],
     FALSE,  -- has_error_handling (simple webhook flow)
     TRUE,   -- has_slack_alerts (this IS the slack alert workflow)
     FALSE   -- has_dashboard_logging
   );
   ```
4. Test with:
   ```bash
   curl -X POST "https://n8n.realtyamp.ai/webhook/gsd-input" \
     -H "Content-Type: application/json" \
     -d '{"type":"test","project":"test-project","summary":"Test notification","action_needed":"Confirm you received this"}'
   ```

## Related

- [GSD Execution Workflow](../../.claude/get-shit-done/workflows/execute-phase.md)
- [GSD Checkpoint Reference](../../.claude/get-shit-done/references/checkpoints.md)
