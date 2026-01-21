import Foundation
import LocalAuthentication

/// Manages health data state for HomeView.
@MainActor
final class HomeViewModel: ObservableObject {
    // MARK: - Published State

    @Published private(set) var healthData: HealthResponse?
    @Published private(set) var isLoading = false
    @Published private(set) var error: NetworkError?

    // Computed for easy access
    var hasData: Bool { healthData != nil }
    var showError: Bool { error != nil && !isLoading }

    // MARK: - Loading

    /// Loads health data from the API.
    /// - Parameter context: LAContext for Keychain access
    func loadHealth(context: LAContext) async {
        guard !isLoading else { return } // Prevent duplicate requests

        isLoading = true
        error = nil

        do {
            let data = try await NetworkManager.shared.fetchHealth(context: context)
            self.healthData = data
        } catch let networkError as NetworkError {
            self.error = networkError
        } catch {
            self.error = .requestFailed(error)
        }

        isLoading = false
    }

    /// Refreshes health data (for pull-to-refresh).
    /// - Parameter context: LAContext for Keychain access
    func refresh(context: LAContext) async {
        // Don't show loading indicator for refresh - iOS handles it
        error = nil

        do {
            let data = try await NetworkManager.shared.fetchHealth(context: context)
            self.healthData = data
        } catch let networkError as NetworkError {
            self.error = networkError
        } catch {
            self.error = .requestFailed(error)
        }
    }

    /// Clears the current error (for retry button).
    func clearError() {
        error = nil
    }
}
