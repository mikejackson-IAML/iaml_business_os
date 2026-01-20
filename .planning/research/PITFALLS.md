# Pitfalls Research: iOS Business Command Center

**Domain:** iOS mobile app with streaming APIs, push notifications, secure storage, voice input
**Researched:** 2026-01-20
**Overall confidence:** HIGH (verified with multiple authoritative sources)

---

## Critical Pitfalls (Will Break the App)

These mistakes cause app crashes, security vulnerabilities, data loss, or App Store rejections.

### 1. Storing API Keys in Source Code or Bundle

**What goes wrong:** API keys hardcoded in Swift files or bundled in app resources can be extracted using decompilation tools. Bad actors can access your Supabase, n8n, or other services, potentially causing data breaches or massive API bills.

**Why it happens:** Developers prioritize speed over security during prototyping, then forget to refactor. .xcconfig files accidentally get committed to git.

**Consequences:**
- Unauthorized API access
- Data breaches
- Service abuse and billing overruns
- App Store rejection if detected

**Prevention:**
1. Use .xcconfig files for build-time configuration AND add them to .gitignore immediately
2. Store runtime secrets in Keychain with `kSecAttrAccessibleWhenUnlocked` minimum
3. Prefer server-issued, short-lived tokens over static API keys where possible
4. Use a backend proxy for sensitive third-party APIs (your server holds the key, not the app)

**Warning signs:**
- Strings containing "api_key", "secret", or "token" in Swift files
- .xcconfig files tracked in git
- API keys visible in GitHub repository search

**Phase mapping:** Address in Phase 1 (Foundation) - set up secure configuration before any API integration

