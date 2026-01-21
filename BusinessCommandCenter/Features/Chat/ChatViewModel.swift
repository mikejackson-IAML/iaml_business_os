import Foundation
import LocalAuthentication

// MARK: - Chat View Model

/// Manages chat conversation state and streaming for ChatView.
/// Follows MVVM pattern established in Phase 7 (HomeViewModel).
@MainActor
final class ChatViewModel: ObservableObject {
    // MARK: - Published State

    /// Conversation history
    @Published private(set) var messages: [ChatMessage] = []

    /// Current streaming text from assistant (accumulates until complete)
    @Published private(set) var currentStreamingText: String = ""

    /// Whether we're currently receiving a streaming response
    @Published private(set) var isStreaming = false

    /// Whether we're waiting for the first token (shows typing indicator)
    @Published private(set) var isWaitingForResponse = false

    /// Action awaiting user confirmation (high-risk operations)
    @Published private(set) var pendingConfirmation: ConfirmationAction? = nil

    /// Current error state
    @Published private(set) var error: NetworkError?

    // MARK: - Private State

    /// Messages queued while streaming (allows typing during response)
    private var pendingMessages: [String] = []

    /// Chat service for API communication
    private let chatService = ChatService.shared

    // MARK: - Computed Properties

    /// Whether to show error UI (not during streaming)
    var showError: Bool { error != nil && !isStreaming }

    /// Whether the send button should be enabled
    var canSend: Bool { !isStreaming || pendingMessages.count < 3 }

    // MARK: - Public Methods

    /// Sends a message to the chat API and streams the response.
    /// - Parameters:
    ///   - text: The message text to send
    ///   - context: LAContext for Keychain access
    func sendMessage(_ text: String, context: LAContext) async {
        let trimmedText = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmedText.isEmpty else { return }

        // If currently streaming, queue the message
        if isStreaming {
            pendingMessages.append(trimmedText)
            return
        }

        // Add user message to conversation
        messages.append(.user(trimmedText))

        // Set streaming state
        isStreaming = true
        isWaitingForResponse = true
        currentStreamingText = ""
        error = nil

        // Get API key from Keychain
        let apiKey: String
        do {
            guard let key = try KeychainManager.shared.getAPIKey(context: context) else {
                self.error = .noAPIKey
                isStreaming = false
                isWaitingForResponse = false
                return
            }
            apiKey = key
        } catch {
            self.error = .requestFailed(error)
            isStreaming = false
            isWaitingForResponse = false
            return
        }

        // Stream response from API
        do {
            for try await event in chatService.streamChat(messages: messages, apiKey: apiKey) {
                handleEvent(event)
            }
        } catch {
            // Map ChatServiceError to NetworkError for consistent UI handling
            if let chatError = error as? ChatServiceError {
                self.error = mapChatServiceError(chatError)
            } else {
                self.error = .requestFailed(error)
            }
        }

        // Finalize streaming
        finalizeStreaming()
    }

    /// Clears the current error state.
    func clearError() {
        error = nil
    }

    /// Clears the entire conversation.
    func clearConversation() {
        messages.removeAll()
        currentStreamingText = ""
        pendingConfirmation = nil
        error = nil
    }

    /// Approves a pending confirmation action.
    /// Note: Full implementation will be in Plan 06 with API changes.
    func approveConfirmation() async {
        // Will be implemented in Plan 06 with server-side confirmation support
        pendingConfirmation = nil
    }

    /// Rejects a pending confirmation action.
    func rejectConfirmation() {
        pendingConfirmation = nil
        // Add a message indicating the action was cancelled
        messages.append(.assistant("Action cancelled."))
    }

    // MARK: - Private Methods

    /// Handles a single SSE event from the stream.
    private func handleEvent(_ event: ChatEvent) {
        switch event {
        case .text(let content):
            // Received text content - no longer waiting
            isWaitingForResponse = false
            currentStreamingText += content

        case .toolUseStart(let id, let name):
            // Tool call starting - track for display
            // Currently just used to show "thinking" state
            _ = (id, name)

        case .toolUse(let id, let name, let input):
            // Tool call complete with input
            // Check if this is a high-risk action requiring confirmation
            if name == "trigger_workflow" {
                // Extract workflow info from input for confirmation dialog
                let workflowId = (input["workflow_id"]?.value as? String) ?? "Unknown"
                let description = (input["description"]?.value as? String)
                    ?? "Trigger workflow \(workflowId)"

                pendingConfirmation = ConfirmationAction(
                    toolId: id,
                    toolName: name,
                    description: description,
                    confirmLabel: "Run Workflow",
                    isDestructive: false,
                    details: [
                        ConfirmationAction.Detail(key: "Workflow ID", value: workflowId)
                    ]
                )
            }

        case .toolResult(let id, let content):
            // Tool execution result - could update UI to show result
            _ = (id, content)

        case .done(let stopReason):
            // Stream complete
            _ = stopReason

        case .error(let message):
            // Server-side error
            self.error = .serverError(500)
            _ = message
        }
    }

    /// Finalizes streaming state and processes queued messages.
    private func finalizeStreaming() {
        // If we have streaming text, add it as assistant message
        if !currentStreamingText.isEmpty {
            messages.append(.assistant(currentStreamingText))
        }

        // Reset streaming state
        isStreaming = false
        isWaitingForResponse = false
        currentStreamingText = ""

        // Process next queued message if any
        if !pendingMessages.isEmpty {
            let nextMessage = pendingMessages.removeFirst()
            // Note: We can't call sendMessage directly here due to async context
            // The view will need to handle this via a task
            Task { [weak self] in
                // This requires a fresh context - the view will need to handle re-auth
                // For now, we just store the message back; view observes pendingMessages
                self?.pendingMessages.insert(nextMessage, at: 0)
            }
        }
    }

    /// Maps ChatServiceError to NetworkError for consistent UI handling.
    private func mapChatServiceError(_ error: ChatServiceError) -> NetworkError {
        switch error {
        case .networkUnavailable:
            return .networkUnavailable
        case .unauthorized:
            return .unauthorized
        case .clientError(let code):
            return .clientError(code)
        case .serverError(let code):
            return .serverError(code)
        case .requestFailed(let underlying):
            return .requestFailed(underlying)
        default:
            return .serverError(500)
        }
    }
}

// MARK: - Pending Message Access

extension ChatViewModel {
    /// Whether there are pending messages queued during streaming.
    var hasPendingMessages: Bool {
        !pendingMessages.isEmpty
    }

    /// Gets and removes the next pending message (for view to re-send with fresh context).
    func popPendingMessage() -> String? {
        pendingMessages.isEmpty ? nil : pendingMessages.removeFirst()
    }
}

// MARK: - Confirmation Action

/// Represents a high-risk action awaiting user confirmation.
struct ConfirmationAction: Identifiable {
    let id = UUID()
    let toolId: String
    let toolName: String
    let description: String
    let confirmLabel: String
    let isDestructive: Bool
    let details: [Detail]

    /// Key-value detail for display in confirmation dialog.
    struct Detail: Hashable {
        let key: String
        let value: String
    }
}
