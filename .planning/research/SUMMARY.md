# Project Research Summary

**Project:** iOS Business Command Center
**Domain:** Native iOS app for business automation dashboard
**Researched:** 2026-01-20
**Confidence:** HIGH

## Executive Summary

This iOS app is a **companion to the existing Business OS** web dashboard, not a replacement. Research across Slack, Linear, and Notion mobile apps confirms the pattern: mobile apps optimize for quick glances (15-20 seconds per session), push notifications for urgent alerts, and one-tap actions. Complex data entry and detailed analysis stay on web. The recommended approach is SwiftUI with MVVM architecture, routing sensitive API calls through the existing Next.js backend as a proxy (never embed API keys in the app), and using Supabase Swift SDK for real-time subscriptions.

The **critical risks** center on security and reliability. Hardcoding API keys or using wrong Keychain accessibility attributes will create security vulnerabilities. Treating push notifications as reliable delivery (they are not - iOS throttles silent pushes) will cause missed alerts. Streaming chat connections that do not handle reconnection will appear frozen. All of these have documented prevention patterns in the research.

The estimated timeline is **5-8 weeks for MVP** (table stakes + Phase 1 differentiators) or **14-21 weeks for full-featured app**. Given this is a companion app with an existing backend, the main work is iOS implementation, not backend architecture. The Xcode 26/Swift 6 requirement (App Store mandate as of April 2026) means strict concurrency checking - establish correct `@MainActor` patterns from day one to avoid refactoring pain later.

## Key Findings

### Recommended Stack

**Summary:** Build with Xcode 26, Swift 6.1, targeting iOS 17+ minimum. SwiftUI is the unambiguous choice for new iOS apps in 2026. Use SwiftAnthropic library for Claude API integration, routed through Next.js backend as a proxy. Native frameworks handle everything else: URLSession for networking (no Alamofire needed), Keychain for secrets, LocalAuthentication for Face ID, SpeechAnalyzer (iOS 26) for voice input.

**Core technologies:**
- **SwiftUI 6.x**: Declarative UI framework - mature, native performance, required for widgets and Live Activities
- **SwiftAnthropic**: Claude API client with streaming - Swift package, AsyncThrowingStream support
- **Supabase Swift SDK**: Direct database access - real-time subscriptions, shared auth with web
- **URLSession + async/await**: HTTP/SSE networking - no third-party dependency needed for streaming
- **Keychain Services**: Secure credential storage - hardware-backed on Secure Enclave devices
- **SpeechAnalyzer (iOS 26)**: Voice input - new API, faster than legacy SFSpeechRecognizer

**What to avoid:** React Native/Flutter (unnecessary for single-platform), Alamofire (URLSession sufficient), Firebase Cloud Messaging (APNs simpler for iOS-only), embedding API keys in app (security violation), UserDefaults for secrets (not encrypted).

### Expected Features

**Must have (table stakes):**
- Dashboard overview with health scores (at-a-glance status)
- Push notifications with actionable buttons (51% iOS opt-in rate)
- Biometric authentication (Face ID/Touch ID required for business data)
- Tab bar navigation (Home, Activity, Chat, Settings - Slack pattern)
- Activity feed (single stream reduces "pogo-sticking")
- Pull-to-refresh, dark mode, accessibility (VoiceOver, Dynamic Type)

**Should have (differentiators):**
- Quick Actions on app icon (low complexity, high perceived value)
- Workflow trigger buttons (one-tap execution - core value proposition)
- Haptic feedback (polishes experience)
- Widgets (glanceable metrics without opening app)
- Voice commands via Siri Shortcuts

**Defer (v2+):**
- Live Activities / Dynamic Island (high complexity)
- Full offline mode with sync (complex conflict resolution)
- AI-summarized notification batching

### Architecture Approach

**Summary:** MVVM with Clean Architecture principles. Three-layer structure: Presentation (SwiftUI Views + ViewModels), Domain (Use Cases + Repository Protocols + Entities), Data (Repositories + Network + Keychain + Cache). iOS app communicates with Next.js API routes for authenticated actions and AI chat streaming. Use Supabase directly for real-time data subscriptions via the Swift SDK.

