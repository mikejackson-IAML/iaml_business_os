# Phase 10: Dashboard & Notifications - Context

**Gathered:** 2026-01-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Dashboard widget showing task counts with click-through to filtered views, nav badge for urgent items, and daily email digest. Users can configure notification preferences in settings.

</domain>

<decisions>
## Implementation Decisions

### Widget Layout
- Show three counts: Critical, Due Today, Overdue
- Overdue only displays if count > 0
- Visual treatment: color chips with icons (red for critical, amber for due today, red with attention icon for overdue)
- Clicking a count chip opens task list filtered to that category
- Widget placed top-left, first position on dashboard (most prominent)

### Badge Behavior
- Badge shows Critical + Overdue count only (not all open tasks)
- Badge appears on "Action Center" nav item
- Updates in real-time via subscription
- Hide badge entirely when count is 0 (no "0" badge)

### Digest Content
- Full structure: greeting + summary line, critical tasks section, due today section, overdue section, quick stats, CTA button
- Friendly and conversational tone ("Hey Mike, here's what's on your plate...")
- Still scannable with bullets and numbers prominent
- Send at 7am in user's timezone
- Skip digest entirely when 0 critical, 0 due today, 0 overdue

### Notification Preferences
- Three settings: daily digest on/off, digest time picker, critical alerts on/off
- Located in user settings page (not on Action Center page)
- Critical alerts delivered via email + in-app toast
- All preferences default to On for new users

### Claude's Discretion
- Exact color values and icon choices
- Toast notification animation and duration
- Digest email template styling
- Real-time subscription implementation approach

</decisions>

<specifics>
## Specific Ideas

- Badge should feel meaningful — only shows when something needs attention, not total open tasks
- Digest tone: "Hey Mike, here's what's on your plate today..." — personable but still scannable
- Widget click behavior like Linear: count chip → filtered list, no intermediate modal

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-dashboard-notifications*
*Context gathered: 2026-01-25*
