# Phase 12: Push Notification UI - Research

**Researched:** 2026-01-21
**Domain:** iOS push notification setup, UNUserNotificationCenter, deep linking, notification preferences UI
**Confidence:** HIGH

## Summary

This phase implements the iOS client-side handling of push notifications: requesting permission, receiving the device token, handling notification taps with deep linking, and providing notification preferences in Settings. The backend API endpoints (register, send, digest) were built in Phase 11.

The research confirms that SwiftUI apps must use `@UIApplicationDelegateAdaptor` to integrate an AppDelegate for push notification handling, as `UNUserNotificationCenterDelegate` must be set in `willFinishLaunchingWithOptions`. Deep linking from notifications works by embedding a URL or route identifier in the notification's `userInfo` dictionary, then handling it via `onOpenURL` modifier or direct navigation state updates. iOS 17's `@Observable` macro integrates well with navigation state for programmatic navigation.

The user decisions from CONTEXT.md specify asking for permission after the first quick action trigger (contextual timing), showing a pre-permission screen, and navigating to Home tab for all notification types (with alerts sheet auto-opening for critical alerts).

**Primary recommendation:** Create an AppDelegate for UNUserNotificationCenter handling, implement a PushNotificationService to manage token registration and permission state, use `@Observable` AppState to hold deep link destination for navigation, and create a dedicated NotificationSettingsView with toggles and time pickers stored via @AppStorage.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| UserNotifications | iOS 17+ | Push notification handling | Apple's standard framework |
| UIKit (AppDelegate) | iOS 17+ | Notification delegate setup | Required for UNUserNotificationCenterDelegate |
| SwiftUI | 5.0+ | UI and navigation | Project's UI framework |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @AppStorage | SwiftUI | Notification preferences persistence | For toggles and time settings |
| DatePicker | SwiftUI | Time pickers for quiet hours/digest | Native wheel picker component |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AppDelegate | SceneDelegate | AppDelegate simpler for notification-only integration |
| @AppStorage | UserDefaults directly | @AppStorage provides SwiftUI binding; UserDefaults fine for non-UI code |
| URL scheme deep linking | NavigationPath direct manipulation | URL scheme more portable; direct manipulation simpler for internal-only |

**Installation:**
No external packages required - all Apple frameworks.

## Architecture Patterns

### Recommended Project Structure
```
BusinessCommandCenter/
├── App/
│   ├── BusinessCommandCenterApp.swift    # MODIFY: Add @UIApplicationDelegateAdaptor
│   ├── AppDelegate.swift                 # NEW: UNUserNotificationCenterDelegate
│   ├── AppState.swift                    # MODIFY: Add deep link destination
│   └── ContentView.swift                 # MODIFY: Handle deep link navigation
├── Core/
│   └── Services/
│       └── PushNotificationService.swift # NEW: Token registration, permission state
├── Features/
│   └── Settings/
│       ├── SettingsView.swift            # MODIFY: Add Notifications section
│       └── NotificationSettingsView.swift # NEW: Notification preferences
└── Shared/
    └── Views/
        └── NotificationPermissionSheet.swift # NEW: Pre-permission screen
```

### Pattern 1: AppDelegate Integration with SwiftUI

**What:** Add AppDelegate to SwiftUI lifecycle for push notification handling
**When to use:** All apps using remote notifications
**Example:**
```swift
// App/AppDelegate.swift
import UIKit
import UserNotifications

final class AppDelegate: NSObject, UIApplicationDelegate {
    func application(
        _ application: UIApplication,
        willFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
    ) -> Bool {
        // MUST set delegate here, before app finishes launching
        UNUserNotificationCenter.current().delegate = self
        return true
    }

    func application(
        _ application: UIApplication,
        didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data
    ) {
        let token = deviceToken.map { String(format: "%02x", $0) }.joined()
        Task {
            await PushNotificationService.shared.registerToken(token)
        }
    }

    func application(
        _ application: UIApplication,
        didFailToRegisterForRemoteNotificationsWithError error: Error
    ) {
        print("Push registration failed: \(error)")
    }
}

extension AppDelegate: UNUserNotificationCenterDelegate {
    // Handle notification when app is in foreground
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        // Show banner even when app is open
        return [.banner, .badge, .sound]
    }

    // Handle notification tap
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        let userInfo = response.notification.request.content.userInfo

        // Extract notification type and navigate
        if let type = userInfo["type"] as? String {
            await MainActor.run {
                NotificationRouter.shared.handleNotificationTap(type: type, userInfo: userInfo)
            }
        }
    }
}

// App/BusinessCommandCenterApp.swift
@main
struct BusinessCommandCenterApp: App {
    @UIApplicationDelegateAdaptor(AppDelegate.self) private var appDelegate
    @State private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            // ... existing content
        }
    }
}
```

