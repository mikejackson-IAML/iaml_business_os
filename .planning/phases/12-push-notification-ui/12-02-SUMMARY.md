---
phase: 12
plan: 02
subsystem: ios-app
tags: [push-notifications, ios, permissions, swiftui]
dependency-graph:
  requires: ["12-01"]
  provides: ["PushNotificationService", "registerDeviceToken", "NotificationPermissionSheet"]
  affects: ["12-03", "12-04"]
tech-stack:
  added: []
  patterns: ["singleton-service", "pre-permission-ui", "contextual-timing"]
file-tracking:
  key-files:
    created:
      - BusinessCommandCenter/Core/Services/PushNotificationService.swift
      - BusinessCommandCenter/Shared/Views/NotificationPermissionSheet.swift
    modified:
      - BusinessCommandCenter/Core/Network/NetworkManager.swift
      - BusinessCommandCenter/Features/Home/QuickActionsViewModel.swift
      - BusinessCommandCenter/Features/Home/Components/QuickActionsGrid.swift
decisions:
  - key: "contextual-permission-timing"
    choice: "Prompt after first successful quick action trigger"
    rationale: "User just triggered workflow, natural moment to ask if they want completion updates"
  - key: "pre-permission-pattern"
    choice: "Custom sheet before iOS system prompt"
    rationale: "Explain benefits to improve permission grant rate (standard iOS pattern)"
  - key: "deferred-token-registration"
    choice: "Register token after permission granted with LAContext"
    rationale: "Need auth context for API key - can't register at token receive time"
metrics:
  duration: "2 min"
  completed: "2026-01-21"
---

# Phase 12 Plan 02: Push Permission & Registration Summary

PushNotificationService singleton with permission requests, pre-permission UI, and contextual trigger after first quick action.

## What Was Built

### PushNotificationService (112 lines)
- **Singleton pattern** matching NetworkManager and HapticManager
- **Permission state tracking** with @Published permissionStatus
- **hasPromptedForPermission** stored in UserDefaults (one-time prompt)
- **shouldPromptForPermission** computed property for trigger timing
- **requestPermission()** triggers iOS system prompt, registers for remote notifications
- **registerTokenWithBackend()** sends token to API with LAContext

### NetworkManager.registerDeviceToken (83 lines added)
- **POST /api/mobile/notifications/register** endpoint
- Sends device_token (64 hex chars) and timezone (IANA format)
- X-API-Key authentication
- Standard NetworkError handling

### NotificationPermissionSheet (116 lines)
- Pre-permission UI explaining notification benefits
- Three benefit rows: Critical Alerts (red), Workflow Updates (green), Daily Digest (orange)
- "Enable Notifications" button triggers iOS system prompt
- "Not Now" button respects user choice
- NavigationStack with Done toolbar button

### QuickActionsViewModel Integration
- Added showPermissionSheet @Published property
- Triggers permission sheet after first successful quick action
- 0.5s delay lets toast show before sheet
- handlePermissionResult registers token when granted

### QuickActionsGrid Integration
- .sheet modifier presents NotificationPermissionSheet
- Passes context to handlePermissionResult for token registration

## Commits

| Hash | Message |
|------|---------|
| 1717d55 | feat(12-02): create PushNotificationService |
| 1b06e17 | feat(12-02): add registerDeviceToken to NetworkManager |
| 586099b | feat(12-02): create NotificationPermissionSheet |
| f43dcbf | feat(12-02): hook permission prompt into QuickActionsViewModel |
| b44265b | feat(12-02): present permission sheet in QuickActionsGrid |

## Key Patterns

**Contextual Permission Timing:** User triggers quick action -> success toast -> 0.5s delay -> permission sheet. Natural moment because user just requested workflow execution.

**Pre-Permission UI:** Custom sheet explains benefits before iOS system prompt. Industry best practice to improve grant rates.

**Deferred Token Registration:** Token received from AppDelegate via NotificationCenter, but registration waits until permission granted AND auth context available.

## Deviations from Plan

None - plan executed exactly as written.

## Next Phase Readiness

**Plan 12-03 (Deep Linking):** Ready
- PushNotificationService is in place
- Token registration works
- Next: Handle notification taps and deep link routing

**Dependencies:**
- 12-01 AppDelegate with Notification.Name extensions (done)
- API endpoint /api/mobile/notifications/register (exists from 11-03)
