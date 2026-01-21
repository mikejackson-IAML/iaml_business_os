import SwiftUI

struct SettingsView: View {
    var appState: AppState

    var body: some View {
        NavigationStack {
            List {
                Section("Security") {
                    NavigationLink {
                        APIKeyView(appState: appState)
                    } label: {
                        HStack {
                            Label("API Key", systemImage: "key")

                            Spacer()

                            // Status indicator
                            if appState.hasAPIKey {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundStyle(.green)
                            } else {
                                Text("Required")
                                    .font(.caption)
                                    .foregroundStyle(.orange)
                            }
                        }
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        HapticManager.shared.tap()
                        appState.recordActivity()
                    })

                    HStack {
                        Label("Auto-Lock", systemImage: "lock.rotation")
                        Spacer()
                        Text("5 minutes")
                            .foregroundStyle(.secondary)
                    }
                }

                Section("Customization") {
                    NavigationLink {
                        QuickActionsSettingsView()
                    } label: {
                        Label("Quick Actions", systemImage: "bolt.fill")
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        HapticManager.shared.tap()
                        appState.recordActivity()
                    })
                }

                Section("Appearance") {
                    AppearanceRow()
                }

                Section("About") {
                    HStack {
                        Label("Version", systemImage: "info.circle")
                        Spacer()
                        Text("\(Constants.App.version) (\(Constants.App.build))")
                            .foregroundStyle(.secondary)
                    }

                    Link(destination: URL(string: "https://docs.iaml.io")!) {
                        HStack {
                            Label("Documentation", systemImage: "book")
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        HapticManager.shared.tap()
                    })

                    Link(destination: URL(string: "https://support.iaml.io")!) {
                        HStack {
                            Label("Support", systemImage: "questionmark.circle")
                            Spacer()
                            Image(systemName: "arrow.up.right.square")
                                .foregroundStyle(.secondary)
                        }
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        HapticManager.shared.tap()
                    })
                }

                Section("Debug") {
                    Button("Lock App Now") {
                        HapticManager.shared.button()
                        appState.lock()
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

/// Shows current appearance mode (informational only - follows system)
struct AppearanceRow: View {
    @Environment(\.colorScheme) var colorScheme

    var body: some View {
        HStack {
            Label("Appearance", systemImage: colorScheme == .dark ? "moon.fill" : "sun.max.fill")
            Spacer()
            Text(colorScheme == .dark ? "Dark" : "Light")
                .foregroundStyle(.secondary)
        }
    }
}

#Preview {
    SettingsView(appState: AppState())
}
