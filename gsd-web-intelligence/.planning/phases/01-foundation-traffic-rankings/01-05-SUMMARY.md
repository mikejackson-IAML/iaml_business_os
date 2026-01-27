# Plan 01-05 Summary: Ranking Analysis & Alerts

## Status: Complete

## What Was Built

### Workflow Files Created

| File | Workflow Name | Trigger |
|------|---------------|---------|
| `workflows/RNK-02-rank-change-detector.json` | Web Intel - Rankings - Change Detector | Daily 5:30 AM CT |
| `workflows/RNK-03-rank-alert-notifier.json` | Web Intel - Rankings - Alert Notifier | Webhook |
| `workflows/RNK-05-opportunity-finder.json` | Web Intel - Rankings - Opportunity Finder | Weekly Monday 4:00 AM CT |
| `workflows/RNK-06-keyword-discovery.json` | Web Intel - Rankings - Keyword Discovery | Weekly Wednesday 4:00 AM CT |

### Workflow Details

**RNK-02 - Rank Change Detector**
- Uses `web_intel.ranking_changes` view for comparison
- Categorizes: critical (lost/major drop), warning (drop), info (gains)
- Creates alert records for critical/warning changes
- Triggers RNK-03 via webhook

**RNK-03 - Rank Alert Notifier**
- Receives webhook from RNK-02
- Formats Slack message with severity grouping
- Shows up to 5 per category, summarizes rest
- Marks alerts as notified

**RNK-05 - Opportunity Finder**
- Weekly analysis of striking distance keywords
- Uses `web_intel.striking_distance` view
- Page 1 opportunities (positions 4-10)
- Page 2 opportunities (positions 11-20)
- Sends opportunity digest to Slack

**RNK-06 - Keyword Discovery**
- Uses high-priority keywords as seeds
- Calls DataForSEO related keywords API
- Filters out existing keywords
- Scores by volume/competition ratio
- Adds top 20 suggestions to database

### Pattern Stored in n8n-brain

| Pattern | ID |
|---------|-----|
| Ranking Change Detector | `cae2a742-e88c-43bc-a8ee-4322d4f24ee7` |

### Alert Flow

```
RNK-02 (Detector)
    │
    ├── Queries ranking_changes view
    ├── Categorizes by severity
    ├── Creates alert records
    │
    └── Triggers RNK-03 (Notifier)
            │
            ├── Formats Slack message
            ├── Groups by severity
            └── Sends to #web-intel
```

### Weekly Workflows

**Monday:**
- RNK-05: Opportunity digest (keywords in striking distance)

**Wednesday:**
- RNK-06: Keyword discovery (new suggestions from related keywords)

## Configuration Notes

**Environment Variables Needed:**
- `SLACK_WEB_INTEL_WEBHOOK` - Slack incoming webhook URL
- `RNK_03_WEBHOOK_URL` - n8n webhook URL for RNK-03

## Phase 1 Complete

All 15 items (1 schema + 14 workflows) have been created.

## Duration
~12 minutes

---
*Completed: 2026-01-20*
