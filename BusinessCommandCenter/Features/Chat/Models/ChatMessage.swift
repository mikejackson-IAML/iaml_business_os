import Foundation

// MARK: - Chat Message

/// Represents a single message in the chat conversation.
/// Used for conversation history and API requests.
struct ChatMessage: Identifiable, Codable {
    let id: UUID
    let role: Role
    let content: String
    let timestamp: Date

    /// Role of the message sender.
    enum Role: String, Codable {
        case user
        case assistant
    }

    // MARK: - Initialization

    /// Creates a new chat message.
    /// - Parameters:
    ///   - id: Unique identifier (auto-generated)
    ///   - role: Message sender role (user or assistant)
    ///   - content: Text content of the message
    ///   - timestamp: When the message was created (defaults to now)
    init(id: UUID = UUID(), role: Role, content: String, timestamp: Date = Date()) {
        self.id = id
        self.role = role
        self.content = content
        self.timestamp = timestamp
    }

    // MARK: - API Conversion

    /// Converts the message to API request format.
    /// The API expects `{"role": "user", "content": "..."}` format.
    /// - Returns: Dictionary suitable for JSON encoding in API request
    func toAPIMessage() -> [String: String] {
        return [
            "role": role.rawValue,
            "content": content
        ]
    }
}

// MARK: - Convenience Initializers

extension ChatMessage {
    /// Creates a user message with the given content.
    /// - Parameter content: The user's message text
    /// - Returns: A new ChatMessage with user role
    static func user(_ content: String) -> ChatMessage {
        ChatMessage(role: .user, content: content)
    }

    /// Creates an assistant message with the given content.
    /// - Parameter content: The assistant's response text
    /// - Returns: A new ChatMessage with assistant role
    static func assistant(_ content: String) -> ChatMessage {
        ChatMessage(role: .assistant, content: content)
    }
}
