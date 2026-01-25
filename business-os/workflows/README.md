# Business OS Workflows

n8n workflows for the Business OS automation platform.

## Uptime Monitor

**File:** `uptime-monitor.json`
**n8n Workflow ID:** `QBS1n2E0IFDyhR7y`
**Status:** Active
**URL:** https://n8n.realtyamp.ai/workflow/QBS1n2E0IFDyhR7y

Monitors www.iaml.com every 5 minutes and sends alerts via Slack and SendGrid email if the site is down.

### Current Configuration

- **Target:** https://www.iaml.com
- **Frequency:** Every 5 minutes
- **Timeout:** 30 seconds
- **Slack Channel:** Configured via webhook
- **Email:** mike.jackson@iaml.com (via SendGrid)

### How It Works

```
Schedule (5 min) → HTTP GET iaml.com → Check Status → Alert if Down
                                          ↓
                               Site Up? → Log success (no action)
                                          ↓
                               Site Down? → Slack Alert + Email Alert
```

### Alert Format

**Slack:**
```
:rotating_light: ALERT: iaml.com is DOWN

Status Code: 503
Error: Service Unavailable
Checked At: 2026-01-13T10:30:00Z

Please investigate immediately.
```

### Storing in n8n-brain

After importing and testing, store this pattern for future reference:

```javascript
// Via n8n-brain MCP tool: store_pattern
{
  "name": "Uptime Monitor",
  "description": "Monitors a website every 5 minutes and sends Slack/email alerts if down",
  "workflow_json": <contents of uptime-monitor.json>,
  "tags": ["monitoring", "uptime", "alerts"],
  "services": ["slack", "email"],
  "node_types": ["scheduleTrigger", "httpRequest", "if", "set", "slack", "emailSend"],
  "trigger_type": "schedule",
  "notes": "First worker in Business OS Phase 1. Uses error output for HTTP failures."
}
```

---

## HeyReach Activity Receiver

**n8n Workflow ID:** `9bt5BdyoosqB8ChU`
**Status:** Active
**Trigger:** Webhook
**URL:** https://n8n.realtyamp.ai/workflow/9bt5BdyoosqB8ChU
**Documentation:** [README-heyreach-activity-receiver.md](README-heyreach-activity-receiver.md)

Receives LinkedIn activity webhooks from HeyReach, logs to campaign tracking, classifies replies with Gemini AI, and routes qualified leads to GHL.

### How It Works

```
HeyReach Webhook → Normalize URL → Check Duplicate → Lookup/Create Contact
                                                            ↓
                                              Get Campaign Context → Log Activity
                                                            ↓
                                              Is Reply? → Gemini AI Classification
                                                            ↓
                                              Assign GHL Branch → Push to GHL
```

### Services

- HeyReach (webhook source)
- Supabase (contact & activity storage)
- Gemini AI (reply classification)
- GHL (CRM routing)

---

## Faculty Scheduler - Cancellation Re-release

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Webhook (POST)
**URL:** `https://n8n.realtyamp.ai/webhook/faculty-scheduler-rerelease`
**Documentation:** [README-faculty-scheduler-rerelease.md](README-faculty-scheduler-rerelease.md)

Instantly notifies all qualified instructors when a teaching spot opens up due to cancellation, giving them a chance to claim the newly available block.

### How It Works

```
Webhook (cancel event) → Get Program Details → Check Active Tier
                                                      ↓
                         Program Active? → Get Eligible Instructors
                                                      ↓
                         Loop → SendGrid Email → Log Notification
                                                      ↓
                         Return count notified
```

### Webhook Payload

```json
{
  "program_id": "uuid",
  "block_id": "uuid",
  "block_name": "Block 1",
  "cancelled_by": "admin"
}
```

### Services

- Supabase (program data, instructor lookup, notification logging)
- SendGrid (email delivery)
- Slack (error alerts)

---

## Faculty Scheduler - Dashboard Alerts

**n8n Workflow ID:** TBD (optional workflow)
**Status:** Recommended (not required)
**Trigger:** Schedule (every 15 minutes)
**Documentation:** [README-faculty-scheduler-alerts.md](README-faculty-scheduler-alerts.md)

Automatically checks for programs at risk and unresponsive VIP instructors, keeping dashboard alerts up-to-date.

### How It Works

```
Schedule (15 min) → Call refresh_alerts() → Log Results
                                                ↓
                            Creates tier_ending alerts (critical)
                            Creates vip_non_response alerts (warning)
                            Auto-resolves when conditions change
```

### Note

This workflow is **optional**. The dashboard queries already call `refresh_alerts()` on page load for on-demand refresh. The periodic workflow provides belt-and-suspenders coverage for time-based alerts.

### Services

- Supabase (RPC call to refresh_alerts function)
- Slack (error alerts)

---

## Alert-to-Task Processor

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Webhook (POST)
**URL:** `https://n8n.realtyamp.ai/webhook/alert-to-task`
**Documentation:** [README-alert-to-task.md](README-alert-to-task.md)

Automatically converts system alerts into trackable tasks in the Action Center. Critical issues become high-priority tasks due immediately; warnings become tasks due this week.

### How It Works

```
Alert Webhook → Validate → Get Config → Record Occurrence
                                              ↓
                          Route by Severity → Check Duplicates
                                              ↓
                          AI Transform Title → Calculate Due Date
                                              ↓
                          Create Task → Return Response
```

### Key Features

- **AI-powered titles** - Transforms alert titles into actionable task titles
- **Smart deduplication** - Prevents duplicate tasks, escalates priority if needed
- **Business hours** - Critical alerts after 6pm due next business day 9am
- **Accumulation** - Info alerts create task after 3 occurrences in 24 hours

### Services

- Anthropic Claude (AI title transformation)
- Supabase (task creation, deduplication, configuration)
- Slack (error alerts)

---

## Recurring Rules Executor

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Daily 7:00 AM CT)
**Documentation:** [README-task-rules-executor.md](README-task-rules-executor.md)

Executes daily/weekly/monthly task rules from the Action Center. Creates tasks on schedule for things like daily standup, weekly review, and monthly reports.

### How It Works

```
Schedule (7am CT) → Call Execute Rules API → Process Active Rules
                                                      ↓
                          For each rule → Check dedupe key → Create task
                                                      ↓
                          Errors? → Slack Alert
```

### Services

- Dashboard API (execute rules endpoint)
- Supabase (task storage)
- Slack (error alerts)

---

## Condition Rules Executor

**n8n Workflow ID:** TBD (import pending)
**Status:** Ready to Import
**Trigger:** Schedule (Daily 7:05 AM CT)
**Documentation:** [README-task-rules-executor.md](README-task-rules-executor.md)

Creates tasks when database conditions are met. Runs SQL queries daily and creates tasks for matching rows (overdue invoices, stale leads, etc.).

### How It Works

```
Schedule (7:05am CT) → Call Execute Rules API → Process Active Rules
                                                      ↓
                          For each rule → Execute SQL query → Create task per row
                                                      ↓
                          Errors? → Slack Alert
```

### Services

- Dashboard API (execute rules endpoint)
- Supabase (task storage, condition queries)
- Slack (error alerts)
