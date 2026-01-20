import SwiftUI

@main
struct BusinessCommandCenterApp: App {
    @State private var appState = AppState()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            Group {
                if appState.isLocked {
                    LockScreenView(appState: appState)
                } else {
                    ContentView()
                }
            }
            .onChange(of: scenePhase) { oldPhase, newPhase in
                handleScenePhaseChange(from: oldPhase, to: newPhase)
            }
        }
    }

    private func handleScenePhaseChange(from oldPhase: ScenePhase, to newPhase: ScenePhase) {
        switch newPhase {
        case .background:
            // Record timestamp when going to background
            appState.recordActivity()
        case .active:
            // Check if we should lock when becoming active
            appState.checkLockStatus()
        case .inactive:
            // App in transition (e.g., control center open)
            break
        @unknown default:
            break
        }
    }
}
