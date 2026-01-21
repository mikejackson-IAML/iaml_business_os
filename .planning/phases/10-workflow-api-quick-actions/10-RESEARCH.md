# Phase 10: Workflow API & Quick Actions - Research

**Researched:** 2026-01-20
**Domain:** n8n workflow triggering, iOS quick action grids, SwiftUI drag-reorder, toast notifications
**Confidence:** HIGH

## Summary

This phase implements the workflow API endpoints and quick action UI for triggering n8n workflows with one tap. The research confirms two key architectural decisions: (1) n8n workflows must use webhook triggers rather than direct API execution since the n8n public REST API does not support executing workflows by ID, and (2) the existing Phase 8 tool infrastructure (`mobile-chat.ts`) can be extended to support direct workflow triggers.

The iOS implementation will use a 2x3 grid of action buttons with `LazyVGrid`, SwiftUI's native `onMove` modifier for drag-to-reorder configuration, and a custom toast overlay for fire-and-forget feedback. The workflow trigger endpoint will be a simple POST that fires a webhook URL and returns immediately - no waiting for workflow completion.

**Primary recommendation:** Create a new `/api/mobile/workflows` endpoint family that queries the workflow registry and triggers workflows via webhook URLs stored in a new `webhook_url` column. iOS uses a simple network call with toast feedback, no streaming required.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| SwiftUI `LazyVGrid` | iOS 14+ | 2x3 action grid layout | Native, efficient for fixed grids |
| SwiftUI `onMove` | iOS 13+ | Drag-to-reorder in Settings | Built-in, handles touch delay |
| `@AppStorage` | iOS 14+ | Persist user workflow preferences | Native UserDefaults wrapper |
| Next.js Route Handler | 16.x | API endpoints for workflows | Already in use for chat/health |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| SwiftUI `overlay` | iOS 15+ | Toast positioning | For toast notifications |
| `withAnimation` | iOS 13+ | Toast slide in/out | Entry/exit animations |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Custom toast | AlertToast package | Custom is simpler for this use case, no dependency |
| `LazyVGrid` | `HStack`+`VStack` | LazyVGrid handles layout math, more maintainable |
| `@AppStorage` | CoreData/Keychain | Overkill for simple preferences |

**Installation:**
No new dependencies required - all native SwiftUI.

## Architecture Patterns

### Recommended Project Structure
```
BusinessCommandCenter/
├── Features/
│   ├── Home/
│   │   ├── HomeView.swift              # Add QuickActionsGrid below health
│   │   ├── Components/
│   │   │   └── QuickActionsGrid.swift  # NEW: 2x3 grid of action buttons
│   │   └── QuickActionsViewModel.swift # NEW: Action state and triggers
│   └── Settings/
│       └── QuickActionsSettingsView.swift # NEW: Configure which actions appear
├── Core/
│   ├── Network/
│   │   └── NetworkManager.swift        # Add triggerWorkflow method
│   └── Models/
│       └── QuickAction.swift           # NEW: Quick action model

dashboard/src/
├── app/api/mobile/
│   ├── workflows/
│   │   ├── route.ts                    # GET list, POST trigger
│   │   └── [id]/route.ts               # GET single workflow details
│   └── health/route.ts                 # Existing
├── lib/api/
│   └── workflow-triggers.ts            # NEW: n8n webhook trigger logic
```

### Pattern 1: Fire-and-Forget Network Call

**What:** Trigger workflow without waiting for completion
**When to use:** Quick actions where user just needs confirmation it started
**Example:**
```swift
// Source: Existing NetworkManager pattern
actor NetworkManager {
    /// Triggers a workflow and returns immediately (fire-and-forget)
    /// - Returns: Execution ID for tracking (optional)
    func triggerWorkflow(
        workflowId: String,
        context: LAContext
    ) async throws -> WorkflowTriggerResponse {
        let apiKey = try getAPIKey(context: context)

        var request = URLRequest(url: workflowsURL.appendingPathComponent("trigger"))
        request.httpMethod = "POST"
        request.setValue(apiKey, forHTTPHeaderField: "X-API-Key")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(["workflow_id": workflowId])

        let (data, response) = try await session.data(for: request)
        // ... validation and decode
        return try decoder.decode(WorkflowTriggerResponse.self, from: data)
    }
}
```

### Pattern 2: 2x3 Grid with LazyVGrid

**What:** Fixed-column grid for quick action buttons
**When to use:** Displaying a consistent grid of tappable actions
**Example:**
```swift
// Source: Apple SwiftUI documentation
private let columns = [
    GridItem(.flexible()),
    GridItem(.flexible()),
]

var body: some View {
    LazyVGrid(columns: columns, spacing: 12) {
        ForEach(enabledActions) { action in
            QuickActionButton(action: action) {
                Task { await triggerAction(action) }
            }
        }
    }
}
```

