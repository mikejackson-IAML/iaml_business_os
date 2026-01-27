---
phase: 04-integrations-bulk-actions
plan: 01
subsystem: lead-intelligence-ui
tags: [checkbox, bulk-actions, selection, shadcn]
dependency_graph:
  requires: [03-03]
  provides: [contact-selection, bulk-actions-bar]
  affects: [04-02, 04-03]
tech_stack:
  added: ["@radix-ui/react-checkbox", "@radix-ui/react-dialog"]
  patterns: [set-based-selection, floating-action-bar]
key_files:
  created:
    - dashboard/src/components/ui/checkbox.tsx
    - dashboard/src/components/ui/dialog.tsx
    - dashboard/src/app/dashboard/lead-intelligence/components/bulk-actions-bar.tsx
  modified:
    - dashboard/src/app/dashboard/lead-intelligence/components/contact-table.tsx
    - dashboard/src/app/dashboard/lead-intelligence/lead-intelligence-content.tsx
decisions: []
metrics:
  tasks: 2/2
  completed: 2026-01-27
---

# Phase 4 Plan 1: Contact Selection & Bulk Actions Bar Summary

> Multi-select checkboxes on contact table with floating bulk actions bar showing campaign, enrich, and follow-up placeholder buttons.

## What Was Done

### Task 1: Checkbox selection column
- Installed shadcn Dialog and Checkbox components via CLI
- Added `selectedIds`, `onSelectOne`, `onSelectAll` props to ContactTable
- Rendered header checkbox with indeterminate state support
- Rendered per-row checkboxes tied to contact ID
- Updated colSpan on loading/empty states to account for new column

### Task 2: Selection state and bulk actions bar
- Created `BulkActionsBar` component: fixed-bottom floating bar with count, three action buttons (Add to Campaign, Enrich Selected, Set Follow-up), and clear button
- Added `selectedIds` state as `Set<string>` in lead-intelligence-content
- Implemented `handleSelectOne`, `handleSelectAll`, `handleClearSelection` callbacks
- Added useEffect to clear selection on searchParams or aiFilters change
- Bar renders conditionally when `selectedIds.size > 0`
- Action buttons are placeholder no-ops for now (wired in later plans)

## Deviations from Plan

None - plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| d124b8b0 | feat(04-01): add checkbox selection column to contact table |
| d3c93f60 | feat(04-01): add selection state and bulk actions bar |

## Verification

- `npm run build` passes
- Checkbox column renders in header and rows
- Selection state managed via Set, cleared on filter/page changes
- Bulk actions bar appears when contacts selected
