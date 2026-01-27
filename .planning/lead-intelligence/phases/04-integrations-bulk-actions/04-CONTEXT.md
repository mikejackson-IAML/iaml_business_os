# Phase 4: Integrations & Bulk Actions - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can take action at scale — add contacts to SmartLead campaigns, trigger enrichment, find colleagues at companies, and set follow-ups. Includes multi-select checkbox mechanism on contact list, bulk actions bar, and all supporting API endpoints (enrichment, campaign, follow-up, find-colleagues).

</domain>

<decisions>
## Implementation Decisions

### SmartLead campaign flow
- Active campaigns only in the modal (no paused/draft)
- Warn before adding if contacts are already in the selected campaign — show duplicate list and ask user to confirm
- Always use primary email address (no per-contact email selection)
- Toast notification on completion: "Added 8 contacts to [Campaign Name]"

### Enrichment behavior
- Enrichment source selection: Claude's discretion based on existing integrations (Apollo, PhantomBuster, etc.)
- Merge strategy: **Fill blanks only** — never overwrite existing fields
- Flag differences: when enriched data differs from existing fields, flag for manual review on Enrichment Data tab
- Raw enrichment JSON always stored regardless of merge outcome
- Timing: Claude's discretion (sync for single, async for bulk recommended)

### Find Colleagues flow
- Available from both contact profile and company profile
- Triggers n8n webhook to find people at the company
- Results displayed in modal with checkboxes + bulk "Add Selected" button
- Each result shows: name, job title, LinkedIn URL
- Existing CRM contacts badged "Already in CRM" (not hidden)
- For existing contacts with different data: offer "Update" option using same enrichment logic (fill blanks + flag differences)

### Bulk actions UX
- Selection bar design: Claude's discretion
- Always confirm before executing any bulk action (modal showing count + action summary)
- Follow-up creation fields: Claude's discretion (due date + note minimum)
- Progress feedback for bulk operations: Claude's discretion (progress bar or background toast)

### Claude's Discretion
- Enrichment source routing logic (which API for which data type)
- Single enrichment: sync vs async timing
- Bulk selection bar placement (sticky top vs bottom)
- Follow-up form fields (type selector optional)
- Bulk operation progress UI pattern
- Error handling and retry behavior for external API calls

</decisions>

<specifics>
## Specific Ideas

- User expressed concern about enrichment overwriting correct data — fill-blanks-only approach preserves trusted existing data
- Find Colleagues should double as a lightweight enrichment opportunity — existing contacts can be updated if external data has new info
- Duplicate warning for campaigns is important — user wants to know before adding someone who's already in a campaign

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-integrations-bulk-actions*
*Context gathered: 2026-01-27*
