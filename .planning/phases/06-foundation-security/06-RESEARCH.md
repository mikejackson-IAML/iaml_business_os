# Phase 6: Foundation & Security - Research

**Researched:** 2026-01-20
**Domain:** SwiftUI app foundation, iOS Keychain, LocalAuthentication, haptic feedback
**Confidence:** HIGH

## Summary

This phase establishes the iOS app skeleton with three-tab navigation (Home, Chat, Settings), system appearance support, haptic feedback, and secure authentication using Face ID/Touch ID with Keychain-protected API key storage. The stack is well-established: SwiftUI TabView for navigation, the `colorScheme` environment value for dark mode, `.sensoryFeedback()` modifier (iOS 17+) for haptics, and the LocalAuthentication framework paired with Keychain Services for biometric-protected secure storage.

The primary complexity lies in implementing the auto-lock timeout correctly (iOS restricts background timers, so use foreground timestamp comparison) and ensuring the biometric prompt appears at the right time (delay after view appears, never in `init()`). The KeychainAccess library simplifies Keychain operations but native APIs work fine for this scope.

**Primary recommendation:** Build authentication infrastructure first (KeychainManager, BiometricAuth), then app shell (TabView, appearance), then connect them. Use `.task` modifier for async work, `@MainActor` on ViewModels, and the `scenePhase` environment value for lock timing.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SwiftUI | 6.x (iOS 17+) | UI Framework | Apple's declarative UI, native performance, TabView built-in |
| LocalAuthentication | Native | Biometric auth | Only official way to do Face ID/Touch ID |
| Security (Keychain) | Native | Secure storage | Apple's secure credential storage, hardware-backed |
| UIKit (haptics only) | Native | UIImpactFeedbackGenerator | Fallback for pre-iOS 17, still works |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| KeychainAccess | 4.2+ | Keychain wrapper | Optional - simplifies biometric-protected storage |
| Factory | 2.x | Dependency injection | Optional - cleaner testable architecture |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| KeychainAccess | Native Security APIs | More verbose but zero dependencies |
| `.sensoryFeedback()` | UIImpactFeedbackGenerator | UIKit approach, works on iOS 10+, less declarative |
| ScenePhase for lock | NotificationCenter observers | ScenePhase is SwiftUI-native, cleaner |

**Installation:**
```bash
# If using KeychainAccess (optional)
# Add to Package.swift or Xcode SPM:
.package(url: "https://github.com/kishikawakatsumi/KeychainAccess.git", from: "4.2.0")
```

## Architecture Patterns

### Recommended Project Structure

```
BusinessCommandCenter/
├── App/
│   ├── BusinessCommandCenterApp.swift  # @main, TabView root
│   └── AppState.swift                  # @Observable, lock state, auth state
├── Core/
│   ├── Security/
│   │   ├── KeychainManager.swift       # API key storage
│   │   ├── BiometricAuth.swift         # Face ID/Touch ID
│   │   └── LockManager.swift           # Auto-lock timing logic
│   └── Utilities/
│       ├── HapticManager.swift         # Centralized haptic feedback
│       └── Constants.swift             # Lock timeout, keychain keys
├── Features/
│   ├── Home/
│   │   └── HomeView.swift              # Placeholder for Phase 7
│   ├── Chat/
│   │   └── ChatView.swift              # Placeholder for Phase 9
│   └── Settings/
│       ├── SettingsView.swift          # API key management
│       └── APIKeyView.swift            # View/update API key
├── Shared/
│   └── Components/
│       └── LockScreenView.swift        # Biometric unlock UI
└── Resources/
    ├── Assets.xcassets                 # Colors, icons
    └── Info.plist                      # Face ID usage description
```

### Pattern 1: Tab-Based Navigation (iOS 17 Style)

**What:** SwiftUI TabView with tabItem modifier for iOS 17 compatibility.
**When to use:** Main app navigation structure.
**Example:**
```swift
// Source: Apple Developer Documentation - TabView
// https://developer.apple.com/documentation/swiftui/tabview

struct ContentView: View {
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house")
                }
                .tag(0)

            ChatView()
                .tabItem {
                    Label("Chat", systemImage: "message")
                }
                .tag(1)

            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(2)
        }
    }
}
```

### Pattern 2: Biometric-Protected Keychain Storage

