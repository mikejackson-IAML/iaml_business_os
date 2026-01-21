# Phase 9: Chat UI - Research

**Researched:** 2026-01-20
**Domain:** SwiftUI chat interface, SSE streaming consumption, iOS Speech framework, animations
**Confidence:** HIGH

## Summary

This phase builds the iOS chat interface that consumes the Phase 8 SSE streaming API. The implementation involves five main areas: (1) SSE streaming consumption using URLSession.bytes with custom parsing or the EventSource Swift library, (2) chat bubble UI with ScrollViewReader for auto-scroll, (3) Speech framework integration for voice input, (4) animations for streaming text and recording state, and (5) confirmation dialog handling as inline chat bubbles.

The codebase already establishes clear patterns from Phase 7: MVVM with @MainActor ViewModels, actor-based NetworkManager, and @Observable AppState. The Chat UI follows these patterns while adding streaming-specific concerns. Phase 8 established a simplified SSE event format (`text`, `tool_use_start`, `tool_use`, `tool_result`, `done`, `error`) that iOS parses and renders incrementally.

**Primary recommendation:** Create ChatViewModel using @MainActor with an AsyncSequence-based SSE consumer. Use ScrollViewReader with `.scrollTo()` for auto-scroll on new content. Implement SFSpeechRecognizer for voice input with AVAudioEngine for real-time audio capture. Use simple opacity animations for text fade-in and a pulsing glow effect for the recording indicator.

## Standard Stack

The established libraries/tools for this domain:

### Core (Built-in)
| Component | iOS Version | Purpose | Why Standard |
|-----------|-------------|---------|--------------|
| `URLSession.bytes` | iOS 15+ | SSE streaming | Native async byte streaming, no dependencies |
| `AsyncSequence` | iOS 15+ | Stream processing | Native Swift concurrency, type-safe |
| `ScrollViewReader` | iOS 14+ | Programmatic scroll | Native SwiftUI, no hacks needed |
| `SFSpeechRecognizer` | iOS 10+ | Speech-to-text | Native Apple framework, on-device option |
| `AVAudioEngine` | iOS 8+ | Audio capture | Required for real-time speech recognition |
| `@FocusState` | iOS 15+ | Keyboard control | Native SwiftUI focus management |

