# Phase 4: Logistics Tab - Context

**Gathered:** 2026-02-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Logistics checklist with status tracking and expense management. Displaying and editing operational preparation items for programs — 10 items for in-person, 6 items for virtual. Includes expense tracking with file attachments. Virtual programs hide irrelevant cards.

</domain>

<decisions>
## Implementation Decisions

### Card Layout & Interaction
- Inline editing — fields become editable in the expanded card, no modal dialogs
- Collapsed cards show brief status summary (e.g., "Instructor: John Smith (confirmed)" or "My Hotel: Not booked")
- Status icon (check/warning/error) visible in collapsed state alongside summary text

### Claude's Discretion: Card Behavior
- Default expand/collapse state (recommendation: collapse all, auto-expand incomplete items)
- Save behavior (recommendation: auto-save on blur for simple fields, explicit save for complex forms)

### Expense Tracking
- Expenses grouped by category with subtotals (Accommodations, Venue, Materials, Equipment)
- Track actual amounts only — no budget comparison for v1
- Support file attachments for receipts/invoices — stored in Supabase storage
- Each expense: description, amount, category, attachment, date

### Claude's Discretion: Expense Display
- Totals placement (recommendation: grand total at top summary, subtotals per category section)

### Virtual vs In-Person
- Virtual programs hide irrelevant cards entirely (hotel, venue, room block, AV cards hidden)
- Show "Virtual Program" badge at top of Logistics tab header
- Only 6 virtual items displayed vs 10 in-person items

### Claude's Discretion: Virtual Item Fields
- Platform/link ready: checkbox + optional link field
- Calendar invites, reminder emails: checkbox + optional date sent
- Keep fields practical without over-engineering

### Edit Permissions & Workflow
- Log all changes for audit purposes (who, what, when)
- Permissions follow AUTONOMOUS-BUILD-GUIDE: builder has full access, CEO view-only if needed

### Claude's Discretion: Audit & Confirmations
- Audit log display (recommendation: per-card history visible when expanded, or subtle "last updated by X" text)
- Confirmation behavior (recommendation: no confirmation for simple edits, confirm on marking complete to prevent accidental clicks)

</decisions>

<specifics>
## Specific Ideas

- Cards should match the visual style established in Phase 3 Contact Panel (clean, subtle shadows)
- Expense categories align with logistics groupings from AUTONOMOUS-BUILD-GUIDE: People, Accommodations, Venue, Materials, Equipment
- File upload for receipts should be simple — drag & drop or click to upload, support common formats (PDF, PNG, JPG)
- Audit trail useful for accountability when multiple people might touch the data

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-logistics-tab*
*Context gathered: 2026-02-01*
