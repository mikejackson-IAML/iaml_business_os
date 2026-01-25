# Weekly AI Focus Generator

> **CEO Summary:** Runs Sunday evening and Friday afternoon to analyze your task patterns and suggest priorities for the upcoming week, acting as an encouraging AI coach.

## Overview

This workflow generates personalized weekly task recommendations by analyzing your 90-day task history. On Sunday evenings, it creates a "planning" focus with priorities for the upcoming week. On Friday afternoons, it creates a "recap" that reviews the past week and suggests course corrections.

The AI acts as an encouraging coach - celebrating wins, gently highlighting patterns (like procrastination or overload), and suggesting high-value tasks you might be avoiding.

## Trigger

| Attribute | Value |
|-----------|-------|
| Type | Schedule |
| Schedule | Sunday 7pm CT (planning), Friday 5pm CT (recap) |
| Cron Expressions | `0 19 * * 0` and `0 17 * * 5` |
| Timezone | America/Chicago |

## Data Flow

1. Schedule trigger fires (Sunday 7pm or Friday 5pm CT)
2. Determine mode based on day of week (planning vs recap)
3. Calculate ISO week key for deduplication
4. Call `/api/action-center/ai-analysis` with mode and max_suggestions
5. Build Weekly Focus Review task with markdown description:
   - Summary of focus areas
   - Suggested actions with confidence scores
   - Patterns noticed (procrastination, workload imbalance, etc.)
   - Last week review (for Friday recap)
6. Insert Weekly Focus Review task (dedupe prevents duplicates)
7. For each AI suggestion of type 'new_task':
   - Create task with `source='ai'`, `ai_confidence`, `ai_suggested_at`
   - Dedupe key prevents duplicate suggestions
8. Send Slack success log to #ai-focus
9. On error, send Slack alert to #alerts

## What Gets Created

### Weekly Focus Review Task

A task with:
- **Title:** "Weekly Focus Review - Jan 26, 2026"
- **Type:** `review`
- **Source:** `ai`
- **Priority:** `normal`
- **Dedupe Key:** `weekly_focus:2026-W04`

The description contains:
- This Week's Focus (AI-generated summary)
- Suggested Actions (numbered list with confidence %)
- Patterns Noticed (with severity indicators)
- Last Week Review (Friday recap only)

### AI Suggestion Tasks

Individual tasks for each AI recommendation:
- **Source:** `ai`
- **ai_confidence:** 0-100 score
- **ai_suggested_at:** Timestamp
- **Dedupe Key:** `ai_suggestion:2026-W04:0`

Only suggestions with `type='new_task'` create new tasks. Other suggestion types (priority_change, due_date_change) are listed in the Weekly Focus Review for manual review.

## Required Credentials/Environment Variables

| Credential | Type | Purpose |
|------------|------|---------|
| `DASHBOARD_API_KEY` | HTTP Header Auth | Authenticates API requests |
| `SLACK_CREDENTIAL_ID` | Slack API | Sends alerts and success logs |
| `DASHBOARD_URL` | Environment Variable | Base URL for dashboard API |

### Setting Up Credentials in n8n

1. **DASHBOARD_API_KEY**: Create an HTTP Header Auth credential with:
   - Header Name: `x-api-key`
   - Header Value: (your MOBILE_API_KEY from dashboard env)

2. **Slack**: Use existing Slack API credentials for #ai-focus and #alerts channels

3. **DASHBOARD_URL**: Set environment variable in n8n settings (e.g., `https://dashboard.iaml.com`)

### Supabase Postgres Credential

The workflow uses direct Supabase Postgres access for task creation:
- Credential ID: `EgmvZHbvINHsh6PR`
- Name: `Supabase Postgres`

## Integrations

| Service | Purpose |
|---------|---------|
| Dashboard API | AI analysis endpoint (calls Claude) |
| Supabase | Task storage (direct Postgres) |
| Claude | AI analysis and suggestions (via API) |
| Slack | Success logging and error alerts |

## Alerts

| Condition | Channel | Message |
|-----------|---------|---------|
| Workflow completes successfully | #ai-focus | Summary with mode, week, and suggestion count |
| AI analysis API fails | #alerts | Error details and timestamp |

## AI Analysis Features

The AI analyzes:
- Open tasks (current workload)
- Overdue items (procrastination patterns)
- Completion velocity (productivity trends)
- Task clustering (deadline bunching)
- Category distribution (workload balance)

Pattern types detected:
- `recurring_neglect` - Tasks repeatedly pushed back
- `workload_imbalance` - Too many tasks in one category
- `velocity_trend` - Productivity increasing/decreasing
- `deadline_clustering` - Too many due dates bunched together

## Deduplication

| Key Format | Purpose |
|------------|---------|
| `weekly_focus:2026-W04` | Prevents duplicate weekly focus tasks |
| `ai_suggestion:2026-W04:0` | Prevents duplicate suggestion tasks |

If the workflow runs twice in the same week, the Weekly Focus task is updated (ON CONFLICT DO UPDATE) while suggestion tasks are skipped (ON CONFLICT DO NOTHING).

## Troubleshooting

### API returns error

1. Check DASHBOARD_API_KEY matches dashboard's MOBILE_API_KEY
2. Verify DASHBOARD_URL environment variable is set
3. Check AI analysis endpoint logs for Claude API errors

### No suggestions created

- AI may return suggestions of type 'priority_change' or 'due_date_change'
- These appear in Weekly Focus Review but don't create separate tasks
- Check the Weekly Focus Review task description for all recommendations

### Weekly Focus task not appearing

1. Check dedupe key format: `weekly_focus:YYYY-WW`
2. Verify task exists in action_center.tasks table
3. Look for tasks with `source='ai'` and `task_type='review'`

### Slack messages not sending

1. Verify Slack API credential is valid
2. Check #ai-focus and #alerts channels exist
3. Review n8n execution logs for Slack errors

## Related

- AI Analysis API: `/api/action-center/ai-analysis`
- Action Center Dashboard: `/dashboard/action-center`
- Task List (AI filter): `/dashboard/action-center/tasks?source=ai`
- Daily Digest: `README-daily-digest.md`

---

*Workflow created: 2026-01-25*
