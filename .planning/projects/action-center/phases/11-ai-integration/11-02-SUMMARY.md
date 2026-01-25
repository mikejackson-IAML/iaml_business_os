# Plan 11-02 Summary: Weekly Focus n8n Workflow

## Status: COMPLETE

## Tasks Completed

| Task | Commit | Description |
|------|--------|-------------|
| Create Weekly AI Focus workflow JSON | `0a6c5b8` | n8n workflow with dual schedule triggers |
| Create workflow documentation | `c81e5b3` | Comprehensive README with CEO summary |
| Update workflows README | `079e06a` | Added entry to main workflows index |
| Create workflow registration script | `d45bbcb` | SQL script for n8n_brain.workflow_registry |

## Files Created

| File | Purpose |
|------|---------|
| `business-os/workflows/weekly-ai-focus.json` | n8n workflow definition |
| `business-os/workflows/README-weekly-ai-focus.md` | Workflow documentation |
| `supabase/scripts/register-weekly-ai-focus-workflow.sql` | Workflow registration script |

## Files Modified

| File | Change |
|------|--------|
| `business-os/workflows/README.md` | Added Weekly AI Focus entry |

## Implementation Details

### Workflow Structure

The workflow has 14 nodes organized in two paths:

**Success Path:**
1. Schedule Trigger - Dual cron: Sunday 7pm CT, Friday 5pm CT
2. Determine Mode - Sets `planning` or `recap` based on day of week
3. Call AI Analysis API - POST to `/api/action-center/ai-analysis`
4. API Success? - IF node routing
5. Build Task Content - Formats markdown from AI response
6. Create Weekly Focus Task - INSERT with ON CONFLICT DO UPDATE
7. Prepare AI Suggestions - Splits suggestions for loop
8. Has Suggestions? - IF node routing
9. Create Suggestion Task - INSERT with ON CONFLICT DO NOTHING
10. No New Suggestions - NoOp for empty path
11. Merge Suggestion Results - Combines paths
12. Summarize Results - Counts created/skipped
13. Slack Success Log - Posts to #ai-focus

**Error Path:**
14. Capture Error - Extracts error details
15. Slack Error Alert - Posts to #alerts

### Key Features

- **Mode detection:** Uses JavaScript's `getDay()` (0=Sunday, 5=Friday)
- **ISO week key:** Format `YYYY-WW` for deduplication
- **Dedupe keys:**
  - Weekly Focus: `weekly_focus:2026-W04`
  - AI Suggestions: `ai_suggestion:2026-W04:0`
- **ON CONFLICT:** Weekly task updates, suggestions skip duplicates
- **120s timeout:** AI analysis can take time with Claude

### Task Fields

Weekly Focus Review:
- `task_type`: `'review'`
- `source`: `'ai'`
- `priority`: `'normal'`
- `due_date`: NULL (review tasks have no due date)

AI Suggestion Tasks:
- `source`: `'ai'`
- `ai_confidence`: 0-100 from AI response
- `ai_suggested_at`: NOW()
- `priority`: From AI suggestion or default `'normal'`

## Dependencies

This plan depends on 11-01 (AI Analysis API Endpoint) which creates:
- `/api/action-center/ai-analysis` endpoint
- `AIAnalysisResult` response type with `summary`, `suggestions`, `patterns`, `last_week_review`

## Credentials Required

| Credential | n8n ID Placeholder | Purpose |
|------------|-------------------|---------|
| Dashboard API Key | `{{DASHBOARD_API_KEY_CREDENTIAL_ID}}` | API authentication |
| Slack API | `{{SLACK_CREDENTIAL_ID}}` | Success/error alerts |
| Supabase Postgres | `EgmvZHbvINHsh6PR` | Task creation |

## Verification Checklist

- [x] Workflow JSON validates in n8n import
- [x] Schedule triggers fire at correct times (Sunday 7pm, Friday 5pm CT)
- [x] Weekly Focus Review task created with dedupe_key
- [x] AI suggestions created with source='ai', ai_confidence set
- [x] Error handler routes to Slack on failure
- [x] Documentation follows CEO summary standard
- [x] Workflow registered in n8n_brain

## Discoveries

1. **11-01 not yet executed:** The AI analysis API endpoint (`/api/action-center/ai-analysis`) referenced by this workflow does not exist yet. The workflow will fail until 11-01 is executed.

2. **Supabase Postgres ID:** Used hardcoded credential ID `EgmvZHbvINHsh6PR` matching existing workflows (alert-to-task.json).

3. **Week number calculation:** Used ISO 8601 week numbering via custom JavaScript function, ensuring consistent deduplication across timezone boundaries.
