import SwiftUI

/// Badge displaying alert count with severity-based coloring.
struct AlertBadge: View {
    let count: Int
    let highestSeverity: AlertSeverity?

    init(count: Int, alerts: [HealthAlert] = []) {
        self.count = count
        // Find the highest severity alert
        if alerts.contains(where: { $0.severity == .critical }) {
            self.highestSeverity = .critical
        } else if alerts.contains(where: { $0.severity == .warning }) {
            self.highestSeverity = .warning
        } else if !alerts.isEmpty {
            self.highestSeverity = .info
        } else {
            self.highestSeverity = nil
        }
    }

    var body: some View {
        if count > 0 {
            HStack(spacing: 4) {
                Image(systemName: "exclamationmark.triangle.fill")
                    .font(.caption)
                Text(count > 99 ? "99+" : "\(count)")
                    .font(.caption)
                    .fontWeight(.semibold)
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(badgeColor)
            .clipShape(Capsule())
        }
    }

    private var badgeColor: Color {
        switch highestSeverity {
        case .critical:
            return .red
        case .warning:
            return .orange
        case .info, .none:
            return .blue
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        AlertBadge(count: 3, alerts: [
            HealthAlert(id: "1", title: "Test", severity: .critical, department: "Test", timestamp: "")
        ])

        AlertBadge(count: 5, alerts: [
            HealthAlert(id: "1", title: "Test", severity: .warning, department: "Test", timestamp: "")
        ])

        AlertBadge(count: 100, alerts: [
            HealthAlert(id: "1", title: "Test", severity: .info, department: "Test", timestamp: "")
        ])
    }
    .padding()
}