**Major components:**
1. **Core/Network** - APIClient, StreamingClient (SSE), NetworkMonitor (NWPathMonitor)
2. **Core/Security** - KeychainManager, BiometricAuth, TokenManager
3. **Core/Services** - SupabaseClient wrapper, PushNotificationService, SpeechService
4. **Features/** - Dashboard, Chat, Actions, Settings, Auth (each with Views/ViewModels/Repository)
5. **Shared/** - Reusable components, extensions, utilities

**Integration architecture:**
```
iOS App --> Next.js API Routes --> Anthropic API (for AI chat)
iOS App --> Supabase (direct) --> PostgreSQL (for data + realtime)
iOS App --> APNs <-- Next.js (for push notifications)
```

### Critical Pitfalls

**Top 5 pitfalls to avoid:**

1. **Storing API keys in source code** - Use .xcconfig (gitignored) + Keychain, route sensitive APIs through backend proxy. If compromised: data breaches, API abuse, App Store rejection.

2. **Wrong Keychain accessibility attributes** - Use `kSecAttrAccessibleWhenUnlocked` minimum. Never use `kSecAttrAccessibleAlways` (deprecated, extractable on jailbroken devices).

3. **Treating silent push as reliable** - iOS throttles/drops silent notifications. Use visible push for critical alerts (priority=10), implement server-side delivery tracking, add fallback polling on app foreground.

4. **@MainActor/@Observable conflicts causing data races** - Swift 6 strict concurrency. Mark all ViewModels with `@MainActor` when using `@Observable`. Use `.task` modifier instead of `onAppear + Task{}`.

5. **SSE/streaming connection not handling reconnection** - EventSource libraries explicitly state they do not reconnect automatically. Implement explicit reconnection with exponential backoff, track `Last-Event-Id` for resume, show connection status in UI.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Foundation (Week 1)
**Rationale:** Security and concurrency patterns must be established before any feature work. All research files agree: get these wrong and you refactor everything later.
**Delivers:** Core infrastructure - networking, security, configuration, DI container
**Addresses:** Biometric authentication (table stakes), secure storage
**Avoids:** Hardcoded API keys, wrong Keychain attributes, @MainActor conflicts, task leaks
**Components:** NetworkMonitor, KeychainManager, BiometricAuth, APIClient, DIContainer, Constants

### Phase 2: Authentication + Data Layer (Week 2)
**Rationale:** All features depend on authenticated access to data. Supabase client and repository patterns enable parallel feature development.
**Delivers:** Login flow, Supabase integration, domain models, repository layer
**Uses:** Supabase Swift SDK, Keychain for JWT storage
**Implements:** Domain layer (entities, repository protocols), Data layer (concrete repositories)

### Phase 3: Dashboard Feature (Week 3)
**Rationale:** Core value proposition - the "at-a-glance" view users expect. Validates data flow patterns before adding complexity.
**Delivers:** Dashboard screen with health scores, alerts, activity feed
**Addresses:** Dashboard overview (table stakes), pull-to-refresh, offline banner
**Uses:** Supabase realtime subscriptions for live updates

### Phase 4: Push Notifications (Week 4)
**Rationale:** Critical alert delivery is core to command center value. Requires APNs setup in Apple Developer Portal, backend endpoint for token registration.
**Delivers:** Push registration, actionable notifications, missed alert fallback
**Addresses:** Push notifications (table stakes)
**Avoids:** Silent push reliability assumptions, token not refreshed, APNs environment mismatch
**Backend work:** `/api/mobile/push/register` endpoint, APNs integration in Next.js

### Phase 5: AI Chat + Streaming (Week 5)
**Rationale:** High-value differentiator. Depends on streaming infrastructure that requires careful error handling.
**Delivers:** Chat interface with streaming responses, voice input
**Addresses:** AI chat interface (differentiator), voice commands
**Avoids:** SSE reconnection issues, speech without inactivity timer
**Uses:** SwiftAnthropic, SpeechAnalyzer, StreamingClient
**Backend work:** `/api/mobile/chat` endpoint with SSE

### Phase 6: Quick Actions + Polish (Week 6)
**Rationale:** Low-complexity differentiators that add polish. Can be parallelized or cut if timeline is tight.
**Delivers:** Home screen quick actions, workflow trigger buttons, haptic feedback, settings
**Addresses:** Quick Actions (differentiator), workflow triggers (differentiator), haptic feedback
**Backend work:** `/api/mobile/actions/:id` endpoint for workflow triggers

### Phase 7: Widgets + App Store (Week 7-8)
**Rationale:** Widgets require app to be stable. App Store submission requires full testing.
**Delivers:** WidgetKit integration, TestFlight, App Store submission
**Addresses:** Widgets (differentiator)
**Note:** TestFlight testing catches APNs environment issues before production

### Phase Ordering Rationale

- **Foundation first:** Security patterns (Keychain, no hardcoded keys) and concurrency patterns (@MainActor) affect every subsequent file. Retrofitting is painful.
- **Auth before features:** Every feature requires authenticated API access. Build once, use everywhere.
- **Dashboard before Chat:** Dashboard validates the full data flow (Supabase -> Repository -> ViewModel -> View) with simpler requirements. Chat adds streaming complexity.
- **Push before Chat:** Push notification infrastructure is well-understood and critical. Chat streaming is more complex. Establish reliable patterns with push first.
- **Quick Actions after core features:** These are polish. Can be cut if timeline is tight without affecting core value.
- **Widgets last:** WidgetKit has additional complexity (shared data container, timeline updates). App needs to be stable first.

### Research Flags

**Phases likely needing deeper research during planning:**
- **Phase 5 (Chat + Streaming):** SSE reconnection logic, SpeechAnalyzer API (iOS 26 specific), voice UX patterns
- **Phase 7 (Widgets):** WidgetKit timeline refresh strategies, shared data container setup

**Phases with standard patterns (skip research-phase):**
- **Phase 1 (Foundation):** Keychain, Face ID, URLSession - well-documented Apple APIs
- **Phase 2 (Auth):** Supabase Swift SDK has comprehensive documentation
- **Phase 3 (Dashboard):** Standard SwiftUI patterns, MVVM
- **Phase 4 (Push):** APNs well-documented, many tutorials available

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Verified via Apple Developer requirements, official SDKs |
| Features | HIGH | Multiple authoritative sources (Slack, Linear, Apple HIG) |
| Architecture | HIGH | Established patterns (MVVM, Clean Architecture), official examples |
| Pitfalls | HIGH | Documented failures, security research, community consensus |

**Overall confidence:** HIGH

### Gaps to Address

- **SwiftAnthropic version:** Verify latest release at implementation time. Active development may have API changes.
- **SpeechAnalyzer fallback:** If supporting iOS 16, need SFSpeechRecognizer fallback path. Decision: target iOS 17+ to avoid.
- **Real-time update strategy:** Research mentions polling vs WebSocket vs Supabase Realtime. Recommendation: Supabase Realtime for simplicity, but validate during Phase 3.
- **APNs vs FCM:** Research assumes iOS-only. If Android is future possibility, consider FCM wrapper. For now: APNs direct.

## Sources

### Primary (HIGH confidence)
- [Apple Developer Upcoming Requirements](https://developer.apple.com/news/upcoming-requirements/) - Xcode 26 requirement
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/patterns) - iOS patterns
- [WWDC25: SpeechAnalyzer](https://developer.apple.com/videos/play/wwdc2025/277/) - Voice input
- [Supabase Swift SDK](https://github.com/supabase/supabase-swift) - Database integration
- [SwiftAnthropic](https://github.com/jamesrochabrun/SwiftAnthropic) - Claude API client

### Secondary (MEDIUM confidence)
- [Slack Mobile Redesign](https://slack.design/articles/re-designing-slack-on-mobile/) - Mobile UX patterns, session data
- [Linear Mobile](https://linear.app/mobile) - Companion app positioning
- [Clean Architecture for SwiftUI](https://nalexn.github.io/clean-architecture-swiftui) - Architecture patterns
- [HackerOne - iOS Secret Management](https://www.hackerone.com/blog/ios-app-secret-management-best-practices-keeping-your-data-secure) - Security

### Tertiary (needs validation)
- [Medium articles on SSE/streaming](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) - Implementation details may vary
- [inaka/EventSource](https://github.com/inaka/EventSource) - Library-specific reconnection behavior

---
*Research completed: 2026-01-20*
*Ready for roadmap: yes*
