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

## v1.1 Analytics & Insights (In Progress)

**Started:** 2026-01-22

**Goal:** Add response tracking, instructor history, and dashboard alerts to give IAML visibility into instructor engagement and recruitment health.

**Target features:**
- Track when instructors view their magic links (portal entry)
- Display instructor teaching history in dashboard
- Alert when programs approaching tier end without claims
- Alert when VIP instructors haven't viewed notifications

**Phases:** 6-8 (continuing from v1.0)
**Requirements:** 10 total

---
