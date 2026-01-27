# Phase 5: Opportunities Pipeline - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Create and manage sales opportunities through two stage-based pipelines (in-house training and individual programs). Users can view opportunities in kanban and table views, create opportunities linked to companies/contacts, advance through stages, attach contacts with roles, add notes, and upload file attachments. AI features, bulk actions, and integrations are out of scope (handled in earlier phases).

</domain>

<decisions>
## Implementation Decisions

### Pipeline visualization
- Two views: kanban board (default) and table with horizontal stage bar — user can toggle between them
- Kanban board is the default landing view
- Drag-and-drop enabled on kanban to move opportunities between stages
- In-house and individual pipelines displayed as separate tabs (not combined)
- Mimic the Planning Studio kanban styling for the board design

### Opportunity creation flow
- Claude's discretion on modal vs full page (follow existing dashboard patterns)
- Context-aware company selection: auto-fill company when created from company profile, otherwise show type-ahead search dropdown
- Single deal value field (no probability/weighted pipeline)
- No expected close date field — stage progression is sufficient tracking

### Stage progression — In-house pipeline (7 stages)
1. Inquiry — Initial contact / call scheduled
2. Strategy Session — First meeting
3. Consultation — Deeper dive with faculty
4. Proposal Sent — Full proposal delivered
5. Planning — Accepted, logistics being planned
6. Won — Complete
7. Lost — Did not proceed

### Stage progression — Individual pipeline (5 stages)
1. Inquiry — Someone calls in / shows interest
2. Info Sent — Sent program information
3. Follow-Up — Following up if no registration yet
4. Registered — They signed up
5. Lost — Did not register

### Stage progression behavior
- Skip stages allowed — can jump to any stage (forward or backward)
- Won/Lost handling: Claude's discretion (suggest requiring loss reason on Lost, optional notes on Won)

### Detail view layout
- Claude's discretion on tabbed vs single-page layout
- This is a monitoring view — not high volume, just need to see where things are in the process
- Contacts attached with roles: Decision Maker, Influencer, Champion, End User, Billing Contact
- Attachments: simple upload list with name/date/size and download — no inline preview

### Claude's Discretion
- Modal vs full page for opportunity creation (match existing patterns)
- Detail page structure (tabbed vs scrollable — low volume, monitoring focus)
- Won/Lost behavior (suggest loss reason required, won notes optional)
- Kanban card content and density
- Stage visualization style on detail page
- Notes integration approach (reuse existing notes patterns)

</decisions>

<specifics>
## Specific Ideas

- "Mimic the Planning Studio kanban styling" — match the existing kanban board design from the Planning Studio module
- Low volume of opportunities — this is a monitoring/tracking tool, not high-throughput
- In-house flow reflects real sales process: inquiry → strategy session → consultation with faculty attorney → proposal → planning → won/lost
- Individual flow is much simpler: inquiry → info sent → follow-up → registered/lost

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-opportunities-pipeline*
*Context gathered: 2026-01-27*
