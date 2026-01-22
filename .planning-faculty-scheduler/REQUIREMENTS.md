# Requirements: Faculty Program Scheduler v1.1

**Defined:** 2026-01-22
**Core Value:** Faculty members receive magic-link emails when programs become available to their tier, view a personalized list of claimable blocks, and instantly lock in teaching assignments — while IAML monitors the entire process from a Business OS dashboard.

## v1.1 Requirements

Requirements for Analytics & Insights milestone. Each maps to roadmap phases.

### Response Tracking

- [ ] **RT-01**: System records when instructor clicks magic link (portal entry)
- [ ] **RT-02**: Notification record updated with viewed_at timestamp when link clicked
- [ ] **RT-03**: Dashboard shows "Viewed" vs "Not Viewed" status per instructor notification

### Instructor History

- [ ] **IH-01**: Database stores historical teaching records (instructor_id, program_id, dates, completed)
- [ ] **IH-02**: Dashboard displays instructor's past programs when viewing instructor details
- [ ] **IH-03**: Instructor history shows in assign modal when selecting who to assign

### Dashboard Alerts

- [ ] **DA-01**: Alert when program approaching tier end with no claims (configurable threshold, e.g., 24h before)
- [ ] **DA-02**: Alert when VIP instructor hasn't viewed after N days of notification (configurable)
- [ ] **DA-03**: Alerts displayed as badge/banner in faculty scheduler dashboard
- [ ] **DA-04**: Alerts list with dismiss/acknowledge action

## v2+ Requirements (Future)

Deferred to future milestones. Tracked but not in current roadmap.

### Instructor Preferences

- **PREF-01**: Instructor can indicate interest in specific program types
- **PREF-02**: Instructor can set availability date ranges
- **PREF-03**: Dashboard shows instructor preferences when assigning

### Waitlist

- **WL-01**: Instructor can join waitlist for fully claimed programs
- **WL-02**: System notifies waitlisted instructors when spot opens
- **WL-03**: Priority ordering for waitlist (first-come)

### Advanced Location

- **LOC-01**: Replace state-based "local" with travel distance calculation
- **LOC-02**: Instructor can set maximum travel distance preference

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Faculty portal changes | v1.1 is dashboard-focused; portal changes deferred |
| Email content changes | Current notification emails sufficient |
| Response time analytics | Simple viewed/not-viewed sufficient for v1.1 |
| Push notifications to iOS | Dashboard-only alerts for this milestone |
| Instructor self-service history | Admin-only view for v1.1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| RT-01 | Phase 6 | Pending |
| RT-02 | Phase 6 | Pending |
| RT-03 | Phase 6 | Pending |
| IH-01 | Phase 7 | Pending |
| IH-02 | Phase 7 | Pending |
| IH-03 | Phase 7 | Pending |
| DA-01 | Phase 8 | Pending |
| DA-02 | Phase 8 | Pending |
| DA-03 | Phase 8 | Pending |
| DA-04 | Phase 8 | Pending |

**Coverage:**
- v1.1 requirements: 10 total
- Mapped to phases: 10
- Unmapped: 0

---
*Requirements defined: 2026-01-22*
*Last updated: 2026-01-22 after initial definition*
