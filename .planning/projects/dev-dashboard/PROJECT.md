# Development Project Management Dashboard

## What This Is

A Development department in the CEO dashboard that provides visibility into all active GSD projects, their roadmaps, and an ideas backlog — enabling parallel project execution with minimal context switching through macOS notifications and copy-paste commands.

## Core Value

See all project statuses at a glance, get notified only when critical, and never lose track of what's being built.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Database schema for tracking projects, phases, and ideas
- [ ] GSD integration to write status to Supabase + send macOS notifications
- [ ] Dashboard Active Projects view with status indicators and launch commands
- [ ] Dashboard Roadmap view showing phase timeline per project
- [ ] Dashboard Ideas Backlog with add/edit forms
- [ ] CLI `/parallel` skill for terminal access

### Out of Scope

- Remote execution (commands always run in terminal, not triggered from dashboard)
- Multi-user support (single operator)
- Android/web CLI (macOS terminal only)
- Complex decision handling in dashboard (those stay in terminal)

## Context

**Problem:** When running 2-5 GSD projects simultaneously, discuss-phase requires focused input while plan/execute phases run autonomously. Context-switching between projects wastes mental energy and there's no single place to see all development work.

**Solution:** Dashboard provides visibility + command generation. Terminal does execution. Notifications bring you back when needed.

**Integration points:**
- CEO Dashboard (Next.js) — new Development tab
- Supabase — new tables for project tracking
- GSD commands — write status as they work
- macOS notifications — alert on completion/blockers

## Constraints

- **Dashboard pattern**: Follow existing CEO dashboard component structure
- **Real-time updates**: Use Supabase subscriptions for live status
- **Terminal execution**: Never execute GSD commands from web — only show commands to copy
- **GSD compatibility**: Must work with existing GSD project structure

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| View + Command model | Keep execution in terminal for full GSD control | — Pending |
| Separate Development department | Different rhythm/metrics than Digital | — Pending |
| High autonomy defaults | Only queue truly critical decisions | — Pending |
| macOS notifications | Low-friction alert system | — Pending |

---
*Last updated: 2026-01-23 after initialization*
