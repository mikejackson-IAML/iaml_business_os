import Foundation

// MARK: - Chat Event

/// SSE events streamed from the /api/mobile/chat endpoint.
/// Matches the event types defined in Phase 8 (mobile-chat.ts).
enum ChatEvent {
    /// Text content streaming
    case text(String)

    /// Tool call starting (announces tool before input is complete)
    case toolUseStart(id: String, name: String)

    /// Tool call complete with input
    case toolUse(id: String, name: String, input: [String: AnyCodable])

    /// Tool execution result
    case toolResult(id: String, content: String)

    /// Message complete
    case done(stopReason: String)

    /// Error occurred
    case error(message: String)
}

// MARK: - Decodable

extension ChatEvent: Decodable {
    private enum EventType: String, Decodable {
        case text
        case toolUseStart = "tool_use_start"
        case toolUse = "tool_use"
        case toolResult = "tool_result"
        case done
        case error
    }

    private enum CodingKeys: String, CodingKey {
        case type
        case content
        case id
        case name
        case input
        case stopReason = "stop_reason"
        case message
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let type = try container.decode(EventType.self, forKey: .type)

        switch type {
        case .text:
            let content = try container.decode(String.self, forKey: .content)
            self = .text(content)

        case .toolUseStart:
            let id = try container.decode(String.self, forKey: .id)
            let name = try container.decode(String.self, forKey: .name)
            self = .toolUseStart(id: id, name: name)

        case .toolUse:
            let id = try container.decode(String.self, forKey: .id)
            let name = try container.decode(String.self, forKey: .name)
            let input = try container.decode([String: AnyCodable].self, forKey: .input)
            self = .toolUse(id: id, name: name, input: input)

        case .toolResult:
            let id = try container.decode(String.self, forKey: .id)
            let content = try container.decode(String.self, forKey: .content)
            self = .toolResult(id: id, content: content)

        case .done:
            let stopReason = try container.decode(String.self, forKey: .stopReason)
            self = .done(stopReason: stopReason)

        case .error:
            let message = try container.decode(String.self, forKey: .message)
            self = .error(message: message)
        }
    }
}

// MARK: - Encodable

extension ChatEvent: Encodable {
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)

        switch self {
        case .text(let content):
            try container.encode("text", forKey: .type)
            try container.encode(content, forKey: .content)

        case .toolUseStart(let id, let name):
            try container.encode("tool_use_start", forKey: .type)
            try container.encode(id, forKey: .id)
            try container.encode(name, forKey: .name)

        case .toolUse(let id, let name, let input):
            try container.encode("tool_use", forKey: .type)
            try container.encode(id, forKey: .id)
            try container.encode(name, forKey: .name)
            try container.encode(input, forKey: .input)

        case .toolResult(let id, let content):
            try container.encode("tool_result", forKey: .type)
            try container.encode(id, forKey: .id)
            try container.encode(content, forKey: .content)

        case .done(let stopReason):
            try container.encode("done", forKey: .type)
            try container.encode(stopReason, forKey: .stopReason)

        case .error(let message):
            try container.encode("error", forKey: .type)
            try container.encode(message, forKey: .message)
        }
    }
}

// MARK: - Parsing Helper

extension ChatEvent {
    /// Parses a single SSE data line into a ChatEvent.
    /// Expected format: `data: {"type": "text", "content": "Hello"}`
    /// - Parameter line: Raw SSE line from stream
    /// - Returns: Parsed ChatEvent, or nil if line is not a data line
    static func parse(from line: String) throws -> ChatEvent? {
        // SSE format: lines starting with "data: " contain JSON payload
        guard line.hasPrefix("data: ") else {
            return nil
        }

        // Extract JSON after "data: " prefix
        let jsonString = String(line.dropFirst(6))

        // Handle empty data lines
        guard !jsonString.isEmpty else {
            return nil
        }

        // Parse JSON into ChatEvent
        guard let data = jsonString.data(using: .utf8) else {
            throw ChatEventError.invalidData
        }

        return try JSONDecoder().decode(ChatEvent.self, from: data)
    }
}

// MARK: - Error Types

enum ChatEventError: LocalizedError {
    case invalidData
    case decodingFailed(Error)

    var errorDescription: String? {
        switch self {
        case .invalidData:
            return "Invalid SSE data format"
        case .decodingFailed(let error):
            return "Failed to decode chat event: \(error.localizedDescription)"
        }
    }
}
