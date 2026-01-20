# IAML Business OS

## What This Is

A comprehensive business automation platform for IAML (an HR training company) that integrates n8n workflows, Supabase, GoHighLevel, and a native iOS app to streamline marketing operations, campaign management, and program delivery — all controllable from anywhere.

## Core Value

Issue commands from anywhere and trust the system executes them correctly.

## Current Milestone: v2.0 iOS App

**Goal:** Build a native iOS app that serves as a mobile command center for the Business OS — monitor health, dispatch agents to do work, get notified when things need attention.

**Target features:**
- Dashboard with department health scores and active alerts
- AI chat interface for natural language commands (streaming)
- Quick actions for common workflows
- Voice input for hands-free commands
- Push notifications (critical alerts, task completions, daily digest)
- Agent capabilities: trigger workflows, data operations, content generation, research

**Risk-based autonomy:**
- Confirm first: sending messages, payments, data deletion
- Execute immediately: workflow triggers, research, content drafts, data reads

**Authentication:** API key stored in iOS Keychain + Face ID biometrics

**Deferred to v2.1:** Home screen widget

---

## Requirements

### Validated

*Shipped and confirmed valuable:*

- ✓ Website with 18 program pages, registration flow, Stripe integration — v1.0
- ✓ 54 of 76 n8n workers deployed — v1.0
- ✓ Campaign tracking schema (Alumni Reconnect Q1 2026) — v1.0
- ✓ n8n-brain learning layer — v1.0
- ✓ Dashboard foundation (Next.js + Tailwind + Radix UI) — v1.0

### Active

*Current scope (iOS App v2.0):*

- [ ] Native iOS app with SwiftUI
- [ ] API routes in Next.js dashboard
- [ ] AI chat with Claude streaming
- [ ] Push notification system
- [ ] Agent action framework

### Out of Scope

- Home screen widget — deferred to v2.1
- Android app — iOS first, evaluate later
- Offline mode — requires online connection
- Multi-user support — single operator for now

---

## Vision

1. **Automate repetitive operations** - Reduce manual work in lead management, campaign tracking, and program administration
2. **Unify data across systems** - Single source of truth connecting Airtable, GHL, Supabase, and external platforms
3. **Enable intelligent decision-making** - Real-time analytics and automated responses based on engagement signals
4. **Scale without headcount** - Build systems that handle growth without proportional team expansion

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           IAML BUSINESS OS                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Website   │  │  Dashboard  │  │   n8n       │  │  Supabase   │   │
│  │  (Vercel)   │  │  (Next.js)  │  │  Workflows  │  │  (Postgres) │   │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘   │
│         │                │                │                │           │
│         └────────────────┴────────────────┴────────────────┘           │
│                                    │                                    │
│                          ┌─────────┴─────────┐                         │
│                          │     n8n-brain     │                         │
│                          │  (Learning Layer) │                         │
│                          └───────────────────┘                         │
│                                                                         │
│  External Integrations:                                                 │
│  ├── GoHighLevel (CRM, email sequences)                                │
│  ├── Airtable (programs, faculty, registrations)                       │
│  ├── Stripe (payments, subscriptions)                                  │
│  ├── HeyReach (LinkedIn automation)                                    │
│  ├── Smartlead (email outreach)                                        │
│  └── 40+ MCP servers                                                   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Current State

- **Website**: 18 program pages, registration flow, Stripe integration (LIVE)
- **n8n Workers**: 54 of 76 planned workers deployed
- **Campaign Tracking**: Multi-channel schema operational (Alumni Reconnect Q1 2026)
- **n8n-brain**: Learning layer storing patterns, credentials, and error fixes
- **Dashboard**: In development (Next.js + Tailwind + Radix UI)

## Success Metrics

- All 76 n8n workers deployed and operational
- Zero manual data entry for standard operations
- Campaign ROI visibility within 24 hours of activity
- 99.9% uptime for critical automation paths

## Constraints

- **No framework complexity on website** - Vanilla HTML/CSS/JS only
- **Supabase as primary database** - All persistent state lives here
- **n8n for orchestration** - No custom backend services
- **GHL for customer communication** - Email/SMS sequences managed there

## Team

- Solo operator with Claude Code assistance
- n8n-brain provides accumulated knowledge across sessions

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| SwiftUI over UIKit | Modern, declarative, better for new iOS projects | — Pending |
| API key + biometrics auth | Simpler than session auth, secure with Keychain | — Pending |
| Risk-based autonomy | Balance speed with safety for high-stakes actions | — Pending |
| Skip widget for v1 | Focus on core app functionality first | — Pending |
| Next.js API routes | Leverage existing dashboard infrastructure | — Pending |

---
*Last updated: 2026-01-20 after milestone v2.0 initialization*
