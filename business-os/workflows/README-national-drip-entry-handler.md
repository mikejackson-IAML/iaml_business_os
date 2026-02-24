# National Drip Entry Handler

> **CEO Summary:** Automates the sales playbook rule "any contact who completes an active sequence without converting enters the national nurture drip after 7 days" — a daily process that was previously manual.

## Workflow ID

`5gz9jEI4ftQ6wwLZ` — active at [n8n.realtyamp.ai](https://n8n.realtyamp.ai)

## Purpose

IAML's sales playbook says: contacts who complete any active sequence without converting should automatically enter **SL-ND-NURTURE (National Drip)** after a 7-day cooldown. This workflow runs every day at 7:00 AM CT and executes that rule automatically.

The national drip is a long-term nurture sequence sending 1 email every 2-3 weeks with educational content, case digests, and periodic re-engagement offers. Once in this state, contacts can re-enter active campaigns if they show engagement.

## Triggers

| Trigger | Details |
|---------|---------|
| Daily Schedule | 7:00 AM CT (`0 7 * * *`) — runs after active campaign checks, before new exports |
| Webhook | `POST https://n8n.realtyamp.ai/webhook/national-drip-entry` — manual trigger for testing or bulk processing |

## Flow Overview

```
[Daily Schedule / Webhook]
  → Log Start (Supabase run_id)
  → [Parallel] Get Sequence-Completed Contacts + Also Get Campaign Contacts Completed
  → Merge and Deduplicate (Code node — dedupes by contact ID, confirms 7-day cooldown)
  → Has Contacts? (IF)
     → TRUE: Loop Over Contacts (batches of 50)
               → Prepare Batch for SmartLead
               → Campaign ID Configured? (IF)
                    → TRUE: Add to SmartLead Drip Campaign
                    → FALSE: Alert No Campaign Configured (Slack warning)
               → Update Contact Status in Supabase
               → [loop back until all batches done]
               → Aggregate Batch Results
     → FALSE: No Contacts for Drip (Set)
  → Build Summary
  → Post Drip Summary to Slack
  → Log Success
```

**Error Path** (5-node canary):
`Error Trigger → Parse Error Details → Log Error to DB → Send Error Slack → Mark Error Notified`

## Node Inventory

| # | Node | Type | Purpose |
|---|------|------|---------|
| 1 | Daily Schedule | scheduleTrigger | Cron: 7 AM CT daily |
| 2 | Webhook Trigger | webhook | POST /national-drip-entry |
| 3 | Log Start | httpRequest | Supabase `log_workflow_start` RPC |
| 4 | Get Sequence-Completed Contacts | httpRequest | Queries `contacts` where `smartlead_status=sequence_complete` AND `last_activity_at < 7 days ago` |
| 5 | Also Get Campaign Contacts Completed | httpRequest | Queries `campaign_contacts` where `status=completed` AND `last_touch_at < 7 days ago` |
| 6 | Merge and Deduplicate | code | Combines both sources, dedupes by ID, confirms cooldown |
| 7 | Has Contacts? | if | Routes on `count > 0` |
| 8 | No Contacts for Drip | set | Dead-end branch when count = 0 |
| 9 | Loop Over Contacts | splitInBatches | Processes 50 contacts per batch |
| 10 | Prepare Batch for SmartLead | code | Formats lead_list for SmartLead API |
| 11 | Campaign ID Configured? | if | Guards against missing ND_CAMPAIGN_ID |
| 12 | Add to SmartLead Drip Campaign | httpRequest | POST to SmartLead `/campaigns/{id}/leads` |
| 13 | Alert No Campaign Configured | httpRequest | Slack warning if campaign not set up |
| 14 | Update Contact Status in Supabase | code | PATCHes each contact: `smartlead_status=national_drip`, `pipeline_stage=national_drip` |
| 15 | Aggregate Batch Results | aggregate | Collects all batch results |
| 16 | Build Summary | code | Computes tier/state breakdown for Slack message |
| 17 | Post Drip Summary to Slack | httpRequest | Daily summary to Slack |
| 18 | Log Success | httpRequest | Supabase `log_workflow_success` RPC |
| E1 | Error Trigger | errorTrigger | Catches any workflow error |
| E2 | Parse Error Details | code | Extracts error info + run_id |
| E3 | Log Error to DB | httpRequest | POSTs to `workflow_errors` table |
| E4 | Send Error Slack | httpRequest | Error alert to Slack |
| E5 | Mark Error Notified | httpRequest | Supabase `mark_workflow_notified` RPC |

## Services

| Service | Purpose | Credential |
|---------|---------|------------|
| Supabase | Read contacts, read campaign_contacts, update contact status, workflow logging | `Dy6aCSbL5Tup4TnE` (httpHeaderAuth) |
| SmartLead | Add contacts to national drip campaign | API key in node URL |
| Slack | Daily summary + error alerts | Webhook URL |

## Data Model (Discovered)

The contacts table does NOT have `campaign_status`. The correct fields are:

| Field | Type | Meaning |
|-------|------|---------|
| `smartlead_status` | text | Values: `found`, `sequence_complete`, `national_drip`, etc. |
| `pipeline_stage` | text | Values: `new`, `alumni`, `national_drip`, etc. |
| `last_activity_at` | timestamp | Last email or engagement activity |

The `campaign_contacts` table tracks:

| Field | Type | Meaning |
|-------|------|---------|
| `status` | text | `active`, `completed`, `opted_out` |
| `completed_at` | timestamp | When the sequence finished |
| `last_touch_at` | timestamp | Last email sent |

## SmartLead Setup Required

No National Drip campaign exists in SmartLead yet. Before this workflow processes contacts into SmartLead, you must:

1. Create a campaign named **SL-ND-NURTURE** in SmartLead
2. Configure it: 1 email every 2-3 weeks, educational content + re-engagement offers
3. Note the campaign ID from the SmartLead URL
4. Set the n8n variable `ND_CAMPAIGN_ID` to that ID

Until this is done, the workflow will still run daily, update Supabase statuses correctly, and alert Slack with the count of contacts needing drip entry — but will NOT add them to SmartLead.

## Test Query Results (2026-02-17)

- Contacts with `smartlead_status=sequence_complete`: **0** (campaigns still in progress)
- Campaign contacts with `status=completed`: **0** (campaigns still active)
- Total contacts in system: **2,608**
- Total campaign_contacts records: **1,189**

This is expected — the workflow is ready to process as soon as the first contacts complete their sequences.

## Slack Output Format

**Daily Summary:**
```
*National Drip Entry Handler*

Moved *N* contacts to national drip
Tier breakdown: tier_1: X, tier_2: Y, tier_3: Z
Top states: Georgia: A, Texas: B, Florida: C
_Run at 7:00:00 AM CT_
```

**Error Alert:**
```
:rotating_light: *National Drip Entry Handler Error*

*Error:* [message]
*Node:* [node name]
*Execution:* [execution ID]
*Time:* [ISO timestamp]
```

## Pipeline Connection

This workflow is the **funnel exit handler** in the IAML sales pipeline:

```
[Cold Outreach Campaigns]
  → Contact engages → Branch C (active sequence)
  → Sequence completes without conversion → [7-day wait]
  → National Drip Entry Handler (this workflow)
  → SL-ND-NURTURE (long-term nurture)
  → Re-engagement detection → back to active campaigns
```

Related workflows:
- `SmartLead Activity Receiver` (3KqJGyOOHSSaC7pU) — receives sequence completion events from SmartLead
- `HeyReach Activity Receiver` (9bt5BdyoosqB8ChU) — LinkedIn sequence completions
- `Lifecycle Manager - Stale Contacts` (6PdgkfipCXPU0FHL) — handles contacts stalled in other stages

## Tags

`business-os` · `lead-intelligence` · `national-drip`

## n8n-brain Pattern ID

`d928eda3-368f-4086-a5a9-7bc3910c62ad`