### Optional Dependencies
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| [EventSource (mattt)](https://github.com/mattt/EventSource) | 1.3.0+ | SSE parsing | If manual parsing proves complex |
| [SwiftUI-Shimmer (markiv)](https://github.com/markiv/SwiftUI-Shimmer) | Latest | Skeleton loading | Lightweight, optional enhancement |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URLSession.bytes | EventSource library | Library adds reconnection handling, but manual parsing is simple for Phase 8's format |
| SFSpeechRecognizer | SpeechAnalyzer (iOS 26) | SpeechAnalyzer is better but requires iOS 26 - not available for iOS 17 target |
| SFSpeechRecognizer | Whisper + CoreML | On-device, offline, but adds 75MB+ model and complexity |

**Installation (if using EventSource):**
```swift
// Package.swift or Xcode Package Dependencies
.package(url: "https://github.com/mattt/EventSource.git", from: "1.3.0")
```

## Architecture Patterns

### Recommended Project Structure
```
BusinessCommandCenter/
├── Features/
│   └── Chat/
│       ├── ChatView.swift              # Main chat UI
│       ├── ChatViewModel.swift         # @MainActor observable state
│       ├── Components/
│       │   ├── MessageBubble.swift     # Individual message bubble
│       │   ├── AIAvatarView.swift      # AI avatar image
│       │   ├── ChatInputBar.swift      # Floating capsule input
│       │   ├── RecordingIndicator.swift # Ethereal pulsing visual
│       │   ├── ConfirmationBubble.swift # Action confirmation card
│       │   └── SkeletonBubble.swift    # Shimmer placeholder
│       ├── Models/
│       │   ├── ChatMessage.swift       # Message model
│       │   └── ChatEvent.swift         # SSE event types
│       └── Services/
│           ├── ChatService.swift       # SSE streaming service
│           └── SpeechService.swift     # Speech recognition service
├── Core/
│   └── Network/
│       └── NetworkManager.swift        # Existing, add streamChat method
```

### Pattern 1: SSE Streaming with URLSession.bytes

**What:** Consume SSE from Phase 8 chat API using URLSession's native byte streaming
**When to use:** Always - this is the primary way to receive streaming responses
**Example:**
```swift
// Source: Apple URLSession docs + Phase 8 SSE format
// BusinessCommandCenter/Features/Chat/Services/ChatService.swift

actor ChatService {
    private let session = URLSession.shared

    /// Stream chat response from API
    /// - Parameters:
    ///   - messages: Conversation history
    ///   - apiKey: Mobile API key
    /// - Returns: AsyncThrowingStream of ChatEvent
    func streamChat(
        messages: [ChatMessage],
        apiKey: String
    ) async throws -> AsyncThrowingStream<ChatEvent, Error> {
        var request = URLRequest(url: URL(string: "\(Constants.API.baseURL)/chat")!)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(ChatRequest(messages: messages))

        return AsyncThrowingStream { continuation in
            Task {
                do {
                    let (bytes, response) = try await session.bytes(for: request)

                    guard let httpResponse = response as? HTTPURLResponse,
                          httpResponse.statusCode == 200 else {
                        throw NetworkError.invalidResponse
                    }

                    var buffer = ""
                    for try await line in bytes.lines {
                        // SSE format: "data: {json}"
                        guard line.hasPrefix("data: ") else { continue }
                        let json = String(line.dropFirst(6))

                        if let event = try? JSONDecoder().decode(ChatEvent.self, from: Data(json.utf8)) {
                            continuation.yield(event)

                            if case .done = event {
                                continuation.finish()
                                return
                            }
                        }
                    }
                    continuation.finish()
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }
}
```

### Pattern 2: ChatViewModel with Streaming State

**What:** @MainActor ViewModel managing conversation state and streaming
**When to use:** Always - central state management for chat UI
**Example:**
```swift
// Source: Phase 7 HomeViewModel pattern + streaming additions
// BusinessCommandCenter/Features/Chat/ChatViewModel.swift

@MainActor
final class ChatViewModel: ObservableObject {
    // MARK: - Published State
    @Published private(set) var messages: [ChatMessage] = []
    @Published private(set) var currentStreamingText: String = ""
    @Published private(set) var isStreaming = false
    @Published private(set) var isWaitingForResponse = false
    @Published private(set) var pendingConfirmation: ConfirmationAction? = nil
    @Published private(set) var error: NetworkError?

    // Message queue for when AI is responding
    private var pendingMessages: [String] = []

    private let chatService = ChatService()

    // MARK: - Send Message

    func sendMessage(_ text: String, context: LAContext) async {
        // If currently streaming, queue the message
        if isStreaming {
            pendingMessages.append(text)
            return
        }

        // Add user message to conversation
        let userMessage = ChatMessage(role: .user, content: text)
        messages.append(userMessage)

        // Start streaming response
        isStreaming = true
        isWaitingForResponse = true
        currentStreamingText = ""

        do {
            guard let apiKey = try KeychainManager.shared.getAPIKey(context: context) else {
                throw NetworkError.noAPIKey
            }

            let stream = try await chatService.streamChat(
                messages: messages.map { $0.toAPIMessage() },
                apiKey: apiKey
            )

            for try await event in stream {
                await handleEvent(event)
            }

            // Finalize AI message
            if !currentStreamingText.isEmpty {
                messages.append(ChatMessage(role: .assistant, content: currentStreamingText))
            }

        } catch let networkError as NetworkError {
            self.error = networkError
        } catch {
            self.error = .requestFailed(error)
        }

        isStreaming = false
        isWaitingForResponse = false
        currentStreamingText = ""

        // Process queued messages
        if let nextMessage = pendingMessages.first {
            pendingMessages.removeFirst()
            await sendMessage(nextMessage, context: context)
        }
    }

    private func handleEvent(_ event: ChatEvent) async {
        switch event {
        case .text(let content):
            isWaitingForResponse = false
            currentStreamingText += content
        case .toolUseStart(let id, let name):
            // Could show "thinking" indicator
            break
        case .toolUse(let id, let name, let input):
            // Could show what tool is being used
            break
        case .toolResult(let id, let content):
            // Tool completed
            break
        case .done(let stopReason):
            break
        case .error(let message):
            self.error = NetworkError.serverError(500)
        }
    }
}
```

### Pattern 3: Auto-Scroll with Smart Detection

**What:** ScrollViewReader that follows new content unless user has scrolled up
**When to use:** Chat message list where newest content appears at bottom
**Example:**
```swift
// Source: Community patterns + Apple ScrollViewReader docs
// BusinessCommandCenter/Features/Chat/ChatView.swift

struct ChatView: View {
    @StateObject private var viewModel = ChatViewModel()
    @State private var isNearBottom = true

    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(spacing: 12) {
                    ForEach(viewModel.messages) { message in
                        MessageBubble(message: message)
                            .id(message.id)
                    }

                    // Streaming message (if active)
                    if !viewModel.currentStreamingText.isEmpty {
                        StreamingBubble(text: viewModel.currentStreamingText)
                            .id("streaming")
                    }

                    // Skeleton placeholder (if waiting)
                    if viewModel.isWaitingForResponse {
                        SkeletonBubble()
                            .id("skeleton")
                    }

                    // Invisible anchor at bottom
                    Color.clear
                        .frame(height: 1)
                        .id("bottom")
                }
                .padding()
            }
            .onScrollGeometryChange(for: Bool.self) { geometry in
                // Detect if user is near bottom (within 100pt)
                let distanceFromBottom = geometry.contentSize.height - geometry.contentOffset.y - geometry.containerSize.height
                return distanceFromBottom < 100
            } action: { _, isNear in
                isNearBottom = isNear
            }
            .onChange(of: viewModel.currentStreamingText) { _, _ in
                // Auto-scroll if user is near bottom
                if isNearBottom {
                    withAnimation(.easeOut(duration: 0.1)) {
                        proxy.scrollTo("streaming", anchor: .bottom)
                    }
                }
            }
            .onChange(of: viewModel.messages.count) { _, _ in
                if isNearBottom {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo("bottom", anchor: .bottom)
                    }
                }
            }
        }
    }
}
```

### Pattern 4: Voice Input with SFSpeechRecognizer

**What:** Real-time speech recognition for voice-first input
**When to use:** When user taps mic button to speak instead of type
**Example:**
```swift
// Source: Apple Speech framework docs + community patterns
// BusinessCommandCenter/Features/Chat/Services/SpeechService.swift

import Speech
import AVFoundation

@MainActor
final class SpeechService: ObservableObject {
    @Published private(set) var isRecording = false
    @Published private(set) var transcribedText = ""
    @Published private(set) var error: Error?

    private var recognizer: SFSpeechRecognizer?
    private var audioEngine: AVAudioEngine?
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    init() {
        recognizer = SFSpeechRecognizer(locale: Locale.current)
    }

    func requestPermissions() async -> Bool {
        // Request speech recognition
        let speechStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }

        // Request microphone
        let micStatus = await AVAudioApplication.requestRecordPermission()

        return speechStatus && micStatus
    }

    func startRecording() async throws {
        guard let recognizer, recognizer.isAvailable else {
            throw SpeechError.recognizerUnavailable
        }

        // Configure audio session
        let audioSession = AVAudioSession.sharedInstance()
        try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
        try audioSession.setActive(true, options: .notifyOthersOnDeactivation)

        // Create recognition request
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else { throw SpeechError.requestCreationFailed }
        recognitionRequest.shouldReportPartialResults = true

        // Setup audio engine
        audioEngine = AVAudioEngine()
        guard let audioEngine else { throw SpeechError.audioEngineUnavailable }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { buffer, _ in
            self.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        isRecording = true
        transcribedText = ""

        // Start recognition
        recognitionTask = recognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self else { return }

            if let result {
                Task { @MainActor in
                    self.transcribedText = result.bestTranscription.formattedString
                }
            }

            if error != nil || result?.isFinal == true {
                Task { @MainActor in
                    self.stopRecording()
                }
            }
        }
    }

    func stopRecording() {
        audioEngine?.stop()
        audioEngine?.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()

        recognitionRequest = nil
        recognitionTask = nil
        audioEngine = nil
        isRecording = false
    }
}

enum SpeechError: Error {
    case recognizerUnavailable
    case requestCreationFailed
    case audioEngineUnavailable
    case permissionDenied
}
```

### Anti-Patterns to Avoid

- **Blocking main thread for SSE parsing:** Always process SSE events asynchronously
- **Not handling partial JSON in tool inputs:** Wait for complete events before parsing
- **Scroll jumping on every character:** Batch scroll updates, use debouncing
- **Starting speech without permissions:** Always check/request before recording
- **Not stopping audio engine:** Memory leak if not properly stopped on cancel

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| SSE parsing | Custom regex/string parsing | URLSession.bytes.lines + JSON decode | Lines API handles buffering |
| Shimmer animation | Custom CALayer animation | SwiftUI-Shimmer or redacted modifier | Edge cases with dark mode, accessibility |
| Auto-scroll detection | Manual geometry tracking | .onScrollGeometryChange (iOS 18+) or geometry reader | Complex edge cases with content size |
| Speech permissions | Inline permission requests | Dedicated permission flow on first use | Better UX, less confusing |
| Focus management | UIKit responder chain hacks | @FocusState property wrapper | Native SwiftUI, cleaner code |

**Key insight:** iOS 17+ has mature SwiftUI APIs for most chat UI needs. Focus on composing existing APIs rather than building custom solutions.

## Common Pitfalls

### Pitfall 1: SSE Connection Drops Without Retry

**What goes wrong:** Stream ends unexpectedly, user sees no error, chat appears frozen
**Why it happens:** Network interruptions, server timeout, no reconnection logic
**How to avoid:**
- Detect unexpected stream end (no `done` event received)
- Show user-friendly error with retry button
- Consider exponential backoff for reconnection
**Warning signs:** Streams ending silently, empty responses

### Pitfall 2: Audio Session Conflicts

**What goes wrong:** Recording fails or other audio stops working
**Why it happens:** Audio session not properly configured or deactivated
**How to avoid:**
```swift
// Always use try/catch and proper cleanup
try audioSession.setCategory(.record, mode: .measurement, options: .duckOthers)
try audioSession.setActive(true, options: .notifyOthersOnDeactivation)
// On stop:
try? audioSession.setActive(false, options: .notifyOthersOnDeactivation)
```
**Warning signs:** Silent failures, other apps' audio affected

### Pitfall 3: Keyboard Jumping on TextField Focus

**What goes wrong:** Keyboard animates awkwardly, content jumps, scroll view bounces
**Why it happens:** SwiftUI keyboard avoidance conflicts with custom layouts
**How to avoid:**
- Use `.ignoresSafeArea(.keyboard)` on outer container if managing manually
- Keep input bar at bottom with consistent position
- Test with different keyboard types (emoji, voice, etc.)
**Warning signs:** Janky animations, content clipping

### Pitfall 4: Memory Leak from Uncancelled Speech Tasks

**What goes wrong:** Memory grows with each recording session
**Why it happens:** AVAudioEngine tap not removed, recognition task not cancelled
**How to avoid:**
```swift
func stopRecording() {
    audioEngine?.inputNode.removeTap(onBus: 0)  // Critical!
    audioEngine?.stop()
    recognitionRequest?.endAudio()
    recognitionTask?.cancel()
    // Reset all references
    audioEngine = nil
    recognitionRequest = nil
    recognitionTask = nil
}
```
**Warning signs:** Increasing memory usage, audio glitches

### Pitfall 5: Race Condition in Message Queue

**What goes wrong:** Messages sent out of order when user types during streaming
**Why it happens:** Async processing without proper ordering
**How to avoid:**
- Use explicit queue (array) for pending messages
- Process queue sequentially after current stream completes
- Disable send button during streaming OR clearly show queued state
**Warning signs:** Message order jumbled, duplicate sends

## Code Examples

### ChatEvent Model (Mirror Phase 8 SSE Format)
```swift
// Source: Phase 8 mobile-chat.ts SSE event types
// BusinessCommandCenter/Features/Chat/Models/ChatEvent.swift

/// SSE events from chat API - matches Phase 8 format exactly
enum ChatEvent: Decodable {
    case text(String)
    case toolUseStart(id: String, name: String)
    case toolUse(id: String, name: String, input: [String: AnyCodable])
    case toolResult(id: String, content: String)
    case done(stopReason: String)
    case error(message: String)

    enum CodingKeys: String, CodingKey {
        case type, content, id, name, input, stopReason = "stop_reason", message
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(String.self, forKey: .type)

        switch type {
        case "text":
            let content = try container.decode(String.self, forKey: .content)
            self = .text(content)
        case "tool_use_start":
            let id = try container.decode(String.self, forKey: .id)
            let name = try container.decode(String.self, forKey: .name)
            self = .toolUseStart(id: id, name: name)
        case "tool_use":
            let id = try container.decode(String.self, forKey: .id)
            let name = try container.decode(String.self, forKey: .name)
            let input = try container.decode([String: AnyCodable].self, forKey: .input)
            self = .toolUse(id: id, name: name, input: input)
        case "tool_result":
            let id = try container.decode(String.self, forKey: .id)
            let content = try container.decode(String.self, forKey: .content)
            self = .toolResult(id: id, content: content)
        case "done":
            let stopReason = try container.decode(String.self, forKey: .stopReason)
            self = .done(stopReason: stopReason)
        case "error":
            let message = try container.decode(String.self, forKey: .message)
            self = .error(message: message)
        default:
            throw DecodingError.dataCorrupted(
                DecodingError.Context(codingPath: [], debugDescription: "Unknown event type: \(type)")
            )
        }
    }
}
```

### Floating Capsule Input Bar
```swift
// Source: Context decisions - "floating capsule input area"
// BusinessCommandCenter/Features/Chat/Components/ChatInputBar.swift

struct ChatInputBar: View {
    @Binding var text: String
    @FocusState.Binding var isKeyboardFocused: Bool
    let isRecording: Bool
    let onSend: () -> Void
    let onMicTap: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Text field (hidden by default, keyboard is secondary)
            if isKeyboardFocused || !text.isEmpty {
                TextField("Message...", text: $text, axis: .vertical)
                    .textFieldStyle(.plain)
                    .lineLimit(1...4)
                    .focused($isKeyboardFocused)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 10)
                    .background(Color(.systemGray6))
                    .clipShape(Capsule())
            }

            // Mic button (always visible, prominent)
            Button(action: onMicTap) {
                ZStack {
                    Circle()
                        .fill(isRecording ? Color.red : Color.accentColor)
                        .frame(width: 52, height: 52)

                    Image(systemName: isRecording ? "stop.fill" : "mic.fill")
                        .font(.title2)
                        .foregroundStyle(.white)
                }
            }
            .animation(.easeInOut(duration: 0.2), value: isRecording)

            // Send button (only when text is not empty)
            if !text.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                Button(action: onSend) {
                    Image(systemName: "arrow.up.circle.fill")
                        .font(.title)
                        .foregroundStyle(.accentColor)
                }
                .transition(.scale.combined(with: .opacity))
            }
        }
        .padding(.horizontal)
        .padding(.vertical, 8)
        .background(.ultraThinMaterial)
        .animation(.easeInOut(duration: 0.2), value: text.isEmpty)
    }
}
```

### Ethereal Recording Indicator
```swift
// Source: Context decisions - "ethereal, pulsing, moving visual"
// BusinessCommandCenter/Features/Chat/Components/RecordingIndicator.swift

struct RecordingIndicator: View {
    @State private var scale: CGFloat = 1.0
    @State private var opacity: Double = 0.6
    @State private var rotation: Double = 0

    var body: some View {
        ZStack {
            // Outer glow layers
            ForEach(0..<3) { i in
                Circle()
                    .fill(
                        RadialGradient(
                            gradient: Gradient(colors: [
                                Color.accentColor.opacity(0.4),
                                Color.accentColor.opacity(0)
                            ]),
                            center: .center,
                            startRadius: 20,
                            endRadius: 80
                        )
                    )
                    .frame(width: 160, height: 160)
                    .scaleEffect(scale + CGFloat(i) * 0.1)
                    .opacity(opacity - Double(i) * 0.15)
                    .rotationEffect(.degrees(rotation + Double(i * 120)))
            }

            // Center mic icon
            Image(systemName: "mic.fill")
                .font(.system(size: 32))
                .foregroundStyle(.white)
        }
        .onAppear {
            withAnimation(
                .easeInOut(duration: 2.0)
                .repeatForever(autoreverses: true)
            ) {
                scale = 1.15
                opacity = 0.8
            }
            withAnimation(
                .linear(duration: 8.0)
                .repeatForever(autoreverses: false)
            ) {
                rotation = 360
            }
        }
    }
}
```

### Skeleton Shimmer Bubble
```swift
// Source: Context decisions - "skeleton shimmer while waiting"
// BusinessCommandCenter/Features/Chat/Components/SkeletonBubble.swift

struct SkeletonBubble: View {
    @State private var shimmerOffset: CGFloat = -200

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // AI Avatar placeholder
            Circle()
                .fill(Color(.systemGray5))
                .frame(width: 36, height: 36)

            // Skeleton lines
            VStack(alignment: .leading, spacing: 8) {
                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemGray5))
                    .frame(width: 200, height: 12)

                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemGray5))
                    .frame(width: 160, height: 12)

                RoundedRectangle(cornerRadius: 4)
                    .fill(Color(.systemGray5))
                    .frame(width: 120, height: 12)
            }
            .padding(12)
            .background(Color(.systemGray6))
            .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
            .overlay {
                // Shimmer effect
                RoundedRectangle(cornerRadius: Constants.UI.cornerRadius)
                    .fill(
                        LinearGradient(
                            colors: [
                                .clear,
                                .white.opacity(0.4),
                                .clear
                            ],
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .offset(x: shimmerOffset)
                    .mask(
                        RoundedRectangle(cornerRadius: Constants.UI.cornerRadius)
                    )
            }

            Spacer()
        }
        .onAppear {
            withAnimation(
                .linear(duration: 1.5)
                .repeatForever(autoreverses: false)
            ) {
                shimmerOffset = 300
            }
        }
    }
}
```

### Confirmation Bubble
```swift
// Source: Context decisions - "inline in chat... full preview... context-specific button labels"
// BusinessCommandCenter/Features/Chat/Components/ConfirmationBubble.swift

struct ConfirmationBubble: View {
    let action: ConfirmationAction
    let onApprove: () -> Void
    let onReject: () -> Void

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // AI Avatar
            AIAvatarView()

            VStack(alignment: .leading, spacing: 12) {
                // Action description
                Text(action.description)
                    .font(.subheadline)

                // Details preview
                if let details = action.details {
                    VStack(alignment: .leading, spacing: 4) {
                        ForEach(details, id: \.key) { detail in
                            HStack {
                                Text(detail.key + ":")
                                    .foregroundStyle(.secondary)
                                Text(detail.value)
                            }
                            .font(.caption)
                        }
                    }
                    .padding(8)
                    .background(Color(.systemGray6))
                    .clipShape(RoundedRectangle(cornerRadius: 8))
                }

                // Action buttons
                HStack(spacing: 12) {
                    Button("Cancel", action: onReject)
                        .buttonStyle(.bordered)

                    Button(action.confirmLabel, action: onApprove)
                        .buttonStyle(.borderedProminent)
                        .tint(action.isDestructive ? .red : .accentColor)
                }
            }
            .padding()
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
            .shadow(color: .black.opacity(0.1), radius: 4, y: 2)

            Spacer()
        }
    }
}

struct ConfirmationAction: Identifiable {
    let id = UUID()
    let description: String
    let confirmLabel: String
    let isDestructive: Bool
    let details: [KeyValuePair]?
    let toolId: String

    struct KeyValuePair: Hashable {
        let key: String
        let value: String
    }
}
```

## iOS 17 Specific Features

| Feature | iOS Version | Use In This Phase |
|---------|-------------|-------------------|
| `@Observable` macro | iOS 17+ | AppState (already using) |
| `.onScrollGeometryChange` | iOS 18+ | Use GeometryReader fallback for iOS 17 |
| TextRenderer API | iOS 18+ | Not available - use opacity animation instead |
| SpeechAnalyzer | iOS 26+ | Not available - use SFSpeechRecognizer |
| `defaultScrollAnchor` | iOS 17+ | Available - use for initial scroll position |

**iOS 17 Compatibility Notes:**
- Use `.scrollPosition(id:)` for scroll tracking (iOS 17+)
- Use `@FocusState` for keyboard control (iOS 15+)
- `.scrollDismissesKeyboard()` available in iOS 16+

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| UIScrollView hacks for chat | ScrollViewReader + LazyVStack | iOS 14+ | Native SwiftUI, less code |
| Character-by-character typing | Chunk-based opacity fade | 2024 | Better performance, less CPU |
| UITextView for multi-line input | TextField with axis: .vertical | iOS 16+ | Native SwiftUI |
| Manual keyboard offset calc | Built-in keyboard avoidance | iOS 14+ | Automatic, reliable |
| AVAudioSession for all audio | AVAudioApplication (iOS 17+) | iOS 17 | Simpler permission API |

**Deprecated/outdated:**
- `onCommit` for TextField: Use `onSubmit` instead (iOS 15+)
- Manual keyboard notification observers: Built-in avoidance is sufficient
- SFTranscriptionSegment-level analysis: Use full transcription for simplicity

## Required Info.plist Entries

```xml
<!-- Speech Recognition -->
<key>NSSpeechRecognitionUsageDescription</key>
<string>Voice commands require speech recognition to understand what you say.</string>

<!-- Microphone Access -->
<key>NSMicrophoneUsageDescription</key>
<string>Microphone access is needed to record your voice commands.</string>
```

## Open Questions

Things that couldn't be fully resolved:

1. **Wispr Flow-style intelligent transcription**
   - What we know: User wants intent interpretation, not literal transcription
   - What's unclear: Requires LLM post-processing of transcription, which adds latency
   - Recommendation: Phase 9 implements basic transcription; add AI post-processing as enhancement. Could send transcription to Claude for "cleaning" before displaying.

2. **Exact animation timing for fade-in chunks**
   - What we know: User wants "smooth fade" as tokens arrive
   - What's unclear: How many tokens to batch, exact duration
   - Recommendation: Start with 0.15s fade per chunk, 3-5 tokens per batch. Adjust based on feel.

3. **Confirmation for tool_use vs tool_result**
   - What we know: High-risk actions need confirmation before executing
   - What's unclear: Whether Phase 8 API returns confirmation request or if UI infers from tool name
   - Recommendation: Check for `requires_confirmation` flag in tool_use input; if not present, infer from tool name (trigger_workflow = confirm)

## Sources

### Primary (HIGH confidence)
- [Apple URLSession.bytes](https://developer.apple.com/videos/play/wwdc2021/10095/) - WWDC21 async/await URLSession
- [EventSource Swift Library](https://github.com/mattt/EventSource) - SSE parsing reference
- [Apple SFSpeechRecognizer](https://developer.apple.com/documentation/speech/asking-permission-to-use-speech-recognition) - Speech permissions
- Phase 8 mobile-chat.ts - SSE event format (codebase)
- Phase 7 HomeViewModel.swift - ViewModel pattern (codebase)

### Secondary (MEDIUM confidence)
- [SwiftUI Shimmer Library](https://github.com/markiv/SwiftUI-Shimmer) - Shimmer implementation
- [Streaming ChatGPT with AsyncSequence](https://zachwaugh.com/posts/streaming-messages-chatgpt-swift-asyncsequence) - SSE pattern
- [SwiftUI TextField Focus](https://fatbobman.com/en/posts/textfield-event-focus-keyboard/) - Keyboard handling
- [ScrollViewReader Auto-scroll](https://medium.com/@mikeusru/auto-scrolling-with-scrollviewreader-in-swiftui-10f16dbb/) - Scroll patterns

### Tertiary (LOW confidence - needs validation)
- Recording indicator animations - Based on community patterns, test visual feel
- AI glow effect patterns - May need adjustment for desired "ethereal" feel

## Metadata

**Confidence breakdown:**
- SSE consumption: HIGH - Well-documented, Phase 8 tested API
- Chat UI patterns: HIGH - Established SwiftUI patterns
- Speech recognition: HIGH - Apple framework, stable API
- Animations: MEDIUM - May need tuning for exact feel
- Wispr-style transcription: LOW - Requires additional AI processing

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable iOS APIs)
