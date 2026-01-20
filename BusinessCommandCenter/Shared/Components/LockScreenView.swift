import SwiftUI

/// Lock screen shown when app is locked, requiring biometric authentication.
struct LockScreenView: View {
    var appState: AppState

    @State private var isAuthenticating = false
    @State private var showingError = false
    @State private var errorMessage = ""
    @State private var hasAttemptedAutoAuth = false

    private let biometricAuth = BiometricAuth()

    var body: some View {
        VStack(spacing: 24) {
            Spacer()

            // Lock icon
            Image(systemName: "lock.shield.fill")
                .font(.system(size: 80))
                .foregroundStyle(.blue)

            // App name
            Text("Business Command Center")
                .font(.title)
                .fontWeight(.semibold)

            Text("Authenticate to continue")
                .foregroundStyle(.secondary)

            Spacer()

            // Unlock button
            Button {
                Task { await authenticate() }
            } label: {
                HStack(spacing: 12) {
                    if isAuthenticating {
                        ProgressView()
                            .tint(.white)
                    } else {
                        Image(systemName: biometricAuth.biometryIcon)
                    }
                    Text("Unlock with \(biometricAuth.biometryName)")
                }
                .font(.headline)
                .frame(maxWidth: .infinity)
                .padding()
                .background(.blue)
                .foregroundColor(.white)
                .clipShape(RoundedRectangle(cornerRadius: 12))
            }
            .disabled(isAuthenticating)
            .padding(.horizontal, 40)

            Spacer()
                .frame(height: 60)
        }
        .alert("Authentication Error", isPresented: $showingError) {
            Button("OK", role: .cancel) { }
        } message: {
            Text(errorMessage)
        }
        .task {
            // Auto-authenticate after short delay to avoid systemCancel
            try? await Task.sleep(for: .milliseconds(500))

            if !hasAttemptedAutoAuth {
                hasAttemptedAutoAuth = true
                await authenticate()
            }
        }
    }

    @MainActor
    private func authenticate() async {
        guard !isAuthenticating else { return }

        isAuthenticating = true
        defer { isAuthenticating = false }

        do {
            let context = try await biometricAuth.authenticate()
            appState.unlock(with: context)
        } catch let error as BiometricError {
            if error.shouldShowAlert, let message = error.errorDescription {
                errorMessage = message
                showingError = true
            }
            // If biometry locked out, offer passcode fallback
            if case .lockout = error {
                await authenticateWithPasscode()
            }
        } catch {
            errorMessage = error.localizedDescription
            showingError = true
        }
    }

    @MainActor
    private func authenticateWithPasscode() async {
        do {
            let context = try await biometricAuth.authenticateWithPasscodeFallback()
            appState.unlock(with: context)
        } catch let error as BiometricError {
            if error.shouldShowAlert, let message = error.errorDescription {
                errorMessage = message
                showingError = true
            }
        } catch {
            errorMessage = error.localizedDescription
            showingError = true
        }
    }
}

#Preview {
    LockScreenView(appState: AppState())
}
