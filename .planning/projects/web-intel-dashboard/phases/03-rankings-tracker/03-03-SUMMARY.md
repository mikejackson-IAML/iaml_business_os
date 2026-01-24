---
phase: 03-rankings-tracker
plan: 03
subsystem: ui
tags: [table, sorting, filtering, keywords]
requires: [03-01]
provides: [keywords-table, sortable-header]
affects: [03-04, 03-05]
tech-stack:
  added: []
  patterns: [sortable-columns, priority-filtering, url-state]
key-files:
  created:
    - dashboard/src/app/dashboard/web-intel/components/keywords-table.tsx
    - dashboard/src/app/dashboard/web-intel/components/sortable-header.tsx
  modified: []
decisions:
  - Default sort by priority ascending (critical first)
  - Null positions treated as 101 for sorting purposes
  - Position change uses positive=dropped, negative=improved convention
metrics:
  duration: 1 min
  completed: 2026-01-24
---

# Phase 03 Plan 03: Keywords Table Component Summary

Sortable, filterable keywords ranking table with position changes and priority indicators.

## What Was Built

### SortableHeader Component
Reusable clickable column header with sort direction indicators:
- ChevronUp icon when sorted ascending
- ChevronDown icon when sorted descending
- ChevronsUpDown icon (faded) when column is inactive
- Uppercase text-xs font-medium styling to match table header conventions

### KeywordsTable Component
Main keywords ranking table displaying:
1. **Keyword** (sortable, 1fr width)
2. **Position** (sortable, 80px - current ranking position)
3. **Change** (sortable, 80px - uses PositionChange component)
4. **Priority** (sortable, 100px - colored dot + text)
5. **URL** (non-sortable, 200px - target URL truncated)

**Data flow:**
- Joins keywords array with rankings array by keywordId
- Groups rankings by keyword, sorts by date (most recent first)
- Calculates change from last 2 ranking snapshots per keyword
- Filters by priorityFilter prop (from URL param)
- Sorts by selected column with toggle direction

**Sorting logic:**
- Priority: critical (0) -> high (1) -> medium (2) -> low (3)
- Position: ascending = best (1) first, nulls sort to bottom as 101
- Change: ascending = biggest improvements first (negative values)
- Keyword: ascending = alphabetical

## Requirements Satisfied

| Requirement | Status | Implementation |
|-------------|--------|----------------|
| RANK-01: Keywords table | Complete | All 5 columns displayed |
| RANK-02: Position changes | Complete | Uses PositionChange component |
| RANK-03: Filter by priority | Complete | Accepts priorityFilter prop |
| RANK-04: Sortable columns | Complete | 4 of 5 columns sortable |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Default sort: priority ascending | Critical keywords need attention first |
| Null positions = 101 for sorting | Ensures unranked keywords sort to bottom |
| Change calculation: new - old | Positive = dropped, negative = improved (matches SEO convention) |
| URL column not sortable | Rarely useful to sort by URL |

## Commits

| Hash | Description |
|------|-------------|
| 909944b | feat(03-03): create sortable header component |
| 4af673b | feat(03-03): create keywords table component |

## Deviations from Plan

None - plan executed exactly as written.

## Next Steps

Ready for 03-04: Integrate KeywordsTable into the web-intel page with real data.
