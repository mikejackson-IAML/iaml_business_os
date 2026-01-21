# IAML Business OS - Roadmap

## Milestones

- ✅ **v1.0 Business OS Foundation** - Phases 1-5 (workers, dashboard foundation)
- 🚧 **v2.0 iOS App** - Phases 6-13 (in progress)

---

<details>
<summary>✅ v1.0 Business OS Foundation (Phases 1-5) - COMPLETE</summary>

## Phase 1: Digital Department Completion
**Status**: COMPLETE (26/28 workers)

Workers deployed:
- Website monitors (uptime, SSL, links, security)
- Performance monitors (Lighthouse, page speed, Core Web Vitals)
- SEO monitors (sitemap, meta tags, schema, indexability)
- Functional monitors (forms, payments, registration, API health)

---

## Phase 2: Marketing & Lead Intelligence
**Status**: COMPLETE

### 2.1 Remaining Digital Workers (2 workers)
- [x] DIG-27: Content Freshness Monitor
- [x] DIG-28: Broken Resource Monitor

### 2.2 Marketing Analytics (3 workers)
- [x] MKT-04: Campaign Analyst
- [x] MKT-05: A/B Test Manager
- [x] MKT-06: Content Performance Tracker

### 2.3 Lead Intelligence (3 workers)
- [x] LEAD-09: Lead Scoring Engine
- [x] LEAD-10: Engagement Decay Monitor
- [x] LEAD-11: Re-engagement Trigger

### 2.4 Operations (3 workers)
- [x] OPS-18: Invoice Generator
- [x] OPS-19: Payment Reminder
- [x] OPS-20: Group Discount Manager

---

## Phase 3: Advanced Lead & Marketing
**Status**: COMPLETE

### 3.1 Marketing Social (2 workers)
- [x] MKT-07: Social Engagement Monitor
- [x] MKT-08: Competitor Tracker

### 3.2 Lead Management (5 workers)
- [x] LEAD-12: List Health Monitor
- [x] LEAD-13: Segment Builder
- [x] LEAD-14: Suppression Manager
- [x] LEAD-15: Bounce Handler
- [x] LEAD-16: Unsubscribe Processor

### 3.3 Operations Advanced (5 workers)
- [x] OPS-21: Corporate Account Manager
- [x] OPS-22: Partner Program Tracker
- [x] OPS-23: Alumni Network Manager
- [x] OPS-24: Referral Tracker
- [x] OPS-25: LMS Integration

---

## Phase 4: Dashboard MVP
**Status**: COMPLETE

- [x] Real-time campaign dashboard
- [x] Worker health overview
- [x] Basic revenue analytics

---

## Phase 5: V1 Polish
**Status**: COMPLETE

- [x] n8n-brain learning layer
- [x] Workflow testing registry
- [x] Documentation standards

</details>

---

## v2.0 iOS App

**Milestone Goal:** Build a native iOS app that serves as a mobile command center for the Business OS — monitor health, dispatch agents to do work, get notified when things need attention.

### Overview

This milestone delivers a native iOS app serving as a mobile command center for the Business OS. The build order prioritizes security and architecture patterns first (they affect everything), then builds API endpoints before their consuming UI features, and concludes with polish and App Store preparation.

**Build Order Rationale:**
1. Foundation & Security first - App structure and auth patterns affect all subsequent code
2. API before UI - Each feature area builds backend first, then iOS UI that consumes it
3. Dashboard before Chat - Simpler data flow validates architecture before complex streaming
4. Chat before Quick Actions - Streaming infrastructure enables richer feedback
5. Notifications last (API then UI) - Depends on all other features being complete
6. Polish phase - Integration testing, edge cases, App Store submission

### Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 6 | Foundation & Security | IOS-01, IOS-02, IOS-03, AUTH-01, AUTH-02, AUTH-03, AUTH-04 | 7 |
| 7 | Health API & Dashboard | API-01, API-02, API-03, DASH-01, DASH-02, DASH-03, DASH-04 | 7 |
| 8 | Chat API | API-04, API-05, API-06, API-07 | 4 |
| 9 | Chat UI | CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06 | 6 |
| 10 | Workflow API & Quick Actions | API-08, API-09, API-10, API-11, ACT-01, ACT-02, ACT-03, ACT-04 | 8 |
| 11 | Push Notification API | API-12, API-13, API-14, API-15 | 4 |
| 12 | Push Notification UI | NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05 | 5 |
| 13 | Polish & App Store | (integration, testing, submission) | 0 |

