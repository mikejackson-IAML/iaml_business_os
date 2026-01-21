import SwiftUI

/// A colored dot indicating health status.
struct StatusIndicator: View {
    let status: HealthStatus
    var size: CGFloat = 12

    var body: some View {
        Circle()
            .fill(color)
            .frame(width: size, height: size)
    }

    private var color: Color {
        switch status {
        case .healthy:
            return .green
        case .warning:
            return .orange
        case .critical:
            return .red
        }
    }
}

#Preview {
    HStack(spacing: 20) {
        StatusIndicator(status: .healthy)
        StatusIndicator(status: .warning)
        StatusIndicator(status: .critical)
    }
    .padding()
}
