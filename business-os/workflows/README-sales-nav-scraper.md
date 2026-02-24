# Sales Navigator Pipeline

> **CEO Summary:** Automatically scrapes LinkedIn Sales Navigator searches, finds email addresses through Apollo + Hunter.io, validates them with NeverBounce, and stores everything in Supabase. You decide when to start campaigns.

## What It Does

This pipeline takes Sales Navigator search URLs and produces enriched contacts in Supabase:

1. **Queue** — `/queue-sales-nav` slash command queues URLs
2. **Scrape** — Apify extracts profiles (no LinkedIn cookies needed)
3. **Dedupe** — Profiles upserted into contacts by LinkedIn URL, marked `lead_source = 'sales_nav'`
4. **Enrich** — Apollo finds email, Hunter.io as fallback
5. **Validate** — NeverBounce checks deliverability
6. **Store** — All data saved to contacts table with `enrichment_source` (apollo/hunter)

## Architecture

```
/queue-sales-nav (Claude slash command)
        │
        ▼
┌─────────────────────────┐
│ sales_nav_searches      │ ← Supabase queue table
│ (status: queued)        │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Sales Nav Scraper       │ ← n8n workflow (every 5 min)
│ Apify Actor             │
│ No cookies needed       │
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│ Results Handler         │ ← n8n workflow
│ Dedupe → contacts table │
│ lead_source = sales_nav │
└───────────┬─────────────┘
            │ POST /webhook/waterfall-enrichment
            ▼
┌─────────────────────────┐
│ Waterfall Enrichment    │ ← n8n workflow
│                         │
│ 1. Apollo (email)       │
│ 2. Hunter.io (fallback) │
│ 3. NeverBounce (verify) │
│ 4. Store in Supabase    │
└─────────────────────────┘
```

## Quick Start

```
/queue-sales-nav https://www.linkedin.com/sales/search/people?query=... "Marketing Directors Bay Area"
```

## Contact Data Stored

After enrichment, each contact in Supabase has:

| Column | Example Value | Description |
|--------|---------------|-------------|
| `lead_source` | `sales_nav` | Where the contact came from |
| `enrichment_source` | `apollo` or `hunter` | Which service found the email |
| `enrichment_data` | `{apollo_id: ..., phone: ...}` | Raw API response data |
| `enriched_at` | `2026-01-28T10:00:00Z` | When enrichment completed |
| `email_status` | `valid`, `invalid`, `catch_all` | NeverBounce result |
| `email_validation_source` | `neverbounce` | Validator used |

## Enrichment Waterfall

| Step | Provider | What It Does | Fallback |
|------|----------|-------------|----------|
| 1 | Apollo | Find email by name + company + LinkedIn | → Hunter.io |
| 2 | Hunter.io | Find email by name + company | → Mark as no email |
| 3 | NeverBounce | Validate deliverability | Skip if no email |

## Database Tables

| Table | Purpose |
|-------|---------|
| `sales_nav_searches` | Search URL queue and status |
| `sales_nav_profiles` | Raw scraped profile data |
| `contacts` | Enriched contacts with email + validation |
| `email_validations` | NeverBounce result cache |

## Costs

| Service | Cost |
|---------|------|
| Apify scraping | ~$0.01/profile |
| Apollo enrichment | 1 credit/contact |
| Hunter.io (fallback) | 1 credit/contact |
| NeverBounce validation | $0.008/email |

## Safety

- Apify scrapes from cloud infrastructure — no LinkedIn cookies, no account risk
- Rate limited: 1 scrape per 5 minutes, 2-second delay between enrichment calls
- NeverBounce validation prevents sending to bad addresses

## n8n Workflow Details

| Workflow | ID | URL |
|----------|----|-----|
| Sales Nav Scraper | `XzuvwpNfgysxtFLq` | https://n8n.realtyamp.ai/workflow/XzuvwpNfgysxtFLq |
| Results Handler | TBD | Import from `n8n-workflows/sales-nav-results-handler.json` |
| Waterfall Enrichment | TBD | Import from `n8n-workflows/waterfall-enrichment.json` |

## Setup Requirements

1. **Apify API Token** — n8n credential
2. **Apollo API Key** — n8n credential (httpHeaderAuth)
3. **Hunter.io API Key** — Hardcoded in workflow (can move to env var)
4. **NeverBounce API Key** — n8n environment variable `NEVERBOUNCE_API_KEY`
5. **Supabase** — Run migration: `20260204_sales_nav_pipeline_schema.sql`

## Related

- [Workflow Registry](../workflows/README.md)
- [Lead Intelligence Architecture](../docs/architecture/04-LEAD-INTELLIGENCE.md)

## Status

- [x] Scraper workflow built and tested
- [x] Results handler workflow built (sets `lead_source = 'sales_nav'`)
- [x] Waterfall enrichment (Apollo + Hunter.io + NeverBounce)
- [x] Data stored in Supabase contacts table
- [x] `/queue-sales-nav` slash command created
- [ ] End-to-end production test