### Pattern 2: PushNotificationService Singleton

**What:** Centralized service for push notification state and API calls
**When to use:** Managing permission state, token registration
**Example:**
```swift
// Core/Services/PushNotificationService.swift
import Foundation
import UserNotifications
import UIKit

@MainActor
final class PushNotificationService: ObservableObject {
    static let shared = PushNotificationService()

    @Published private(set) var permissionStatus: UNAuthorizationStatus = .notDetermined
    @Published private(set) var hasPromptedForPermission = false

    private init() {
        Task { await refreshPermissionStatus() }
    }

    func refreshPermissionStatus() async {
        let settings = await UNUserNotificationCenter.current().notificationSettings()
        permissionStatus = settings.authorizationStatus
    }

    /// Request permission with pre-permission screen flow
    /// Returns true if granted
    func requestPermission() async -> Bool {
        hasPromptedForPermission = true

        do {
            let granted = try await UNUserNotificationCenter.current()
                .requestAuthorization(options: [.alert, .badge, .sound])

            if granted {
                await MainActor.run {
                    UIApplication.shared.registerForRemoteNotifications()
                }
            }

            await refreshPermissionStatus()
            return granted
        } catch {
            print("Permission request failed: \(error)")
            await refreshPermissionStatus()
            return false
        }
    }

    /// Register device token with backend
    func registerToken(_ token: String) async {
        // Call POST /api/mobile/notifications/register
        // Similar pattern to NetworkManager.triggerWorkflow
    }
}
```

### Pattern 3: Deep Link Navigation via AppState

**What:** Use @Observable AppState to trigger navigation from notification tap
**When to use:** Navigating to specific screens from notification
**Example:**
```swift
// App/AppState.swift additions
@Observable
final class AppState {
    // Existing properties...

    /// Deep link destination from notification tap
    var deepLinkDestination: DeepLinkDestination?
}

enum DeepLinkDestination: Equatable {
    case home
    case homeWithAlerts  // Opens Home tab then alerts sheet
    case settings
}

// Notification router (can be in AppDelegate or separate)
@MainActor
final class NotificationRouter {
    static let shared = NotificationRouter()
    weak var appState: AppState?

    func handleNotificationTap(type: String, userInfo: [AnyHashable: Any]) {
        switch type {
        case "CRITICAL_ALERT":
            appState?.deepLinkDestination = .homeWithAlerts
        case "WORKFLOW_COMPLETE", "DIGEST":
            appState?.deepLinkDestination = .home
        default:
            appState?.deepLinkDestination = .home
        }
    }
}

// App/ContentView.swift - handle navigation
struct ContentView: View {
    var appState: AppState
    @State private var selectedTab = 0
    @State private var showAlerts = false  // Moved from HomeView for cross-tab control

    var body: some View {
        TabView(selection: $selectedTab) {
            // tabs...
        }
        .onChange(of: appState.deepLinkDestination) { _, destination in
            guard let destination else { return }

            switch destination {
            case .home:
                selectedTab = 0
            case .homeWithAlerts:
                selectedTab = 0
                showAlerts = true
            case .settings:
                selectedTab = 2
            }

            appState.deepLinkDestination = nil  // Clear after handling
        }
    }
}
```

### Pattern 4: Notification Preferences Storage

**What:** Store notification preferences using @AppStorage with Codable struct
**When to use:** Persisting user notification settings
**Example:**
```swift
// Models/NotificationPreferences.swift
struct NotificationPreferences: Codable {
    var criticalAlertsEnabled: Bool = true
    var workflowCompletionsEnabled: Bool = true
    var dailyDigestEnabled: Bool = true
    var quietHoursEnabled: Bool = true
    var quietHoursStart: Int = 22  // 10pm
    var quietHoursEnd: Int = 7     // 7am
    var digestHour: Int = 8        // 8am
}

extension NotificationPreferences: RawRepresentable {
    init?(rawValue: String) {
        guard let data = rawValue.data(using: .utf8),
              let result = try? JSONDecoder().decode(NotificationPreferences.self, from: data)
        else { return nil }
        self = result
    }

    var rawValue: String {
        guard let data = try? JSONEncoder().encode(self),
              let result = String(data: data, encoding: .utf8)
        else { return "{}" }
        return result
    }
}

// Usage in Settings
struct NotificationSettingsView: View {
    @AppStorage("notificationPreferences") private var preferences = NotificationPreferences()

    var body: some View {
        Form {
            Section("Notification Types") {
                Toggle("Critical Alerts", isOn: $preferences.criticalAlertsEnabled)
                Toggle("Workflow Completions", isOn: $preferences.workflowCompletionsEnabled)
                Toggle("Daily Digest", isOn: $preferences.dailyDigestEnabled)
            }

            Section("Quiet Hours") {
                Toggle("Enable Quiet Hours", isOn: $preferences.quietHoursEnabled)
                if preferences.quietHoursEnabled {
                    // Time pickers...
                }
            }
        }
    }
}
```