**What:** Store API key in Keychain with Face ID/Touch ID requirement for access.
**When to use:** Any sensitive credential storage.
**Example:**
```swift
// Source: Apple Developer Documentation
// https://developer.apple.com/documentation/localauthentication/accessing-keychain-items-with-face-id-or-touch-id

import Security
import LocalAuthentication

class KeychainManager {
    static let shared = KeychainManager()
    private let apiKeyAccount = "com.iaml.businessos.apikey"

    func saveAPIKey(_ apiKey: String) throws {
        let data = apiKey.data(using: .utf8)!

        // Create access control with biometric protection
        var error: Unmanaged<CFError>?
        guard let access = SecAccessControlCreateWithFlags(
            nil,
            kSecAttrAccessibleWhenUnlockedThisDeviceOnly,
            .biometryCurrentSet,  // Invalidates if biometrics change
            &error
        ) else {
            throw KeychainError.accessControlCreationFailed
        }

        // Delete existing item first
        let deleteQuery: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: apiKeyAccount
        ]
        SecItemDelete(deleteQuery as CFDictionary)

        // Add new item with biometric protection
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: apiKeyAccount,
            kSecValueData as String: data,
            kSecAttrAccessControl as String: access
        ]

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.saveFailed(status)
        }
    }

    func getAPIKey() throws -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: apiKeyAccount,
            kSecReturnData as String: true,
            kSecUseAuthenticationContext as String: LAContext()
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let apiKey = String(data: data, encoding: .utf8) else {
            if status == errSecItemNotFound {
                return nil
            }
            throw KeychainError.retrievalFailed(status)
        }

        return apiKey
    }
}

enum KeychainError: Error {
    case accessControlCreationFailed
    case saveFailed(OSStatus)
    case retrievalFailed(OSStatus)
}
```

### Pattern 3: Auto-Lock with ScenePhase

**What:** Lock app after 5 minutes of inactivity using timestamp comparison (not background timers).
**When to use:** Security requirement for sensitive apps.
**Example:**
```swift
// Source: Hacking with Swift - ScenePhase
// https://www.hackingwithswift.com/quick-start/swiftui/how-to-detect-when-your-app-moves-to-the-background-or-foreground-with-scenephase

import SwiftUI

@Observable
class AppState {
    var isLocked = true
    var lastActiveTime: Date?

    private let lockTimeout: TimeInterval = 5 * 60  // 5 minutes

    func checkLockStatus() {
        guard let lastActive = lastActiveTime else {
            isLocked = true
            return
        }

        let elapsed = Date().timeIntervalSince(lastActive)
        if elapsed >= lockTimeout {
            isLocked = true
        }
    }

    func recordActivity() {
        lastActiveTime = Date()
    }

    func unlock() {
        isLocked = false
        recordActivity()
    }
}

@main
struct BusinessCommandCenterApp: App {
    @State private var appState = AppState()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            Group {
                if appState.isLocked {
                    LockScreenView(appState: appState)
                } else {
                    ContentView()
                }
            }
            .onChange(of: scenePhase) { oldPhase, newPhase in
                switch newPhase {
                case .background:
                    appState.recordActivity()
                case .active:
                    appState.checkLockStatus()
                case .inactive:
                    break
                @unknown default:
                    break
                }
            }
        }
    }
}
```

### Pattern 4: Haptic Feedback (iOS 17+ Native)

**What:** Use `.sensoryFeedback()` modifier for declarative haptics.
**When to use:** Button taps, state changes, success/error feedback.
**Example:**
```swift
// Source: Hacking with Swift - sensoryFeedback
// https://www.hackingwithswift.com/quick-start/swiftui/how-to-add-haptic-effects-using-sensory-feedback

struct ActionButton: View {
    @State private var isComplete = false

    var body: some View {
        Button("Submit") {
            isComplete = true
        }
        .sensoryFeedback(.success, trigger: isComplete)
    }
}

// For pre-iOS 17 fallback or more control:
class HapticManager {
    static let shared = HapticManager()

    private let impactLight = UIImpactFeedbackGenerator(style: .light)
    private let impactMedium = UIImpactFeedbackGenerator(style: .medium)
    private let notification = UINotificationFeedbackGenerator()

    func prepare() {
        impactLight.prepare()
        impactMedium.prepare()
        notification.prepare()
    }

    func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .medium) {
        switch style {
        case .light:
            impactLight.impactOccurred()
        case .medium:
            impactMedium.impactOccurred()
        default:
            impactMedium.impactOccurred()
        }
    }

    func notify(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        notification.notificationOccurred(type)
    }
}
```

### Anti-Patterns to Avoid

