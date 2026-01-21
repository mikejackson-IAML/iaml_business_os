import Foundation

/// Network-related errors with user-friendly descriptions.
enum NetworkError: Error, LocalizedError {
    case unauthorized          // 401 - Invalid or missing API key
    case invalidResponse       // Non-HTTP response
    case serverError(Int)      // 500-599 status codes
    case clientError(Int)      // 400-499 (except 401)
    case noAPIKey              // API key not found in Keychain
    case decodingFailed(Error) // JSON decoding error
    case networkUnavailable    // No internet connection
    case requestFailed(Error)  // URLSession error

    var errorDescription: String? {
        switch self {
        case .unauthorized:
            return "Invalid API key. Please check your settings."
        case .invalidResponse:
            return "Received an invalid response from the server."
        case .serverError(let code):
            return "Server error (\(code)). Please try again later."
        case .clientError(let code):
            return "Request error (\(code))."
        case .noAPIKey:
            return "API key not configured. Please add your API key in Settings."
        case .decodingFailed:
            return "Failed to process server response."
        case .networkUnavailable:
            return "No internet connection. Please check your network."
        case .requestFailed(let error):
            return "Network request failed: \(error.localizedDescription)"
        }
    }

    /// Whether this error should prompt the user to check Settings
    var shouldShowSettings: Bool {
        switch self {
        case .unauthorized, .noAPIKey:
            return true
        default:
            return false
        }
    }

    /// User-friendly message for display in UI
    var userMessage: String {
        switch self {
        case .noAPIKey:
            return "API key not configured. Please add it in Settings."
        case .unauthorized:
            return "Authentication failed. Please check your API key."
        case .networkUnavailable:
            return "No internet connection."
        case .serverError:
            return "Server error. Please try again."
        case .clientError(let code):
            return "Request failed (error \(code))."
        case .invalidResponse:
            return "Invalid response from server."
        case .decodingFailed:
            return "Could not read server response."
        case .requestFailed:
            return "Request failed. Please try again."
        }
    }
}
