# Post-Program: What You Missed Sender

> **CEO Summary:** After each IAML local program concludes, this workflow automatically identifies contacts in that city who were in the outreach pipeline but never registered, then queues them into a SmartLead "What You Missed" sequence — striking while interest is still fresh, 3-5 days post-event.

## Overview

```
Daily Schedule (9AM CT)           Webhook Trigger (POST /wym-sender-trigger)
         │                                        │
         └────────────────────┬───────────────────┘
                              │
                              ▼
                    Log Workflow Start (Supabase RPC)
                              │
                              ▼
                    Find Completed Programs
                    (program_instances ended 3-5 days ago,
                     format=in-person, status=scheduled)
                              │
                              ▼
                    Check Webhook Override
                    (inject test program if program_id provided)
                              │
                              ▼
                    Has Programs? ──── No ──► Log No Programs Slack
                              │
                             Yes
                              │
                              ▼
                    Get Non-Converting Contacts
                    (contacts in that city, with email, not wym_queued)
                              │
                              ▼
                    Build WYM Email Payload
                    (filter out wym_queued/unsubscribed/bounced)
                              │
                              ▼
                    Has Contacts? ──── No ──► Post Summary to Slack
                              │
                             Yes
                              │
                              ▼
                    Batch Contacts (25)
                              │
                              ▼
                    Add to SmartLead WYM Campaign (ID: 2927777)
                              │
                              ▼
                    Update Contact Status (smartlead_status = wym_queued)
                              │
                              ▼
                    Aggregate Results
                              │
                              ▼
                    Post Summary to Slack
                              │
                              ▼
                    Log Workflow Success
```

## Workflow Details

| Field | Value |
|-------|-------|
| **n8n Workflow ID** | `JJa8FJaHrQm9t8sM` |
| **Status** | Active |
| **URL** | https://n8n.realtyamp.ai/workflow/JJa8FJaHrQm9t8sM |
| **Schedule Trigger** | Daily at 9:00 AM Central Time |
| **Webhook Trigger** | POST `/wym-sender-trigger` |
| **Tags** | `business-os`, `local-program`, `email-campaign` |

## What It Does

The IAML sales playbook calls for a "What You Missed" follow-up 3-5 days after a local program ends. This workflow automates that step:

1. **Finds completed programs** — Queries `program_instances` for in-person programs whose `end_date` was 3-5 days ago.
2. **Checks for webhook override** — If triggered via webhook with a `program_id`, uses that specific program (useful for testing or manual re-runs).
3. **Gets non-converting contacts** — Finds contacts in that program's city with a valid email who haven't already been queued for WYM outreach.
4. **Batches and queues** — Adds contacts in batches of 25 to the `SL-LP-GEO: Local Program Geo Campaign` in SmartLead.
5. **Updates contact status** — Sets `smartlead_status = wym_queued` on each contact so they aren't re-processed.
6. **Posts Slack summary** — Reports programs processed and contacts queued.

## Trigger Options

### Automatic (Daily Schedule)
Runs every day at 9:00 AM CT. Will find any programs that ended 3-5 days ago and process them automatically.

### Manual Webhook Test
```bash
POST https://n8n.realtyamp.ai/webhook/wym-sender-trigger
Content-Type: application/json

{
  "program_id": "test",
  "city": "Atlanta",
  "program_name": "Certificate in Employee Relations Law",
  "state": "Georgia"
}
```

## Services Used

| Service | Purpose | Credential |
|---------|---------|-----------|
| Supabase REST API | Read program_instances + contacts, update contact status, log workflow | `Dy6aCSbL5Tup4TnE` (httpHeaderAuth) |
| SmartLead | Add contacts to SL-LP-GEO campaign | API key in node (campaign ID: 2927777) |
| Slack | Post run summary and error alerts | Webhook `https://hooks.slack.com/services/T09D27N8KSP/B0A8XLFMN6M/...` |

## Database Tables

| Table | Role |
|-------|------|
| `program_instances` | Source of truth for local program schedule (city, end_date, format) |
| `contacts` | Contacts filtered by city match + smartlead_status exclusion |
| `campaign_contacts` | Available for future refinement (has quarterly_update_registered column) |

## Key Design Decisions

**SmartLead Campaign:** No dedicated WYM campaign exists in SmartLead. Contacts are added to `SL-LP-GEO: Local Program Geo Campaign` (ID: 2927777), which is the same geo-targeted local program campaign. This aligns with the playbook intent — keeping them in the local program pipeline.

**Contact Filtering:** The workflow filters by `contacts.city` (ilike match) rather than `campaign_contacts.campaign_id`. This is intentional: it captures any contact who received outreach in that market, regardless of which specific sub-campaign they were in.

**Status Used for Deduplication:** `contacts.smartlead_status = 'wym_queued'` prevents contacts from being re-added across multiple runs. The field is also used to exclude `unsubscribed`, `bounced`, and `opted_out` contacts.

**End Date Note:** `program_instances.status` remains `scheduled` even after a program has passed — do not filter by status for date-based lookups. Filter by `end_date` range only.

## Error Handling (5-Node Canary)

```
Error Trigger → Parse Error Details → Log Error to DB (Supabase RPC) → Send Error Slack → Mark Error Notified
```

All error-handling nodes have `continueOnFail: true`. Error details logged via `log_workflow_error` RPC. Slack alert sent to the same business-os webhook.

## Slack Messages

**On successful run with contacts:**
```
:mailbox_with_mail: Post-Program: What You Missed Sender

Programs processed: 1
Contacts queued for WYM emails: 47
Cities: Atlanta

SmartLead campaign: SL-LP-GEO: Local Program Geo Campaign (ID: 2927777)
```

**On no programs found:**
```
:information_source: WYM Sender: No in-person programs ended 3-5 days ago. Nothing to process today.
```

**On error:**
```
:rotating_light: WYM Sender ERROR

Error: [message]
Node: [node name]
Execution: [execution id]
Time: [timestamp]
```

## n8n-brain Pattern

- **Pattern ID:** `34574915-bcfe-46f7-a51d-1dbe75a83bca`
- **Tags:** `what-you-missed`, `post-program`, `smartlead`, `local-campaign`, `nurture`

## Related

- [Local Campaign Launcher](README-local-campaign-launcher.md) — Sends SL-LP-GEO outreach BEFORE programs run
- [National Drip Entry Handler](README-national-drip-entry-handler.md) — Fallback nurture for contacts who complete sequences without converting