### Anti-Patterns to Avoid
- **Setting UNUserNotificationCenter.delegate too late:** Must be in willFinishLaunchingWithOptions, not didFinish
- **Requesting permission on app launch:** Contextual timing (after first action) has better conversion
- **Ignoring foreground notifications:** Implement willPresent to show banner when app is open
- **Hardcoding notification text:** Use constants or localized strings
- **Not handling denied state gracefully:** Show link to iOS Settings, don't nag

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Permission dialogs | Custom alert | UNUserNotificationCenter.requestAuthorization | System dialog required by Apple |
| Token format conversion | Manual string parsing | `deviceToken.map { String(format: "%02x", $0) }.joined()` | Standard hex conversion |
| Opening iOS Settings | Guessing URL | UIApplication.openSettingsURLString | Documented constant |
| Time pickers | Custom wheel view | DatePicker with .hourAndMinute | Native, accessible |

**Key insight:** The notification permission flow is heavily controlled by iOS. Focus on contextual timing and pre-permission education rather than fighting the system.

## Common Pitfalls

### Pitfall 1: Missing Push Notification Entitlement

**What goes wrong:** App rejected or notifications silently fail
**Why it happens:** Xcode doesn't auto-add aps-environment to entitlements
**How to avoid:**
- Add Push Notifications capability in Xcode Signing & Capabilities
- Verify entitlements file includes `aps-environment`
- Regenerate provisioning profile if needed
**Warning signs:** "Missing Push Notification Entitlement" warning in Xcode/App Store Connect

### Pitfall 2: Delegate Set Too Late

**What goes wrong:** Notification taps not received when app launches from killed state
**Why it happens:** UNUserNotificationCenter.delegate set in didFinishLaunching or later
**How to avoid:**
- Set delegate in `willFinishLaunchingWithOptions`, not `didFinishLaunchingWithOptions`
- Verify in code review
**Warning signs:** Deep links work when app is backgrounded but not when launching from killed

### Pitfall 3: Permission Request Ignored After First Denial

**What goes wrong:** Users who denied can't enable notifications
**Why it happens:** iOS only shows system prompt once; subsequent calls return immediately
**How to avoid:**
- Check permission status first
- If denied, show custom UI directing to iOS Settings
- Use `UIApplication.shared.open(URL(string: UIApplication.openSettingsURLString)!)`
**Warning signs:** Toggle in app doesn't enable notifications

### Pitfall 4: Token Registration Race Condition

**What goes wrong:** Token sent to server before user is authenticated
**Why it happens:** didRegisterForRemoteNotifications fires immediately after registerForRemoteNotifications
**How to avoid:**
- Queue token registration if auth context not available
- Register token again after successful authentication
- Use device-level token storage to retry
**Warning signs:** Token exists on server but user not associated, or 401 errors in token registration

### Pitfall 5: Navigation State Lost on Background

**What goes wrong:** Deep link destination cleared before navigation happens
**Why it happens:** App suspends before onChange handler runs
**How to avoid:**
- Handle destination in onAppear as well as onChange
- Use synchronous navigation update if possible
- Persist pending deep link across scene phase changes
**Warning signs:** Notification tap sometimes doesn't navigate to correct screen

## Xcode Project Setup

### Required Capabilities

1. **Push Notifications Capability**
   - Open project in Xcode
   - Select target -> Signing & Capabilities
   - Click "+ Capability"
   - Add "Push Notifications"
   - This creates/updates the entitlements file

