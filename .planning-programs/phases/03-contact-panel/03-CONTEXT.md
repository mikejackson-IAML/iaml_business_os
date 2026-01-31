# Phase 3: Contact Panel - Context

**Gathered:** 2026-01-31
**Status:** Ready for planning

<domain>
## Phase Boundary

Slide-out panel (600px+ width) that opens on registrant click. Displays enriched person data, registration/payment details, company information with historical attendee data, and engagement history from GA4/SmartLead/GHL integrations.

</domain>

<decisions>
## Implementation Decisions

### Panel layout & sections
- Person hero section at top: photo, name, title, company, key contact info
- Single scroll layout (no tabs) — all sections stacked vertically
- Section order: Registration → Payment → Company → Engagement

### Engagement history display
- Summary + expandable pattern: show counts/metrics at top, expand to see details
- Summary shows counts with recency: "5 emails opened (last: 3 days ago)"
- Expanded view is minimal: date + event type + subject/page, one line per event
- Show last 10 events with "View all" link for more

### Payment & workflow status
- Moderate prominence — clear section with status, not shouting
- Display status + due date only (Paid/Unpaid/Overdue, due date, days until/past due)
- Quick action buttons: "Send Reminder", "Mark Paid" available in section

### Company & colleagues
- Full Apollo-enriched company data: name, industry, size, growth rates, founded, technologies
- Company history scope: ALL registrants from that company across ALL programs historically
- Display as count + expandable table: "7 from ABC Company" expands to table with Name, Program, Date, Status
- Colleague Outreach button: wired up to trigger n8n workflow (not disabled placeholder)

### Claude's Discretion
- Section visual style (cards with borders vs. headers with dividers)
- Workflow status display format (badge, progress indicator, or badge + last action)

</decisions>

<specifics>
## Specific Ideas

- Company history goes beyond current program — "7 employees from ABC Company have registered, and these are the programs they've taken"
- Colleague Outreach should work immediately, even if the workflow it triggers is simple

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-contact-panel*
*Context gathered: 2026-01-31*
