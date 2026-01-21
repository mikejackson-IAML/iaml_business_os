import Foundation
import LocalAuthentication
import SwiftUI

/// Manages quick actions state for the QuickActionsGrid component.
@MainActor
final class QuickActionsViewModel: ObservableObject {
    // MARK: - Published State

    /// Available quick actions loaded from the API.
    @Published private(set) var actions: [QuickAction] = []
    /// Whether actions are currently loading.
    @Published private(set) var isLoading = false
    /// ID of the action currently being triggered (shows loading state on button).
    @Published private(set) var loadingActionId: String?
    /// Toast notification to display.
    @Published var toast: Toast?
    /// Action awaiting confirmation (for risky/destructive actions).
    @Published var confirmationAction: QuickAction?

    /// Maximum number of actions to display in the grid.
    private let maxActions = 6

    /// Persisted enabled action IDs from settings.
    @AppStorage("enabledActionIds") private var enabledActionIdsData: Data = Data()

    /// Decoded array of enabled action IDs from AppStorage.
    private var enabledActionIds: [String] {
        guard !enabledActionIdsData.isEmpty else { return [] }
        return (try? JSONDecoder().decode([String].self, from: enabledActionIdsData)) ?? []
    }

    // MARK: - Loading Actions

    /// Loads quick actions from the API, respecting user preferences.
    /// - Parameter context: LAContext for Keychain access.
    func loadActions(context: LAContext) async {
        guard !isLoading else { return }

        isLoading = true

        do {
            let response = try await NetworkManager.shared.fetchWorkflows(context: context)
            let allWorkflows = response.workflows
            let savedIds = enabledActionIds

            if savedIds.isEmpty {
                // Default: first 6 actions
                actions = Array(allWorkflows.prefix(maxActions))
            } else {
                // Restore user-defined order from settings
                actions = savedIds.compactMap { id in
                    allWorkflows.first { $0.id == id }
                }
            }
        } catch let networkError as NetworkError {
            toast = Toast(message: networkError.userMessage, type: .error)
        } catch {
            toast = Toast(message: "Failed to load actions", type: .error)
        }

        isLoading = false
    }

    // MARK: - Triggering Actions

    /// Triggers a quick action. Shows confirmation for risky/destructive actions.
    /// - Parameters:
    ///   - action: The action to trigger.
    ///   - context: LAContext for Keychain access.
    func triggerAction(_ action: QuickAction, context: LAContext) async {
        // Check if action requires confirmation
        if action.riskLevel != .safe {
            confirmationAction = action
            return
        }

        await performTrigger(action, context: context)
    }

    /// Confirms and triggers a pending risky action.
    /// - Parameter context: LAContext for Keychain access.
    func confirmAndTrigger(context: LAContext) async {
        guard let action = confirmationAction else { return }
        confirmationAction = nil
        await performTrigger(action, context: context)
    }

    /// Cancels a pending confirmation.
    func cancelConfirmation() {
        confirmationAction = nil
    }

    // MARK: - Private

    /// Performs the actual workflow trigger.
    /// - Parameters:
    ///   - action: The action to trigger.
    ///   - context: LAContext for Keychain access.
    private func performTrigger(_ action: QuickAction, context: LAContext) async {
        loadingActionId = action.id
        HapticManager.shared.tap()

        do {
            let response = try await NetworkManager.shared.triggerWorkflow(
                workflowId: action.id,
                parameters: nil,
                context: context
            )

            if response.success {
                toast = Toast(message: "Sent!", type: .success)
            } else {
                toast = Toast(message: response.message, type: .error)
            }
        } catch let networkError as NetworkError {
            toast = Toast(message: networkError.userMessage, type: .error)
        } catch {
            toast = Toast(message: "Failed to trigger workflow", type: .error)
        }

        loadingActionId = nil
    }
}
