# Phase 6: Response Tracking - Context

**Gathered:** 2026-01-22
**Status:** Ready for planning

<domain>
## Phase Boundary

Track when instructors click their magic links so the dashboard shows viewed vs not-viewed status. This phase adds view tracking to existing notifications and updates the dashboard to display viewed status. Re-send functionality and automated follow-ups are out of scope.

</domain>

<decisions>
## Implementation Decisions

### View Tracking Behavior
- Record timestamp on **first click only** — ignore subsequent visits
- Record view **even if token is expired** — instructor saw the notification, even if they can't act on it
- **No client/device tracking** — timestamp only, no user-agent or metadata
- **No side effects** — viewing doesn't change notification status, purely informational

### Dashboard Display
- **Subtle 'Viewed' text badge** on instructor rows
- Badge color: **neutral/gray** — informational only, not good or bad
- Badge placement: **in status column** with other badges
- Timestamp shown **on hover/tooltip only** — "Viewed Jan 22 at 3:45 PM"

### Not Responded Breakdown
- **Visual badges only** — single list, 'Viewed' badge distinguishes from not viewed (no badge)
- **Not Viewed is higher priority** than Viewed+No Claim (delivery issues worse than engagement issues)
- Default sort: **Not Viewed instructors first** — surface delivery problems before engagement problems
- **No new actions** — just visibility for now, re-send can come in a future phase

### Data Retention
- Keep view data **forever** — useful for historical analysis
- **Add viewed_at column to notifications table** — simple, single timestamp per notification
- **No special privacy handling** — internal data, instructors don't see their own view status

### Claude's Discretion
- Exact tooltip formatting and timing
- Badge CSS styling details
- Query optimization for sort order

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches

</specifics>

<deferred>
## Deferred Ideas

- **Re-send notification button** — allow admin to resend to Not Viewed instructors (mentioned, deferred to future phase)

</deferred>

---

*Phase: 06-response-tracking*
*Context gathered: 2026-01-22*
