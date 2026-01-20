import SwiftUI
import LocalAuthentication

/// Settings screen for viewing and updating the Claude API key.
/// API key is stored in Keychain with biometric protection.
struct APIKeyView: View {
    var appState: AppState

    @State private var apiKey = ""
    @State private var isEditing = false
    @State private var isKeyVisible = false
    @State private var isLoading = false
    @State private var showingSaveSuccess = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var showingDeleteConfirmation = false

    private let keychainManager = KeychainManager.shared
    private let biometricAuth = BiometricAuth()

    var body: some View {
        Form {
            Section {
                if isEditing {
                    editingView
                } else {
                    displayView
                }
            } header: {
                Text("Claude API Key")
            } footer: {
                Text("Your API key is stored securely in the iOS Keychain and protected by \(biometricAuth.biometryName). It is never transmitted except to the Business OS API.")
            }

            Section {
                actionButtons
            }

            if appState.hasAPIKey && !isEditing {
                Section {
                    Button("Delete API Key", role: .destructive) {
                        HapticManager.shared.warning()
                        showingDeleteConfirmation = true
                    }
                }
            }
        }
        .navigationTitle("API Key")
        .navigationBarTitleDisplayMode(.inline)
        .alert("API Key Saved", isPresented: $showingSaveSuccess) {
            Button("OK", role: .cancel) { }
        } message: {
            Text("Your API key has been securely stored.")
        }
        .alert("Error", isPresented: $showingError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage)
        }
        .confirmationDialog(
            "Delete API Key?",
            isPresented: $showingDeleteConfirmation,
            titleVisibility: .visible
        ) {
            Button("Delete", role: .destructive) {
                deleteAPIKey()
            }
            Button("Cancel", role: .cancel) { }
        } message: {
            Text("This will remove your API key from the device. You'll need to enter it again to use the app.")
        }
        .task {
            await loadAPIKey()
        }
    }

    // MARK: - Display View

    private var displayView: some View {
        HStack {
            if isLoading {
                ProgressView()
                    .padding(.trailing, 8)
            }

            if appState.hasAPIKey {
                Text(isKeyVisible ? apiKey : maskedKey)
                    .font(.system(.body, design: .monospaced))
                    .foregroundStyle(apiKey.isEmpty ? .secondary : .primary)
            } else {
                Text("Not configured")
                    .foregroundStyle(.secondary)
            }

            Spacer()

            if appState.hasAPIKey && !apiKey.isEmpty {
                Button {
                    HapticManager.shared.tap()
                    isKeyVisible.toggle()
                } label: {
                    Image(systemName: isKeyVisible ? "eye.slash" : "eye")
                        .foregroundStyle(.blue)
                }
                .buttonStyle(.plain)
            }
        }
    }

    // MARK: - Editing View

    private var editingView: some View {
        VStack(alignment: .leading, spacing: 8) {
            SecureField("Enter API Key", text: $apiKey)
                .textContentType(.password)
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)

            Text("Paste your Claude API key from Anthropic Console")
                .font(.caption)
                .foregroundStyle(.secondary)
        }
    }

    // MARK: - Action Buttons

    @ViewBuilder
    private var actionButtons: some View {
        if isEditing {
            Button {
                HapticManager.shared.button()
                Task { await saveAPIKey() }
            } label: {
                HStack {
                    Text("Save API Key")
                    if isLoading {
                        Spacer()
                        ProgressView()
                    }
                }
            }
            .disabled(apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || isLoading)

            Button("Cancel", role: .cancel) {
                HapticManager.shared.tap()
                isEditing = false
                Task { await loadAPIKey() }
            }
        } else {
            Button {
                HapticManager.shared.tap()
                isEditing = true
            } label: {
                Text(appState.hasAPIKey ? "Update API Key" : "Add API Key")
            }
        }
    }

    // MARK: - Masked Key Display

    private var maskedKey: String {
        guard !apiKey.isEmpty else { return "********" }

        let prefix = String(apiKey.prefix(8))
        let suffix = String(apiKey.suffix(4))
        let masked = String(repeating: "*", count: max(0, apiKey.count - 12))

        return prefix + masked + suffix
    }

    // MARK: - Data Operations

    @MainActor
    private func loadAPIKey() async {
        guard appState.hasAPIKey else {
            apiKey = ""
            return
        }

        isLoading = true
        defer { isLoading = false }

        do {
            // Use auth context if available, otherwise will prompt for biometric
            if let key = try keychainManager.getAPIKey(context: appState.authContext) {
                apiKey = key
            }
        } catch KeychainError.userCanceled {
            // User canceled biometric, don't show error
            apiKey = ""
        } catch {
            errorMessage = "Failed to load API key: \(error.localizedDescription)"
            showingError = true
            apiKey = ""
        }
    }

    @MainActor
    private func saveAPIKey() async {
        let trimmedKey = apiKey.trimmingCharacters(in: .whitespacesAndNewlines)

        guard !trimmedKey.isEmpty else { return }

        isLoading = true
        defer { isLoading = false }

        do {
            try keychainManager.saveAPIKey(trimmedKey)
            HapticManager.shared.success()
            appState.refreshAPIKeyStatus()
            isEditing = false
            showingSaveSuccess = true
        } catch {
            HapticManager.shared.error()
            errorMessage = "Failed to save API key: \(error.localizedDescription)"
            showingError = true
        }
    }

    @MainActor
    private func deleteAPIKey() {
        do {
            try keychainManager.deleteAPIKey()
            HapticManager.shared.success()
            apiKey = ""
            appState.refreshAPIKeyStatus()
        } catch {
            HapticManager.shared.error()
            errorMessage = "Failed to delete API key: \(error.localizedDescription)"
            showingError = true
        }
    }
}

#Preview {
    NavigationStack {
        APIKeyView(appState: AppState())
    }
}
