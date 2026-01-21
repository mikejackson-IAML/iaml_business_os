import Foundation

// MARK: - Health Response

/// Top-level response from the /api/mobile/health endpoint.
struct HealthResponse: Codable {
    let timestamp: String
    let overallHealth: OverallHealth
    let departments: [DepartmentHealth]
    let alerts: [HealthAlert]
    let totalAlertCount: Int
}

// MARK: - Overall Health

/// Aggregated health score across all departments.
struct OverallHealth: Codable {
    let score: Int
    let status: HealthStatus
}

// MARK: - Department Health

/// Health data for a single department (e.g., Workflow, Digital Real Estate).
struct DepartmentHealth: Codable, Identifiable {
    let id: String
    let name: String
    let score: Int
    let status: HealthStatus
    let alertCount: Int
    let topMetrics: [TopMetric]
}

// MARK: - Top Metric

/// Key metric displayed for a department (e.g., "Success Rate: 98%").
struct TopMetric: Codable, Identifiable {
    // Generate ID locally since API doesn't provide one
    var id: String { "\(label)-\(value)" }
    let label: String
    let value: String
    let status: HealthStatus

    enum CodingKeys: String, CodingKey {
        case label, value, status
    }
}

// MARK: - Health Alert

/// Active alert requiring attention.
struct HealthAlert: Codable, Identifiable {
    let id: String
    let title: String
    let severity: AlertSeverity
    let department: String
    let timestamp: String
}

// MARK: - Enums

/// Health status indicator for departments and metrics.
enum HealthStatus: String, Codable {
    case healthy
    case warning
    case critical
}

/// Alert severity level.
enum AlertSeverity: String, Codable {
    case info
    case warning
    case critical
}
