# 04-03 Summary: Cancellation Re-release Workflow

## Status: Complete

## Deliverables

| Deliverable | Location |
|-------------|----------|
| n8n Workflow | `FCUm05vNbAmi6vdd` |
| URL | https://n8n.realtyamp.ai/workflow/FCUm05vNbAmi6vdd |
| Webhook | https://n8n.realtyamp.ai/webhook/faculty-scheduler-rerelease |

## What Was Built

**Faculty Scheduler - Cancellation Re-release** workflow that:
- Receives webhook POST when admin cancels a claim
- Validates program is in active tier (tier_0, tier_1, tier_2)
- Queries eligible instructors via `get_instructors_for_rerelease()`
- Sends urgent re-release emails via SendGrid
- Logs notifications with type='rerelease'
- Returns JSON response with instructor count
- Includes Canary error handling

### Webhook Payload
```json
{
  "program_id": "uuid",
  "block_id": "uuid",
  "block_name": "Block 1",
  "cancelled_by": "admin"
}
```

### Response Format
```json
{"success": true, "instructors_notified": 5}
```

### Key Patterns Applied
- Webhook body access: `$json.body.field`
- Explicit node references: `$('Prepare Email Data').item.json.*`
- If condition: `status` starts with `tier_`
- SplitInBatches for instructor loop

## Commits

| Hash | Description |
|------|-------------|
| (via API) | Workflow created, fixed, and activated in n8n |

## Issues Encountered

1. **SendGrid credential not linked after import** - Manual credential selection required
2. **SendGrid missing Sender Name and Message Body** - Fields needed manual configuration
3. **If condition wrong** - Changed from "contains" to "starts with" for tier check
4. **Data flow after SplitInBatches** - Required explicit node references instead of $json
5. **Log Notification empty instructor data** - Fixed by referencing Prepare Email Data node

## Deviations from Plan

- Simplified email body (plain text vs full HTML) for faster testing
- Added explicit node references throughout for data flow reliability

## Learnings Logged to n8n-brain

1. SendGrid nodes require explicit Sender Name and Message Body after import
2. After action nodes (SendGrid), use `$('SourceNode').item.json.*` to access original data