2. **Entitlements File**
   Create `BusinessCommandCenter.entitlements` with:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>aps-environment</key>
       <string>development</string>
   </dict>
   </plist>
   ```
   Note: Xcode changes `development` to `production` for release builds automatically.

3. **Update project.pbxproj**
   - Add entitlements file reference
   - Add `CODE_SIGN_ENTITLEMENTS = BusinessCommandCenter/BusinessCommandCenter.entitlements` to build settings

4. **Background Modes (Optional)**
   If supporting silent notifications for background refresh:
   - Add "Background Modes" capability
   - Enable "Remote notifications"
   - Add to Info.plist: `UIBackgroundModes` array containing `remote-notification`

### Provisioning Profile

1. In Apple Developer Portal:
   - Identifiers -> App IDs -> Your App ID
   - Enable "Push Notifications" capability
   - Create new provisioning profile (or regenerate existing)

2. Download and install new profile in Xcode

## Code Examples

### Complete Permission Request Flow

```swift
// Pre-permission sheet (shown before system prompt)
struct NotificationPermissionSheet: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var service = PushNotificationService.shared
    var onComplete: (Bool) -> Void

    var body: some View {
        NavigationStack {
            VStack(spacing: 24) {
                Image(systemName: "bell.badge.fill")
                    .font(.system(size: 60))
                    .foregroundStyle(.blue)

                Text("Stay Informed")
                    .font(.title2)
                    .fontWeight(.bold)

                VStack(alignment: .leading, spacing: 16) {
                    benefitRow(
                        icon: "exclamationmark.triangle.fill",
                        color: .red,
                        title: "Critical Alerts",
                        subtitle: "Know immediately when systems need attention"
                    )

                    benefitRow(
                        icon: "checkmark.circle.fill",
                        color: .green,
                        title: "Workflow Updates",
                        subtitle: "Get notified when triggered workflows complete"
                    )

                    benefitRow(
                        icon: "sun.max.fill",
                        color: .orange,
                        title: "Daily Digest",
                        subtitle: "Morning summary of overnight activity"
                    )
                }
                .padding(.horizontal)

                Spacer()

                Button {
                    Task {
                        let granted = await service.requestPermission()
                        onComplete(granted)
                        dismiss()
                    }
                } label: {
                    Text("Enable Notifications")
                        .frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button("Not Now") {
                    onComplete(false)
                    dismiss()
                }
                .foregroundStyle(.secondary)
            }
            .padding()
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("Done") {
                        onComplete(false)
                        dismiss()
                    }
                }
            }
        }
    }

    private func benefitRow(icon: String, color: Color, title: String, subtitle: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.headline)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
    }
}
```

### Notification Settings View

```swift
struct NotificationSettingsView: View {
    @AppStorage("notificationPreferences") private var preferences = NotificationPreferences()
    @StateObject private var service = PushNotificationService.shared

    var body: some View {
        Form {
            // Permission status section
            if service.permissionStatus == .denied {
                Section {
                    HStack {
                        Image(systemName: "bell.slash.fill")
                            .foregroundStyle(.orange)
                        Text("Notifications Disabled")
                        Spacer()
                        Button("Settings") {
                            openSettings()
                        }
                        .font(.caption)
                    }
                } footer: {
                    Text("Tap Settings to enable notifications in iOS Settings.")
                }
            }

            Section("Notification Types") {
                Toggle("Critical Alerts", isOn: $preferences.criticalAlertsEnabled)
                Toggle("Workflow Completions", isOn: $preferences.workflowCompletionsEnabled)
                Toggle("Daily Digest", isOn: $preferences.dailyDigestEnabled)
            }

            Section("Quiet Hours") {
                Toggle("Enable Quiet Hours", isOn: $preferences.quietHoursEnabled)

                if preferences.quietHoursEnabled {
                    HStack {
                        Text("Start")
                        Spacer()
                        hourPicker(hour: $preferences.quietHoursStart)
                    }

                    HStack {
                        Text("End")
                        Spacer()
                        hourPicker(hour: $preferences.quietHoursEnd)
                    }
                }
            } footer: {
                if preferences.quietHoursEnabled {
                    Text("Critical alerts will still be delivered during quiet hours.")
                }
            }

            Section("Daily Digest") {
                if preferences.dailyDigestEnabled {
                    HStack {
                        Text("Delivery Time")
                        Spacer()
                        hourPicker(hour: $preferences.digestHour)
                    }
                }
            } footer: {
                Text("Time shown in \(TimeZone.current.identifier)")
            }
        }
        .navigationTitle("Notifications")
        .task {
            await service.refreshPermissionStatus()
        }
    }

    private func hourPicker(hour: Binding<Int>) -> some View {
        Picker("", selection: hour) {
            ForEach(0..<24, id: \.self) { h in
                Text(formatHour(h)).tag(h)
            }
        }
        .pickerStyle(.wheel)
        .frame(width: 100, height: 100)
        .clipped()
    }

