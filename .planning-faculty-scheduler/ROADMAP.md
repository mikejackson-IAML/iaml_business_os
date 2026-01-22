# Faculty Program Scheduler - Roadmap

## Milestones

- ✅ **v1.0 MVP** - Phases 1-5 (SHIPPED 2026-01-22)
- 🚧 **v1.1 Analytics & Insights** - Phases 6-8 (in progress)

---

<details>
<summary>✅ v1.0 MVP (Phases 1-5) - SHIPPED</summary>

**Delivered:** Complete tiered instructor assignment system with automated notifications, faculty sign-up portal, and Business OS dashboard integration.

**Phases:**
- Phase 1: Foundation & Data Migration
- Phase 2: Tier Engine & Notification System
- Phase 3: Instructor Sign-up Page
- Phase 4: Release Controls & Reminders
- Phase 5: Business OS Dashboard Integration

**Stats:** 38 requirements, 17 plans, 5 phases

**Archived:** See `.planning-faculty-scheduler/milestones/v1.0-ROADMAP.md`

</details>

---

## v1.1 Analytics & Insights

**Milestone Goal:** Add response tracking, instructor history, and dashboard alerts to give IAML visibility into instructor engagement and recruitment health.

### Overview

This milestone adds analytics and insights capabilities to the existing Faculty Scheduler system. Build order prioritizes data collection first (response tracking), then historical data (instructor history), and finally alerting (dashboard alerts).

**Build Order Rationale:**
1. Response Tracking first - Needed to identify "viewed but not claimed" instructors
2. Instructor History second - Builds on existing data, informs assignment decisions
3. Dashboard Alerts last - Uses response tracking data to power alerts

### Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 6 | Response Tracking | RT-01, RT-02, RT-03 | 3 |
| 7 | Instructor History | IH-01, IH-02, IH-03 | 3 |
| 8 | Dashboard Alerts | DA-01, DA-02, DA-03, DA-04 | 4 |

**Total:** 10 requirements across 3 phases

---

### Phase 6: Response Tracking
**Goal:** Track when instructors click their magic links so dashboard shows viewed vs not-viewed status
**Depends on:** v1.0 (existing notification and magic token system)
**Requirements:** RT-01, RT-02, RT-03

**Success Criteria** (what must be TRUE):
1. When instructor clicks magic link, viewed_at timestamp is recorded in notification record
2. Dashboard shows "Viewed" badge on instructors who have opened their notification
3. "Not Responded" list distinguishes between "Viewed, No Claim" and "Not Viewed"

**Plans:** TBD (estimated 2-3 plans)

Plans:
- [x] 06-01-PLAN.md — Database migration: Add viewed_at to notifications, update views (Wave 1)
- [x] 06-02-PLAN.md — Token validation: Record view on magic link click (Wave 2)
- [x] 06-03-PLAN.md — Dashboard: Viewed badge with tooltip, Not Viewed first sort (Wave 2)

---

### Phase 7: Instructor History
**Goal:** Store and display instructor teaching history for better assignment decisions
**Depends on:** Phase 6 (uses similar dashboard patterns)
**Requirements:** IH-01, IH-02, IH-03

**Success Criteria** (what must be TRUE):
1. Teaching history table stores past program assignments (instructor_id, program_id, dates, completed)
2. Admin can view instructor's teaching history in dashboard
3. Assign modal shows instructor's past programs when selecting

**Plans:** TBD (estimated 2-3 plans)

Plans:
- [ ] 07-01-PLAN.md — Database migration: Create teaching_history table, populate from claims
- [ ] 07-02-PLAN.md — Dashboard query and types for instructor history
- [ ] 07-03-PLAN.md — Dashboard UI: History display in instructor details and assign modal

---

### Phase 8: Dashboard Alerts
**Goal:** Surface alerts for programs at risk and unresponsive VIP instructors
**Depends on:** Phase 6 (response tracking needed for VIP non-response alerts)
**Requirements:** DA-01, DA-02, DA-03, DA-04

**Success Criteria** (what must be TRUE):
1. Alert badge shows count of active alerts in dashboard header
2. "Approaching Tier End" alerts fire 24h before tier window closes (configurable)
3. "VIP Non-Response" alerts fire when VIP hasn't viewed after N days (configurable)
4. Alerts can be dismissed/acknowledged from dashboard

**Plans:** TBD (estimated 3-4 plans)

Plans:
- [ ] 08-01-PLAN.md — Database migration: Create alerts table with configurable thresholds
- [ ] 08-02-PLAN.md — Supabase functions: Generate alerts for tier-end and VIP non-response
- [ ] 08-03-PLAN.md — Dashboard query and types for alerts
- [ ] 08-04-PLAN.md — Dashboard UI: Alert badge, alert list, dismiss action

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | 17/17 | Complete | 2026-01-22 |
| 6. Response Tracking | v1.1 | 3/3 | Complete | 2026-01-22 |
| 7. Instructor History | v1.1 | 0/3 | Ready to plan | - |
| 8. Dashboard Alerts | v1.1 | 0/4 | Planned | - |

---
*Roadmap created: 2026-01-22*
*Last updated: 2026-01-22 after Phase 6 complete*
