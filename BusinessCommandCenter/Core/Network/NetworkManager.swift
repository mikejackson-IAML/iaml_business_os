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

    // MARK: - Workflows

    /// Fetches available workflows (quick actions) from the API.
    /// - Parameter context: LAContext for Keychain access (from AppState after auth)
    /// - Returns: WorkflowListResponse with available quick actions
    /// - Throws: NetworkError for auth, network, or decoding failures
    func fetchWorkflows(context: LAContext) async throws -> WorkflowListResponse {
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
        guard let url = URL(string: Constants.API.baseURL)?.appendingPathComponent("workflows") else {
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
            return try decoder.decode(WorkflowListResponse.self, from: data)
        } catch {
            throw NetworkError.decodingFailed(error)
        }
    }

    /// Triggers a workflow via the API.
    /// - Parameters:
    ///   - workflowId: The n8n workflow ID to trigger
    ///   - parameters: Optional parameters to pass to the workflow
    ///   - context: LAContext for Keychain access (from AppState after auth)
    /// - Returns: WorkflowTriggerResponse with success status
    /// - Throws: NetworkError for auth, network, or decoding failures
    func triggerWorkflow(
        workflowId: String,
        parameters: [String: Any]?,
        context: LAContext
    ) async throws -> WorkflowTriggerResponse {
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
        guard let url = URL(string: Constants.API.baseURL)?.appendingPathComponent("workflows/trigger") else {
            throw NetworkError.invalidResponse
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.timeoutInterval = Constants.API.timeout

        // Build request body
        var body: [String: Any] = ["workflow_id": workflowId]
        if let params = parameters {
            body["parameters"] = params
        }
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

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
            return try decoder.decode(WorkflowTriggerResponse.self, from: data)
        } catch {
            throw NetworkError.decodingFailed(error)
        }
    }
}
