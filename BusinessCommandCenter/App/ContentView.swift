import SwiftUI

struct ContentView: View {
    var appState: AppState
    @State private var selectedTab = 0

    var body: some View {
        TabView(selection: $selectedTab) {
            HomeView()
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
        .onChange(of: selectedTab) { _, _ in
            HapticManager.shared.selectionChanged()
            appState.recordActivity()  // Record tab change as activity
        }
    }
}

#Preview {
    ContentView(appState: AppState())
}