### Pattern 3: Drag-to-Reorder with onMove

**What:** Allow users to reorder items by dragging
**When to use:** Settings screen for configuring action order
**Example:**
```swift
// Source: https://sarunw.com/posts/swiftui-list-onmove/
List {
    ForEach($enabledActions) { $action in
        ActionRow(action: action)
    }
    .onMove { source, destination in
        enabledActions.move(fromOffsets: source, toOffset: destination)
        saveOrder()
    }
}
.environment(\.editMode, .constant(.active)) // Always show drag handles
```

### Pattern 4: Toast Overlay

**What:** Brief success/failure message that auto-dismisses
**When to use:** Fire-and-forget feedback after action triggers
**Example:**
```swift
// Source: Community patterns + Apple HIG
struct ToastView: View {
    let message: String
    let type: ToastType

    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: type.icon)
            Text(message)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.regularMaterial)
        .clipShape(Capsule())
        .shadow(radius: 4)
    }
}

// Usage in parent view
.overlay(alignment: .bottom) {
    if let toast = viewModel.toast {
        ToastView(message: toast.message, type: toast.type)
            .transition(.move(edge: .bottom).combined(with: .opacity))
            .padding(.bottom, 100)
    }
}
```

### Anti-Patterns to Avoid
- **Waiting for workflow completion:** n8n workflows can take minutes. Fire-and-forget is correct.
- **Using n8n REST API for execution:** The public API does not support `/workflows/{id}/run`. Use webhooks.
- **Complex drag gestures on action buttons:** Use standard onMove in List for Settings, not custom gestures.
- **Modal confirmation for every action:** Only risky/destructive actions need confirmation per CONTEXT.md.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Grid layout math | Manual HStack/VStack nesting | `LazyVGrid` | Handles spacing, alignment, overflow |
| Drag reordering | Custom gesture recognizers | `onMove` modifier | Built-in accessibility, handles touch delay |
| Preference persistence | Manual UserDefaults | `@AppStorage` | Automatic encoding, property wrapper |
| Toast animation | Custom transition logic | `.transition()` + `withAnimation` | Composable, interruptible |

**Key insight:** SwiftUI has mature support for all the UI patterns needed. Avoid third-party dependencies for this phase.

## Common Pitfalls

### Pitfall 1: n8n API Does Not Support Direct Execution

**What goes wrong:** Calling `POST /rest/workflows/{id}/run` returns 401/404
**Why it happens:** n8n's public REST API does not expose workflow execution by ID
**How to avoid:**
- Add webhook trigger nodes to workflows that need quick action support
- Store the webhook URL in workflow registry
- Call the webhook URL from the API
**Warning signs:** 401/404 errors when trying to execute workflows via n8n REST API

### Pitfall 2: onMove Only Works with ForEach

**What goes wrong:** Drag reordering doesn't work in custom views
**Why it happens:** `onMove` modifier only applies to `ForEach` inside `List`
**How to avoid:** Always use `ForEach` within `List` for drag-to-reorder
**Warning signs:** Compiler error or no drag handle appearing

### Pitfall 3: Toast Dismisses During State Change

**What goes wrong:** Toast disappears immediately or doesn't animate
**Why it happens:** State update interrupts animation
**How to avoid:** Use `Task.sleep` for auto-dismiss, wrap in `withAnimation`
```swift
@MainActor func showToast(_ toast: Toast) {
    withAnimation { self.toast = toast }
    Task {
        try await Task.sleep(for: .seconds(2))
        withAnimation { self.toast = nil }
    }
}
```
**Warning signs:** Toast flickers or doesn't appear

### Pitfall 4: Blocking UI During Workflow Trigger

**What goes wrong:** App freezes while waiting for API response
**Why it happens:** Network call not properly awaited with loading state
**How to avoid:** Show button loading state, don't await workflow completion
**Warning signs:** Button stays tappable during request, or UI freezes

### Pitfall 5: Settings Changes Not Persisting

**What goes wrong:** User reorders actions, they reset on app restart
**Why it happens:** Not using `@AppStorage` or manual save not called
**How to avoid:** Store action order in `@AppStorage` as JSON-encoded array
**Warning signs:** Order resets after background/terminate

## n8n Workflow Triggering

### How It Works

n8n workflows must have a **Webhook node** as their trigger to be callable via HTTP. The workflow's webhook URL is available in two forms:

