import SwiftUI

/// Sheet view displaying all active alerts.
struct AlertsView: View {
    let alerts: [HealthAlert]
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationStack {
            content
                .navigationTitle("Alerts")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button("Done") {
                            dismiss()
                        }
                    }
                }
        }
    }

    @ViewBuilder
    private var content: some View {
        if alerts.isEmpty {
            emptyState
        } else {
            alertList
        }
    }

    private var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 50))
                .foregroundStyle(.green)

            Text("All Clear")
                .font(.title2)
                .fontWeight(.semibold)

            Text("No active alerts")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var alertList: some View {
        List {
            // Critical alerts section
            let criticalAlerts = alerts.filter { $0.severity == .critical }
            if !criticalAlerts.isEmpty {
                Section {
                    ForEach(criticalAlerts) { alert in
                        AlertRow(alert: alert)
                    }
                } header: {
                    Label("Critical", systemImage: "exclamationmark.octagon.fill")
                        .foregroundStyle(.red)
                }
            }

            // Warning alerts section
            let warningAlerts = alerts.filter { $0.severity == .warning }
            if !warningAlerts.isEmpty {
                Section {
                    ForEach(warningAlerts) { alert in
                        AlertRow(alert: alert)
                    }
                } header: {
                    Label("Warnings", systemImage: "exclamationmark.triangle.fill")
                        .foregroundStyle(.orange)
                }
            }

            // Info alerts section
            let infoAlerts = alerts.filter { $0.severity == .info }
            if !infoAlerts.isEmpty {
                Section {
                    ForEach(infoAlerts) { alert in
                        AlertRow(alert: alert)
                    }
                } header: {
                    Label("Info", systemImage: "info.circle.fill")
                        .foregroundStyle(.blue)
                }
            }
        }
        .listStyle(.insetGrouped)
    }
}

#Preview {
    AlertsView(alerts: [
        HealthAlert(id: "1", title: "Workflow failed", severity: .critical, department: "Workflows", timestamp: ISO8601DateFormatter().string(from: Date())),
        HealthAlert(id: "2", title: "LCP warning", severity: .warning, department: "Digital", timestamp: ISO8601DateFormatter().string(from: Date())),
        HealthAlert(id: "3", title: "Backup complete", severity: .info, department: "Database", timestamp: ISO8601DateFormatter().string(from: Date()))
    ])
}
