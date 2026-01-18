# Airtable Registrations Sync

> **CEO Summary:** This workflow syncs all program registrations from Airtable to Supabase and GoHighLevel (GHL) every night at midnight. It also responds to webhooks for immediate syncing. This ensures our dashboard has accurate enrollment data and GHL has current contact records for participant communications.

## Overview

```
Triggers:
├── Daily Midnight Sync (scheduled)
└── Webhook (on-demand)
       │
       ▼
 Airtable API ──► Fetch Registrations
       │
       ▼
 Split into individual records
       │
       ▼
 Transform registration data
       │
       ▼
 Upsert to Supabase registrations table
       │
       ▼
 Link to program_instances (FK)
       │
       ▼
 Push each registration to GHL
       │
       ├── Scheduled ──► Sync Complete
       └── Webhook ──► Respond with count
```

## Schedule

- **Daily:** Midnight (automatic full sync)
- **On-demand:** Webhook trigger for immediate sync

## What It Does

1. **Fetches registrations** from Airtable (up to 1000 records)
2. **Transforms data** to match Supabase schema:
   - Extracts contact info (name, email, phone, title, company)
   - Extracts program info (name, format, location, dates)
   - Extracts payment info (amount, status, Stripe IDs)
   - Captures UTM tracking parameters
3. **Upserts to Supabase** with conflict handling on `airtable_id`
4. **Links foreign keys** to `program_instances` table
5. **Pushes to GHL** for CRM contact management and email sequences

## Data Flow

### Airtable → Supabase

| Airtable Field | Supabase Column |
|----------------|-----------------|
| Record ID | `airtable_id` |
| Program Instance | `program_instance_airtable_id` |
| Contact Name | `first_name`, `last_name` |
| Contact Email | `email` |
| Contact Phone | `phone` |
| Job Title | `job_title` |
| Company Name | `company_name` |
| Created Date | `registration_date` |
| Registration Status | `registration_status` |
| Final Price | `final_price` |
| Payment Status | `payment_status` |
| Stripe Payment Intent | `stripe_payment_intent` |
| UTM Source/Medium/Campaign | `utm_source`, `utm_medium`, `utm_campaign` |

### Supabase → GHL

All registration data is pushed to GHL webhook with tags `n8n_sync` and `airtable_registration`.

## GHL Integration

The workflow pushes to GHL webhook: `https://services.leadconnectorhq.com/hooks/MjGEy0pobNT9su2YJqFI/...`

**GHL Fields Populated:**
- `unique_identifier` - Airtable record ID
- `first_name`, `last_name`, `email`, `phone`, `title`
- `company_name`
- `selected_program`, `program_format`, `selected_location`
- `program_start_date`, `program_end_date`
- `registration_code`, `amount_due`, `payment_status`
- `registration_status`, `registration_date`
- UTM tracking fields
- Tags: `n8n_sync`, `airtable_registration`

## Setup

### Prerequisites

1. **Airtable API credential** with ID `xMPEGJc6SUNw3C1n`
2. **Supabase Postgres credential** with ID `EgmvZHbvINHsh6PR`
3. **Database tables:** `registrations`, `program_instances`
4. **GHL webhook** configured to receive registration data

### Airtable Configuration

The workflow fetches from:
- **Base ID:** `applWPVmMkgMWoZIC`
- **Table ID:** `tblhp9Llw7zSRqRnt`

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `airtable-registrations-sync.json`
3. Verify credentials are connected
4. Activate the workflow

### Webhook URL

To trigger immediate sync, POST to:
```
https://n8n.realtyamp.ai/webhook/airtable-registration-sync
```

## Monitoring

### Check recent syncs

```sql
SELECT
  registration_date,
  COUNT(*) as registrations,
  SUM(final_price) as revenue,
  COUNT(DISTINCT program_instance_id) as programs
FROM registrations
WHERE registration_date >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY registration_date
ORDER BY registration_date DESC;
```

### Check sync status

```sql
SELECT
  program_name,
  COUNT(*) as total_registrations,
  COUNT(program_instance_id) as linked_to_program,
  SUM(final_price) as revenue
FROM registrations r
LEFT JOIN program_instances pi ON pi.id = r.program_instance_id
GROUP BY program_name
ORDER BY COUNT(*) DESC;
```

### Find unlinked registrations

```sql
SELECT
  id,
  first_name,
  last_name,
  email,
  program_instance_airtable_id
FROM registrations
WHERE program_instance_id IS NULL
  AND program_instance_airtable_id IS NOT NULL;
```

## Troubleshooting

### Registrations not syncing
1. Check n8n workflow is active
2. Verify Airtable API key is valid
3. Check Airtable table ID matches current table

### GHL not receiving data
1. Check GHL webhook URL is current
2. Review n8n execution history for HTTP errors
3. Verify GHL workflow is active

### Program links missing
1. `program_instances` table may not have matching `airtable_id`
2. Run the linking query manually after import

## Related

- [Programs Department](../departments/programs/DEPARTMENT.md) - Owns registration tracking
- [Campaign Tracking Schema](../docs/architecture/08-CAMPAIGN-TRACKING.md) - Contact attribution
