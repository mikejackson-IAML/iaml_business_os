---
phase: 04-integrations-bulk-actions
plan: 02
subsystem: lead-intelligence
tags: [smartlead, campaigns, bulk-actions, modal]
dependency-graph:
  requires: [04-01]
  provides: [add-to-campaign-flow, smartlead-proxy-routes]
  affects: []
tech-stack:
  added: []
  patterns: [smartlead-proxy, bulk-with-duplicate-detection, batch-api-calls]
key-files:
  created:
    - dashboard/src/app/api/lead-intelligence/campaigns/route.ts
    - dashboard/src/app/api/lead-intelligence/contacts/[id]/add-to-campaign/route.ts
    - dashboard/src/app/api/lead-intelligence/bulk/add-to-campaign/route.ts
    - dashboard/src/app/dashboard/lead-intelligence/components/add-to-campaign-modal.tsx
  modified:
    - dashboard/src/app/dashboard/lead-intelligence/components/contact-row-actions.tsx
    - dashboard/src/app/dashboard/lead-intelligence/components/contact-table.tsx
    - dashboard/src/app/dashboard/lead-intelligence/lead-intelligence-content.tsx
decisions: []
metrics:
  duration: ~3min
  completed: 2026-01-27
---

# Phase 4 Plan 2: Add to Campaign Flow Summary

> SmartLead campaign integration with duplicate detection, single/bulk contact addition via modal

## What Was Built

### API Routes (3 new)

1. **GET /api/lead-intelligence/campaigns** - Fetches active (STARTED) SmartLead campaigns, returns id/name/status/created_at. 60s revalidation cache.

2. **POST /api/lead-intelligence/contacts/[id]/add-to-campaign** - Adds single contact by fetching from Supabase, posting to SmartLead. Validates email exists.

3. **POST /api/lead-intelligence/bulk/add-to-campaign** - Bulk add with duplicate detection. First call checks existing campaign leads and returns `action: 'confirm_needed'` with duplicate list. Second call with `confirmed: true` proceeds. Batches of 10 with 500ms delay.

### Campaign Modal

- Dialog with campaign list (selectable cards)
- Loading states for fetch and submit
- Duplicate warning with email list, "Add Anyway" / "Cancel"
- Success/error toasts via sonner

### Wiring

- Row actions: "Add to Campaign" now opens modal with single contact
- Bulk actions bar: "Add to Campaign" opens modal with all selected contacts
- Parent component manages modal state, clears selection on success

## Commits

| Hash | Description |
|------|-------------|
| 2d4a3a62 | SmartLead campaign API routes (3 files) |
| 9427cc89 | Campaign modal and action wiring (4 files) |

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

Campaign addition flow complete. Contacts can now be pushed to SmartLead campaigns from both individual row actions and bulk selection.