    private func formatHour(_ hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h a"
        let date = Calendar.current.date(from: DateComponents(hour: hour)) ?? Date()
        return formatter.string(from: date)
    }

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }
}
```

### Syncing Preferences to Backend

```swift
// Extension to sync preferences when changed
extension NotificationSettingsView {
    private func syncPreferences() {
        Task {
            // Get current device token from Keychain/storage
            guard let token = PushNotificationService.shared.currentToken else { return }

            // Update backend with preferences
            try? await NetworkManager.shared.updateNotificationPreferences(
                token: token,
                preferences: NotificationPreferencesRequest(
                    quietHoursEnabled: preferences.quietHoursEnabled,
                    quietHoursStart: preferences.quietHoursStart,
                    quietHoursEnd: preferences.quietHoursEnd,
                    digestEnabled: preferences.dailyDigestEnabled,
                    digestHour: preferences.digestHour,
                    timezone: TimeZone.current.identifier
                )
            )
        }
    }
}
```

## iOS 17+ Specific APIs

| Feature | API | Note |
|---------|-----|------|
| Observable state | `@Observable` macro | Used for AppState, replaces ObservableObject |
| Bindable from environment | `@Bindable` local variable | Required when passing @Observable to NavigationStack path |
| Async delegate methods | `async` in UNUserNotificationCenterDelegate | iOS 15+, cleaner than completion handlers |
| NavigationStack | `NavigationStack(path:)` | iOS 16+, required for programmatic navigation |

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UIApplicationDelegate in UIKit | @UIApplicationDelegateAdaptor | SwiftUI 2.0 | Required for push in SwiftUI |
| Completion handler delegates | async delegate methods | iOS 15 | Cleaner code |
| ObservableObject | @Observable macro | iOS 17 | Simpler observation |
| NavigationView | NavigationStack | iOS 16 | Required for path-based navigation |

**Deprecated/outdated:**
- `registerUserNotificationSettings`: Use UNUserNotificationCenter
- `application:didReceiveRemoteNotification:`: Use UNUserNotificationCenterDelegate

## Open Questions

Things that couldn't be fully resolved:

1. **Badge Count Strategy**
   - What we know: Badge can show a number on app icon
   - What's unclear: Should it show unresolved alert count, or unread notifications?
   - Recommendation: Start with unresolved alert count (matches dashboard), adjust based on feedback

2. **Notification Categories/Actions**
   - What we know: iOS supports action buttons on notifications
   - What's unclear: Are any custom actions needed for this phase?
   - Recommendation: Keep simple for MVP (just tap to open), add actions later if needed

3. **TestFlight vs Development APNs**
   - What we know: TestFlight uses production APNs environment
   - What's unclear: How to test both environments during development
   - Recommendation: Use simulator for development testing, TestFlight for production validation

## Sources

### Primary (HIGH confidence)
- [Apple Developer: APS Environment Entitlement](https://developer.apple.com/documentation/bundleresources/entitlements/aps-environment) - Entitlement setup
- [Apple Developer: UNNotificationCategory](https://developer.apple.com/documentation/usernotifications/unnotificationcategory) - Custom actions
- Phase 11 Research and Plans - Backend API contract

### Secondary (MEDIUM confidence)
- [Swift with Majid: Deep linking for notifications](https://swiftwithmajid.com/2024/04/09/deep-linking-for-local-notifications-in-swiftui/) - SwiftUI integration pattern
- [tanaschita: Custom notification actions](https://tanaschita.com/ios-notifications-custom-actions/) - Action button setup
- [Medium: iOS Notifications 2026 Guide](https://medium.com/@thakurneeshu280/the-complete-guide-to-ios-notifications-from-basics-to-advanced-2026-edition-48cdcba8c18c) - Current patterns
- [swiftyplace: NavigationStack](https://www.swiftyplace.com/blog/better-navigation-in-swiftui-with-navigation-stack) - Programmatic navigation

### Tertiary (LOW confidence)
- Community discussions on iOS 17 NavigationPath flash bug - May need workaround

## Metadata

**Confidence breakdown:**
- Xcode/entitlements setup: HIGH - Apple documentation
- AppDelegate integration: HIGH - Well-documented SwiftUI pattern
- Deep link navigation: HIGH - Standard NavigationStack pattern
- Notification preferences UI: HIGH - Standard SwiftUI Form/Toggle patterns
- Backend sync timing: MEDIUM - Design decision, may need tuning

**Research date:** 2026-01-21
**Valid until:** 2026-02-21 (30 days - stable patterns)
