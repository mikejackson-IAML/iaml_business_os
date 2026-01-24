# Phase 8: Alert Integration - Context

**Gathered:** 2026-01-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Alerts from Business OS monitors automatically create tasks in the Action Center via n8n workflows. This phase builds the automation bridge between the existing alert system and the Task API (Phase 2). The goal: when something needs attention, it becomes a trackable task.

</domain>

<decisions>
## Implementation Decisions

### Alert-to-task mapping
- **Title format:** Action-oriented (transform "SSL Certificate Expiring Soon" → "Renew SSL Certificate")
- **Transformation approach:** AI transformation via Claude to generate action-oriented titles from alert content
- **Description content:** AI-generated actionable summary focused on what to do, with key details (not full alert dump)
- **Department assignment:** Mapped by alert type/category (e.g., uptime/SSL → Digital, payment failures → Operations)

### Severity thresholds
- **Critical alerts:** Create critical priority tasks; business-hours aware due dates (after 6pm → due next business day 9am)
- **Warning alerts:** Create high priority tasks; due date from alert metadata (alert specifies urgency/offset)
- **Info alerts:**
  - Default: Do not create tasks
  - Exception 1: Configurable per alert type (some info alerts can be flagged to always create low-priority tasks)
  - Exception 2: Accumulation rule — same info alert 3+ times in 24 hours creates a low priority task

### Duplicate handling
- **Dedupe key:** Claude's discretion — likely alert type + affected resource as composite key
- **On duplicate with open task:** Bump priority if escalated (if duplicate is higher severity than original task, escalate it)
- **Cooldown after completion:** Configurable per alert type (some need longer cooldown than others)
- **Dismissed tasks:** Claude's discretion — likely respect dismissal with reasonable timeout (7 days)

### Source linking
- **Entity reference:** Store both alert ID AND affected resource (dual reference for full context)
- **Alert source location:** Supabase alerts table; link format: `/alerts/[id]` on dashboard
- **UI integration:** Claude's discretion — likely link in description (simpler) or dedicated button if it improves UX
- **Alert resolution:** When task completed, update alert record status to 'resolved' with timestamp

### Claude's Discretion
- Exact dedupe key composition (type + resource vs alert ID vs custom)
- Dismissed task deduplication behavior and timeout window
- UI treatment of "View Alert" link (description vs button vs both)
- Default cooldown period for alert types without explicit config
- AI prompt design for title transformation and description generation

</decisions>

<specifics>
## Specific Ideas

- Title transformation should feel natural: "SSL Certificate Expiring Soon" → "Renew SSL Certificate" (active voice, action verb)
- Business hours defined as 9am-6pm for due date calculations
- Accumulation detection needs a sliding window: "3 times in last 24 hours" not "3 times today"
- Department mapping should be maintainable in workflow config, not hardcoded

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-alert-integration*
*Context gathered: 2026-01-24*
