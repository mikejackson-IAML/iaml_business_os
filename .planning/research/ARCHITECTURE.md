# Architecture Research: iOS Business Command Center

**Project:** iOS Business Command Center App
**Researched:** 2026-01-20
**Overall Confidence:** HIGH (established patterns, official documentation)

## Executive Summary

This document defines the architecture for an iOS SwiftUI app that integrates with the existing Business OS ecosystem (Next.js dashboard, Supabase, n8n workflows). The recommended architecture uses **MVVM with Clean Architecture principles**, leveraging Swift's modern concurrency (async/await) for networking and the Supabase Swift SDK for direct database access.

The app should communicate with Next.js API routes for authenticated actions and AI chat streaming, while using Supabase directly for real-time data subscriptions. Push notifications require APNs setup with the Next.js backend acting as the push server.

---

## High-Level Architecture

```
+------------------------------------------------------------------+
|                        iOS App                                    |
|  +------------------------------------------------------------+  |
|  |                    Presentation Layer                       |  |
|  |  [SwiftUI Views] <-> [ViewModels] <-> [State Management]   |  |
|  +------------------------------------------------------------+  |
|  |                      Domain Layer                           |  |
|  |  [Use Cases] <-> [Repository Protocols] <-> [Entities]     |  |
|  +------------------------------------------------------------+  |
|  |                       Data Layer                            |  |
|  |  [Repositories] <-> [Network] <-> [Keychain] <-> [Cache]   |  |
|  +------------------------------------------------------------+  |
+------------------------------------------------------------------+
          |                    |                    |
          v                    v                    v
+------------------+  +------------------+  +------------------+
|   Next.js API    |  |    Supabase      |  |   APNs Server    |
|   (dashboard/)   |  |   (PostgreSQL)   |  |   (via Next.js)  |
+------------------+  +------------------+  +------------------+
          |                    |
          v                    v
+------------------+  +------------------+
|  Anthropic API   |  |   n8n Workflows  |
|   (AI Chat)      |  |   (Actions)      |
+------------------+  +------------------+
```

### Communication Paths

| iOS Component | Backend Service | Protocol | Purpose |
|---------------|-----------------|----------|---------|
| Dashboard Data | Supabase | REST + Realtime | Metrics, alerts, activity |
| AI Chat | Next.js API | SSE (Server-Sent Events) | Streaming responses |
| Quick Actions | Next.js API | REST | Trigger n8n workflows |
| Push Registration | Next.js API | REST | Register device token |
| Authentication | Supabase Auth | OAuth/JWT | User sessions |

---

## iOS App Structure

### Recommended Folder Structure

