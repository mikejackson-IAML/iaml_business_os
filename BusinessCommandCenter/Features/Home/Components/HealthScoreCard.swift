import SwiftUI

/// Displays overall health score as a ring chart with status color.
struct HealthScoreCard: View {
    let score: Int
    let status: HealthStatus

    var body: some View {
        VStack(spacing: 12) {
            // Ring chart
            ZStack {
                // Background ring
                Circle()
                    .stroke(Color.secondary.opacity(0.2), lineWidth: 10)

                // Progress ring
                Circle()
                    .trim(from: 0, to: CGFloat(score) / 100)
                    .stroke(
                        statusColor,
                        style: StrokeStyle(lineWidth: 10, lineCap: .round)
                    )
                    .rotationEffect(.degrees(-90))
                    .animation(.easeInOut(duration: 0.5), value: score)

                // Score text
                VStack(spacing: 2) {
                    Text("\(score)")
                        .font(.system(size: 40, weight: .bold, design: .rounded))

                    Text("Health")
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
            .frame(width: 120, height: 120)

            // Status label
            Text(statusLabel)
                .font(.subheadline)
                .fontWeight(.medium)
                .foregroundStyle(statusColor)
        }
        .padding()
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
        .shadow(color: .black.opacity(0.05), radius: 5, y: 2)
    }

    private var statusColor: Color {
        switch status {
        case .healthy: return .green
        case .warning: return .orange
        case .critical: return .red
        }
    }

    private var statusLabel: String {
        switch status {
        case .healthy: return "Healthy"
        case .warning: return "Needs Attention"
        case .critical: return "Critical"
        }
    }
}

#Preview {
    VStack(spacing: 20) {
        HealthScoreCard(score: 92, status: .healthy)
        HealthScoreCard(score: 73, status: .warning)
        HealthScoreCard(score: 45, status: .critical)
    }
    .padding()
    .background(Color(.systemGroupedBackground))
}
