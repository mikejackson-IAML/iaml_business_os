# Phase 8: Dashboard Alerts - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Surface alerts for programs at risk and unresponsive VIP instructors in the Business OS dashboard. Two alert types: "Tier Ending" (program approaching tier close with no claims) and "VIP Non-Response" (VIP instructor hasn't viewed notification). Includes configurable thresholds and dismiss capability.

</domain>

<decisions>
## Implementation Decisions

### Alert Presentation
- Badge-only approach — number badge in sidebar nav next to "Faculty Scheduler" menu item
- Clicking badge navigates/scrolls to alerts section within the main dashboard page
- Color-coded by severity — red for critical (tier ending), yellow for warning (VIP non-response)

### Threshold Behavior
- Tier ending: Configurable hours-before threshold (admin can set 24h, 48h, etc.)
- VIP non-response: Alert fires N days after notification sent IF instructor hasn't viewed
- Ship with sensible defaults (tier alert = 24h, VIP non-response = 3 days)
- Alerts fire automatically when conditions met — no manual trigger needed

### Dismiss Workflow
- Dismiss hides alert from active list (soft delete pattern)
- Individual dismiss only — no bulk "dismiss all" option
- Toast with "Undo" button for ~10 seconds after dismissing
- Once dismissed, that specific alert won't re-fire for same event

### Alert Prioritization
- Urgency-first sort order — tier-ending alerts before VIP non-response
- No limit on alert count — show all active alerts
- One alert per program maximum — highest priority alert shown, others suppressed
- Auto-resolve when condition fixed (tier claimed or VIP views)

### Claude's Discretion
- Where threshold configuration UI lives (settings tab, global settings, or inline)
- Exact timing of auto-resolution checks
- Alert section layout and card design
- Empty state when no alerts

</decisions>

<specifics>
## Specific Ideas

- Badge follows iOS app pattern (already used in Business OS sidebar)
- Severity colors align with existing dashboard patterns (red = critical, yellow = warning)
- Undo toast pattern matches quick actions implementation

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-dashboard-alerts*
*Context gathered: 2026-01-22*
