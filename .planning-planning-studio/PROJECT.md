# Planning Studio

> Transform ideas into development-ready projects through AI-guided conversations with enforced incubation periods.

## Current State (v1.0 Shipped)

**Version:** 1.0 — Shipped 2026-01-28
**Status:** Production-ready

Planning Studio v1.0 is complete with:
- Full 6-phase idea pipeline with AI guidance
- Memory system with semantic search (Cmd+K global, project-scoped Ask AI)
- Document generation and versioning (ICP, Lean Canvas, Feature Specs, GSD)
- Deep research via Perplexity integration
- AI-prioritized build queue with goal-based scoring
- Build tracker with progress and shipping flow
- Analytics dashboard with funnel metrics
- Migration from old Development Dashboard

**Tech Stack:** Next.js, Supabase (pgvector), Claude API, Perplexity API, OpenAI Embeddings
**LOC:** ~7,900 TypeScript

---

## Vision

Planning Studio is the **unified command center** for the entire idea-to-production lifecycle. It provides a structured system that:

1. **Captures ideas** instantly when inspiration strikes
2. **Enforces incubation** — mandatory reflection periods backed by cognitive science
3. **Guides planning** through structured AI conversations
4. **Builds queryable memory** — every decision, insight, and pivot is searchable
5. **Recommends priorities** — AI suggests what to build next based on your goals
6. **Outputs Claude Code commands** — ready to paste into terminal and build

**The goal:** Minimize involvement during actual development by doing thorough planning upfront.

## Problem Statement

Currently, ideas get built too quickly without proper incubation, leading to scope creep, unclear requirements, and excessive back-and-forth during development. There's no systematic way to capture decisions and their reasoning, making it hard to answer "why did we decide X?" weeks later.

## Target User

Mike Jackson — sole operator of IAML who needs to:
- Capture ideas quickly when inspiration strikes
- Think deeply before building (not just ship fast)
- Minimize involvement during actual development
- Query past decisions ("why did I choose X?")
- Get AI-recommended priorities based on goals

## Success Metrics

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| Ideas captured | Track growth | System should encourage capture |
| Planning completion rate | >80% | Ideas shouldn't stall in planning |
| Incubation skip rate | <20% | Process should feel valuable |
| Build autonomy | <5 questions during build | Thorough planning = smooth builds |
| Decision recall accuracy | >90% | Memory system must work |

## Technical Foundation

| Component | Technology | Notes |
|-----------|------------|-------|
| Frontend | Next.js | Existing Business OS dashboard |
| Database | Supabase | With pgvector extension for embeddings |
| AI Conversations | Claude API (claude-sonnet-4-20250514) | Streaming responses |
| Deep Research | Perplexity API | Async research during DISCOVER |
| Embeddings | OpenAI (text-embedding-3-small) | 1536 dimensions |
| Styling | Existing conventions | Match current dashboard |

## Key Constraints

- Single user only (no team collaboration in v1)
- Web-responsive (no mobile-specific UI)
- No integrations beyond Claude, Perplexity, OpenAI
- No public-facing features
- In-app notifications only (no email/push)

## The Six-Phase Flow

```
CAPTURE (5 min)
    │
    ▼
🔒 INCUBATION (24 hours) ← System prevents progression
    │
    ▼
DISCOVER (Deep research, ICP, competitive intel)
    │
    ▼
🔒 INCUBATION (24-48 hours)
    │
    ▼
DEFINE (Problem statement, Lean Canvas)
    │
    ▼
DEVELOP (Feature design, technical scoping)
    │
    ▼
🔒 INCUBATION (24 hours — "sleep on it")
    │
    ▼
VALIDATE (Readiness check with AI)
    │
    ▼
PACKAGE (Generate GSD documents + Claude Code command)
    │
    ▼
🚀 READY-TO-BUILD QUEUE (AI-prioritized)
    │
    ▼
BUILDING (Track progress)
    │
    ▼
SHIPPED
```

## Requirements

### Validated (v1.0)

- Pipeline View — Kanban board with DnD, search, filter
- Project Detail — Layout with sidebar panels
- Incubation State — Lock overlay with countdown, skip
- Ready-to-Build Queue — AI-prioritized queue
- Build Tracker — Progress display, shipping
- Ask AI — Project + global (Cmd+K)
- Goals Management — CRUD with tiers
- Analytics Dashboard — Metrics, funnel, trends
- Conversation Engine — AI chat with streaming, context
- Phase Transitions — Incubation enforcement
- Memory System — Extraction, embeddings, search
- Document Generation — Versioning, export
- Research Integration — Perplexity API
- Migration — Import from old dashboard
- E2E Tests — Playwright infrastructure
- Documentation — CLAUDE.md, API docs

### Active

(None — define in next milestone)

### Out of Scope

- Mobile-specific UI — web-responsive only in v1
- Team collaboration — single user only
- Email/push notifications — in-app only
- GitHub PR integration — manual tracking only

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| HNSW index over IVFFlat | Faster queries, no training | Good |
| SSE streaming for chat | Real-time responses | Good |
| Fire-and-forget memory extraction | Non-blocking chat UX | Good |
| Synchronous Perplexity calls | Avoid serverless timeouts | Good |
| jszip for client-side ZIP | No server temp files | Good |
| 308 redirect for old routes | Browser caches permanently | Good |

## Reference Documents

- [Milestones](./MILESTONES.md) — Shipped milestone history
- [v1.0 Roadmap Archive](./milestones/v1.0-ROADMAP.md) — v1.0 phase details
- [v1.0 Requirements Archive](./milestones/v1.0-REQUIREMENTS.md) — v1.0 requirements
- [System Prompts](./references/system_prompts.md) — Claude prompts for each planning phase
- [Document Templates](./references/document_templates.md) — Templates for generated documents
- [Memory Extraction](./references/memory_extraction.md) — How memories are identified and stored

---
*Last updated: 2026-01-28 after v1.0 milestone*
