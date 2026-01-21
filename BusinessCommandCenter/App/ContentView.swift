import SwiftUI

struct ContentView: View {
    var appState: AppState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView(showAlerts: Binding(
                get: { appState.showAlerts },
                set: { appState.showAlerts = $0 }
            ))
            .tabItem {
                Label("Home", systemImage: "house")
            }
            .tag(0)

            ChatView()
                .tabItem {
                    Label("Chat", systemImage: "message")
                }
                .tag(1)

            SettingsView(appState: appState)
                .tabItem {
                    Label("Settings", systemImage: "gear")
                }
                .tag(2)
        }
        .environment(appState)  // Inject AppState for child views using @Environment
        .onChange(of: selectedTab) { _, _ in
            HapticManager.shared.selectionChanged()
            appState.recordActivity()  // Record tab change as activity
        }
        .onChange(of: appState.deepLinkDestination) { _, destination in
            handleDeepLink(destination)
        }
        .onAppear {
            // Handle any deep link that arrived before view appeared
            handleDeepLink(appState.deepLinkDestination)
        }
    }

    // MARK: - Deep Link Handling

    private func handleDeepLink(_ destination: DeepLinkDestination?) {
        guard let destination else { return }

        switch destination {
        case .home:
            selectedTab = 0

        case .homeWithAlerts:
            selectedTab = 0
            // Small delay to ensure tab switch completes before showing sheet
            Task { @MainActor in
                try? await Task.sleep(for: .milliseconds(100))
                appState.showAlerts = true
            }

        case .settings:
            selectedTab = 2
        }

        // Clear destination after handling
        appState.deepLinkDestination = nil

        print("[DeepLink] Navigated to \(destination)")
    }
}

#Preview {
    ContentView(appState: AppState())
}
