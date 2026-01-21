# Phase 10: Workflow API & Quick Actions - Context

**Gathered:** 2026-01-20
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can trigger n8n workflows with one tap from a grid of quick actions on the Home tab. Includes API endpoints for triggering workflows and listing available actions, UI grid with feedback states, and Settings for configuring which actions appear.

</domain>

<decisions>
## Implementation Decisions

### Action grid layout
- 2x3 grid (6 actions max) — compact, fits above the fold
- Each action: icon + short label
- Grid appears on Home tab below health dashboard

### Trigger feedback
- Fire-and-forget pattern: tap → confirm (if needed) → "Sent!" toast → done
- No waiting for workflow completion
- Toast dismisses automatically after 2 seconds

### Confirmation behavior
- Only risky/destructive actions require confirmation
- Safe actions (status checks, reports) execute immediately
- Confirmation is a simple alert: "Run [Action Name]?" with Cancel/Run buttons
- Risk level defined per-workflow in API response

### Action configuration
- Settings screen shows available workflows
- User can enable/disable which appear in grid
- Drag to reorder enabled actions
- Maximum 6 actions in grid (excess hidden)

### Claude's Discretion
- Icon selection for each workflow type
- Exact grid spacing and card styling
- Toast animation and positioning
- Loading indicator style (spinner vs subtle opacity)
- Settings UI layout

</decisions>

<specifics>
## Specific Ideas

- Confirmation pattern matches Phase 9's high-risk action dialogs for consistency
- Grid should feel tappable and responsive — immediate visual feedback on press

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-workflow-api-quick-actions*
*Context gathered: 2026-01-20*