1. **Test URL:** Used during development, workflow must be in "listen" mode
2. **Production URL:** Used when workflow is activated, always available

### Webhook URL Pattern
```
https://n8n.realtyamp.ai/webhook/{path}
```
Where `{path}` is either:
- Auto-generated UUID (default)
- Custom path (if configured in the webhook node)

### Triggering a Workflow
```typescript
// dashboard/src/lib/api/workflow-triggers.ts
export async function triggerWorkflow(
  workflowId: string,
  webhookUrl: string,
  parameters?: Record<string, unknown>
): Promise<{ success: boolean; executionId?: string }> {
  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(parameters || {}),
  });

  if (!response.ok) {
    throw new Error(`Workflow trigger failed: ${response.status}`);
  }

  // Webhook may return execution data or just 200
  const data = await response.json().catch(() => ({}));
  return {
    success: true,
    executionId: data.executionId,
  };
}
```

### Adding Quick Action Support to Workflows

For a workflow to be a quick action:
1. Add a Webhook trigger node (or ensure one exists)
2. Note the production webhook URL
3. Add `webhook_url` to workflow registry

**Migration needed:** Add `webhook_url` column to `n8n_brain.workflows`:
```sql
ALTER TABLE n8n_brain.workflows
ADD COLUMN webhook_url TEXT;
```

## Existing Code to Reuse

### From Phase 8: Tool Definitions

The existing `mobile-chat.ts` already has `trigger_workflow` tool with placeholder implementation. Phase 10 replaces the placeholder with real webhook triggers.

**Current placeholder:**
```typescript
async function executeTriggerWorkflow(input: TriggerWorkflowInput): Promise<string> {
  // Placeholder - actual n8n webhook trigger will be implemented in Phase 10
  return JSON.stringify({
    status: 'pending',
    message: `Workflow trigger requested: ${input.workflow_name} (${input.workflow_id})`,
    note: 'Workflow triggering will be fully implemented in Phase 10',
  });
}
```

**Phase 10 replacement:**
```typescript
async function executeTriggerWorkflow(input: TriggerWorkflowInput): Promise<string> {
  // Look up webhook URL from registry
  const workflow = await getWorkflowById(input.workflow_id);
  if (!workflow?.webhook_url) {
    return JSON.stringify({ error: 'Workflow does not support direct triggering' });
  }

  // Trigger via webhook
  const result = await triggerWorkflow(
    input.workflow_id,
    workflow.webhook_url,
    input.parameters
  );

  return JSON.stringify({
    status: 'triggered',
    workflow_name: input.workflow_name,
    execution_id: result.executionId,
  });
}
```

### From Phase 7: NetworkManager Pattern

Extend existing `NetworkManager.swift` actor pattern:
- Already has `fetchHealth(context:)`
- Add `triggerWorkflow(workflowId:, context:)`
- Add `fetchWorkflows(context:)` for getting available actions

### From Phase 9: Confirmation Pattern

Reuse the confirmation alert pattern from `ChatViewModel`:
- `ConfirmationAction` struct already exists
- Only risky actions need confirmation (per CONTEXT.md)
- Safe actions execute immediately with toast feedback

## Suggested Quick Actions (Default Set)

Based on workflow registry analysis, recommended default quick actions:

| Action | Workflow | Icon | Risk Level | Why Include |
|--------|----------|------|------------|-------------|
| Check System Health | `get_health_status` tool | `heart.text.square` | safe | Most common check |
| Domain Health | `HnZQopXL7xjZnX3O` | `envelope.badge` | safe | Email deliverability critical |
| Run Speed Audit | `3ynFk0HYxFwFA5LS` | `speedometer` | safe | Manual trigger workflow |
| Sync Registrations | `2HAORwXKt7UffvxG` | `arrow.triangle.2.circlepath` | risky | Affects GHL |
| Check Uptime | `QBS1n2E0IFDyhR7y` | `bolt.badge.checkmark` | safe | Quick status check |
| Validate Emails | `PAyKdjpKLHfH5L89` | `checkmark.circle` | safe | Webhook-triggered |

Note: Only workflows with webhook triggers can be quick actions.

## API Endpoint Design

### GET /api/mobile/workflows

Returns list of workflows available as quick actions.

**Response:**
```typescript
{
  workflows: [
    {
      id: string,           // workflow_id
      name: string,         // workflow_name
      description: string,
      icon: string,         // SF Symbol name
      risk_level: 'safe' | 'risky' | 'destructive',
      category: string,     // 'monitoring', 'sync', etc.
      can_trigger: boolean, // has webhook_url
    }
  ]
}
```

### POST /api/mobile/workflows/trigger

Triggers a workflow via its webhook URL.

