# Project Milestones: Faculty Program Scheduler

## v1.0 MVP (Shipped: 2026-01-22)

**Delivered:** Complete tiered instructor assignment system with automated notifications, faculty sign-up portal, and Business OS dashboard integration.

**Phases completed:** 1-5 (17 plans total)

**Key accomplishments:**

- Database schema with programs, instructors, claims, and tier logic
- Automated tier advancement (VIP 7d -> Local 5d -> Open)
- Magic link authentication and faculty sign-up portal
- Email notifications via SendGrid (release, confirmation, reminders, re-release)
- 5 n8n workflows for automation
- Business OS dashboard with full admin controls

**Stats:**

- ~2,900 lines of TypeScript/SQL
- 5 phases, 17 plans
- 38 requirements shipped
- 58 commits

**Git range:** Initial faculty scheduler commits -> `658d0ce`

---

## v1.1 Analytics & Insights (Shipped: 2026-01-22)

**Delivered:** Analytics and insights capabilities including response tracking, instructor teaching history, and configurable dashboard alerts for recruitment health monitoring.

**Phases completed:** 6-8 (10 plans total)

**Key accomplishments:**

- Response tracking: viewed_at timestamps recorded when instructors click magic links
- "Viewed" badge in dashboard showing instructor engagement before claiming
- Teaching history table with trigger-based population from confirmed claims
- Expandable instructor rows showing past teaching assignments
- Alert system for tier-ending programs and VIP non-response
- Configurable alert thresholds via n8n_brain.preferences
- Optimistic UI for alert dismissal with 10-second undo

**Stats:**

- ~1,150 lines of SQL/TypeScript
- 3 phases, 10 plans
- 10 requirements shipped
- 30+ commits

**Git range:** `9ad07e4` (phase-6 start) → `8ba588b` (phase-8 complete)

---
