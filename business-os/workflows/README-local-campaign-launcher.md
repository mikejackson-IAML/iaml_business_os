# Local Program Campaign Launcher

> **CEO Summary:** Every month, this workflow finds upcoming IAML programs and identifies nearby prospects, tagging them for a location-specific outreach sequence (SL-LP-GEO) before they ever receive generic national outreach — ensuring local buyers get a local message first.

## Workflow ID

**n8n Workflow ID:** `ieFVoSyC2QDyPuXn`
**URL:** https://n8n.realtyamp.ai/workflow/ieFVoSyC2QDyPuXn

## Trigger

- **Schedule:** 1st of each month at 6:00 AM CT (runs automatically)
- **Webhook:** `POST https://n8n.realtyamp.ai/webhook/local-campaign-launcher`
  - Optional body: `{"program_id": "<uuid>"}` to filter to a single program
  - Webhook path registered as `local-campaign-launcher`

## What It Does

1. Queries `program_instances` for in-person programs with `status = scheduled` and a non-null `state`, with `start_date` between 3 and 12 months from today
2. Identifies the 6 states with upcoming programs (currently: Arizona, Texas, Florida, Tennessee, Nevada, D.C.)
3. Queries `contacts` for Tier 1 and Tier 2 contacts in those states with `smartlead_status = found`
4. Sets `smartlead_status = queued_local` and `smartlead_campaign_id = 2927777` on matching contacts
5. Posts a per-state breakdown to Slack
6. Logs run start, success, and errors to Supabase workflow monitoring tables

## Services Used

| Service | Purpose |
|---------|---------|
| Supabase | Read program_instances, read + update contacts, workflow logging |
| SmartLead | Campaign ID 2927777 (SL-LP-GEO: Local Program Geo Campaign) |
| Slack | Run summary and error alerts |

## Key Schema Details

| Field | Table | Values |
|-------|-------|--------|
| `state` | `program_instances` | Full name: "Georgia", "Arizona", "Texas" |
| `state` | `contacts` | Full name: "Georgia", "Arizona", "Texas" |
| `tier` | `contacts` | `tier_1`, `tier_2` |
| `smartlead_status` eligible | `contacts` | `found` |
| `smartlead_status` after tag | `contacts` | `queued_local` |
| `smartlead_campaign_id` | `contacts` | `2927777` (SL-LP-GEO) |

## Connection to Supabase-to-SmartLead Exporter

This workflow is the **first step** in the local program outreach pipeline:

```
Local Campaign Launcher (this workflow)
  → Sets contacts.smartlead_status = 'queued_local'
  → Sets contacts.smartlead_campaign_id = 2927777

Supabase-to-SmartLead Exporter (next workflow)
  → Picks up contacts where smartlead_status = 'queued_local'
  → Exports them to SmartLead campaign ID 2927777 (SL-LP-GEO)
  → Sets smartlead_status = 'exported'

SmartLead SL-LP-GEO Sequence
  → Sends location-aware email sequence referencing nearby program
```

The SL-LP-GEO sequence runs BEFORE the generic national sequences (SL-T1-CORE, SL-T2-CORE), ensuring contacts in program markets receive location-specific outreach first per the IAML sales playbook.

## Current Program Window (as of Feb 2026)

States with in-person programs in the 3-12 month window:
- Arizona (Scottsdale, Jun 2026)
- Texas (Austin, Jun + Sep 2026)
- Florida (Orlando, Jul 2026)
- Tennessee (Nashville, Aug 2026)
- Nevada (Las Vegas, Oct 2026)
- D.C. (Washington, Nov 2026)

## Error Handling

The 5-node canary error chain (Error Trigger → Parse Error → Log to DB → Slack Alert → Mark Notified) catches any workflow failure, logs it to Supabase `workflow_errors`, and posts an alert to Slack.

## Technical Notes

- The webhook node requires `webhookId` field matching the `path` value for n8n production URL registration
- Contact data is currently concentrated in Georgia (1,000 contacts); Arizona/Texas/Florida/Tennessee/Nevada/D.C. contacts will be populated as lead import campaigns run
- The workflow gracefully handles 0 contacts found (skips queue, still logs success)
- Max 500 contacts per run (can be raised by changing `limit` param in Get Eligible Contacts node)
