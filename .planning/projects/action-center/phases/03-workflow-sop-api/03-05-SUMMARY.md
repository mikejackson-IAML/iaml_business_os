# Plan 03-05 Summary: SOP Queries and Mutations

## What Was Built

Database query and mutation functions for SOP templates, following patterns from task-queries.ts and task-mutations.ts.

## Files Created

### 1. `dashboard/src/lib/api/sop-queries.ts`

Query functions for reading SOP data:

| Function | Description |
|----------|-------------|
| `listSOPs(params)` | Cursor-based pagination with filters for category, department, is_active, search |
| `getSOPById(id)` | Fetch single SOP template by ID |
| `getSOPExtendedById(id)` | Fetch SOP with computed `steps_count` field |

**Features:**
- Default sort by name ASC
- Supports sort_by: `created_at`, `name`, `times_used`
- Returns `ListSOPsResult` with `sops`, `cursor`, `has_more`

### 2. `dashboard/src/lib/api/sop-mutations.ts`

Mutation functions for writing SOP data:

| Function | Description |
|----------|-------------|
| `createSOP(data, createdBy)` | Create new SOP template |
| `updateSOP(id, data, updatedBy)` | Partial update with version auto-increment |
| `incrementSOPUsage(id)` | Track usage: times_used + 1, last_used_at = now |

**Features:**
- Version auto-increments on every save (per 03-RESEARCH requirement)
- Partial updates - only provided fields are changed
- Steps array full replacement pattern (not incremental)
- Non-throwing incrementSOPUsage (non-critical operation)

## Must Haves Verified

- [x] Query functions exist: listSOPs, getSOPById, getSOPExtendedById
- [x] Mutation functions exist: createSOP, updateSOP, incrementSOPUsage
- [x] listSOPs supports cursor-based pagination with filters
- [x] updateSOP auto-increments version number on every save
- [x] Steps array is stored directly (full replacement pattern)

## Commits

1. `feat(03-05): add SOP query functions` - sop-queries.ts
2. `feat(03-05): add SOP mutation functions` - sop-mutations.ts

## Notes

- TypeScript compilation shows type errors related to Supabase generated types not including action_center schema tables. This is a pre-existing issue also affecting task-mutations.ts. The code patterns are correct and match the existing task API implementation.
- incrementSOPUsage has fallback logic if the RPC function doesn't exist yet
