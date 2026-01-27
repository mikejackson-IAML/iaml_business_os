---
phase: 01-database-schema-core-api
plan: 03
subsystem: api
tags: [companies, crud, next-api, supabase]
dependency-graph:
  requires: [01-01]
  provides: [companies-crud-api]
  affects: [02-contacts-companies-linking, 03-ui-companies]
tech-stack:
  added: []
  patterns: [offset-pagination, validate-then-mutate, async-route-params]
key-files:
  created:
    - dashboard/src/lib/api/lead-intelligence-companies-types.ts
    - dashboard/src/lib/api/lead-intelligence-companies-validation.ts
    - dashboard/src/lib/api/lead-intelligence-companies-queries.ts
    - dashboard/src/lib/api/lead-intelligence-companies-mutations.ts
    - dashboard/src/app/api/lead-intelligence/companies/route.ts
    - dashboard/src/app/api/lead-intelligence/companies/[id]/route.ts
  modified:
    - dashboard/src/lib/supabase/types.ts
decisions:
  - id: supabase-type-assertion
    decision: Used `as never` for Supabase insert/update due to type mismatch
    rationale: Supabase generated types use Json but API types use Record<string, unknown>; runtime compatible
metrics:
  duration: ~3 minutes
  completed: 2026-01-27
---

# Phase 01 Plan 03: Companies CRUD API Summary

> Complete companies CRUD API with pagination, sorting, validation, and structured errors matching the existing task API pattern.

## What Was Done

### Task 1: Companies types and validation
- Defined `Company`, `CreateCompanyInput`, `UpdateCompanyInput`, `CompanyListParams`, `CompanyListResponse` interfaces
- Created validation functions: `validateCreateCompany` (name required, URL validation for website/linkedin_url, positive int for employee_count) and `validateUpdateCompany` (same rules, all optional)
- Mirrored task-validation pattern with `ValidationResult<T>`, `createValidationError`, `createErrorResponse`

### Task 2: Queries, mutations, and API routes
- `getCompanies`: offset-based pagination with configurable sort column and order, exact count
- `getCompanyById`: single select with PGRST116 not-found handling
- `createCompany`, `updateCompany`, `deleteCompany`: standard Supabase mutations
- List route: GET (paginated) + POST (create with 201)
- Detail route: GET (404 if missing) + PUT (validate + update) + DELETE (204)
- All routes use `validateApiKey`, UUID format validation, structured error responses
- Added `companies` table definition to Supabase types file

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added companies table to Supabase types**
- **Found during:** Task 2
- **Issue:** Supabase typed client didn't know about `companies` table, causing TS2769 errors on insert/update
- **Fix:** Added full Row/Insert/Update type definitions to `dashboard/src/lib/supabase/types.ts`
- **Files modified:** `dashboard/src/lib/supabase/types.ts`
- **Commit:** 4930e539

**2. [Rule 3 - Blocking] Used type assertion for mutations**
- **Found during:** Task 2
- **Issue:** `CreateCompanyInput` uses `Record<string, unknown>` for enrichment_data but Supabase Insert type uses `Json`; structurally compatible but TS rejects it
- **Fix:** Used `as never` type assertion on insert/update calls
- **Commit:** 4930e539

## Commits

| Task | Commit | Message |
|------|--------|---------|
| 1 | b6b466da | feat(01-03): create companies types and validation |
| 2 | 4930e539 | feat(01-03): create companies queries, mutations, and API routes |

## Next Phase Readiness

- Companies API is fully operational
- Contacts API (01-02) uses identical patterns and can be built in parallel
- No blockers for downstream phases