**Sources:**
- [HackerOne - iOS App Secret Management](https://www.hackerone.com/blog/ios-app-secret-management-best-practices-keeping-your-data-secure)
- [Kodeco - Managing Secrets](https://www.kodeco.com/books/ios-app-distribution-best-practices/v1.0.ea1/chapters/12-managing-secrets)

---

### 2. Using Wrong Keychain Accessibility Attributes

**What goes wrong:** Using `kSecAttrAccessibleAlways` (or the deprecated equivalents) makes secrets readable even when device is locked. On jailbroken devices, all keychain items with this attribute can be dumped.

**Why it happens:** Developers copy sample code without understanding accessibility levels. Default may seem "safe enough."

**Consequences:**
- Credentials extractable on locked devices
- Full keychain dump possible on jailbroken devices
- Real-world examples: Finance apps storing PINs, VPN apps storing credentials in cleartext with AlwaysAccessible

**Prevention:**
1. Use `kSecAttrAccessibleWhenPasscodeSetThisDeviceOnly` for highest security (biometric-protected items)
2. Use `kSecAttrAccessibleWhenUnlocked` as minimum for all sensitive data
3. Use `kSecAttrAccessibleAfterFirstUnlock` only if you must access data while device is locked
4. Never use `kSecAttrAccessibleAlways` - it's deprecated for a reason

**Warning signs:**
- Any use of `kSecAttrAccessibleAlways` in code
- Keychain items accessible without biometric challenge when they should require it
- Credentials persisting across device backups when they shouldn't

**Phase mapping:** Address in Phase 1 (Foundation) - establish Keychain wrapper with correct defaults

**Sources:**
- [SANS Institute - How Not to Store Passwords in iOS](https://www.sans.org/blog/how-not-to-store-passwords-in-ios/)
- [Medium - iOS Keychain and Data Protection Classes Abuse](https://medium.com/@salamsajid7/ios-keychain-and-data-protection-classes-abuse-and-misuse-759267ee03b4)

---

### 3. Silent Push Notifications Treated as Reliable Delivery

**What goes wrong:** Building critical alert delivery assuming silent push notifications will always fire. iOS throttles, delays, or drops them based on battery, memory, and user behavior.

**Why it happens:** Developers test on plugged-in devices with fresh installs. Production users have different conditions.

**Consequences:**
- Missing critical business alerts (the core value proposition of this app)
- Users think app is broken when notifications don't arrive
- Invisible failures - APNs reports "delivered" but app never receives it

**Prevention:**
1. Use visible (not silent) push for critical alerts - they have higher priority
2. Implement server-side delivery tracking with client acknowledgment
3. Use priority = 5 for silent pushes (priority = 10 is for visible alerts only)
4. Build fallback: poll server for missed alerts on app foreground
5. Never rely on silent push for time-critical business operations

**Warning signs:**
- Using `content-available: 1` without visible alert for critical notifications
- No server-side tracking of notification delivery/acknowledgment
- Assuming push = delivery

**Phase mapping:** Address in Phase 2 (Push Notifications) - design for unreliability from the start

**Sources:**
- [Medium - Silent Push Notifications: Opportunities, Not Guarantees](https://mohsinkhan845.medium.com/silent-push-notifications-in-ios-opportunities-not-guarantees-2f18f645b5d5)
- [Netguru - Why Push Notification Architecture Fails](https://www.netguru.com/blog/why-mobile-push-notification-architecture-fails)

---

### 4. @MainActor and @Observable Conflicts Causing Data Races

**What goes wrong:** With Swift 6 strict concurrency, updating `@Observable` state from background tasks without `@MainActor` causes data races. App crashes intermittently or shows corrupted UI.

**Why it happens:** Streaming API responses arrive on background threads. Developers update state directly without actor isolation.

**Consequences:**
- Swift 6 compiler errors or runtime crashes
- "Publishing changes from background threads" errors
- UI corruption, intermittent crashes
- App Store crashes from race conditions

**Prevention:**
1. Mark all ViewModels with `@MainActor` when using `@Observable`
2. Use `@MainActor` for any async function that updates UI state
3. Don't use regular `@State` with `@MainActor @Observable` classes - use `@StateObject` or the whole view must be `@MainActor`
4. For streaming responses: collect on background, publish batch updates on MainActor

**Warning signs:**
- Purple runtime warnings about main thread
- `@Observable` classes without `@MainActor`
- Direct state mutation inside `Task {}` blocks after await

**Phase mapping:** Address in Phase 1 (Foundation) - establish correct patterns before building features

**Sources:**
- [Hacking with Swift - Do Not Use Actor for SwiftUI Data Models](https://www.hackingwithswift.com/quick-start/concurrency/important-do-not-use-an-actor-for-your-swiftui-data-models)
- [Medium - Understanding @MainActor in SwiftUI](https://medium.com/@donatogomez88/understanding-mainactor-in-swiftui-a-practical-guide-for-swift-6-69e657872ec5)
- [Fat Bob Man - SwiftUI Views and @MainActor](https://fatbobman.com/en/posts/swiftui-views-and-mainactor/)

---

### 5. SSE/Streaming Connection Not Handling Reconnection

**What goes wrong:** EventSource/SSE connection drops silently. App shows stale chat response or hangs indefinitely. User thinks app is frozen.

**Why it happens:** Libraries like `inaka/EventSource` explicitly state: "EventSource doesn't reconnect at all. If a network error occurs... you will have to take care of reconnecting."

**Consequences:**
- Chat appears hung mid-response
- User loses context of streaming conversation
- Silent failures with no user feedback
- Memory leaks from orphaned connections

**Prevention:**
1. Implement explicit reconnection logic with exponential backoff
2. Track `Last-Event-Id` and send on reconnect to resume from last position
3. Show connection status indicator in UI
4. Set connection timeout and implement heartbeat/ping
5. Handle app backgrounding: reconnect on `willEnterForeground`

**Warning signs:**
- Using EventSource library without reading its connection handling docs
- No reconnection code in streaming implementation
- No UI feedback for connection state

**Phase mapping:** Address in Phase 3 (Streaming Chat) - connection resilience is core to feature

**Sources:**
- [GitHub - inaka/EventSource](https://github.com/inaka/EventSource)
- [GitHub - launchdarkly/swift-eventsource changelog](https://github.com/launchdarkly/swift-eventsource/blob/main/CHANGELOG.md)
- [Nick Arner - Working with SSE in Swift](https://nickarner.com/notes/working-with-server-sent-events-in-swift-november-16-2021/)

---

## Common Mistakes (Will Cause Problems)

These mistakes cause poor UX, performance issues, or ongoing maintenance pain.

### 6. Face ID/Touch ID Shown at Wrong Time

**What goes wrong:** Biometric prompt appears immediately on app launch or at inappropriate moments. Prompt disappears instantly on cold start, returning `SystemCancel` error.

**Why it happens:** LocalAuthentication evaluatePolicy called before UI is ready. iOS dismisses the prompt automatically.

**Consequences:**
- Users see biometric prompt flash and disappear
- Auth fails silently, users can't log in
- Frustrating first-app-launch experience

**Prevention:**
1. Delay biometric prompt until after initial view appears (use `onAppear` with slight delay)
2. Handle `LAError.systemCancel` explicitly - retry after delay
3. Add Info.plist entry `NSFaceIDUsageDescription` before any Face ID code
4. Show a "Tap to unlock" button instead of auto-prompting

**Warning signs:**
- Biometric auth in `init()` or `viewDidLoad()`
- No handling for `LAError.systemCancel`
- Missing `NSFaceIDUsageDescription` in Info.plist

**Phase mapping:** Address in Phase 1 (Foundation) - authentication flow design

**Sources:**
- [Hacking with Swift - Touch ID, Face ID and LocalAuthentication](https://www.hackingwithswift.com/read/28/4/touch-to-activate-touch-id-face-id-and-localauthentication)
- [Apple Developer Forums - Local Authentication failure](https://developer.apple.com/forums/thread/119067)

---

### 7. Push Token Not Refreshed on Every Launch

**What goes wrong:** Stored push token becomes invalid. Server sends notifications to dead token. User never receives alerts.

**Why it happens:** Token cached once and assumed stable. But tokens can invalidate on iOS update, app reinstall, or randomly.

**Consequences:**
- Silent notification failures (30% of pushes fail industry-wide)
- Users stop receiving critical alerts
- No error feedback - server thinks delivery succeeded

**Prevention:**
1. Call `registerForRemoteNotifications()` on every cold app start
2. Always send fresh token to server in `didRegisterForRemoteNotificationsWithDeviceToken`
3. Handle APNs feedback: delete tokens returning "BadDeviceToken" or "Unregistered"
4. Consider tokens older than 30 days as potentially stale

**Warning signs:**
- Token registration only in first-launch flow
- No server endpoint for token refresh
- No handling of APNs error responses

**Phase mapping:** Address in Phase 2 (Push Notifications) - token lifecycle management

**Sources:**
- [NSHipster - APNs Device Tokens](https://nshipster.com/apns-device-tokens/)
- [Firebase - FCM Token Management Best Practices](https://firebase.google.com/docs/cloud-messaging/manage-tokens)
- [Customer.io - Registering Device Tokens](https://docs.customer.io/journeys/device-tokens/)

---

### 8. Async/Await Task Leaks and Duplicate Calls

**What goes wrong:** Creating `Task {}` in `onAppear` without cancellation causes duplicate API calls on every view appearance. Tasks continue running after view disappears.

**Why it happens:** SwiftUI view lifecycle differs from UIKit. `onAppear` fires more often than expected (navigation, tab switches, sheet dismissals).

**Consequences:**
- Multiple simultaneous API requests
- Wasted bandwidth and API quota
- Memory leaks from retained tasks
- Stale data appearing briefly before new data

**Prevention:**
1. Use `.task` modifier instead of `onAppear` + `Task {}` - it auto-cancels
2. Store `Task` reference and cancel in `onDisappear`
3. Use `task(id:)` to restart only when specific data changes
4. Implement request deduplication in network layer

**Warning signs:**
- `Task {}` inside `onAppear` without corresponding cancellation
- Multiple identical requests in network logs
- Views that fetch on every tab switch

**Phase mapping:** Address in Phase 1 (Foundation) - establish data fetching patterns

**Sources:**
- [SwiftLee - 5 Biggest Mistakes with Async/Await](https://www.avanderlee.com/concurrency/the-5-biggest-mistakes-ios-developers-make-with-async-await/)
- [Medium - Common Swift Concurrency Mistakes](https://medium.com/@lucasmrowskovskypaim/common-swift-concurrency-mistakes-that-can-be-killing-your-app-performance-b180a7ede4df)

---

### 9. Network Retry Without Exponential Backoff

**What goes wrong:** Failed request retries immediately in tight loop. Server under load gets hammered harder. Rate limits trigger. App gets blocked.

**Why it happens:** Simple retry logic: "if failed, try again." No consideration for why it failed.

**Consequences:**
- API rate limit bans
- Server overload during partial outages
- Battery drain from constant retries
- HTTP 429 responses ignored

**Prevention:**
1. Implement exponential backoff: 1s, 2s, 4s, 8s... with max cap
2. Add jitter (randomization) to prevent thundering herd
3. Respect `Retry-After` headers from HTTP 429/503 responses
4. Cap maximum retry attempts (3-5 typically)
5. Only retry transient errors (network timeout, 5xx) - not 4xx client errors

**Warning signs:**
- Retry logic without any delay
- Not checking HTTP status codes before retry
- Ignoring `Retry-After` headers

**Phase mapping:** Address in Phase 1 (Foundation) - network layer design

**Sources:**
- [Swift by Sundell - Retrying an Async Swift Task](https://www.swiftbysundell.com/articles/retrying-an-async-swift-task/)
- [DEV.to - SwiftUI Error Recovery & Retry Systems](https://dev.to/sebastienlato/swiftui-error-recovery-retry-systems-resilient-architecture-51i3)
- [Peter Friese - Building Custom Combine Operator for Exponential Backoff](https://peterfriese.dev/blog/2022/swiftui-combine-custom-operators/)

---

### 10. WebSocket Connection Not Sending Pings

**What goes wrong:** WebSocket connection silently dropped by server after idle period. Real-time updates stop. User sees frozen dashboard.

**Why it happens:** Server-side load balancers and proxies timeout idle connections. Many have 60-second or shorter timeouts.

**Consequences:**
- Dashboard shows stale data
- Real-time alerts not received
- User must manually refresh
- Connection looks "open" to client but is dead

**Prevention:**
1. Send ping every 10-30 seconds to keep connection alive
2. Implement ping/pong response verification
3. Set connection timeout and reconnect if pong not received
4. Show connection status indicator to user
5. Reconnect on app foreground (connection likely dead after backgrounding)

**Warning signs:**
- No periodic ping logic in WebSocket code
- Connection state shows "open" but no messages received
- "Connection worked yesterday, not today" reports

**Phase mapping:** Address in Phase 3 (Real-time Features) - connection health monitoring

**Sources:**
- [Bugfender - Implementing Real-Time Communication in iOS](https://bugfender.com/blog/ios-websockets/)
- [Medium - Real-time with WebSockets and Swift Concurrency](https://medium.com/@thomsmed/real-time-with-websockets-and-swift-concurrency-8b44a8808d0d)
- [Ably - WebSockets Swift Client-Side Challenges](https://ably.com/topic/websockets-swift)

---

### 11. Speech Recognition Without Inactivity Timer

**What goes wrong:** User finishes speaking but recording continues indefinitely. They must manually tap stop. Poor UX for hands-free voice commands.

**Why it happens:** Focus on "how to start" speech recognition, overlooking "how to stop gracefully."

**Consequences:**
- Awkward UX requiring manual stop
- Wasted battery and processing
- Transcription includes silence/background noise
- User uncertainty about when to stop speaking

**Prevention:**
1. Implement inactivity timer (3 seconds of silence = auto-stop)
2. Reset timer on each new speech segment detected
3. Provide haptic feedback when recording stops
4. Show visual countdown or silence indicator

**Warning signs:**
- Speech recognition only stops on button tap
- No timer logic in speech handling code
- Test recordings that run indefinitely

**Phase mapping:** Address in Phase 4 (Voice Features) - UX polish

**Sources:**
- [Medium - Speech-to-Text: Building a Voice Manager in iOS](https://medium.com/@burakekmen/speech-to-text-building-a-clean-modular-voice-manager-in-ios-with-swift-4eba58606c8c)
- [Create with Swift - Implementing Advanced Speech-to-Text](https://www.createwithswift.com/implementing-advanced-speech-to-text-in-your-swiftui-app/)

---

## Subtle Issues (Easy to Miss)

These seem fine during development but cause problems in production or at scale.

### 12. SwiftUI Modifier Order Bugs

**What goes wrong:** Padding applied before background vs after produces different results. `offset()` doesn't change hit area. Layout looks wrong on different devices.

**Why it happens:** SwiftUI modifier order matters but it's not obvious. Code compiles and runs, just looks wrong.

**Consequences:**
- UI bugs on certain screen sizes
- Tap targets not where they appear
- Visual inconsistency across views
- Hours debugging "why doesn't this look right"

**Prevention:**
1. Establish modifier ordering convention: frame > background > padding > overlay
2. Remember: `offset()` changes rendering position but not layout bounds
3. Test on multiple device sizes during development
4. Use SwiftUI previews with different device configurations

**Warning signs:**
- Views that look right on one device, wrong on another
- Tap targets that don't match visual bounds
- Background colors not extending to expected areas

**Phase mapping:** Ongoing concern - establish conventions in Phase 1

**Sources:**
- [Hacking with Swift - Common SwiftUI Mistakes](https://www.hackingwithswift.com/articles/224/common-swiftui-mistakes-and-how-to-fix-them)
- [DEV.to - SwiftUI Performance and Stability](https://dev.to/arshtechpro/swiftui-performance-and-stability-avoiding-the-most-costly-mistakes-234c)

---

### 13. Background Task Reliability Assumptions

**What goes wrong:** Assuming `BGTaskScheduler` will execute reliably. Building features that depend on background refresh. Users in Low Power Mode get no updates.

**Why it happens:** Background tasks work in testing. Production devices have different battery/memory conditions.

**Consequences:**
- Features that "work on my phone" but fail for users
- 30-second execution limit exceeded
- Low Power Mode disables background refresh entirely
- Force-quit apps don't get any background tasks

**Prevention:**
1. Design features to work without background execution
2. Use background tasks for "nice to have" pre-fetching only
3. Handle stale data gracefully when user returns
4. Document to users: "Don't force-quit for best experience"
5. Test with Low Power Mode enabled

**Warning signs:**
- Core features requiring background execution
- No graceful degradation when background tasks don't run
- Testing only on plugged-in, full-battery devices

**Phase mapping:** Consider in Phase 2 (Push Notifications) - background refresh strategy

**Sources:**
- [Andy Ibanez - Common Reasons Background Tasks Fail](https://www.andyibanez.com/posts/common-reasons-background-tasks-fail-ios/)
- [Medium - Why iOS Background Tasks Are Less Reliable](https://medium.com/@bhumibhuva18/why-ios-background-tasks-are-becoming-less-reliable-each-year-1514c72b406f)
- [Apple Developer - Extending Background Execution Time](https://developer.apple.com/documentation/uikit/extending-your-app-s-background-execution-time)

---

### 14. APNs Environment Mismatch

**What goes wrong:** Notifications work in TestFlight but not development, or vice versa. Different APNs environments (sandbox vs production) use different servers and certificates.

**Why it happens:** Debug builds use APNs sandbox. TestFlight/App Store use APNs production. Different device tokens per environment.

**Consequences:**
- "Notifications work on my device but not testers'"
- Push delivery fails silently
- Wrong tokens sent to wrong environment

**Prevention:**
1. Track APNs environment with each device token
2. Use separate backend endpoints or flags for sandbox vs production
3. Test the full flow in TestFlight before release
4. Log which environment token came from

**Warning signs:**
- Same token used for dev and production
- No environment flag stored with tokens
- Notifications stop working after TestFlight deploy

**Phase mapping:** Address in Phase 2 (Push Notifications) - environment handling

**Sources:**
- [Notificare - Common Issues with Push in iOS](https://notificare.com/blog/2023/09/25/common-issues-with-push-in-ios/)
- [Moldstud - Avoiding Common Pitfalls in iOS Push Notifications](https://moldstud.com/articles/p-avoiding-common-pitfalls-in-ios-push-notifications-best-practices-and-tips)

---

### 15. Actor Reentrancy State Corruption

**What goes wrong:** Actor method suspends at `await`, another task modifies actor state, original task resumes with unexpected state. Data corruption or logic errors.

**Why it happens:** Actors are reentrant by design (unlike traditional locks). This is intentional but surprising.

**Consequences:**
- Intermittent bugs that are hard to reproduce
- State inconsistency after concurrent operations
- "This worked before" confusion

**Prevention:**
1. Treat state before and after `await` as potentially different
2. Re-read any state needed after suspension point
3. Minimize suspension points in actor methods
4. Consider whether sequential processing is required (use AsyncStream)

**Warning signs:**
- Long actor methods with multiple await points
- Assumptions about state consistency across await
- Intermittent test failures

**Phase mapping:** Address in Phase 1 (Foundation) - concurrency patterns

**Sources:**
- [Medium - 5 Concurrency Pitfalls That Break Your App](https://medium.com/@rashadsh/5-concurrency-pitfalls-that-break-your-app-swift-d2f0a7e01bbc)
- [Two Cent Studios - Swift Concurrency Challenges](https://twocentstudios.com/2025/08/12/3-swift-concurrency-challenges-from-the-last-2-weeks/)

---

### 16. Keychain Performance for Large Data

**What goes wrong:** Storing large JSON responses or logs in Keychain. App becomes slow. Keychain has size limits.

**Why it happens:** "It's secure, so I'll put everything there." Keychain designed for credentials, not bulk storage.

**Consequences:**
- Slow read/write operations
- Potential storage limits exceeded
- Battery drain from encryption overhead

**Prevention:**
1. Keychain: Only credentials, tokens, small secrets
2. Large data: Use encrypted file storage (Data Protection APIs)
3. Non-sensitive large data: UserDefaults or Core Data
4. Consider: Does this actually need encryption at rest?

**Warning signs:**
- Keychain items larger than a few KB
- Slow app launch related to Keychain reads
- Storing entire API responses in Keychain

**Phase mapping:** Address in Phase 1 (Foundation) - storage architecture

**Sources:**
- [Medium - Saving Data in iOS Keychain](https://medium.com/@jakkornat/saving-data-in-ios-keychain-e9ae885abc48)
- [Medium - When Can the Keychain Fail](https://medium.com/@kalidoss.shanmugam/when-can-the-keychain-fail-841a67e6b649)

---

## Prevention Checklist

Use this checklist during development phases.

### Phase 1: Foundation
- [ ] .xcconfig files in .gitignore
- [ ] Keychain wrapper uses `kSecAttrAccessibleWhenUnlocked` minimum
- [ ] No hardcoded API keys in Swift files
- [ ] ViewModels marked with `@MainActor` when using `@Observable`
- [ ] Data fetching uses `.task` modifier (not `onAppear` + `Task`)
- [ ] Network layer has exponential backoff with jitter
- [ ] Face ID/Touch ID prompt delayed until after view appears
- [ ] `NSFaceIDUsageDescription` in Info.plist

### Phase 2: Push Notifications
- [ ] `registerForRemoteNotifications()` called every app launch
- [ ] Fresh token sent to server on every registration callback
- [ ] APNs environment (sandbox/production) tracked with token
- [ ] Server handles "BadDeviceToken" feedback
- [ ] Critical alerts use visible notifications (not silent)
- [ ] Fallback polling for missed notifications on foreground

### Phase 3: Streaming & Real-time
- [ ] SSE/EventSource has explicit reconnection logic
- [ ] `Last-Event-Id` tracked for resume after reconnect
- [ ] Connection status visible in UI
- [ ] WebSocket sends ping every 10-30 seconds
- [ ] Reconnect on `willEnterForeground`
- [ ] Timeout handling for hung connections

### Phase 4: Voice Features
- [ ] `NSSpeechRecognitionUsageDescription` in Info.plist
- [ ] `NSMicrophoneUsageDescription` in Info.plist
- [ ] Inactivity timer auto-stops recording after silence
- [ ] Haptic feedback on recording stop
- [ ] Graceful handling of speech recognition unavailable

### Ongoing
- [ ] Test on real devices, not just simulator
- [ ] Test with Low Power Mode enabled
- [ ] Test after force-quitting app
- [ ] Test with poor network conditions
- [ ] Review modifier order in SwiftUI views
- [ ] Audit for state mutations after await points

---

## Phase Mapping Summary

| Pitfall | Severity | Primary Phase | Secondary Phase |
|---------|----------|---------------|-----------------|
| Hardcoded API keys | Critical | Phase 1 | - |
| Wrong Keychain accessibility | Critical | Phase 1 | - |
| Silent push reliability | Critical | Phase 2 | Phase 5 (monitoring) |
| @MainActor/@Observable conflicts | Critical | Phase 1 | - |
| SSE reconnection missing | Critical | Phase 3 | - |
| Face ID timing | Common | Phase 1 | - |
| Push token not refreshed | Common | Phase 2 | - |
| Task leaks | Common | Phase 1 | - |
| No exponential backoff | Common | Phase 1 | - |
| WebSocket no pings | Common | Phase 3 | - |
| Speech no inactivity timer | Common | Phase 4 | - |
| Modifier order bugs | Subtle | Phase 1 | Ongoing |
| Background task assumptions | Subtle | Phase 2 | - |
| APNs environment mismatch | Subtle | Phase 2 | - |
| Actor reentrancy | Subtle | Phase 1 | - |
| Keychain size limits | Subtle | Phase 1 | - |

---

## Sources Summary

**SwiftUI & Concurrency:**
- [Hacking with Swift - Common SwiftUI Mistakes](https://www.hackingwithswift.com/articles/224/common-swiftui-mistakes-and-how-to-fix-them)
- [SwiftLee - 5 Biggest Mistakes with Async/Await](https://www.avanderlee.com/concurrency/the-5-biggest-mistakes-ios-developers-make-with-async-await/)
- [DEV.to - SwiftUI Performance and Stability](https://dev.to/arshtechpro/swiftui-performance-and-stability-avoiding-the-most-costly-mistakes-234c)

**Security:**
- [HackerOne - iOS App Secret Management](https://www.hackerone.com/blog/ios-app-secret-management-best-practices-keeping-your-data-secure)
- [SANS - How Not to Store Passwords in iOS](https://www.sans.org/blog/how-not-to-store-passwords-in-ios/)
- [Medium - iOS Keychain Abuse and Misuse](https://medium.com/@salamsajid7/ios-keychain-and-data-protection-classes-abuse-and-misuse-759267ee03b4)

**Push Notifications:**
- [Netguru - Why Push Notification Architecture Fails](https://www.netguru.com/blog/why-mobile-push-notification-architecture-fails)
- [Medium - Silent Push Notifications: Opportunities, Not Guarantees](https://mohsinkhan845.medium.com/silent-push-notifications-in-ios-opportunities-not-guarantees-2f18f645b5d5)
- [NSHipster - APNs Device Tokens](https://nshipster.com/apns-device-tokens/)

**Streaming & Real-time:**
- [GitHub - inaka/EventSource](https://github.com/inaka/EventSource)
- [Bugfender - iOS WebSockets](https://bugfender.com/blog/ios-websockets/)
- [Ably - WebSockets Swift Challenges](https://ably.com/topic/websockets-swift)

**Background Tasks:**
- [Andy Ibanez - Common Reasons Background Tasks Fail](https://www.andyibanez.com/posts/common-reasons-background-tasks-fail-ios/)
- [Medium - iOS Background Tasks Less Reliable](https://medium.com/@bhumibhuva18/why-ios-background-tasks-are-becoming-less-reliable-each-year-1514c72b406f)
