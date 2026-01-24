# Alert-to-Task Automation

> **CEO Summary:** Automatically converts system alerts into trackable tasks in the Action Center, ensuring nothing falls through the cracks. Critical issues become high-priority tasks due immediately; warnings become tasks due this week.

## What It Does

This n8n workflow receives alerts from all Business OS monitoring systems and converts them into tasks. It:

1. **Transforms alert titles** - Uses AI to make titles action-oriented ("SSL Certificate Expiring Soon" becomes "Renew SSL Certificate")
2. **Sets smart due dates** - Critical alerts during business hours are due today; after 6pm they're due next business day 9am
3. **Prevents duplicates** - Won't create multiple tasks for the same ongoing issue
4. **Escalates priority** - If a higher-severity alert arrives for an existing task, bumps the priority
5. **Tracks accumulation** - For low-priority info alerts, creates a task after 3 occurrences in 24 hours

## Trigger

- **Type:** Webhook
- **Path:** `/webhook/alert-to-task`
- **Method:** POST

## Alert Payload

```json
{
  "alert_type": "ssl_expiry",
  "severity": "critical",
  "title": "SSL Certificate Expiring Soon",
  "description": "Certificate for www.iaml.com expires in 7 days",
  "affected_resource": "www.iaml.com",
  "source_system": "ssl_monitor",
  "source_alert_id": "uuid-from-source",
  "metadata": {
    "expiry_date": "2026-02-01",
    "days_remaining": 7
  }
}
```

### Required Fields

| Field | Type | Description |
|-------|------|-------------|
| alert_type | string | Type identifier (e.g., `ssl_expiry`, `uptime_down`) |
| severity | string | One of: `critical`, `warning`, `info` |
| title | string | Alert title from source system |
| affected_resource | string | Resource identifier for deduplication |

### Optional Fields

| Field | Type | Description |
|-------|------|-------------|
| description | string | Detailed alert description |
| source_system | string | Originating system name |
| source_alert_id | string | ID in source system for linking |
| metadata | object | Additional context (passed to due date calculation) |

## Severity Handling

| Severity | Task Priority | Due Date |
|----------|---------------|----------|
| Critical | critical | Today (or next business day 9am if after 6pm) |
| Warning | high | End of week or from metadata |
| Info | low | No due date (only if config allows or 3x/24h threshold) |

## Duplicate Prevention

Tasks use a dedupe key format: `{alert_type}:{affected_resource}`

- **Open task exists:** Skip creation, optionally escalate priority
- **Recently completed:** Respect cooldown period (default 24h, configurable per alert type)
- **Recently dismissed:** Respect dismissal window (default 7 days)

### Priority Escalation

When a higher-severity alert arrives for an existing open task:

| Existing Priority | New Alert Severity | Action |
|-------------------|-------------------|--------|
| normal/low | critical | Escalate to critical |
| high | critical | Escalate to critical |
| high/normal | warning | Escalate if lower |
| Any | info | No escalation |

## Configuration

Alert behavior is configured in `action_center.alert_config`:

| Setting | Default | Description |
|---------|---------|-------------|
| creates_tasks | true | Whether to create tasks for this alert type |
| default_department | varies | Department assigned to tasks |
| info_creates_task | false | If true, info alerts create low-priority tasks |
| accumulation_threshold | 3 | Info alert count to trigger task |
| accumulation_window_hours | 24 | Window for accumulation count |
| cooldown_after_completion_hours | 24 | Don't recreate task during cooldown |
| dismissed_cooldown_days | 7 | Respect dismissal for this many days |

### Viewing Configuration

```sql
SELECT alert_type, display_name, creates_tasks, default_department, info_creates_task
FROM action_center.alert_config
ORDER BY alert_type;
```

## Alert Sources

Currently integrated:

| Alert Type | Source System | Severity | Department |
|------------|---------------|----------|------------|
| ssl_expiry | SSL Monitor | critical | Digital |
| domain_health | Domain Health Checker | warning | Digital |
| uptime_down | Uptime Monitor | critical | Digital |
| tier_ending | Faculty Scheduler | warning | Programs |
| vip_non_response | Faculty Scheduler | warning | Programs |

## Task Resolution

When a task created from an alert is completed:

1. Source alert status updates to 'resolved' (if applicable)
2. Alert occurrences marked as task_created
3. Activity logged on the task with 'alert_resolved' type

This is handled automatically by a database trigger.

## Business Hours

Due date calculation respects business hours:

- **Business hours:** 9am-6pm CT, Monday-Friday
- **Critical after 6pm:** Due next business day 9am
- **Warning alerts:** Default to Friday 5pm if no specific offset

## Error Handling

- Slack alerts to #workflow-alerts on errors
- Fallback title transformation if AI unavailable
- All database operations have error handling
- Invalid payloads return 400 with error details

## n8n Workflow Details

- **Workflow Name:** Alert-to-Task Processor
- **File:** `business-os/workflows/alert-to-task.json`
- **Status:** Active

### Key Nodes

| Node | Purpose |
|------|---------|
| Validate Payload | Ensures required fields present |
| Get Alert Config | Loads per-type configuration |
| Record Occurrence | Logs alert and checks accumulation |
| Route by Severity | Branches critical/warning/info |
| Check for Duplicate | Prevents duplicate task creation |
| Transform with Claude | AI-powered title transformation |
| Calculate Due Date | Business-hours-aware due date |
| Create Task | Inserts into action_center.tasks |

## Related

- [Action Center Tasks](/dashboard/action-center)
- Alert Config: `SELECT * FROM action_center.alert_config`
- Alert Occurrences: `SELECT * FROM action_center.alert_occurrences ORDER BY occurred_at DESC LIMIT 20`
