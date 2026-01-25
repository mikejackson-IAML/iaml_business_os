# Plan 10-09 Summary: n8n Workflow for Daily Digest Scheduling

## Completed Tasks

| Task | Description | Status |
|------|-------------|--------|
| 1 | Create n8n workflow "Daily Digest Sender" | COMPLETE |
| 2 | Add HTTP Request node to call digest API | COMPLETE |
| 3 | Add error handling with Slack alerts | COMPLETE |
| 4 | Add success logging | COMPLETE |
| 5 | Create workflow documentation | COMPLETE |
| 6 | Create workflow registration script | COMPLETE |

## Files Created

1. **`business-os/workflows/daily-digest-sender.json`**
   - n8n workflow JSON ready to import
   - Schedule trigger: Hourly 6-9am CT weekdays (cron: `0 6-9 * * 1-5`)
   - HTTP Request node calls `/api/digest/send` with `{ "all": true }`
   - Error handling: Slack alert to #alerts on failures
   - Success logging: Slack message to #daily-digest when emails sent

2. **`business-os/workflows/README-daily-digest.md`**
   - CEO Summary and workflow overview
   - Schedule and data flow explanation
   - Required credentials and setup instructions
   - Integration points and troubleshooting guide

3. **`supabase/scripts/register-daily-digest-workflow.sql`**
   - SQL to register workflow in n8n_brain.workflow_registry
   - Placeholder for workflow ID to fill after n8n import

## Files Modified

1. **`business-os/workflows/README.md`**
   - Added Daily Digest Sender entry to central workflows index

## Workflow Details

### Schedule

The workflow runs hourly from 6-9am CT on weekdays. This covers the typical morning window across US timezones:
- 6am CT = 7am ET, 4am PT
- 9am CT = 10am ET, 7am PT

Users set their preferred delivery time in their profile (e.g., "07:00"). The API filters users to only those whose preferred time matches the current time in their timezone.

### Data Flow

```
Schedule (hourly 6-9am) --> POST /api/digest/send { all: true }
                                    |
                                    v
                          API fetches users with digest enabled
                                    |
                                    v
                          Filter to users whose time matches now
                                    |
                                    v
                          For each: Generate digest, send email
                                    |
                                    v
                          Return: { sent, skipped, failed }
                                    |
                                    v
                          Has failures? --> Slack #alerts
                                    |
                                    v
                          Any sent? --> Slack #daily-digest
```

### Required Setup

Before activating the workflow:

1. **Import to n8n**: Import `daily-digest-sender.json`
2. **Configure credentials**:
   - HTTP Header Auth with `x-api-key` header = `DIGEST_API_KEY`
   - Slack API credentials
3. **Set environment variables**:
   - `DASHBOARD_URL` = base URL of dashboard
4. **Register workflow**: Run `register-daily-digest-workflow.sql` with actual workflow ID
5. **Activate**: Enable the workflow in n8n

## Checkpoint: Workflow Import and Test

**Status**: Ready for import

**Actions required**:
1. Import `daily-digest-sender.json` to n8n
2. Set up HTTP Header Auth credential with DIGEST_API_KEY
3. Update Slack credential IDs in workflow
4. Run the workflow manually with test data
5. Verify emails send to eligible users
6. Activate the workflow

**Note**: The workflow JSON contains placeholder credential IDs (`{{DIGEST_API_KEY_CREDENTIAL_ID}}`, `{{SLACK_CREDENTIAL_ID}}`). These must be replaced with actual n8n credential IDs after import.

## Requirements Covered

- Workflow runs on configurable schedule
- Calls dashboard API with "all" mode
- Sends Slack alert on failures
- Logs successful sends to #daily-digest channel
- Documentation at `business-os/workflows/README-daily-digest.md`
- Registration script for n8n_brain.workflow_registry