- **Biometric prompt in init():** Face ID dialog flashes and disappears. Always delay until view is rendered.
- **Storing API key in UserDefaults:** Not encrypted. Always use Keychain for secrets.
- **Using `kSecAttrAccessibleAlways`:** Deprecated, insecure. Use `kSecAttrAccessibleWhenUnlockedThisDeviceOnly`.
- **Background timers for lock timeout:** iOS kills them. Use timestamp comparison on foreground return.
- **Task {} in onAppear without cancellation:** Causes duplicate API calls. Use `.task` modifier instead.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Keychain storage | Raw Security APIs everywhere | KeychainAccess or single wrapper class | Error handling is complex, easy to misconfigure accessibility |
| Biometric auth | Custom biometric flow | LocalAuthentication framework | Apple handles all device variations, fallbacks |
| Tab navigation | Custom tab bar | SwiftUI TabView | Automatic accessibility, system appearance |
| Dark mode | Manual color switching | Asset catalog colors + `colorScheme` | System handles transitions, high contrast mode |
| Haptics | Raw AudioToolbox | UIImpactFeedbackGenerator or `.sensoryFeedback()` | Apple handles device capabilities |

**Key insight:** iOS security infrastructure is battle-tested. The LocalAuthentication + Keychain combination has handled billions of transactions. Rolling your own biometric validation is both harder and less secure.

## Common Pitfalls

### Pitfall 1: Face ID Prompt Appears and Disappears Instantly

**What goes wrong:** Biometric prompt shown during app launch flashes and disappears, returning `LAError.systemCancel`.
**Why it happens:** `LAContext.evaluatePolicy()` called before UI is fully rendered.
**How to avoid:**
1. Delay biometric prompt until after initial view appears
2. Use a "Tap to Unlock" button instead of auto-prompting
3. Handle `LAError.systemCancel` with retry after delay
**Warning signs:** Biometric auth in `init()` or immediately in `onAppear`.

### Pitfall 2: Wrong Keychain Accessibility Level

**What goes wrong:** Credentials accessible on locked device, extractable on jailbroken devices.
**Why it happens:** Using `kSecAttrAccessibleAlways` or not specifying accessibility.
**How to avoid:**
1. Always use `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` for API keys
2. Use `.biometryCurrentSet` to invalidate if biometrics change
3. Never use deprecated `kSecAttrAccessibleAlways`
**Warning signs:** Keychain code without explicit accessibility attribute.

### Pitfall 3: API Key Visible in Source Control

**What goes wrong:** API key hardcoded in Swift file or `.xcconfig` tracked in git.
**Why it happens:** Prototyping shortcuts not cleaned up before commit.
**How to avoid:**
1. Add `.xcconfig` to `.gitignore` immediately
2. Store API key in Keychain, entered at runtime
3. Never include API keys in bundled resources
**Warning signs:** Strings containing "api_key" or "secret" in source files.

### Pitfall 4: Auto-Lock Uses Background Timer

**What goes wrong:** Lock timer stops when app is backgrounded, user returns and app is still unlocked hours later.
**Why it happens:** iOS suspends/kills background timers for normal apps.
**How to avoid:**
1. Record timestamp when app goes to background
2. Compare elapsed time when app returns to foreground
3. Lock immediately if threshold exceeded
**Warning signs:** Using `Timer` or `DispatchQueue.asyncAfter` for lock timeout.

### Pitfall 5: Missing Info.plist Face ID Description

**What goes wrong:** Face ID authentication fails silently or app crashes.
**Why it happens:** `NSFaceIDUsageDescription` key missing from Info.plist.
**How to avoid:** Add before any Face ID code:
```xml
<key>NSFaceIDUsageDescription</key>
<string>Authenticate to access your Business Command Center</string>
```
**Warning signs:** Touch ID works but Face ID doesn't, no error message shown.

## Code Examples

Verified patterns from official sources:

### System Appearance Detection

```swift
// Source: Hacking with Swift
// https://www.hackingwithswift.com/quick-start/swiftui/how-to-detect-dark-mode

struct ContentView: View {
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        // Views automatically adapt to system appearance
        // Only use colorScheme for custom drawing or conditional content
        Text("Current mode: \(colorScheme == .dark ? "Dark" : "Light")")
            .foregroundStyle(colorScheme == .dark ? .white : .black)
    }
}
```

### Biometric Authentication with LocalAuthentication

