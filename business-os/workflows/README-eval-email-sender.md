# Eval Email Sender

> **CEO Summary:** An hourly scheduled workflow that emails every confirmed participant a link to their personalized program evaluation once their program has ended (4 PM local time on the last day). Runs safely on its own — no manual steps between program end and the evaluation landing in the participant's inbox.

## Overview

```
Hourly cron (minute 0 of every hour)
       │
       ▼
  Get Send Queue  ── Postgres: SELECT * FROM eval_get_ready_to_send(100)
       │             └─ Mints program_evaluations rows for new eligible registrations
       │             └─ Returns unsent queue (email_sent_at IS NULL, attempts < 3)
       ▼
  Compose Email  ── Code node, per attendee → {subject, text, html}
       │
       ▼
  Send via SendGrid  ── HTTP POST https://api.sendgrid.com/v3/mail/send
       │
       ├── ✅ 202 Accepted → Mark Sent (Postgres: eval_mark_email_sent(id, TRUE, NULL))
       │                       └─ Sets email_sent_at, removes row from queue
       │
       └── ❌ error        → Mark Failed (Postgres: eval_mark_email_sent(id, FALSE, err))
                               └─ Increments attempts, stores error.
                                  Retries hourly until attempts >= 3.
```

## When it fires

The DB helper `public.eval_instance_send_due(instance_id)` compares:

```
(program_instances.end_date + 16 hours) AT TIME ZONE program_instances.local_timezone   ≤   NOW()
```

An instance's evaluations become eligible to send at **4 PM in the program's local timezone on the last day of the program**. `local_timezone` defaults to `America/New_York`; override per instance with a simple UPDATE:

```sql
UPDATE public.program_instances
   SET local_timezone = 'America/Los_Angeles'
 WHERE instance_name = 'Comprehensive Labor Relations - Oct 2026 - Las Vegas';
```

Hourly cron granularity means a participant could receive the email anywhere from 0 to 59 minutes after the 4 PM threshold.

## What it sends

Subject: `Your feedback on {program_name}`

Body (HTML + plain-text, both included):

- Personalized greeting by first name
- Link: `https://iaml.com/evaluation.html?token={resume_token}`
- Reassurance that the link is unique and auto-saves progress

From: `info@iaml.com` / Name: `IAML` (edit in the workflow's Compose Email node if the address changes).

## Idempotency guarantees

| Scenario | Behavior |
|---|---|
| Workflow runs twice in the same hour | Second run returns `[]` — rows already sent are filtered out by `email_sent_at IS NULL` |
| Same participant registers for two blocks | One eval per `(registration_id, program_code, block_code)` — unique index enforces it |
| SendGrid fails for one attendee | Row stays in queue; `email_send_attempts` increments; retries next hour until 3 attempts, then parked for manual review |
| New registration comes in after end_date | Next hourly run mints the eval + sends it |
| Cancellation after eval minted | No dedicated handling; manually `DELETE` the eval row or `UPDATE email_sent_at` to suppress |

## Credential setup (n8n)

This workflow ships with placeholder credential IDs. Before activating:

| Node | Credential Type | What to configure |
|---|---|---|
| Get Send Queue, Mark Sent, Mark Failed | `postgres` (Supabase Postgres) | Already using the shared `EgmvZHbvINHsh6PR` credential — no change needed |
| Send via SendGrid | `httpHeaderAuth` | Create a new "SendGrid API" credential with header `Authorization: Bearer SG.XXX...`, then update the node's credential ID from the placeholder `SENDGRID_CREDENTIAL_ID` |

The SendGrid API key is the same one stored as `SENDGRID_API_KEY` at the repo root `.env.local`.

## Failure review

Query to find evals that failed 3+ times:

```sql
SELECT
  e.id,
  r.email,
  pi.instance_name,
  e.email_send_attempts,
  e.email_last_error,
  e.updated_at
FROM iaml_evaluations.program_evaluations e
JOIN public.registrations      r  ON r.id  = e.registration_id
JOIN public.program_instances  pi ON pi.id = e.program_instance_id
WHERE e.email_sent_at IS NULL
  AND e.email_send_attempts >= 3
ORDER BY e.updated_at DESC;
```

To retry: reset the counter.

```sql
UPDATE iaml_evaluations.program_evaluations
   SET email_send_attempts = 0, email_last_error = NULL
 WHERE id = '…';
```

## Manual first-send for an existing cohort

If a program ended before this workflow existed, just call the RPC once from the Supabase SQL editor:

```sql
SELECT * FROM public.eval_get_ready_to_send(100);
```

That will mint evals for every eligible registration. The next hourly n8n run picks them up and sends.

## Related

- Schema: `supabase/migrations/20260421000000_create_iaml_evaluations_schema.sql`
- Scheduling + tracking migration: `supabase/migrations/20260421000009_eval_email_delivery.sql`
- Participant form: `website/evaluation.html`
