---
phase: 02-registrations-tab
plan: 01
subsystem: schema-types
tags: [schema, typescript, supabase, apollo, registrations]
dependency-graph:
  requires: [01-foundation-programs-list]
  provides: [cancellation-columns, apollo-columns, program-detail-types, roster-queries]
  affects: [02-02, 02-03]
tech-stack:
  added: []
  patterns: [BLOCK_CONFIG constant, isBlockSelected helper]
key-files:
  created:
    - supabase/migrations/20260131_registrations_tab_schema.sql
  modified:
    - dashboard/src/lib/api/programs-queries.ts
    - dashboard/src/dashboard-kit/types/departments/programs.ts
decisions:
  - id: migration-manual
    choice: "Migration requires manual run in Supabase Dashboard"
    reason: "CLI migration history out of sync - multiple remote versions without local files"
  - id: block-config-constant
    choice: "BLOCK_CONFIG constant with program name to blocks mapping"
    reason: "Allows flexible block detection by exact or partial program name match"
  - id: cancellation-fields-nullable
    choice: "Cancellation fields (cancelled_at, refund_status) are nullable until migration applied"
    reason: "Graceful degradation - code works before and after migration"
metrics:
  duration: "10min"
  completed: "2026-01-31"
---

# Phase 02 Plan 01: Schema Extensions for Registrations Tab Summary

Extended database schema and TypeScript types to support registrations tab features including cancellation tracking, Apollo enrichment storage, and program detail queries.

## Tasks Completed

| Task | Name | Status | Commit |
|------|------|--------|--------|
| 1 | Schema extensions for cancellation and enrichment | Done | 8abdd5b5 |
| 2 | Types and query functions for program detail | Done | 57bc09b8 |

## What Was Built

### Task 1: Schema Extensions (Migration File)

Created `supabase/migrations/20260131_registrations_tab_schema.sql` with:

**Registrations table:**
- `cancelled_at TIMESTAMPTZ` - When registration was cancelled
- `cancellation_reason TEXT` - Why cancelled
- `refund_status TEXT` - not_applicable/pending/processed/denied
- `refund_amount DECIMAL(10,2)` - Amount refunded

**Contacts table:**
- `apollo_person_id TEXT` - Apollo person identifier
- `apollo_enriched_at TIMESTAMPTZ` - Last enrichment timestamp
- `apollo_enrichment_data JSONB` - Raw Apollo response
- `photo_url TEXT` - Contact photo URL

**Companies table:**
- `apollo_org_id TEXT` - Apollo organization identifier
- `apollo_enriched_at TIMESTAMPTZ` - Last enrichment timestamp
- `growth_30d/60d/90d NUMERIC(5,2)` - Growth percentages
- `technologies TEXT[]` - Tech stack array

**View update:**
- `registration_dashboard_summary` extended with registration_source, cancellation fields

### Task 2: TypeScript Types and Queries

Added to `programs-queries.ts`:

**Types:**
- `ProgramBlock` - Block configuration (id, name, shortName, startDate)
- `RegistrationRosterItem` - Extended with cancellation fields
- `RosterFilters` - Filter options interface

**Functions:**
- `getBlocksForProgram(programName)` - Get blocks by program name
- `getProgram(id)` - Fetch single program detail
- `getRegistrationsForProgram(id, filters)` - Extended with filter support
- `isBlockSelected(blocks, blockId)` - Check if block is selected

Added to `programs.ts` types:
- `ProgramDetailUI` - Client-side program detail type
- `ProgramBlockUI` - Client-side block type
- `RegistrationRosterItemUI` - Client-side roster item type
- `RosterFiltersUI` - Client-side filter state type

**BLOCK_CONFIG constant** maps program names to their blocks:
- Certificate in Employee Relations Law: 3 blocks
- Certificate in Strategic HR Leadership: 2 blocks
- Certificate in Legal HR Foundations: 2 blocks
- Certificate in HR Analytics: 2 blocks

## Decisions Made

1. **Migration Manual Run Required**
   - The Supabase CLI migration history is out of sync with remote
   - Migration file created and ready
   - User needs to run SQL in Supabase Dashboard SQL Editor
   - URL: https://supabase.com/dashboard/project/mnkuffgxemfyitcjnjdc/sql/new

2. **Block Config as Constant**
   - Program-to-blocks mapping stored in code constant
   - Supports exact and partial name matching
   - Easy to extend with new programs

3. **Nullable Cancellation Fields**
   - Fields return null if migration not applied
   - Code handles gracefully with default values

## Deviations from Plan

### Migration Application Blocked

**Found during:** Task 1
**Issue:** Supabase CLI migration history out of sync - remote has 20+ versions without local files
**Impact:** ALTER TABLE statements and view update not applied automatically
**Resolution:**
- Migration file created with SQL ready
- Added instructions to file header
- TypeScript code handles null values gracefully
- User needs to run SQL manually in Dashboard

## Key Files

| File | Purpose |
|------|---------|
| `supabase/migrations/20260131_registrations_tab_schema.sql` | Schema extensions for cancellation and Apollo |
| `dashboard/src/lib/api/programs-queries.ts` | getProgram, getBlocksForProgram, roster queries |
| `dashboard/src/dashboard-kit/types/departments/programs.ts` | ProgramDetailUI, RosterFiltersUI types |

## Verification

- [x] Migration file exists with all ALTER TABLE statements
- [x] TypeScript compiles without errors in programs files
- [x] ProgramDetail, RegistrationRosterItem, ProgramBlock types exported
- [x] getProgram, getBlocksForProgram, isBlockSelected functions exported
- [x] getRegistrationsForProgram supports filters

## Next Steps (Plan 02-02)

1. Create program detail page route (`/dashboard/programs/[id]`)
2. Build tabbed interface with Registrations default
3. Implement roster table with block columns
4. Add filter panel for roster

## Manual Action Required

Before running Plan 02-02, apply the migration:

1. Go to: https://supabase.com/dashboard/project/mnkuffgxemfyitcjnjdc/sql/new
2. Paste contents of: `supabase/migrations/20260131_registrations_tab_schema.sql`
3. Click "Run"
4. Verify columns exist with: `SELECT cancelled_at, refund_status FROM registrations LIMIT 1`