```
BusinessCommandCenter/
├── App/
│   ├── BusinessCommandCenterApp.swift     # @main entry point
│   ├── AppDelegate.swift                   # Push notification handling
│   └── DIContainer.swift                   # Dependency injection setup
│
├── Core/
│   ├── Network/
│   │   ├── APIClient.swift                 # Base HTTP client
│   │   ├── StreamingClient.swift           # SSE handling for chat
│   │   ├── Endpoints.swift                 # API endpoint definitions
│   │   └── NetworkMonitor.swift            # Connectivity observer
│   │
│   ├── Security/
│   │   ├── KeychainManager.swift           # Secure storage wrapper
│   │   ├── BiometricAuth.swift             # Face ID/Touch ID
│   │   └── TokenManager.swift              # JWT handling
│   │
│   ├── Persistence/
│   │   ├── CacheManager.swift              # Offline data cache
│   │   └── UserDefaults+Extensions.swift   # Non-sensitive preferences
│   │
│   └── Services/
│       ├── SupabaseClient.swift            # Supabase SDK wrapper
│       ├── PushNotificationService.swift   # APNs registration
│       └── SpeechService.swift             # Voice input handling
│
├── Features/
│   ├── Dashboard/
│   │   ├── Views/
│   │   │   ├── DashboardView.swift
│   │   │   ├── MetricCardView.swift
│   │   │   └── AlertListView.swift
│   │   ├── ViewModels/
│   │   │   └── DashboardViewModel.swift
│   │   ├── Models/
│   │   │   └── DashboardModels.swift
│   │   └── Repository/
│   │       └── DashboardRepository.swift
│   │
│   ├── Chat/
│   │   ├── Views/
│   │   │   ├── ChatView.swift
│   │   │   ├── MessageBubbleView.swift
│   │   │   └── VoiceInputButton.swift
│   │   ├── ViewModels/
│   │   │   └── ChatViewModel.swift
│   │   ├── Models/
│   │   │   └── ChatModels.swift
│   │   └── Repository/
│   │       └── ChatRepository.swift
│   │
│   ├── Actions/
│   │   ├── Views/
│   │   │   ├── QuickActionsView.swift
│   │   │   └── ActionConfirmationSheet.swift
│   │   ├── ViewModels/
│   │   │   └── ActionsViewModel.swift
│   │   └── Repository/
│   │       └── ActionsRepository.swift
│   │
│   ├── Settings/
│   │   ├── Views/
│   │   │   ├── SettingsView.swift
│   │   │   └── APIKeyManagementView.swift
│   │   └── ViewModels/
│   │       └── SettingsViewModel.swift
│   │
│   └── Auth/
│       ├── Views/
│       │   └── LoginView.swift
│       └── ViewModels/
│           └── AuthViewModel.swift
│
├── Shared/
│   ├── Components/
│   │   ├── LoadingView.swift
│   │   ├── ErrorView.swift
│   │   ├── OfflineBanner.swift
│   │   └── BiometricButton.swift
│   │
│   ├── Extensions/
│   │   ├── View+Extensions.swift
│   │   ├── Date+Extensions.swift
│   │   └── Color+Brand.swift
│   │
│   └── Utilities/
│       ├── Logger.swift
│       └── Constants.swift
│
└── Resources/
    ├── Assets.xcassets
    ├── Localizable.strings
    └── Info.plist
```

### Layer Responsibilities

| Layer | Responsibility | Depends On |
|-------|---------------|------------|
| **Views** | UI rendering, user interaction | ViewModels |
| **ViewModels** | Business logic, state management | Repositories |
| **Repositories** | Data orchestration, caching strategy | Network, Persistence |
| **Network** | HTTP/SSE communication | Foundation |
| **Persistence** | Local storage (Keychain, Cache) | Foundation |

---

## Component Boundaries

### 1. Presentation Layer

**Views (SwiftUI)**
- Pure UI components
- No business logic
- Bind to ViewModel `@Published` properties
- Use `@StateObject` for owning ViewModels
- Use `@EnvironmentObject` for shared state

**ViewModels (ObservableObject)**
- Hold view state
- Call repository methods
- Handle errors and loading states
- Transform data for display
- Mark dependencies with `@ObservationIgnored` when using `@Observable`

```swift
@MainActor
final class DashboardViewModel: ObservableObject {
    @Published var metrics: [MetricValue] = []
    @Published var isLoading = false
    @Published var error: Error?

    private let repository: DashboardRepositoryProtocol

    init(repository: DashboardRepositoryProtocol = DashboardRepository()) {
        self.repository = repository
    }

    func loadDashboard() async {
        isLoading = true
        defer { isLoading = false }

        do {
            metrics = try await repository.fetchMetrics()
        } catch {
            self.error = error
        }
    }
}
```

### 2. Domain Layer

**Entities**
- Plain Swift structs
- Mirror existing TypeScript types from `dashboard-kit/types/`
- Codable for serialization

```swift
// Mirror of dashboard/src/dashboard-kit/types/dashboard.ts
struct MetricValue: Codable, Identifiable {
    let id: String
    let label: String
    let value: String
    let delta: String?
    let status: HealthStatus?

    enum HealthStatus: String, Codable {
        case healthy, warning, critical
    }
}
```

