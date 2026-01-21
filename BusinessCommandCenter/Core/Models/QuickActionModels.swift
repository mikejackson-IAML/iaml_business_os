import Foundation

// MARK: - Risk Level

/// Risk level determining confirmation behavior before triggering a workflow.
enum RiskLevel: String, Codable {
    /// Execute immediately on tap, no confirmation needed.
    case safe
    /// Show confirmation dialog before executing.
    case risky
    /// Show destructive-style confirmation dialog with warning.
    case destructive
}

// MARK: - Quick Action

/// A workflow that can be triggered from the quick actions grid.
struct QuickAction: Codable, Identifiable {
    /// Unique workflow identifier (n8n workflow ID).
    let id: String
    /// Human-readable workflow name.
    let name: String
    /// Optional description of what this workflow does.
    let description: String?
    /// SF Symbol name for display in the grid.
    let icon: String
    /// Determines if confirmation is required before triggering.
    let riskLevel: RiskLevel
    /// Category for grouping (e.g., "operations", "marketing").
    let category: String?
    /// Whether this workflow has a webhook URL and can be triggered.
    let canTrigger: Bool

    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case icon
        case riskLevel = "risk_level"
        case category
        case canTrigger = "can_trigger"
    }
}

// MARK: - Workflow List Response

/// Response from the /api/mobile/workflows endpoint.
struct WorkflowListResponse: Codable {
    /// List of available quick actions.
    let workflows: [QuickAction]
}

// MARK: - Workflow Trigger Response

/// Response from the /api/mobile/workflows/trigger endpoint.
struct WorkflowTriggerResponse: Codable {
    /// Whether the workflow was successfully triggered.
    let success: Bool
    /// Optional execution ID returned by the webhook (may not always be available).
    let executionId: String?
    /// Human-readable message about the trigger result.
    let message: String

    enum CodingKeys: String, CodingKey {
        case success
        case executionId = "execution_id"
        case message
    }
}
