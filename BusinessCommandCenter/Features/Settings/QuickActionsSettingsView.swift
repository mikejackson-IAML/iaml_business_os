import SwiftUI
import LocalAuthentication

/// Settings view for configuring which quick actions appear and their order.
struct QuickActionsSettingsView: View {
    @Environment(AppState.self) var appState

    /// Persisted enabled action IDs as JSON array data.
    @AppStorage("enabledActionIds") private var enabledActionIdsData: Data = Data()

    /// All available actions loaded from the API.
    @State private var allActions: [QuickAction] = []
    /// Ordered list of enabled actions (subset of allActions).
    @State private var enabledActions: [QuickAction] = []
    /// Whether actions are currently loading.
    @State private var isLoading = false
    /// Error message to display if loading fails.
    @State private var errorMessage: String?

    /// Maximum number of actions that can be enabled in the grid.
    private let maxEnabled = 6

    /// Disabled actions (all actions not in enabled list).
    private var disabledActions: [QuickAction] {
        allActions.filter { action in
            !enabledActions.contains { $0.id == action.id }
        }
    }

    /// Decoded array of enabled action IDs from AppStorage.
    private var enabledActionIds: [String] {
        get {
            guard !enabledActionIdsData.isEmpty else { return [] }
            return (try? JSONDecoder().decode([String].self, from: enabledActionIdsData)) ?? []
        }
    }

    var body: some View {
        Group {
            if isLoading {
                ProgressView("Loading workflows...")
            } else if let error = errorMessage {
                ContentUnavailableView(
                    "Unable to Load",
                    systemImage: "exclamationmark.triangle",
                    description: Text(error)
                )
            } else {
                actionsList
            }
        }
        .navigationTitle("Quick Actions")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await loadActions()
        }
    }

    /// List showing enabled and available actions.
    @ViewBuilder
    private var actionsList: some View {
        List {
            Section {
                ForEach(enabledActions) { action in
                    ActionRow(action: action, isEnabled: true) {
                        removeAction(action)
                    }
                }
                .onMove(perform: moveAction)
            } header: {
                Text("Enabled (\(enabledActions.count)/\(maxEnabled))")
            } footer: {
                Text("Drag to reorder. These appear on your Home tab.")
            }

            if !disabledActions.isEmpty {
                Section {
                    ForEach(disabledActions) { action in
                        ActionRow(
                            action: action,
                            isEnabled: false,
                            isAddDisabled: enabledActions.count >= maxEnabled
                        ) {
                            addAction(action)
                        }
                    }
                } header: {
                    Text("Available")
                } footer: {
                    if enabledActions.count >= maxEnabled {
                        Text("Remove an enabled action to add more.")
                    }
                }
            }
        }
        .environment(\.editMode, .constant(.active))
    }

    // MARK: - Data Loading

    /// Loads all available actions and separates into enabled/disabled.
    private func loadActions() async {
        guard let context = appState.authContext else { return }

        isLoading = true
        errorMessage = nil

        do {
            let response = try await NetworkManager.shared.fetchWorkflows(context: context)
            allActions = response.workflows

            // Apply saved order or default to first 6
            let savedIds = enabledActionIds
            if savedIds.isEmpty {
                // Default: first 6 actions
                enabledActions = Array(allActions.prefix(maxEnabled))
            } else {
                // Restore saved order
                enabledActions = savedIds.compactMap { id in
                    allActions.first { $0.id == id }
                }
            }
        } catch let networkError as NetworkError {
            errorMessage = networkError.userMessage
        } catch {
            errorMessage = "Failed to load workflows"
        }

        isLoading = false
    }

    // MARK: - Actions

    /// Moves an action within the enabled list.
    private func moveAction(from source: IndexSet, to destination: Int) {
        enabledActions.move(fromOffsets: source, toOffset: destination)
        HapticManager.shared.tap()
        savePreferences()
    }

    /// Adds an action to the enabled list.
    private func addAction(_ action: QuickAction) {
        guard enabledActions.count < maxEnabled else { return }
        enabledActions.append(action)
        HapticManager.shared.success()
        savePreferences()
    }

    /// Removes an action from the enabled list.
    private func removeAction(_ action: QuickAction) {
        enabledActions.removeAll { $0.id == action.id }
        HapticManager.shared.tap()
        savePreferences()
    }

    /// Persists enabled action IDs to AppStorage.
    private func savePreferences() {
        let ids = enabledActions.map(\.id)
        enabledActionIdsData = (try? JSONEncoder().encode(ids)) ?? Data()
    }
}

// MARK: - Action Row

/// A single row in the quick actions settings list.
private struct ActionRow: View {
    let action: QuickAction
    let isEnabled: Bool
    var isAddDisabled: Bool = false
    let onToggle: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Icon
            Image(systemName: action.icon)
                .font(.title3)
                .foregroundStyle(.tint)
                .frame(width: 28)

            // Name and description
            VStack(alignment: .leading, spacing: 2) {
                Text(action.name)
                    .font(.body)

                if let description = action.description {
                    Text(description)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            // Add/Remove button
            if isEnabled {
                Button {
                    onToggle()
                } label: {
                    Image(systemName: "minus.circle.fill")
                        .foregroundStyle(.red)
                        .font(.title2)
                }
                .buttonStyle(.plain)
            } else {
                Button {
                    onToggle()
                } label: {
                    Image(systemName: "plus.circle.fill")
                        .foregroundStyle(isAddDisabled ? .secondary : .green)
                        .font(.title2)
                }
                .buttonStyle(.plain)
                .disabled(isAddDisabled)
            }
        }
        .contentShape(Rectangle())
    }
}

#Preview {
    NavigationStack {
        QuickActionsSettingsView()
            .environment(AppState())
    }
}
