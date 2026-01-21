import SwiftUI

/// Main chat interface for conversing with the AI assistant.
/// Wired to ChatViewModel for real-time streaming responses.
/// Uses ScrollViewReader for programmatic scrolling with smart auto-scroll behavior.
struct ChatView: View {
    @Environment(AppState.self) private var appState
    @StateObject private var viewModel = ChatViewModel()

    @State private var messageText = ""
    @FocusState private var isKeyboardFocused: Bool
    @State private var isNearBottom = true

    // For voice (Plan 05)
    @State private var isRecording = false

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                messageList
                inputBar
            }
            .navigationTitle("Chat")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        HapticManager.shared.tap()
                        viewModel.clearConversation()
                    } label: {
                        Image(systemName: "trash")
                    }
                    .disabled(viewModel.messages.isEmpty && viewModel.currentStreamingText.isEmpty)
                }
            }
            .alert("Error", isPresented: .constant(viewModel.showError)) {
                Button("Retry") {
                    viewModel.clearError()
                    // User can manually retry their last message
                }
                Button("OK", role: .cancel) {
                    viewModel.clearError()
                }
            } message: {
                Text(viewModel.error?.userMessage ?? "Something went wrong")
            }
        }
    }

    // MARK: - Message List

    private var messageList: some View {
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

                    // Skeleton placeholder (if waiting for first token)
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
            .scrollDismissesKeyboard(.interactively)
            .defaultScrollAnchor(.bottom)
            // Auto-scroll on streaming text change
            .onChange(of: viewModel.currentStreamingText) { _, _ in
                // Always auto-scroll during streaming (iOS 17 compatible)
                withAnimation(.easeOut(duration: 0.1)) {
                    proxy.scrollTo("streaming", anchor: .bottom)
                }
            }
            // Auto-scroll when new message added
            .onChange(of: viewModel.messages.count) { _, _ in
                withAnimation(.easeOut(duration: 0.2)) {
                    proxy.scrollTo("bottom", anchor: .bottom)
                }
            }
            // Scroll to skeleton when waiting starts
            .onChange(of: viewModel.isWaitingForResponse) { _, isWaiting in
                if isWaiting {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo("skeleton", anchor: .bottom)
                    }
                }
            }
        }
    }

    // MARK: - Input Bar

    private var inputBar: some View {
        ChatInputBar(
            text: $messageText,
            isKeyboardFocused: $isKeyboardFocused,
            isRecording: isRecording,
            isStreaming: viewModel.isStreaming,
            onSend: sendMessage,
            onMicTap: {
                // Will be implemented in Plan 05
                isRecording.toggle()
                HapticManager.shared.button()
            }
        )
    }

    // MARK: - Actions

    private func sendMessage() {
        let text = messageText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        messageText = ""
        isKeyboardFocused = false
        HapticManager.shared.tap()

        // Get auth context from AppState
        guard let context = appState.authContext else {
            // User not authenticated - shouldn't happen if app flow is correct
            return
        }

        Task {
            await viewModel.sendMessage(text, context: context)
        }
    }
}

#Preview {
    ChatView()
        .environment(AppState())
}
