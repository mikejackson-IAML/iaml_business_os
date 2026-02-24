# Colleague Expansion Trigger

> **CEO Summary:** When anyone registers for an IAML program, this workflow fires within minutes: it tags every other HR contact we have at that company for a special "your colleague just registered" SmartLead sequence, and queues a Sales Navigator search to find HR contacts at that company we don't know yet.

---

## Overview

```
Webhook (POST /colleague-expansion)
        │
        ▼
  Validate Input (UUID check)
        │
        ▼
  Get Registration Details (Supabase)
        │
        ▼
  Registration Found?
        │
   ┌────┴────┐
  Yes        No
   │          │
   ▼          ▼
Prepare    Respond 404
Params
   │
   ▼
Tag Company Contacts for CE
(UPDATE contacts SET smartlead_status = 'queued_ce')
   │
   ▼
Count Tagged Contacts
   │
   ▼
Queue Sales Nav Search
(INSERT into sales_nav_searches)
   │
   ▼
Log Activity (campaign_activity)
   │
   ▼
Build Slack Summary
   │
   ▼
Send Slack Notification
   │
   ▼
Respond 200 Success
```

---

## What It Does

1. **Receives registration webhook** — triggered by registration confirmation (see Trigger section below)
2. **Looks up the registration** — gets company name, registrant details, program info
3. **Tags existing contacts** — finds all known HR contacts at that company in our `contacts` table and sets `smartlead_status = 'queued_ce'`
4. **Queues Sales Nav search** — inserts a Sales Navigator search job into `sales_nav_searches` to find HR contacts we don't have yet
5. **Logs the activity** — writes to `campaign_activity` for observability
6. **Sends Slack summary** — reports how many contacts were tagged and confirms the search was queued

---

## File

`n8n-workflows/colleague-expansion.json`

---

## Webhook Payload

```json
{
  "registration_id": "uuid"
}
```

**Endpoint:** `POST https://n8n.realtyamp.ai/webhook/colleague-expansion`

**Response (success):**
```json
{
  "success": true,
  "message": "Colleague expansion triggered",
  "company": "Acme Corp",
  "tagged_contacts": 7,
  "sales_nav_search_queued": true
}
```

**Response (not found):**
```json
{
  "success": false,
  "error": "Registration not found or cancelled",
  "registration_id": "..."
}
```

---

## When to Trigger This

**From any system that processes registrations**, call this webhook:

```bash
curl -X POST https://n8n.realtyamp.ai/webhook/colleague-expansion \
  -H "Content-Type: application/json" \
  -d '{"registration_id": "your-uuid-here"}'
```

**Ideal trigger points:**
- After Stripe payment confirmation
- After registration form submission
- After manual registration entry in the dashboard

**Timing:** Must fire within 48 hours of registration. "Your colleague just registered" has urgency — stale outreach loses the moment.

---

## SmartLead Campaign: SL-CE

Tagged contacts (`smartlead_status = 'queued_ce'`) are picked up by the SmartLead exporter on its next 2-hour cycle and pushed to the **SL-CE** (Colleague Expansion) campaign on `invitationtohrtraining.com`.

**Before activating:**
1. Create the SL-CE campaign in SmartLead if it doesn't exist
2. Set `SL_CE_CAMPAIGN_ID` as an n8n variable or ensure the SmartLead exporter is configured for CE contacts

---

## Sales Navigator Search

For each registration, the workflow queues a search like:
```
CE: HR at Acme Corp
URL: https://www.linkedin.com/sales/search/people?query=(company:(name:Acme Corp),title:(keyword:HR OR Human Resources OR People Operations OR Benefits OR Talent))
```

Results flow through the standard pipeline:
```
sales_nav_searches → Apify scraper → sales_nav_profiles → process_sales_nav_to_contacts() → contacts
```

New contacts found by this search will be automatically tagged in the existing pipeline. **Note:** These new contacts will need to be separately tagged for the CE campaign by the results handler, or the exporter's query updated to include recently-added contacts from CE company searches.

---

## Setup

### Prerequisites

1. **Supabase Postgres credential** `EgmvZHbvINHsh6PR` — already configured
2. **Slack webhook** — already configured
3. **`registrations` table** with `company_name` column
4. **`contacts` table** with `smartlead_status` and `company` columns
5. **`sales_nav_searches` table** — already exists
6. **`campaign_activity` table** — verify this table exists; if not, the log step will fail gracefully (set to continueOnFail)

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `n8n-workflows/colleague-expansion.json`
3. Verify credentials are mapped
4. Activate the workflow
5. Copy the webhook URL for use in registration systems

---

## Monitoring

### Check recent colleague expansions
```sql
SELECT
  description,
  metadata->>'company_name' as company,
  (metadata->>'tagged_contacts_count')::int as tagged,
  activity_at
FROM campaign_activity
WHERE activity_type = 'colleague_expansion_triggered'
ORDER BY activity_at DESC
LIMIT 20;
```

### Check contacts queued for CE
```sql
SELECT
  company,
  COUNT(*) as contacts_queued,
  MAX(updated_at) as last_updated
FROM contacts
WHERE smartlead_status = 'queued_ce'
GROUP BY company
ORDER BY last_updated DESC;
```

### Check Sales Nav searches queued by CE
```sql
SELECT
  search_name,
  status,
  profiles_found,
  created_at
FROM sales_nav_searches
WHERE requested_by = 'colleague-expansion'
ORDER BY created_at DESC
LIMIT 20;
```

---

## Related

- [Sales Navigator Scraper](README-sales-nav-scraper.md) — processes the queued searches
- [Supabase to SmartLead Exporter](../../../n8n-workflows/supabase-to-smartlead-exporter.json) — sends tagged contacts to SmartLead
- [Sales Playbook: Colleague Expansion](../../docs/SALES-PLAYBOOK.md#play-1-colleague-expansion-automated) — business rules
