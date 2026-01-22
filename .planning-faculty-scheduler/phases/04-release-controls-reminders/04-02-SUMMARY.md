# 04-02 Summary: Reminder Workflow

## Status: Complete

## Deliverables

| Deliverable | Location |
|-------------|----------|
| n8n Workflow | `pqVg83IQsmbUeoHH` |
| URL | https://n8n.realtyamp.ai/workflow/pqVg83IQsmbUeoHH |

## What Was Built

**Faculty Scheduler - Reminder Notifications** workflow that:
- Runs daily at 7:00 AM CT
- Calls `get_programs_needing_reminder()` to find programs at 45-55% of tier window
- For each program, gets eligible instructors via `get_instructors_needing_reminder()`
- Sends personalized reminder emails via SendGrid
- Logs notifications with type='reminder' for duplicate prevention
- Includes Canary error handling (logs to DB + Slack alerts)

### Workflow Nodes
1. Schedule Trigger (7 AM CT)
2. Get Programs Needing Reminder (Postgres)
3. Has Programs? (If)
4. For Each Program (SplitInBatches)
5. Get Instructors to Remind (Postgres)
6. Has Instructors? (If)
7. For Each Instructor (SplitInBatches)
8. Build Reminder Email (Code - builds HTML)
9. Send Reminder Email (SendGrid)
10. Log Notification (Postgres)
11. Error handling chain

### Key Patterns Applied
- Explicit node references in Log Notification: `$('Build Reminder Email').item.json.*`
- Code node for building dynamic email HTML
- Nested SplitInBatches for programs → instructors loop

## Commits

| Hash | Description |
|------|-------------|
| (via API) | Workflow created and activated in n8n |

## Issues Encountered

- Log Notification node needed explicit node references (same fix as 04-03)

## Deviations from Plan

- Used Code node for email building instead of Set node (more flexible for dynamic content)
