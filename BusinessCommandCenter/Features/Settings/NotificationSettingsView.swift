import SwiftUI

/// Settings view for configuring notification preferences.
struct NotificationSettingsView: View {
    @Environment(AppState.self) private var appState
    @AppStorage("notificationPreferences") private var preferences = NotificationPreferences()
    @StateObject private var pushService = PushNotificationService.shared

    var body: some View {
        Form {
            // Permission status section (if denied)
            if pushService.permissionStatus == .denied {
                Section {
                    HStack {
                        Image(systemName: "bell.slash.fill")
                            .foregroundStyle(.orange)
                        Text("Notifications Disabled")
                        Spacer()
                        Button("Settings") {
                            HapticManager.shared.tap()
                            openSettings()
                        }
                        .font(.caption)
                        .buttonStyle(.bordered)
                    }
                } footer: {
                    Text("Tap Settings to enable notifications in iOS Settings.")
                }
            }

            // Notification types section
            Section("Notification Types") {
                Toggle(isOn: $preferences.criticalAlertsEnabled) {
                    Label {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Critical Alerts")
                            Text("System down, payment failed")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } icon: {
                        Image(systemName: "exclamationmark.triangle.fill")
                            .foregroundStyle(.red)
                    }
                }
                .onChange(of: preferences.criticalAlertsEnabled) { _, _ in
                    syncPreferences()
                }

                Toggle(isOn: $preferences.workflowCompletionsEnabled) {
                    Label {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Workflow Completions")
                            Text("When triggered workflows finish")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } icon: {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundStyle(.green)
                    }
                }
                .onChange(of: preferences.workflowCompletionsEnabled) { _, _ in
                    syncPreferences()
                }

                Toggle(isOn: $preferences.dailyDigestEnabled) {
                    Label {
                        VStack(alignment: .leading, spacing: 2) {
                            Text("Daily Digest")
                            Text("Morning summary of activity")
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                    } icon: {
                        Image(systemName: "sun.max.fill")
                            .foregroundStyle(.orange)
                    }
                }
                .onChange(of: preferences.dailyDigestEnabled) { _, _ in
                    syncPreferences()
                }
            }

            // Quiet hours section
            Section {
                Toggle("Enable Quiet Hours", isOn: $preferences.quietHoursEnabled)
                    .onChange(of: preferences.quietHoursEnabled) { _, _ in
                        syncPreferences()
                    }

                if preferences.quietHoursEnabled {
                    HStack {
                        Text("Start")
                        Spacer()
                        HourPicker(hour: $preferences.quietHoursStart)
                            .onChange(of: preferences.quietHoursStart) { _, _ in
                                syncPreferences()
                            }
                    }

                    HStack {
                        Text("End")
                        Spacer()
                        HourPicker(hour: $preferences.quietHoursEnd)
                            .onChange(of: preferences.quietHoursEnd) { _, _ in
                                syncPreferences()
                            }
                    }
                }
            } header: {
                Text("Quiet Hours")
            } footer: {
                if preferences.quietHoursEnabled {
                    Text("Critical alerts will still be delivered during quiet hours.")
                }
            }

            // Digest time section
            if preferences.dailyDigestEnabled {
                Section {
                    HStack {
                        Text("Delivery Time")
                        Spacer()
                        HourPicker(hour: $preferences.digestHour)
                            .onChange(of: preferences.digestHour) { _, _ in
                                syncPreferences()
                            }
                    }
                } header: {
                    Text("Daily Digest")
                } footer: {
                    Text("Time shown in \(TimeZone.current.identifier)")
                }
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .task {
            await pushService.refreshPermissionStatus()
        }
    }

    // MARK: - Actions

    private func openSettings() {
        if let url = URL(string: UIApplication.openSettingsURLString) {
            UIApplication.shared.open(url)
        }
    }

    private func syncPreferences() {
        guard let context = appState.authContext,
              let token = PushNotificationService.shared.currentToken else {
            return
        }

        Task {
            do {
                try await NetworkManager.shared.updateNotificationPreferences(
                    token: token,
                    preferences: preferences,
                    context: context
                )
                print("[NotificationSettings] Preferences synced")
            } catch {
                // Fail silently - local prefs are saved anyway
                print("[NotificationSettings] Sync failed: \(error)")
            }
        }
    }
}

// MARK: - Hour Picker

/// Picker for selecting an hour (0-23) displayed in 12-hour format.
private struct HourPicker: View {
    @Binding var hour: Int

    var body: some View {
        Picker("", selection: $hour) {
            ForEach(0..<24, id: \.self) { h in
                Text(formatHour(h)).tag(h)
            }
        }
        .pickerStyle(.menu)
        .onChange(of: hour) { _, _ in
            HapticManager.shared.tap()
        }
    }

    private func formatHour(_ hour: Int) -> String {
        let formatter = DateFormatter()
        formatter.dateFormat = "h a"
        let date = Calendar.current.date(from: DateComponents(hour: hour)) ?? Date()
        return formatter.string(from: date)
    }
}

#Preview {
    NavigationStack {
        NotificationSettingsView()
            .environment(AppState())
    }
}