**Total:** 41 requirements across 8 phases

---

### Phase 6: Foundation & Security
**Goal:** Establish the app skeleton with secure authentication that all features depend on
**Depends on:** Nothing (first phase of milestone)
**Requirements:** IOS-01, IOS-02, IOS-03, AUTH-01, AUTH-02, AUTH-03, AUTH-04

**Success Criteria** (what must be TRUE):
1. User can launch app and navigate between Home, Chat, and Settings tabs
2. App appearance follows system dark/light mode setting
3. User feels haptic feedback when tapping buttons and completing actions
4. User can authenticate with Face ID or Touch ID to unlock the app
5. API key is stored in iOS Keychain and never visible in source code or logs

**Plans:** 4 plans in 3 waves

Plans:
- [x] 06-01-PLAN.md — Xcode project setup with SwiftUI and tab navigation (Wave 1)
- [x] 06-02-PLAN.md — Keychain integration and biometric authentication (Wave 2)
- [x] 06-03-PLAN.md — Dark mode support and haptic feedback utilities (Wave 2)
- [x] 06-04-PLAN.md — Auto-lock timer and Settings API key management (Wave 3)

---

### Phase 7: Health API & Dashboard
**Goal:** Users can view real-time department health from the Home tab
**Depends on:** Phase 6 (authentication required for API calls)
**Requirements:** API-01, API-02, API-03, DASH-01, DASH-02, DASH-03, DASH-04

**Success Criteria** (what must be TRUE):
1. GET /api/mobile/health returns department health scores as JSON
2. Health endpoint aggregates data from Supabase and n8n into unified response
3. Unauthenticated requests to health endpoint receive 401 error
4. User sees department health scores displayed on Home tab after login
5. User can pull down to refresh and see updated health data

**Plans:** 4 plans in 3 waves

Plans:
- [x] 07-01-PLAN.md — Health API endpoint with auth and data aggregation (Wave 1)
- [x] 07-02-PLAN.md — iOS networking layer with Codable models (Wave 2)
- [x] 07-03-PLAN.md — Dashboard UI with health score cards and pull-to-refresh (Wave 3)
- [x] 07-04-PLAN.md — Alert count display with tap-to-view details (Wave 3)

---

### Phase 8: Chat API
**Goal:** Backend supports streaming AI chat with tool use capabilities
**Depends on:** Phase 7 (uses same auth middleware)
**Requirements:** API-04, API-05, API-06, API-07

**Success Criteria** (what must be TRUE):
1. POST /api/mobile/chat accepts message and returns streaming SSE response
2. Chat endpoint proxies to Claude API without exposing API key to client
3. Chat endpoint can invoke tools for workflow triggers and data operations
4. Unauthenticated requests to chat endpoint receive 401 error

**Plans:** 4 plans in 3 waves

Plans:
- [x] 08-01-PLAN.md — Chat endpoint with SSE streaming and auth (Wave 1)
- [x] 08-02-PLAN.md — Claude API integration with streaming proxy (Wave 2)
- [x] 08-03-PLAN.md — Tool definitions for workflow triggers and data operations (Wave 2)
- [x] 08-04-PLAN.md — Tool execution loop and response formatting (Wave 3)

---

### Phase 9: Chat UI
**Goal:** Users can have natural language conversations with the AI assistant
**Depends on:** Phase 8 (requires chat API)
**Requirements:** CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06

**Success Criteria** (what must be TRUE):
1. User can type message and see it appear in conversation thread
2. AI response streams in real-time as tokens arrive (not waiting for full response)
3. User can scroll through conversation history within the session
4. User can tap microphone button and speak message instead of typing
5. User sees confirmation dialog before high-risk actions execute

**Plans:** 6 plans in 5 waves

Plans:
- [x] 09-01-PLAN.md — Chat models and SSE streaming service (Wave 1)
- [x] 09-02-PLAN.md — ChatViewModel for state management (Wave 2)
- [x] 09-03-PLAN.md — Chat UI layout with message bubbles and input bar (Wave 2)
- [x] 09-04-PLAN.md — SSE integration with real-time streaming and auto-scroll (Wave 3)
- [x] 09-05-PLAN.md — Voice input with Speech framework (Wave 4)
- [x] 09-06-PLAN.md — Confirmation dialogs for high-risk actions (Wave 5)

---

### Phase 10: Workflow API & Quick Actions
**Goal:** Users can trigger workflows with one tap from a grid of quick actions
**Depends on:** Phase 9 (chat can also trigger workflows)
**Requirements:** API-08, API-09, API-10, API-11, ACT-01, ACT-02, ACT-03, ACT-04