**Repository Protocols**
- Define data access contracts
- Enable testing with mocks

```swift
protocol DashboardRepositoryProtocol {
    func fetchMetrics() async throws -> [MetricValue]
    func subscribeToAlerts() -> AsyncStream<AlertItem>
}
```

### 3. Data Layer

**Repositories (Concrete)**
- Implement protocols
- Decide: network vs cache
- Handle offline fallback

**Network Clients**
- URLSession with async/await
- Separate client for streaming (SSE)

**Persistence**
- Keychain for secrets (API keys, tokens)
- FileManager/Cache for offline data
- UserDefaults for preferences only

---

## Data Flow

### Dashboard Data Flow

```
User Opens App
      |
      v
[DashboardView] --onAppear--> [DashboardViewModel.loadDashboard()]
      |
      v
[DashboardRepository.fetchMetrics()]
      |
      +---> Check NetworkMonitor.isConnected
      |         |
      |         +---> YES: Call Supabase SDK
      |         |         |
      |         |         v
      |         |     [Supabase REST API]
      |         |         |
      |         |         v
      |         |     Cache response locally
      |         |         |
      |         |         v
      |         |     Return fresh data
      |         |
      |         +---> NO: Return cached data (if available)
      |                   |
      |                   v
      |               Show offline banner
      |
      v
[ViewModel updates @Published metrics]
      |
      v
[SwiftUI re-renders DashboardView]
```

### AI Chat Streaming Flow

```
User Sends Message
      |
      v
[ChatView] --send--> [ChatViewModel.sendMessage(text)]
      |
      v
[ChatRepository.streamResponse(prompt)]
      |
      v
[StreamingClient.stream(to: /api/chat)]
      |
      +---> Create URLRequest with:
      |     - POST method
      |     - Bearer token (from Keychain)
      |     - Content-Type: application/json
      |
      v
[URLSession.bytes(for: request)]
      |
      v
for try await line in stream.lines {
    // Parse SSE: "data: {json}"
    // Update ViewModel.currentResponse
    // SwiftUI re-renders incrementally
}
      |
      v
[Message complete, add to history]
```

### Push Notification Flow

```
App Launch
    |
    v
[AppDelegate.didFinishLaunching]
    |
    v
[UNUserNotificationCenter.requestAuthorization]
    |
    v
[UIApplication.registerForRemoteNotifications]
    |
    v
[AppDelegate.didRegisterForRemoteNotifications(deviceToken)]
    |
    v
[PushNotificationService.registerToken(deviceToken)]
    |
    v
[POST /api/push/register with token + userId]
    |
    v
[Next.js stores token in Supabase]
    |
    v
[n8n workflow triggers push via APNs]
    |
    v
[iOS receives notification]
    |
    v
[userNotificationCenter(_:didReceive:) handles tap]
```

---

## Integration Points

### 1. Next.js API Routes

**Required New Endpoints:**

| Endpoint | Method | Purpose | Request | Response |
|----------|--------|---------|---------|----------|
| `/api/mobile/auth` | POST | Mobile-specific auth | `{email, password}` | `{token, user}` |
| `/api/mobile/chat` | POST | Streaming AI chat | `{prompt, context}` | SSE stream |
| `/api/mobile/actions/:id` | POST | Trigger workflow | `{params}` | `{success, result}` |
| `/api/mobile/push/register` | POST | Register device | `{token, userId}` | `{success}` |
| `/api/mobile/push/unregister` | DELETE | Remove device | `{token}` | `{success}` |

**SSE Streaming Implementation (Next.js):**

```typescript
// app/api/mobile/chat/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  const { prompt } = await request.json();

  const stream = new ReadableStream({
    async start(controller) {
      // Call Anthropic API with streaming
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      });

      for await (const event of response) {
        if (event.type === 'content_block_delta') {
          const data = `data: ${JSON.stringify(event.delta)}\n\n`;
          controller.enqueue(new TextEncoder().encode(data));
        }
      }

      controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
```

