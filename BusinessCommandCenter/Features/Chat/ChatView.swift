import SwiftUI

/// Main chat interface for conversing with the AI assistant.
/// Layout uses ScrollViewReader for programmatic scrolling, LazyVStack for efficient rendering,
/// and iOS 17+ APIs for smooth keyboard handling and scroll anchoring.
/// Note: This creates the static layout - wiring to ViewModel happens in Plan 04.
struct ChatView: View {
    // Temporary static state for layout testing - will be replaced with ViewModel in Plan 04
    @State private var messageText = ""
    @FocusState private var isKeyboardFocused: Bool
    @State private var isRecording = false

    // Sample messages for layout preview
    private let sampleMessages: [ChatMessage] = [
        ChatMessage(role: .assistant, content: "Hello! I'm your Business OS assistant. How can I help you today?"),
        ChatMessage(role: .user, content: "What's the current system health?"),
        ChatMessage(role: .assistant, content: "The system health is currently at 94%. All workflows are running normally, and there are 2 minor alerts that need your attention."),
    ]

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Message list
                ScrollViewReader { proxy in
                    ScrollView {
                        LazyVStack(spacing: 12) {
                            ForEach(sampleMessages) { message in
                                MessageBubble(message: message)
                                    .id(message.id)
                            }

                            // Skeleton placeholder (shown when waiting)
                            // Uncomment to preview:
                            // SkeletonBubble()
                            //     .id("skeleton")

                            // Streaming message (shown during response)
                            // Uncomment to preview:
                            // StreamingBubble(text: "This is streaming...")
                            //     .id("streaming")

                            // Invisible anchor at bottom for scrolling
                            Color.clear
                                .frame(height: 1)
                                .id("bottom")
                        }
                        .padding()
                    }
                    .scrollDismissesKeyboard(.interactively)
                    .defaultScrollAnchor(.bottom)
                }

                // Input bar
                ChatInputBar(
                    text: $messageText,
                    isKeyboardFocused: $isKeyboardFocused,
                    isRecording: isRecording,
                    isStreaming: false,
                    onSend: {
                        // Will be wired to ViewModel in Plan 04
                        print("Send: \(messageText)")
                        messageText = ""
                    },
                    onMicTap: {
                        // Will be wired to SpeechService in Plan 05
                        isRecording.toggle()
                        HapticManager.shared.button()
                    }
                )
            }
            .navigationTitle("Chat")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        // Clear conversation - will be wired in Plan 04
                        HapticManager.shared.tap()
                    } label: {
                        Image(systemName: "trash")
                    }
                }
            }
        }
    }
}

#Preview {
    ChatView()
}