**Success Criteria** (what must be TRUE):
1. POST /api/mobile/workflows/trigger starts specified n8n workflow
2. Workflow trigger returns execution ID for status tracking
3. GET /api/mobile/workflows returns list of available quick actions
4. User sees grid of quick action buttons on Home tab
5. User taps action button, sees loading state, then success/failure feedback

**Plans:** 6 plans in 5 waves

Plans:
- [x] 10-01-PLAN.md — Database migration and iOS models (Wave 1)
- [x] 10-02-PLAN.md — Workflow trigger and list API endpoints (Wave 2)
- [x] 10-03-PLAN.md — Toast notification component (Wave 2)
- [x] 10-04-PLAN.md — Chat tools update and iOS networking (Wave 3)
- [x] 10-05-PLAN.md — Quick actions grid UI on Home tab (Wave 4)
- [x] 10-06-PLAN.md — Settings UI for action configuration (Wave 5)

---

### Phase 11: Push Notification API
**Goal:** Backend can send push notifications for critical alerts, completions, and digests
**Depends on:** Phase 10 (workflow completions trigger notifications)
**Requirements:** API-12, API-13, API-14, API-15

**Success Criteria** (what must be TRUE):
1. POST /api/mobile/notifications/register stores APNs device token
2. System can send push notification via APNs for critical alerts
3. System can send push notification when triggered tasks complete
4. System generates and sends daily digest notification

**Plans:** 5 plans in 3 waves

Plans:
- [x] 11-01-PLAN.md — Database schema and TypeScript types (Wave 1)
- [x] 11-02-PLAN.md — APNs provider and notification sending logic (Wave 2)
- [x] 11-03-PLAN.md — Device token registration endpoint (Wave 2)
- [x] 11-04-PLAN.md — Send notification endpoint for n8n and critical alerts (Wave 3)
- [x] 11-05-PLAN.md — Daily digest generation and Vercel Cron scheduling (Wave 3)

---

### Phase 12: Push Notification UI
**Goal:** Users receive and can act on push notifications
**Depends on:** Phase 11 (requires notification API)
**Requirements:** NOTIF-01, NOTIF-02, NOTIF-03, NOTIF-04, NOTIF-05

**Success Criteria** (what must be TRUE):
1. User receives push notification when critical alert fires (system down, payment failed)
2. User receives push notification when triggered task completes
3. User receives daily digest notification summarizing overnight activity
4. Tapping notification opens app to relevant screen
5. User can configure notification preferences in Settings

**Plans:** TBD

Plans:
- [ ] 12-01: Push notification permission request and token handling
- [ ] 12-02: Notification handling for different types (critical, completion, digest)
- [ ] 12-03: Deep linking from notification tap to relevant screen
- [ ] 12-04: Notification preferences UI in Settings

---

### Phase 13: Polish & App Store
**Goal:** App is production-ready and submitted to App Store
**Depends on:** Phase 12 (all features complete)
**Requirements:** (none - integration and polish)

**Success Criteria** (what must be TRUE):
1. All features work together in end-to-end user flows
2. App handles network errors, timeouts, and edge cases gracefully
3. App passes App Store review guidelines
4. App is submitted to App Store for review

**Plans:** TBD

Plans:
- [ ] 13-01: End-to-end integration testing
- [ ] 13-02: Error handling and edge case polish
- [ ] 13-03: App Store assets (screenshots, description, metadata)
- [ ] 13-04: App Store submission

---

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1-5 | v1.0 | - | Complete | - |
| 6. Foundation & Security | v2.0 | 4/4 | Complete | 2026-01-20 |
| 7. Health API & Dashboard | v2.0 | 4/4 | Complete | 2026-01-20 |
| 8. Chat API | v2.0 | 4/4 | Complete | 2026-01-20 |
| 9. Chat UI | v2.0 | 6/6 | Complete | 2026-01-21 |
| 10. Workflow API & Quick Actions | v2.0 | 6/6 | Complete | 2026-01-21 |
| 11. Push Notification API | v2.0 | 5/5 | Complete | 2026-01-21 |
| 12. Push Notification UI | v2.0 | 0/4 | Not started | - |
| 13. Polish & App Store | v2.0 | 0/4 | Not started | - |

---
*Roadmap created: 2026-01-20*
*Last updated: 2026-01-21 after Phase 11 execution*
