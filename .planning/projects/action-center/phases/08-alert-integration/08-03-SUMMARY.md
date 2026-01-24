# Plan 08-03: Alert-to-Task n8n Workflow Skeleton - SUMMARY

**Status:** COMPLETE
**Completed:** 2026-01-24

## What Was Built

Created a complete n8n workflow skeleton for processing alert webhooks and routing them to task creation. The workflow handles the full lifecycle from webhook receipt through duplicate detection and severity-based routing.

## Files Created

| File | Purpose |
|------|---------|
| `business-os/workflows/alert-to-task.json` | n8n workflow JSON with all nodes and connections |

## Workflow Structure

### Nodes Implemented (17 total)

1. **Alert Webhook** - POST endpoint at `/webhook/alert-to-task`
2. **Validate Payload** - Validates required fields (alert_type, severity, title, affected_resource)
3. **Get Alert Config** - Queries `action_center.alert_config` for per-type settings
4. **Merge Config with Payload** - Combines config with alert data, applies defaults
5. **Record Occurrence** - Calls `action_center.record_alert_occurrence()` for accumulation
6. **Merge Occurrence Result** - Adds occurrence_id and accumulation status
7. **Route by Severity** - Switch node with critical/warning/info paths
8. **Set Critical Priority** - Sets task_priority = 'critical', proceed_to_task = true
9. **Set Warning Priority** - Sets task_priority = 'high', proceed_to_task = true
10. **Check Info Exceptions** - Evaluates info_creates_task config and accumulation threshold
11. **Should Proceed?** - IF node to filter info alerts that don't need tasks
12. **Skip - No Task Needed** - Response for skipped info alerts
13. **Merge All Paths** - Combines critical/warning/info paths for dedupe check
14. **Check for Duplicate** - Queries existing tasks by dedupe_key with cooldown logic
15. **Handle Duplicate Check** - Determines action: create, escalate, or skip
16. **Route by Action** - Switch node for create/escalate/skip paths
17. **Create Task (Placeholder)** - Marked for AI transformation in 08-04
18. **Escalate Priority** - Updates existing task to higher priority
19. **Various Response Nodes** - Format success/skip/escalate/error responses
20. **Error Handler + Slack Alert** - Catches errors, sends Slack notification

### Key Flow Logic

```
Webhook → Validate → Get Config → Record Occurrence
         ↓
    Route by Severity
    ├── Critical → Set priority, proceed
    ├── Warning → Set priority, proceed
    └── Info → Check exceptions → Skip or proceed
                ↓
         Merge All Paths
                ↓
         Check Dedupe
    ├── No duplicate → Create task (placeholder)
    ├── Duplicate open, higher severity → Escalate priority
    └── Duplicate (any other) → Skip
```

### Credentials Used

- **Supabase Postgres** (ID: EgmvZHbvINHsh6PR) - Database queries
- **Slack Webhook** - Error alerts to #workflow-alerts

## Must-Haves Verified

| Requirement | Status |
|-------------|--------|
| Webhook accepts POST with alert payload | DONE |
| Severity routing splits into three paths | DONE |
| All paths record occurrence via record_alert_occurrence | DONE |
| Info path checks config and accumulation | DONE |

## Next Steps

1. **08-04:** Replace Create Task placeholder with AI title transformation and actual Task API call
2. **08-05:** Implement full duplicate detection logic
3. **08-06:** Add business hours due date calculation
4. **08-07:** Connect existing monitors to webhook

## Notes

- Workflow created inactive (active: false)
- Uses Supabase credential already registered in n8n-brain
- Placeholder node includes note about 08-04 implementation
- Error handler logs to Slack for visibility

---

*Completed: 2026-01-24*
