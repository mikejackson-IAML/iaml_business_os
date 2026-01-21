import SwiftUI

/// Row displaying a single department's health status and key metrics.
struct DepartmentHealthRow: View {
    let department: DepartmentHealth

    var body: some View {
        HStack(spacing: 12) {
            // Status indicator
            StatusIndicator(status: department.status)

            // Department info
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 8) {
                    Text(department.name)
                        .font(.headline)

                    // Alert badge if any
                    if department.alertCount > 0 {
                        Text("\(department.alertCount)")
                            .font(.caption2)
                            .fontWeight(.semibold)
                            .foregroundStyle(.white)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(alertBadgeColor)
                            .clipShape(Capsule())
                    }
                }

                // Top metrics summary
                if !department.topMetrics.isEmpty {
                    Text(metricsText)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(1)
                }
            }

            Spacer()

            // Score
            Text("\(department.score)")
                .font(.title2)
                .fontWeight(.semibold)
                .foregroundStyle(scoreColor)
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle()) // Make entire row tappable
    }

    private var metricsText: String {
        department.topMetrics
            .prefix(2)
            .map { "\($0.label): \($0.value)" }
            .joined(separator: " | ")
    }

    private var alertBadgeColor: Color {
        department.status == .critical ? .red : .orange
    }

    private var scoreColor: Color {
        switch department.status {
        case .healthy: return .primary
        case .warning: return .orange
        case .critical: return .red
        }
    }
}

#Preview {
    List {
        DepartmentHealthRow(department: DepartmentHealth(
            id: "workflows",
            name: "Workflows",
            score: 96,
            status: .healthy,
            alertCount: 0,
            topMetrics: [
                TopMetric(label: "Success Rate", value: "98%", status: .healthy),
                TopMetric(label: "Unresolved", value: "0", status: .healthy)
            ]
        ))

        DepartmentHealthRow(department: DepartmentHealth(
            id: "digital",
            name: "Digital",
            score: 78,
            status: .warning,
            alertCount: 2,
            topMetrics: [
                TopMetric(label: "Uptime", value: "99.2%", status: .healthy),
                TopMetric(label: "LCP", value: "3.1s", status: .warning)
            ]
        ))
    }
}