**Request:**
```typescript
{
  workflow_id: string,
  parameters?: Record<string, unknown>  // Optional webhook payload
}
```

**Response:**
```typescript
{
  success: boolean,
  execution_id?: string,  // If webhook returns it
  message: string,
}
```

**Error Response:**
```typescript
{
  error: string,
  code: 'NOT_FOUND' | 'NO_WEBHOOK' | 'TRIGGER_FAILED'
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| n8n REST API execution | Webhook triggers | Always (n8n design) | Must use webhooks for external triggers |
| UIKit collection view | SwiftUI LazyVGrid | iOS 14+ | Simpler, declarative grid layout |
| Custom drag reordering | SwiftUI onMove | iOS 13+ | Built-in accessibility support |
| Third-party toast libs | Native overlay + transition | iOS 15+ | No dependencies needed |

**Deprecated/outdated:**
- `UICollectionView`: Use `LazyVGrid` for SwiftUI
- Alert-based feedback: Use toast for non-blocking feedback
- Polling for workflow status: Fire-and-forget is sufficient

## Code Examples

### Quick Action Button Component

```swift
// Source: Apple HIG button guidelines
struct QuickActionButton: View {
    let action: QuickAction
    let isLoading: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(spacing: 8) {
                if isLoading {
                    ProgressView()
                        .frame(width: 32, height: 32)
                } else {
                    Image(systemName: action.icon)
                        .font(.system(size: 24))
                        .foregroundStyle(action.riskLevel == .safe ? .blue : .orange)
                }

                Text(action.label)
                    .font(.caption)
                    .lineLimit(2)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 80)
            .background(Color(.systemBackground))
            .clipShape(RoundedRectangle(cornerRadius: Constants.UI.cornerRadius))
        }
        .buttonStyle(.plain)
        .disabled(isLoading)
    }
}
```

### Toast Modifier

```swift
// Source: Community pattern
struct ToastModifier: ViewModifier {
    @Binding var toast: Toast?

    func body(content: Content) -> some View {
        content
            .overlay(alignment: .bottom) {
                if let toast {
                    ToastView(toast: toast)
                        .transition(.move(edge: .bottom).combined(with: .opacity))
                        .padding(.bottom, 100)
                        .onAppear {
                            Task {
                                try? await Task.sleep(for: .seconds(2))
                                withAnimation { self.toast = nil }
                            }
                        }
                }
            }
            .animation(.spring(duration: 0.3), value: toast)
    }
}

extension View {
    func toast(_ toast: Binding<Toast?>) -> some View {
        modifier(ToastModifier(toast: toast))
    }
}
```

## Open Questions

Things that couldn't be fully resolved:

1. **Webhook URL storage**
   - What we know: Workflows need webhook URLs to be triggerable
   - What's unclear: Whether to add to existing registry or separate table
   - Recommendation: Add `webhook_url` column to `n8n_brain.workflows`

2. **Icon mapping**
   - What we know: Each workflow needs an SF Symbol icon
   - What's unclear: Where to store icon choices (registry? API response?)
   - Recommendation: Add `quick_action_icon` column to registry, default based on category

3. **Webhook authentication**
   - What we know: n8n webhooks can require authentication
   - What's unclear: Current authentication setup for IAML workflows
   - Recommendation: Start without auth (internal network), add later if needed

## Sources

### Primary (HIGH confidence)
- [n8n Webhook Node Documentation](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/) - Webhook trigger patterns
- [SwiftUI onMove Tutorial](https://sarunw.com/posts/swiftui-list-onmove/) - Drag reorder implementation
- [Hacking with Swift - LazyVGrid](https://www.hackingwithswift.com/quick-start/swiftui/how-to-let-users-move-rows-in-a-list) - Grid layout patterns

### Secondary (MEDIUM confidence)
- [n8n Community - Executing Workflows via API](https://community.n8n.io/t/executing-a-workflow-via-api-call-without-webhook-or-cli-command/212895) - Confirms no direct API execution
- [AlertToast GitHub](https://github.com/elai950/AlertToast) - Toast UI patterns (reference only, not using)

### Tertiary (LOW confidence)
- n8n webhook authentication patterns - Needs validation against IAML setup

## Metadata

**Confidence breakdown:**
- n8n webhook pattern: HIGH - Verified via official docs
- SwiftUI patterns: HIGH - Native framework, well-documented
- API design: HIGH - Follows existing Phase 7/8 patterns
- Workflow selection: MEDIUM - Based on registry analysis, may need adjustment

**Research date:** 2026-01-20
**Valid until:** 2026-02-20 (30 days - stable patterns)