```swift
// Source: Hacking with Swift
// https://www.hackingwithswift.com/books/ios-swiftui/using-touch-id-and-face-id-with-swiftui

import LocalAuthentication

class BiometricAuth {
    func authenticate() async throws -> Bool {
        let context = LAContext()
        var error: NSError?

        // Check if biometrics are available
        guard context.canEvaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            error: &error
        ) else {
            throw BiometricError.notAvailable(error?.localizedDescription ?? "Unknown")
        }

        // Perform authentication
        do {
            let success = try await context.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: "Unlock your Business Command Center"
            )
            return success
        } catch let authError as LAError {
            switch authError.code {
            case .userCancel:
                throw BiometricError.userCancelled
            case .biometryNotAvailable:
                throw BiometricError.notAvailable("Biometrics not available")
            case .biometryLockout:
                throw BiometricError.lockout
            case .systemCancel:
                throw BiometricError.systemCancelled  // Retry after delay
            default:
                throw BiometricError.failed(authError.localizedDescription)
            }
        }
    }

    var biometryType: String {
        let context = LAContext()
        _ = context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: nil)
        switch context.biometryType {
        case .faceID:
            return "Face ID"
        case .touchID:
            return "Touch ID"
        case .opticID:
            return "Optic ID"
        default:
            return "Biometrics"
        }
    }
}

enum BiometricError: Error {
    case notAvailable(String)
    case userCancelled
    case lockout
    case systemCancelled
    case failed(String)
}
```

### Lock Screen View with Delayed Biometric Prompt

```swift
// Combines patterns from multiple sources

struct LockScreenView: View {
    var appState: AppState
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var hasAttemptedAuto = false

    private let biometricAuth = BiometricAuth()

    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "lock.fill")
                .font(.system(size: 60))
                .foregroundStyle(.secondary)

            Text("Business Command Center")
                .font(.title)

            Button {
                Task { await authenticate() }
            } label: {
                Label("Unlock with \(biometricAuth.biometryType)",
                      systemImage: biometricAuth.biometryType == "Face ID" ? "faceid" : "touchid")
                    .font(.headline)
                    .padding()
                    .frame(maxWidth: .infinity)
                    .background(.blue)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .padding(.horizontal, 40)
            .sensoryFeedback(.impact, trigger: hasAttemptedAuto)
        }
        .alert("Authentication Error", isPresented: $showingError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage)
        }
        .task {
            // Delay auto-prompt to avoid systemCancel
            try? await Task.sleep(for: .milliseconds(500))
            if !hasAttemptedAuto {
                hasAttemptedAuto = true
                await authenticate()
            }
        }
    }

    @MainActor
    private func authenticate() async {
        do {
            let success = try await biometricAuth.authenticate()
            if success {
                HapticManager.shared.notify(.success)
                appState.unlock()
            }
        } catch BiometricError.systemCancelled {
            // Don't show error, user can tap button
        } catch BiometricError.userCancelled {
            // User cancelled, don't show error
        } catch {
            errorMessage = error.localizedDescription
            showingError = true
            HapticManager.shared.notify(.error)
        }
    }
}
```

### Settings View for API Key Management

