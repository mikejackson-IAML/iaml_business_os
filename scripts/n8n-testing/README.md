# n8n Morning Test

> **CEO Summary:** Automatically tests 5-10 n8n workflows each morning and sends you a Slack summary of what's working and what needs attention.

## Quick Start

```bash
# Test 10 workflows (default)
./scripts/n8n-testing/morning-test.sh

# Test specific count
./scripts/n8n-testing/morning-test.sh --count 5

# See what would be tested
./scripts/n8n-testing/morning-test.sh --dry-run
```

## What It Does

1. **Selects workflows** - Rotates through your 71 active workflows daily
2. **Checks recent executions** - Verifies each workflow ran successfully
3. **Generates report** - Creates `.n8n-testing/morning-report.md`
4. **Sends Slack alert** - Summary with pass/fail counts

## Usage

```bash
# Default: Test 10 workflows (rotating daily)
./morning-test.sh

# Test specific count
./morning-test.sh --count 5

# Test a specific workflow
./morning-test.sh --workflow 2HAORwXKt7UffvxG

# Test critical workflows only
./morning-test.sh --critical

# Random sample
./morning-test.sh --random

# Dry run
./morning-test.sh --dry-run
```

## Configuration

Edit `config.json`:

```json
{
  "n8n": {
    "api_key": "your-n8n-api-key",
    "base_url": "https://n8n.realtyamp.ai"
  },
  "slack": {
    "webhook_url": "your-slack-webhook"
  },
  "testing": {
    "default_count": 10,
    "timeout_seconds": 120,
    "critical_workflows": [
      "workflow-id-1",
      "workflow-id-2"
    ]
  }
}
```

## Workflow Selection Modes

| Mode | Description |
|------|-------------|
| `rotate` (default) | Different workflows each day, cycles through all |
| `random` | Random sample from active workflows |
| `critical` | Only test workflows listed in `critical_workflows` |

## Outputs

| File | Description |
|------|-------------|
| `.n8n-testing/morning-report.md` | Human-readable summary |
| `.n8n-testing/results.json` | Detailed results for each workflow |

## Example Report

```markdown
# n8n Morning Test Report

**Date:** January 22, 2026 at 6:00 AM
**Workflows Tested:** 10

## Summary

| Status | Count |
|--------|-------|
| ✅ Success | 8 |
| ❌ Failed | 1 |
| ⏸️ No Recent Execution | 1 |

## ❌ Failed (1)

- **Domain Health Sync** (abc123)
  - Error: Connection timeout
```

## Slack Notifications

**On success:**
```
✅ n8n Morning Test Complete

Tested: 10 | Success: 10 | Failed: 0
```

**On failures:**
```
⚠️ n8n Morning Test - 2 Failures

Tested: 10 | Success: 8 | Failed: 2

Failed workflows:
• Domain Health Sync
• Registration Processor
```

## Automation

### Run Daily at 6 AM

Add to your crontab:
```bash
crontab -e
```

```cron
0 6 * * * cd /Users/mike/IAML\ Business\ OS && ./scripts/n8n-testing/morning-test.sh >> /tmp/n8n-morning-test.log 2>&1
```

### Run as Part of Overnight GSD

The overnight-gsd script can include n8n testing:
```bash
./scripts/overnight-gsd/overnight.sh --n8n-only
```

## Integration with n8n-brain

When workflows fail, use n8n-brain to find fixes:

```
# In Claude Code
lookup_error_fix({
  error_message: "Connection timeout",
  node_type: "n8n-nodes-base.httpRequest"
})
```

After fixing, store the solution:
```
store_error_fix({
  error_message: "Connection timeout",
  fix_description: "Increased timeout to 60s and added retry logic",
  node_type: "n8n-nodes-base.httpRequest"
})
```

## Troubleshooting

### "No recent execution" for all workflows

The workflows may be schedule-based and haven't run yet. Options:
- Wait until after their scheduled time
- Use `--workflow <id>` to test specific ones that have manual triggers

### API errors

Check that your n8n API key in `config.json` is valid:
```bash
curl -s "https://n8n.realtyamp.ai/api/v1/workflows" \
  -H "X-N8N-API-KEY: your-key" | jq '.data | length'
```

### Slack not sending

Verify webhook URL is correct in `config.json` by testing manually:
```bash
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Test"}' \
  "your-webhook-url"
```
