import Foundation
import LocalAuthentication

/// Manages all network requests for the app.
/// Uses actor for thread-safe network operations.
actor NetworkManager {
    static let shared = NetworkManager()

    private let session = URLSession.shared
    private let decoder: JSONDecoder = {
        let decoder = JSONDecoder()
        // API uses camelCase which is default
        return decoder
    }()

    private init() {}

    // MARK: - Health

    /// Fetches health data from the API.
    /// - Parameter context: LAContext for Keychain access (from AppState after auth)
    /// - Returns: HealthResponse with department health scores
    /// - Throws: NetworkError for auth, network, or decoding failures
    func fetchHealth(context: LAContext) async throws -> HealthResponse {
        // Get API key from Keychain
        let apiKey: String
        do {
            guard let key = try KeychainManager.shared.getAPIKey(context: context) else {
                throw NetworkError.noAPIKey
            }
            apiKey = key
        } catch let error as KeychainError {
            if case .userCanceled = error {
                throw NetworkError.unauthorized
            }
            throw NetworkError.noAPIKey
        }

        // Build request
        guard let url = URL(string: Constants.API.baseURL)?.appendingPathComponent("health") else {
            throw NetworkError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = Constants.API.timeout

        // Execute request
        let data: Data
        let response: URLResponse

        do {
            (data, response) = try await session.data(for: request)
        } catch let error as URLError {
            if error.code == .notConnectedToInternet || error.code == .networkConnectionLost {
                throw NetworkError.networkUnavailable
            }
            throw NetworkError.requestFailed(error)
        } catch {
            throw NetworkError.requestFailed(error)
        }

        // Validate response
        guard let httpResponse = response as? HTTPURLResponse else {
            throw NetworkError.invalidResponse
        }

        // Map status codes
        switch httpResponse.statusCode {
        case 200...299:
            break // Success, continue to decode
        case 401:
            throw NetworkError.unauthorized
        case 400...499:
            throw NetworkError.clientError(httpResponse.statusCode)
        case 500...599:
            throw NetworkError.serverError(httpResponse.statusCode)
        default:
            throw NetworkError.clientError(httpResponse.statusCode)
        }

        // Decode response
        do {
            return try decoder.decode(HealthResponse.self, from: data)
        } catch {
            throw NetworkError.decodingFailed(error)
        }
    }
}
