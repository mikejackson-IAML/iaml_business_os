import SwiftUI

/// Row displaying a single alert with severity indicator and details.
struct AlertRow: View {
    let alert: HealthAlert

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            // Severity icon
            Image(systemName: severityIcon)
                .foregroundStyle(severityColor)
                .font(.title3)
                .frame(width: 24)

            VStack(alignment: .leading, spacing: 4) {
                // Title
                Text(alert.title)
                    .font(.subheadline)
                    .fontWeight(.medium)

                // Department and time
                HStack(spacing: 8) {
                    Text(alert.department)
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Text("\u{2022}")
                        .font(.caption)
                        .foregroundStyle(.secondary)

                    Text(formatTimestamp(alert.timestamp))
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }

            Spacer()

            // Severity badge
            Text(severityLabel)
                .font(.caption2)
                .fontWeight(.medium)
                .foregroundStyle(severityColor)
                .padding(.horizontal, 8)
                .padding(.vertical, 4)
                .background(severityColor.opacity(0.15))
                .clipShape(Capsule())
        }
        .padding(.vertical, 8)
    }

    private var severityIcon: String {
        switch alert.severity {
        case .critical:
            return "exclamationmark.octagon.fill"
        case .warning:
            return "exclamationmark.triangle.fill"
        case .info:
            return "info.circle.fill"
        }
    }

    private var severityColor: Color {
        switch alert.severity {
        case .critical: return .red
        case .warning: return .orange
        case .info: return .blue
        }
    }

    private var severityLabel: String {
        switch alert.severity {
        case .critical: return "Critical"
        case .warning: return "Warning"
        case .info: return "Info"
        }
    }

    private func formatTimestamp(_ iso: String) -> String {
        let formatter = ISO8601DateFormatter()
        guard let date = formatter.date(from: iso) else { return iso }

        let relative = RelativeDateTimeFormatter()
        relative.unitsStyle = .abbreviated
        return relative.localizedString(for: date, relativeTo: Date())
    }
}

#Preview {
    List {
        AlertRow(alert: HealthAlert(
            id: "1",
            title: "Workflow 'Domain Sync' failed",
            severity: .critical,
            department: "Workflows",
            timestamp: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-3600))
        ))

        AlertRow(alert: HealthAlert(
            id: "2",
            title: "LCP above threshold (3.2s)",
            severity: .warning,
            department: "Digital",
            timestamp: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-7200))
        ))

        AlertRow(alert: HealthAlert(
            id: "3",
            title: "Daily backup completed",
            severity: .info,
            department: "Database",
            timestamp: ISO8601DateFormatter().string(from: Date().addingTimeInterval(-86400))
        ))
    }
}
