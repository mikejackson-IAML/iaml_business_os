# Daily Digest Sender

> **CEO Summary:** Sends daily email summaries of critical, overdue, and due-today tasks to each user at their preferred time, so nothing falls through the cracks.

## Overview

This workflow triggers the dashboard's digest email API every hour during the workday. The API handles timezone-aware delivery, sending emails only to users whose preferred delivery time matches the current time in their timezone.

## Trigger

| Attribute | Value |
|-----------|-------|
| Type | Schedule |
| Schedule | Every hour from 6-9am CT, weekdays |
| Cron Expression | `0 6-9 * * 1-5` |

The workflow runs hourly to catch users in different timezones with different preferred delivery times (e.g., 6am Pacific, 7am Central, 8am Eastern).

## Data Flow

1. Schedule trigger fires at the top of each hour (6-9am CT)
2. Call `/api/digest/send` with `{ "all": true }`
3. API fetches all users with daily digest enabled
4. API filters to users whose preferred time matches current time in their timezone
5. For each eligible user, generate digest and send email
6. Return summary: sent/skipped/failed counts
7. If any failures, send Slack alert to #alerts
8. If any sent, log summary to #daily-digest

## Digest Content

The email includes:

- **Critical Tasks** - Tasks marked as critical priority
- **Overdue Tasks** - Tasks past their due date
- **Due Today** - Tasks due today
- **Stats** - Total active tasks, completed this week

Users are skipped if they have no urgent items (nothing critical, overdue, or due today).

## Required Credentials/Environment Variables

| Credential | Type | Purpose |
|------------|------|---------|
| `DIGEST_API_KEY` | HTTP Header Auth | Authenticates API requests |
| `SLACK_CREDENTIAL_ID` | Slack API | Sends alerts and success logs |
| `DASHBOARD_URL` | Environment Variable | Base URL for dashboard API |

### Setting Up Credentials in n8n

1. **DIGEST_API_KEY**: Create an HTTP Header Auth credential with:
   - Header Name: `x-api-key`
   - Header Value: (your DIGEST_API_KEY from dashboard env)

2. **Slack**: Use existing Slack API credentials for #alerts and #daily-digest channels

3. **DASHBOARD_URL**: Set environment variable in n8n settings (e.g., `https://dashboard.iaml.com`)

## Integrations

| Service | Purpose |
|---------|---------|
| Dashboard API | Generate and send digest emails |
| Supabase | User preferences and task data (via API) |
| Resend | Email delivery (via API) |
| Slack | Error alerts and success logging |

## Alerts

| Condition | Channel | Message |
|-----------|---------|---------|
| Any email send failures | #alerts | Warning with failure details |
| Emails sent successfully | #daily-digest | Summary of sent/skipped/failed |

## User Configuration

Users control their digest via profile settings:

- **Enable/Disable**: `notification_daily_digest` boolean
- **Preferred Time**: `notification_digest_time` (e.g., "07:00")
- **Timezone**: `timezone` (e.g., "America/Chicago")

Users with digest disabled or inactive accounts are skipped.

## Troubleshooting

### No emails being sent

1. Check user has `notification_daily_digest: true`
2. Verify user's `notification_digest_time` matches a run hour (6-9am in their timezone)
3. Confirm user has critical, overdue, or due-today tasks

### All users skipped

- "nothing_urgent" - Users have no tasks needing attention
- "digest_disabled" - Users opted out of daily digest
- Time mismatch - Users' preferred times don't match current run hour

### Email delivery failures

1. Check Resend API key is configured in dashboard environment
2. Verify `DIGEST_FROM_EMAIL` has a valid verified sender
3. Review Resend dashboard for delivery errors

### API authentication failures

1. Verify `DIGEST_API_KEY` in n8n matches dashboard's `DIGEST_API_KEY` env var
2. Check HTTP Header Auth credential uses header name `x-api-key`

## Related

- Digest Send API: `/api/digest/send`
- User Profiles: `profiles` table
- Action Center: `/dashboard/action-center`
- Notification Preferences: `/dashboard/action-center/settings`

---

*Workflow created: 2026-01-25*
