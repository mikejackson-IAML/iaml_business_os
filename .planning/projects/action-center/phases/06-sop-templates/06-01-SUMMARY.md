# 06-01 Summary: SOP Server Actions

## Completed Tasks

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create SOP server actions file | `1cd6a1d` |
| 2 | Add mastery lookup to sop-queries.ts | `8ca5cef` |
| 3 | Add tasks-using-SOP query | `a62beb4` |
| 4 | Export types needed for actions | `ae46f44` |

## Files Modified

- `dashboard/src/app/dashboard/action-center/sop-actions.ts` (created)
- `dashboard/src/lib/api/sop-queries.ts` (modified)
- `dashboard/src/lib/api/sop-types.ts` (modified)

## Implementation Notes

### Server Actions (sop-actions.ts)

Created server actions that wrap SOP API calls with Next.js revalidation:

- `createSOPAction(data)` - Creates SOP with name validation, revalidates `/dashboard/action-center/sops`
- `updateSOPAction(id, data)` - Updates SOP with SOP_NOT_FOUND error handling
- `getSOPAction(id)` - Direct pass-through to `getSOPById`
- `getSOPsAction(params)` - Direct pass-through to `listSOPs`
- `getUserMasteryAction(sopId)` - Gets mastery for single-user CEO
- `getTasksUsingSOPAction(sopId)` - Gets tasks referencing the SOP

Actions reuse `ActionResult` type from existing `actions.ts` for consistency.

### Mastery Lookup (getUserMasteryForSOP)

Calculates user's mastery level for an SOP based on completed tasks:

- Tries `get_user_mastery` RPC first (if database function exists)
- Falls back to counting tasks with `sop_template_id` and `status='done'`
- Returns `{ mastery_level: number, mastery_tier: string }`

**Mastery Tiers:**
| Completions | Tier |
|-------------|------|
| 0-2 | novice |
| 3-5 | developing |
| 6-9 | proficient |
| 10+ | expert |

### Tasks Using SOP (getTasksUsingSOP)

Queries tasks that reference a specific SOP template:

- Returns total count and list of tasks (max 100)
- Task data includes: id, title, status
- Sorted by created_at descending
- Gracefully handles errors with empty result

### Type Exports (sop-types.ts)

Added types for mastery and usage:

```typescript
export type MasteryTier = 'novice' | 'developing' | 'proficient' | 'expert';
export interface SOPMastery { mastery_level: number; mastery_tier: MasteryTier; }
export interface TaskUsingSOP { id: string; title: string; status: string; }
export interface SOPUsageStats { count: number; tasks: TaskUsingSOP[]; }
```

## Verification

- [x] `sop-actions.ts` created with all server actions
- [x] `createSOPAction` and `updateSOPAction` revalidate correct paths
- [x] `getUserMasteryForSOP` returns mastery level and tier
- [x] `getTasksUsingSOP` returns count and task list
- [x] TypeScript compilation passes (existing Supabase type issues documented as known debt)
- [x] Actions follow existing `actions.ts` patterns

## Technical Notes

TypeScript shows a warning for the `get_user_mastery` RPC call because the Supabase generated types don't include the `action_center` schema. This is documented in STATE.md as "Known Technical Debt" and the code works correctly at runtime with proper fallback handling.
