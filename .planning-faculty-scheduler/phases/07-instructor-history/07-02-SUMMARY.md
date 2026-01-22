# Plan 07-02 Summary: Dashboard Query Layer and Types

## Outcome: COMPLETE

All TypeScript types and query functions for teaching history have been added to support the dashboard UI components.

## What Was Implemented

### Types Added (in `faculty-scheduler-queries.ts`)

| Type | Purpose | Lines |
|------|---------|-------|
| `TeachingHistoryRecord` | Single program history record with block count | 107-122 |
| `InstructorHistorySummary` | Aggregated counts for quick display | 128-135 |
| `EligibleInstructorWithHistory` | Extends EligibleInstructor with optional history | 141-143 |

### Functions Added

| Function | Purpose | Lines |
|----------|---------|-------|
| `getInstructorHistory(instructorId, limit)` | Fetch detailed history records, most recent first | 298-317 |
| `getInstructorHistorySummaries(instructorIds)` | Fetch summaries for multiple instructors in one call | 323-341 |
| `getEligibleInstructorsWithHistory(scheduledProgramId)` | Combine eligible instructors with their history summaries | 347-367 |

## Verification

- [x] TypeScript compiles without new errors (pre-existing Supabase typing issues unrelated to these changes)
- [x] `TeachingHistoryRecord` type has all fields matching database schema
- [x] `InstructorHistorySummary` type has all aggregation fields
- [x] `getInstructorHistory` returns empty array for non-existent instructor
- [x] `getInstructorHistorySummaries([])` returns empty array without error
- [x] `getEligibleInstructorsWithHistory` includes history property on each instructor
- [x] All new types and functions are exported

## Technical Notes

1. **Type ordering fix**: Moved `EligibleInstructorWithHistory` after `InstructorHistorySummary` to avoid TypeScript forward reference issues.

2. **On-demand loading**: History is fetched on-demand when expanding rows or opening the assign modal, not in the initial data load. This keeps the dashboard fast for the common case.

3. **Efficient batch loading**: `getInstructorHistorySummaries` accepts an array of IDs to fetch all summaries in a single database query rather than N+1 queries.

## Commits

| Commit | Description |
|--------|-------------|
| `88f029d` | feat(07-03): add teaching history query functions |
| `2753f6c` | fix(07-02): reorder types to avoid forward reference |

## Files Modified

- `dashboard/src/lib/api/faculty-scheduler-queries.ts`

## Next Steps

Plan 07-03 implements the UI components that consume these queries:
- InstructorHistoryPanel component for expandable row content
- InstructorList component with teaching history display
- Integration with assign modal
