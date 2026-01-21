import Foundation

// MARK: - Chat Service

/// Manages chat communication with the mobile API.
/// Uses actor for thread-safe streaming operations.
actor ChatService {
    static let shared = ChatService()

    private let session = URLSession.shared
    private let encoder = JSONEncoder()

    private init() {}

    // MARK: - Streaming Chat

    /// Streams chat response from the API as SSE events.
    /// - Parameters:
    ///   - messages: Conversation history to send
    ///   - apiKey: Mobile API key from Keychain
    /// - Returns: AsyncThrowingStream of ChatEvent for consumption
    func streamChat(
        messages: [ChatMessage],
        apiKey: String
    ) -> AsyncThrowingStream<ChatEvent, Error> {
        AsyncThrowingStream { continuation in
            Task {
                do {
                    try await performStreamRequest(
                        messages: messages,
                        apiKey: apiKey,
                        continuation: continuation
                    )
                } catch {
                    continuation.finish(throwing: error)
                }
            }
        }
    }

    // MARK: - Private Implementation

    /// Performs the actual streaming request.
    private func performStreamRequest(
        messages: [ChatMessage],
        apiKey: String,
        continuation: AsyncThrowingStream<ChatEvent, Error>.Continuation
    ) async throws {
        // Build request URL
        guard let url = URL(string: Constants.API.baseURL)?.appendingPathComponent("chat") else {
            throw ChatServiceError.invalidURL
        }

        // Build request
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        request.timeoutInterval = Constants.API.timeout

        // Encode request body
        let chatRequest = ChatRequest(
            messages: messages.map { $0.toAPIMessage() }
        )
        request.httpBody = try encoder.encode(chatRequest)

        // Perform streaming request
        let (bytes, response): (URLSession.AsyncBytes, URLResponse)

        do {
            (bytes, response) = try await session.bytes(for: request)
        } catch let error as URLError {
            if error.code == .notConnectedToInternet || error.code == .networkConnectionLost {
                throw ChatServiceError.networkUnavailable
            }
            throw ChatServiceError.requestFailed(error)
        } catch {
            throw ChatServiceError.requestFailed(error)
        }

        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw ChatServiceError.invalidResponse
        }

        // Check status code
        guard (200...299).contains(httpResponse.statusCode) else {
            switch httpResponse.statusCode {
            case 401:
                throw ChatServiceError.unauthorized
            case 400...499:
                throw ChatServiceError.clientError(httpResponse.statusCode)
            case 500...599:
                throw ChatServiceError.serverError(httpResponse.statusCode)
            default:
                throw ChatServiceError.clientError(httpResponse.statusCode)
            }
        }

        // Process SSE stream
        for try await line in bytes.lines {
            // Skip empty lines and non-data lines
            guard !line.isEmpty else { continue }

            // Parse SSE data line
            if let event = try ChatEvent.parse(from: line) {
                continuation.yield(event)

                // Finish stream on done or error events
                switch event {
                case .done, .error:
                    continuation.finish()
                    return
                default:
                    break
                }
            }
        }

        // Stream ended without done event
        continuation.finish()
    }
}

// MARK: - Request Types

/// Request body for chat API.
private struct ChatRequest: Encodable {
    let messages: [[String: String]]
}

// MARK: - Error Types

/// Errors that can occur during chat operations.
enum ChatServiceError: LocalizedError {
    case invalidURL
    case invalidResponse
    case networkUnavailable
    case unauthorized
    case clientError(Int)
    case serverError(Int)
    case requestFailed(Error)
    case streamEnded

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid API URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .networkUnavailable:
            return "No internet connection"
        case .unauthorized:
            return "Authentication failed"
        case .clientError(let code):
            return "Request error (code \(code))"
        case .serverError(let code):
            return "Server error (code \(code))"
        case .requestFailed(let error):
            return "Request failed: \(error.localizedDescription)"
        case .streamEnded:
            return "Connection closed unexpectedly"
        }
    }

    /// User-friendly message suitable for display.
    var userMessage: String {
        switch self {
        case .networkUnavailable:
            return "Please check your internet connection and try again."
        case .unauthorized:
            return "Please re-enter your API key in Settings."
        case .serverError:
            return "The server is temporarily unavailable. Please try again later."
        default:
            return "Something went wrong. Please try again."
        }
    }
}