### 2. Supabase Direct Access

Use the [Supabase Swift SDK](https://github.com/supabase/supabase-swift) for:
- Real-time subscriptions (alerts, activity)
- Direct data queries (dashboard metrics)
- Authentication (shared with web)

```swift
import Supabase

class SupabaseService {
    static let shared = SupabaseService()

    let client: SupabaseClient

    private init() {
        client = SupabaseClient(
            supabaseURL: URL(string: Config.supabaseURL)!,
            supabaseKey: Config.supabaseAnonKey
        )
    }

    func subscribeToAlerts() -> AsyncStream<AlertItem> {
        AsyncStream { continuation in
            let channel = client.realtime.channel("alerts")

            channel.on("INSERT", table: "alerts") { message in
                if let alert = try? JSONDecoder().decode(AlertItem.self, from: message.payload) {
                    continuation.yield(alert)
                }
            }

            Task {
                await channel.subscribe()
            }

            continuation.onTermination = { _ in
                Task { await channel.unsubscribe() }
            }
        }
    }
}
```

### 3. Keychain for Secrets

Use [KeychainSwift](https://github.com/evgenyneu/keychain-swift) or native Keychain Services:

```swift
import Security

class KeychainManager {
    static let shared = KeychainManager()

    func save(_ value: String, for key: String) throws {
        let data = value.data(using: .utf8)!

        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data,
            kSecAttrAccessible as String: kSecAttrAccessibleWhenUnlockedThisDeviceOnly
        ]

        SecItemDelete(query as CFDictionary) // Remove existing

        let status = SecItemAdd(query as CFDictionary, nil)
        guard status == errSecSuccess else {
            throw KeychainError.unableToSave
        }
    }

    func get(_ key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data,
              let value = String(data: data, encoding: .utf8) else {
            return nil
        }

        return value
    }
}
```

**Biometric Protection:**

```swift
import LocalAuthentication

class BiometricAuth {
    func authenticate() async throws -> Bool {
        let context = LAContext()
        var error: NSError?

        guard context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) else {
            throw BiometricError.notAvailable
        }

        return try await context.evaluatePolicy(
            .deviceOwnerAuthenticationWithBiometrics,
            localizedReason: "Access your API keys"
        )
    }
}
```

### 4. Offline/Online State

Use `NWPathMonitor` from Network framework:

```swift
import Network

class NetworkMonitor: ObservableObject {
    static let shared = NetworkMonitor()

    private let monitor = NWPathMonitor()
    private let queue = DispatchQueue(label: "NetworkMonitor")

    @Published var isConnected = true
    @Published var connectionType: ConnectionType = .unknown

    enum ConnectionType {
        case wifi, cellular, unknown
    }

    func start() {
        monitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                self?.isConnected = path.status == .satisfied
                self?.connectionType = self?.getConnectionType(path) ?? .unknown
            }
        }
        monitor.start(queue: queue)
    }

    private func getConnectionType(_ path: NWPath) -> ConnectionType {
        if path.usesInterfaceType(.wifi) { return .wifi }
        if path.usesInterfaceType(.cellular) { return .cellular }
        return .unknown
    }
}
```

### 5. Voice Input

Use `SFSpeechRecognizer` (iOS 10+) or new `SpeechAnalyzer` (iOS 26+):

```swift
import Speech

class SpeechService: ObservableObject {
    @Published var transcript = ""
    @Published var isRecording = false

    private let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private var recognitionTask: SFSpeechRecognitionTask?
    private let audioEngine = AVAudioEngine()

    func startRecording() async throws {
        let status = await SFSpeechRecognizer.requestAuthorization()
        guard status == .authorized else {
            throw SpeechError.notAuthorized
        }

        let request = SFSpeechAudioBufferRecognitionRequest()
        request.shouldReportPartialResults = true

        let inputNode = audioEngine.inputNode
        let format = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: format) { buffer, _ in
            request.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()
        isRecording = true

        recognitionTask = recognizer?.recognitionTask(with: request) { [weak self] result, error in
            if let result = result {
                DispatchQueue.main.async {
                    self?.transcript = result.bestTranscription.formattedString
                }
            }
        }
    }

    func stopRecording() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionTask?.cancel()
        isRecording = false
    }
}
```

---

## Dependency Injection

Recommend using [Factory](https://github.com/hmlongco/Factory) for DI:

```swift
import Factory

extension Container {
    var networkMonitor: Factory<NetworkMonitor> {
        self { NetworkMonitor.shared }
            .singleton
    }

    var supabaseService: Factory<SupabaseService> {
        self { SupabaseService.shared }
            .singleton
    }

    var keychainManager: Factory<KeychainManager> {
        self { KeychainManager.shared }
            .singleton
    }

    var dashboardRepository: Factory<DashboardRepositoryProtocol> {
        self { DashboardRepository() }
    }

    var chatRepository: Factory<ChatRepositoryProtocol> {
        self { ChatRepository() }
    }
}

// Usage in ViewModel
final class DashboardViewModel: ObservableObject {
    @Injected(\.dashboardRepository) private var repository
    // ...
}
```

---

## Build Order (Dependencies)

The following build order respects dependencies between components:

### Phase 1: Foundation (Week 1)

Build these first - they have no dependencies:

1. **Core/Network/NetworkMonitor.swift** - Connectivity detection
2. **Core/Security/KeychainManager.swift** - Secure storage
3. **Core/Security/BiometricAuth.swift** - Face ID/Touch ID
4. **Shared/Utilities/Constants.swift** - Configuration
5. **Shared/Extensions/** - Helper extensions
6. **App/DIContainer.swift** - Dependency injection setup

### Phase 2: Data Layer (Week 2)

Depends on: Foundation

1. **Core/Network/APIClient.swift** - Base HTTP client
2. **Core/Services/SupabaseClient.swift** - Supabase SDK wrapper
3. **Features/*/Models/** - All domain models (mirror TypeScript types)
4. **Features/*/Repository/** - Repository protocols and implementations

### Phase 3: Authentication (Week 2-3)

Depends on: Data Layer

1. **Features/Auth/ViewModels/AuthViewModel.swift**
2. **Features/Auth/Views/LoginView.swift**
3. Backend: `/api/mobile/auth` endpoint

### Phase 4: Dashboard Feature (Week 3)

Depends on: Authentication, Data Layer

1. **Features/Dashboard/ViewModels/DashboardViewModel.swift**
2. **Features/Dashboard/Views/** - All dashboard views
3. **Shared/Components/OfflineBanner.swift**

### Phase 5: Chat Feature (Week 4)

Depends on: Authentication, Data Layer

1. **Core/Network/StreamingClient.swift** - SSE handling
2. **Core/Services/SpeechService.swift** - Voice input
3. **Features/Chat/ViewModels/ChatViewModel.swift**
4. **Features/Chat/Views/** - Chat UI components
5. Backend: `/api/mobile/chat` endpoint with SSE

### Phase 6: Quick Actions (Week 4-5)

Depends on: Authentication

1. **Features/Actions/ViewModels/ActionsViewModel.swift**
2. **Features/Actions/Views/** - Action buttons and confirmations
3. Backend: `/api/mobile/actions/:id` endpoint

### Phase 7: Push Notifications (Week 5)

Depends on: Authentication, Backend

1. **App/AppDelegate.swift** - Push registration
2. **Core/Services/PushNotificationService.swift**
3. Backend: `/api/mobile/push/register` endpoint
4. APNs configuration in Apple Developer Portal

### Phase 8: Settings & Polish (Week 6)

Depends on: All features

1. **Features/Settings/** - Settings views
2. Error handling improvements
3. Offline mode polish
4. App Store preparation

---

## Type Sharing Strategy

The existing Next.js dashboard has TypeScript types in `dashboard/src/dashboard-kit/types/`. The iOS app should mirror these:

| TypeScript Type | Swift Equivalent | Location |
|-----------------|------------------|----------|
| `MetricValue` | `MetricValue` | `Features/Dashboard/Models/` |
| `AlertItem` | `AlertItem` | `Features/Dashboard/Models/` |
| `QuickAction` | `QuickAction` | `Features/Actions/Models/` |
| `ActivityItem` | `ActivityItem` | `Features/Dashboard/Models/` |
| `HealthStatus` | `HealthStatus` (enum) | `Shared/` |

Consider generating Swift types from TypeScript using tools like `quicktype` or maintaining manually for a small number of types.

---

## Security Considerations

| Data | Storage | Protection |
|------|---------|------------|
| Supabase anon key | Bundled (not secret) | N/A |
| User JWT token | Keychain | `kSecAttrAccessibleWhenUnlockedThisDeviceOnly` |
| API response cache | FileManager | Encrypted at rest (iOS default) |
| Push device token | Keychain | `kSecAttrAccessibleAfterFirstUnlock` |
| User preferences | UserDefaults | No sensitive data |

---

## Sources

### Architecture Patterns
- [Clean Architecture for SwiftUI](https://nalexn.github.io/clean-architecture-swiftui) - Alexey Naumov
- [MVVM in SwiftUI](https://matteomanferdini.com/swiftui-mvvm/) - Matteo Manferdini
- [SwiftUI Large-Scale App Composition](https://dev.to/sebastienlato/swiftui-large-scale-app-composition-100-screens-real-architecture-39lh) - DEV Community

### Streaming & Networking
- [Streaming messages from ChatGPT using Swift AsyncSequence](https://zachwaugh.com/posts/streaming-messages-chatgpt-swift-asyncsequence) - Zach Waugh
- [URLSession Async/Await](https://developer.apple.com/videos/play/wwdc2021/10095/) - Apple WWDC21
- [Fixing Slow SSE Streaming in Next.js](https://medium.com/@oyetoketoby80/fixing-slow-sse-server-sent-events-streaming-in-next-js-and-vercel-99f42fbdb996) - Medium (Jan 2026)

### Push Notifications
- [iOS Push Notifications Guide 2026](https://medium.com/@khmannaict13/ios-push-notifications-the-complete-setup-guide-for-2026-adfc98592ab7) - Medium
- [Push Notifications in SwiftUI](https://medium.com/@jpmtech/your-complete-guide-to-push-notifications-in-swiftui-8a13f5588662) - Medium

### Security
- [Keychain Services and Biometrics with SwiftUI](https://www.kodeco.com/11496196-how-to-secure-ios-user-data-keychain-services-and-biometrics-with-swiftui) - Kodeco
- [KeychainSwift Library](https://github.com/evgenyneu/keychain-swift) - GitHub

### Network Monitoring
- [Network Connectivity on iOS](https://www.vadimbulavin.com/network-connectivity-on-ios-with-swift/) - Vadim Bulavin
- [NWPathMonitor in SwiftUI](https://medium.com/@husnainali593/how-to-check-network-connection-in-swiftui-using-nwpathmonitor-8f6cd4777514) - Medium

### Speech Recognition
- [SpeechAnalyzer WWDC25](https://developer.apple.com/videos/play/wwdc2025/277/) - Apple Developer
- [SFSpeechRecognizer Documentation](https://developer.apple.com/documentation/speech/sfspeechrecognizer) - Apple

### Supabase
- [Supabase Swift SDK](https://github.com/supabase/supabase-swift) - GitHub
- [Supabase iOS/SwiftUI Quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/ios-swiftui) - Supabase Docs

### Dependency Injection
- [Factory DI Container](https://github.com/hmlongco/Factory) - GitHub
- [Dependency Injection in SwiftUI](https://medium.com/@nimjea/dependency-injection-in-swiftui-from-basics-to-advanced-di-containers-241b8de76d7a) - Medium
