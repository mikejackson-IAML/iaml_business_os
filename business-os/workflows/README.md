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
