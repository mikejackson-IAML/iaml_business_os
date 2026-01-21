# Phase 12: Push Notification UI - Context

**Gathered:** 2026-01-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Users receive and can act on push notifications. This phase handles iOS-side notification permission, handling incoming notifications, deep linking to relevant screens, and notification preferences in Settings. The API/backend for sending notifications was built in Phase 11.

</domain>

<decisions>
## Implementation Decisions

### Permission Flow
- Ask for permission after first quick action trigger (not onboarding or first launch)
- Value prop timing: "Want to know when it completes?" — clear reason to enable
- Show custom pre-permission screen before iOS system prompt explaining benefits
- If denied: silent respect — no nagging, no reminders, no banners
- Show "Notifications disabled" in Settings with link to iOS Settings if they change their mind

### Deep Linking Behavior
- Workflow complete notification → Home tab (command center view)
- Critical alert notification → Home tab with alerts sheet auto-opened (immediate visibility)
- Daily digest notification → Home tab (digest summarizes what Home shows)
- If app is already open: no auto-navigation, only navigate when user taps notification
- Don't interrupt current activity with auto-navigation

### Notification Content
- Tone: Direct and clear (professional, informative)
- Titles: "Workflow Complete", "Critical Alert", "Daily Summary"
- Workflow complete body: "{Workflow name} completed successfully" — specific, actionable
- Critical alert body: Alert type + affected system (e.g., "Digital Department health dropped to 45%")
- Daily digest body: Quick health summary ("All systems healthy. 3 workflows ran, 0 failures.")

### Settings Preferences
- Dedicated "Notifications" section in Settings (grouped, not scattered)
- Per-type toggles: Critical Alerts, Workflow Completions, Daily Digest (all on by default)
- Quiet hours: configurable start/end time pickers (critical alerts bypass)
- Digest time: hour picker for when to receive daily digest (default 8am local)

### Claude's Discretion
- Exact wording of pre-permission screen copy
- Animation/transition when opening alerts sheet from notification
- UI layout of Settings notification section
- Badge handling (show count or not)

</decisions>

<specifics>
## Specific Ideas

- Pre-permission screen should clearly list the three notification types and their benefit
- Time pickers should use iOS native wheel pickers for familiarity
- Quiet hours should show current timezone for clarity

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-push-notification-ui*
*Context gathered: 2026-01-21*