```swift
struct APIKeyView: View {
    @State private var apiKey = ""
    @State private var isEditing = false
    @State private var showingKey = false
    @State private var saveSuccess = false

    private let keychainManager = KeychainManager.shared

    var body: some View {
        Form {
            Section {
                if isEditing {
                    SecureField("API Key", text: $apiKey)
                        .textContentType(.password)
                        .autocorrectionDisabled()
                } else {
                    HStack {
                        Text(showingKey ? (apiKey.isEmpty ? "Not set" : apiKey) : "********")
                            .foregroundStyle(apiKey.isEmpty ? .secondary : .primary)
                        Spacer()
                        Button(showingKey ? "Hide" : "Show") {
                            showingKey.toggle()
                        }
                        .buttonStyle(.borderless)
                    }
                }
            } header: {
                Text("Claude API Key")
            } footer: {
                Text("Your API key is stored securely in the iOS Keychain and protected by \(BiometricAuth().biometryType).")
            }

            Section {
                if isEditing {
                    Button("Save") {
                        saveAPIKey()
                    }
                    .sensoryFeedback(.success, trigger: saveSuccess)

                    Button("Cancel", role: .cancel) {
                        loadAPIKey()
                        isEditing = false
                    }
                } else {
                    Button("Edit API Key") {
                        isEditing = true
                    }
                }
            }
        }
        .navigationTitle("API Key")
        .task {
            loadAPIKey()
        }
    }

    private func loadAPIKey() {
        do {
            apiKey = try keychainManager.getAPIKey() ?? ""
        } catch {
            apiKey = ""
        }
    }

    private func saveAPIKey() {
        do {
            try keychainManager.saveAPIKey(apiKey)
            isEditing = false
            saveSuccess.toggle()
        } catch {
            // Handle error
        }
    }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UIKit tab bar | SwiftUI TabView | iOS 14 (mature iOS 17+) | Full SwiftUI, no UIKit interop needed |
| Completion handler auth | async/await LAContext | iOS 15 | Cleaner error handling, no callback hell |
| UIImpactFeedbackGenerator | `.sensoryFeedback()` modifier | iOS 17 | Declarative, SwiftUI-native |
| AppDelegate lifecycle | ScenePhase environment | iOS 14 | SwiftUI-native, no UIKit delegate |
| Manual dark mode detection | Asset catalog + colorScheme | iOS 13 | Automatic system integration |

**Deprecated/outdated:**
- `kSecAttrAccessibleAlways`: Removed, use `kSecAttrAccessibleWhenUnlocked` minimum
- `touchIDAny`/`touchIDCurrentSet`: Renamed to `biometryAny`/`biometryCurrentSet`
- `evaluatePolicy` completion handlers: Use async/await version

## Open Questions

Things that couldn't be fully resolved:

1. **KeychainAccess vs Native APIs**
   - What we know: KeychainAccess simplifies code, native APIs have zero dependencies
   - What's unclear: Team preference for dependency management
   - Recommendation: Start with native wrapper class, add KeychainAccess only if complexity warrants

2. **Simulator Testing Limitations**
   - What we know: Simulator lacks Secure Enclave, biometric tests pass immediately
   - What's unclear: How to reliably test biometric failure cases
   - Recommendation: Test on physical device for final validation, document simulator limitations

3. **iOS 18+ TabView API**
   - What we know: iOS 18 introduced new Tab() syntax, cleaner but iOS 18+ only
   - What's unclear: Whether to use new API with availability check or stick to iOS 17 API
   - Recommendation: Use iOS 17 API for simplicity since minimum target is iOS 17

## Sources

### Primary (HIGH confidence)

- [Apple Developer Documentation - TabView](https://developer.apple.com/documentation/swiftui/tabview) - Official TabView API reference
- [Apple Developer Documentation - Accessing Keychain Items with Face ID](https://developer.apple.com/documentation/localauthentication/accessing-keychain-items-with-face-id-or-touch-id) - Official biometric keychain guide
- [Hacking with Swift - TabView](https://www.hackingwithswift.com/quick-start/swiftui/how-to-embed-views-in-a-tab-bar-using-tabview) - Practical TabView examples
- [Hacking with Swift - Face ID and LocalAuthentication](https://www.hackingwithswift.com/books/ios-swiftui/using-touch-id-and-face-id-with-swiftui) - Complete biometric tutorial
- [Hacking with Swift - sensoryFeedback](https://www.hackingwithswift.com/quick-start/swiftui/how-to-add-haptic-effects-using-sensory-feedback) - iOS 17+ haptics
- [Hacking with Swift - ScenePhase](https://www.hackingwithswift.com/quick-start/swiftui/how-to-detect-when-your-app-moves-to-the-background-or-foreground-with-scenephase) - App lifecycle detection

### Secondary (MEDIUM confidence)

- [Kodeco - Keychain Services and Biometrics with SwiftUI](https://www.kodeco.com/11496196-how-to-secure-ios-user-data-keychain-services-and-biometrics-with-swiftui) - Comprehensive security tutorial
- [GitHub - KeychainAccess](https://github.com/kishikawakatsumi/KeychainAccess) - Keychain wrapper library
- [SerialCoder - ScenePhase](https://serialcoder.dev/text-tutorials/swiftui/handling-app-lifecycle-in-swiftui-with-scenephase/) - Detailed lifecycle handling
- [SwiftLee - TabView](https://www.avanderlee.com/swiftui/tabview-tabbed-views/) - TabView best practices

### Tertiary (LOW confidence)

- [Medium - App Lock Implementation](https://medium.com/@gauravharkhani01/implementing-app-lock-in-ios-everything-you-need-to-know-918d65dff9c0) - General lock patterns (verify specifics)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Native Apple frameworks, well-documented
- Architecture: HIGH - MVVM patterns from prior research, established conventions
- Pitfalls: HIGH - Multiple authoritative sources confirm same issues

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (stable domain, 30 days)
