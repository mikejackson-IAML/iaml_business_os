# IAML Business OS

## Vision

A comprehensive business automation platform for IAML (an HR training company) that integrates n8n workflows, Supabase, and GoHighLevel to streamline marketing operations, campaign management, and program delivery.

## Goals

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
