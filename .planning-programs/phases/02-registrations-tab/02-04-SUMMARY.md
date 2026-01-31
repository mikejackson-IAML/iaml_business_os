---
phase: 02-registrations-tab
plan: 04
subsystem: programs-dashboard
tags: [apollo, enrichment, api, database-trigger, pg-net]
requires: ["02-01", "02-03"]
provides:
  - Apollo enrichment API endpoint
  - Auto-enrichment on registration insert
  - Contact enrichment via row click action
affects: ["03-contact-panel"]
tech-stack:
  added:
    - pg_net (PostgreSQL HTTP extension)
  patterns:
    - Database trigger for async API calls
    - 24-hour enrichment cache
    - JSONB storage for enrichment data
key-files:
  created:
    - dashboard/src/lib/api/apollo-enrichment.ts
    - dashboard/src/app/api/apollo/enrich/route.ts
    - supabase/migrations/20260131_apollo_auto_enrich_trigger.sql
  modified:
    - dashboard/src/app/dashboard/programs/[id]/program-detail-content.tsx
decisions:
  - pg_net for non-blocking async HTTP calls from database triggers
  - 24-hour cache prevents redundant enrichment API calls
  - app_config table for configurable API base URL
  - Error handling ensures registration insert never fails
metrics:
  duration: 2min
  completed: 2026-01-31
---

# Phase 02 Plan 04: Apollo Enrichment Integration Summary

Apollo enrichment API with automatic triggering on new registrations via pg_net database trigger

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Apollo enrichment library functions | 88f9257e | apollo-enrichment.ts |
| 2 | Apollo enrichment API route | 1ea0e458 | route.ts |
| 3 | Row click toast with enrichment option | b034444a | program-detail-content.tsx |
| 4 | Database trigger for auto-enrichment | 76b08952 | 20260131_apollo_auto_enrich_trigger.sql |

## What Was Built

### Apollo Enrichment Library (`apollo-enrichment.ts`)
- `enrichContactWithApollo()` - Calls Apollo people/match API endpoint
- `saveEnrichmentResults()` - Stores enriched data in contacts/companies tables
- `isRecentlyEnriched()` - 24-hour cache check to avoid redundant API calls
- Rate limit handling (429 response)
- Full enrichment result stored in JSONB column

### API Route (`/api/apollo/enrich`)
- POST endpoint for triggering enrichment
- Accepts email, firstName, lastName, domain, force parameters
- Returns enriched person and organization data
- Skips if contact was enriched within 24 hours (unless force=true)

### Row Click Enrichment
- Toast notification when clicking registration row
- "Enrich" action button for manual Apollo enrichment
- Displays enrichment result (success/skipped/failed)
- Prepares state for Contact Panel in Phase 3

### Database Trigger (`trigger_apollo_enrichment`)
- Fires AFTER INSERT on registrations table
- Uses pg_net for non-blocking async HTTP calls
- Skips if contact was recently enriched (24-hour check)
- Error handling ensures registration insert never fails
- app_config table for configurable API base URL

## Requirements Addressed

| Requirement | Status |
|-------------|--------|
| PROG-65: Apollo auto-enrichment on registration | Implemented via database trigger |

## Deviations from Plan

None - plan executed exactly as written.

## Configuration Notes

### APOLLO_API_KEY
Required environment variable for Apollo API access.
Source: Apollo Dashboard -> Settings -> API Keys

### Database Migration
The migration requires manual execution in Supabase Dashboard SQL Editor due to CLI history being out of sync:
- File: `supabase/migrations/20260131_apollo_auto_enrich_trigger.sql`
- URL: https://supabase.com/dashboard/project/mnkuffgxemfyitcjnjdc/sql/new

### API Base URL Configuration
After migration, update the config for your environment:
```sql
-- Development
UPDATE app_config SET value = 'http://localhost:3000' WHERE key = 'api_base_url';

-- Production
UPDATE app_config SET value = 'https://your-production-domain.com' WHERE key = 'api_base_url';
```

## Next Phase Readiness

**Phase 02 Complete:** All 4 plans in Phase 02 (Registrations Tab) are now complete.

Ready to proceed to Phase 03 (Contact Panel):
- Apollo enrichment API is ready for Contact Panel to display enriched data
- Row click handler sets selectedRegistration state for slideout panel
- Enrichment data stored in JSONB column for full detail display

## Technical Details

### Apollo API Integration
- Endpoint: `https://api.apollo.io/api/v1/people/match`
- Rate limit: 600 requests/hour
- Headers: X-Api-Key, Content-Type: application/json

### Database Storage
- contacts table: apollo_person_id, apollo_enriched_at, apollo_enrichment_data (JSONB)
- companies table: apollo_org_id, apollo_enriched_at, technologies (array)

### pg_net Extension
- Non-blocking HTTP POST from PostgreSQL
- Required for async enrichment without blocking registration insert
- Available on Supabase Pro plan and above
