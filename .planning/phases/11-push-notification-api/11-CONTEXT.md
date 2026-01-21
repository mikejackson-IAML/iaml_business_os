# Phase 11: Push Notification API - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend infrastructure for sending push notifications via APNs. Includes device token registration, critical alert triggers, workflow completion notifications, and daily digest generation. The notification UI and preferences screen belong to Phase 12.

</domain>

<decisions>
## Implementation Decisions

### Critical Alert Triggers
- Severity threshold: Claude's discretion on what qualifies as push-worthy
- Batching: If 3+ alerts fire within 5 minutes, combine into single notification
- App-level quiet hours: Build quiet hours setting (e.g., 10pm-7am) — API must check before sending
- No repeat alerts: Each alert fires one notification, no escalation if unresolved

### Completion Notifications
- Only user-triggered workflows: Quick actions and chat commands notify, scheduled background jobs don't
- Notify on both success and failure: Different message content for each outcome
- Result content: Claude's discretion on including summary stats vs simple status
- Timing: Claude's discretion on immediate vs brief delay

### Daily Digest
- Timing: User-configurable in settings (API reads preference, default to 7am local)
- Content: Comprehensive — unresolved alerts, key metrics/health scores, workflow activity summary
- Skip behavior: Claude's discretion on whether to send "all quiet" digests
- Optional: Users can disable digest entirely via settings toggle

### Notification Payload
- Critical alerts use iOS Critical Alert API (bypasses Do Not Disturb) — requires Apple approval
- Action buttons: Claude's discretion on context-specific actions
- Badge count: Claude's discretion on behavior
- Grouping: Claude's discretion on lock screen organization

### Claude's Discretion
- Alert severity threshold (what qualifies for immediate push)
- Completion notification timing
- Whether to include result summaries in completion notifications
- Skip empty daily digests or send "all quiet"
- Action button design
- Badge count behavior
- Notification grouping strategy

</decisions>

<specifics>
## Specific Ideas

- Critical Alerts should feel urgent — they bypass quiet hours and DND for a reason
- Completion notifications are informational — "your thing finished" confirmation
- Daily digest is optional and time-configurable — respect user preferences
- Batching prevents notification spam when multiple alerts fire together

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 11-push-notification-api*
*Context gathered: 2026-01-21*
