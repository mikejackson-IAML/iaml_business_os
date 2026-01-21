# Requirements: Business OS iOS App v2.0

**Defined:** 2026-01-20
**Core Value:** Issue commands from anywhere and trust the system executes them correctly.

## v2.0 Requirements

Requirements for iOS app milestone. Each maps to roadmap phases.

### iOS App - Foundation

- [x] **IOS-01**: User can launch app and see tab bar with Home, Chat, and Settings tabs
- [x] **IOS-02**: App supports dark mode following system appearance
- [x] **IOS-03**: App provides haptic feedback on user actions

### iOS App - Authentication

- [x] **AUTH-01**: User can authenticate with Face ID or Touch ID to unlock the app
- [x] **AUTH-02**: API key is stored securely in iOS Keychain (never in source code)
- [x] **AUTH-03**: App auto-locks after 5 minutes of inactivity, requiring re-authentication
- [x] **AUTH-04**: User can view/update their API key in Settings

### iOS App - Dashboard

- [x] **DASH-01**: User can view department health scores on Home tab
- [x] **DASH-02**: User can pull-to-refresh to update dashboard data
- [x] **DASH-03**: Dashboard shows current alert count with tap to view details
- [x] **DASH-04**: Health scores update in real-time or near-real-time

### iOS App - AI Chat

- [x] **CHAT-01**: User can send natural language messages to AI assistant
- [x] **CHAT-02**: AI responses stream in real-time (not wait for full response)
- [x] **CHAT-03**: User can view conversation history within session
- [x] **CHAT-04**: User can use voice input to speak messages instead of typing
- [x] **CHAT-05**: AI can trigger workflows, generate content, perform research based on commands
- [x] **CHAT-06**: High-risk actions (sending messages, payments, deletions) show confirmation before executing

### iOS App - Quick Actions

- [x] **ACT-01**: User can see grid of quick action buttons for common workflows
- [x] **ACT-02**: User can tap quick action to trigger n8n workflow
- [x] **ACT-03**: User sees success/failure feedback after workflow trigger
- [x] **ACT-04**: Quick actions are configurable (user can choose which workflows appear)

### iOS App - Push Notifications

- [ ] **NOTIF-01**: User receives push notification for critical alerts (system down, payment failed)
- [ ] **NOTIF-02**: User receives push notification when triggered tasks complete
- [ ] **NOTIF-03**: User receives daily digest notification summarizing overnight activity
- [ ] **NOTIF-04**: Notifications are actionable (tap opens relevant screen)
- [ ] **NOTIF-05**: User can configure notification preferences in Settings

### API Backend - Health

- [x] **API-01**: GET /api/mobile/health returns department health scores as JSON
- [x] **API-02**: Health endpoint aggregates data from Supabase/n8n into unified response
- [x] **API-03**: Health endpoint requires valid API key authentication

### API Backend - Chat

- [x] **API-04**: POST /api/mobile/chat accepts message and returns streaming response (SSE)
- [x] **API-05**: Chat endpoint proxies to Claude API (never exposes API key to client)
- [x] **API-06**: Chat endpoint supports tool use for workflow triggers and data operations
- [x] **API-07**: Chat endpoint requires valid API key authentication

### API Backend - Workflows

- [x] **API-08**: POST /api/mobile/workflows/trigger starts specified n8n workflow
- [x] **API-09**: Workflow trigger returns execution ID for status tracking
- [x] **API-10**: GET /api/mobile/workflows returns list of available quick actions
- [x] **API-11**: Workflow endpoints require valid API key authentication

### API Backend - Notifications

- [x] **API-12**: POST /api/mobile/notifications/register stores APNs device token
- [x] **API-13**: System can send push notifications via APNs for critical alerts
- [x] **API-14**: System can send push notifications for task completions
- [x] **API-15**: System generates and sends daily digest notification

## v2.1 Requirements (Future)

Deferred to next milestone. Tracked but not in current roadmap.

### Home Screen Widget
- **WIDGET-01**: User can add home screen widget showing health scores
- **WIDGET-02**: Widget updates periodically with latest data
- **WIDGET-03**: Tapping widget opens app to dashboard

### Activity Feed
- **FEED-01**: User can view unified activity stream of all events
- **FEED-02**: Activity feed supports filtering by type
- **FEED-03**: Activity feed supports pagination

### Advanced Features
- **ADV-01**: Siri Shortcuts integration for voice commands
- **ADV-02**: Command palette for power users
- **ADV-03**: Direct data operations on Supabase/GHL
- **ADV-04**: Offline mode with sync when reconnected
- **ADV-05**: Live Activities showing workflow progress on lock screen

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Android app | iOS first, evaluate Android after v2.0 ships |
| iPad-specific UI | Universal app works, but no iPad optimization for v2.0 |
| Apple Watch companion | Focus on iPhone experience first |
| Offline mode | Requires significant sync infrastructure |
| Multi-user support | Single operator use case for now |
| Desktop app | Web dashboard serves this need |
| Complex data entry | Mobile is for quick actions, not data entry (link to web) |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| IOS-01 | Phase 6 | Complete |
| IOS-02 | Phase 6 | Complete |
| IOS-03 | Phase 6 | Complete |
| AUTH-01 | Phase 6 | Complete |
| AUTH-02 | Phase 6 | Complete |
| AUTH-03 | Phase 6 | Complete |
| AUTH-04 | Phase 6 | Complete |
| DASH-01 | Phase 7 | Complete |
| DASH-02 | Phase 7 | Complete |
| DASH-03 | Phase 7 | Complete |
| DASH-04 | Phase 7 | Complete |
| CHAT-01 | Phase 9 | Complete |
| CHAT-02 | Phase 9 | Complete |
| CHAT-03 | Phase 9 | Complete |
| CHAT-04 | Phase 9 | Complete |
| CHAT-05 | Phase 9 | Complete |
| CHAT-06 | Phase 9 | Complete |
| ACT-01 | Phase 10 | Complete |
| ACT-02 | Phase 10 | Complete |
| ACT-03 | Phase 10 | Complete |
| ACT-04 | Phase 10 | Complete |
| NOTIF-01 | Phase 12 | Pending |
| NOTIF-02 | Phase 12 | Pending |
| NOTIF-03 | Phase 12 | Pending |
| NOTIF-04 | Phase 12 | Pending |
| NOTIF-05 | Phase 12 | Pending |
| API-01 | Phase 7 | Complete |
| API-02 | Phase 7 | Complete |
| API-03 | Phase 7 | Complete |
| API-04 | Phase 8 | Complete |
| API-05 | Phase 8 | Complete |
| API-06 | Phase 8 | Complete |
| API-07 | Phase 8 | Complete |
| API-08 | Phase 10 | Complete |
| API-09 | Phase 10 | Complete |
| API-10 | Phase 10 | Complete |
| API-11 | Phase 10 | Complete |
| API-12 | Phase 11 | Complete |
| API-13 | Phase 11 | Complete |
| API-14 | Phase 11 | Complete |
| API-15 | Phase 11 | Complete |

**Coverage:**
- v2.0 requirements: 41 total
- Mapped to phases: 41
- Unmapped: 0

---
*Requirements defined: 2026-01-20*
*Last updated: 2026-01-21 after Phase 11 completion*
