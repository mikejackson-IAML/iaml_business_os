import SwiftUI

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            List {
                Section("Security") {
                    NavigationLink {
                        Text("API Key settings")
                    } label: {
                        Label("API Key", systemImage: "key")
                    }
                    .simultaneousGesture(TapGesture().onEnded {
                        HapticManager.shared.tap()
                    })
                }

                Section("Appearance") {
                    AppearanceRow()
                }

                Section("About") {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(Constants.App.version)
                            .foregroundStyle(.secondary)
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
    SettingsView()
}
