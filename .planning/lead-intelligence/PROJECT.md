# Lead Intelligence System

## What This Is

A comprehensive CRM module within the IAML Business OS dashboard that replaces the existing domain health/email capacity dashboard with a full contact intelligence system. It provides a filterable contact database with AI-powered natural language search, individual contact profiles with engagement history, company profiles, an opportunities pipeline for both in-house training deals and individual program inquiries, and integrations with SmartLead, Apollo, PhantomBuster, and the Business OS Action Center.

## Core Value

Users can find any contact, understand their full relationship with IAML, and take immediate action — all from one interface.

## Current State

Shipped v1.0 on 2026-01-27 with 103 files and 12,651 lines of TypeScript/TSX/SQL.
- Contact database with 15-filter search, AI natural language queries, paginated table
- Contact profiles with 6 tabs, AI intelligence summaries
- Company profiles with contacts, notes, enrichment, opportunities
- Dual-pipeline opportunities with kanban drag-and-drop
- SmartLead, Apollo, PhantomBuster, n8n integrations
- Bulk actions for campaign, enrichment, follow-up

## Requirements

### Validated

*Shipped and confirmed in v1.0:*

- ✓ Next.js 16 dashboard with Tailwind + Tremor + shadcn/Radix — existing
- ✓ Supabase PostgreSQL backend with server client — existing
- ✓ Anthropic SDK installed in dashboard — existing
- ✓ Department page pattern (Suspense + skeleton + content + server data loader) — existing
- ✓ Dashboard-kit types system for department configs — existing
- ✓ Action Center task system — existing
- ✓ Contacts database with search, filtering, and AI natural language queries — v1.0
- ✓ Individual contact profiles with full engagement history across tabs — v1.0
- ✓ Company profiles aggregating contacts and enabling account-based workflows — v1.0
- ✓ Opportunities pipeline (in-house training + individual program stages) — v1.0
- ✓ AI-generated contact intelligence summaries via Anthropic API — v1.0
- ✓ Data health metrics dashboard (email validity, freshness, completeness) — v1.0
- ✓ SmartLead campaign integration (add to campaign, sync email activity) — v1.0
- ✓ Enrichment integration (Apollo, Clearbit, PhantomBuster) — v1.0
- ✓ Find Colleagues workflow via n8n — v1.0
- ✓ Bulk actions (add to campaign, enrich, set follow-up) — v1.0
- ✓ Follow-up task creation integrated with Action Center — v1.0
- ✓ Complete replacement of existing leads dashboard — v1.0

### Active

*(None — next milestone not yet defined)*

### Out of Scope

- Saved views/segments — deferred to post-v1 (R1 in PRD roadmap)
- Tagging system — deferred to post-v1 (R2)
- AI lead scoring — deferred (R3)
- Company scoring model — deferred (R4)
- Click-to-call — deferred (R6)
- Website tracking pixel — deferred (R8)
- Deep company intelligence reports — deferred (R10)
- Multi-user RLS — single operator for now
- Mobile-specific UI — desktop-first dashboard module

## Context

- **Routes:** `/dashboard/lead-intelligence` (main), `/dashboard/lead-intelligence/contacts/[id]`, `/dashboard/lead-intelligence/companies/[id]`, `/dashboard/lead-intelligence/opportunities`
- **Dashboard pattern:** Next.js App Router, server components with Suspense, `getServerClient()` for Supabase, Tremor for data tables/metrics, shadcn for UI primitives
- **AI backend:** Anthropic API (Haiku for search parsing, Sonnet for summaries) via Next.js API routes
- **External integrations:** SmartLead, Apollo, PhantomBuster, Clearbit APIs
- **n8n:** Find Colleagues and enrichment workflows via webhooks

## Constraints

- **Tech stack**: Next.js 16, React 19, Tailwind, Tremor, shadcn/Radix, Supabase, Anthropic SDK — must match existing dashboard
- **Single operator**: No multi-user auth or RLS required
- **Supabase migrations**: Run via `supabase db push` CLI (project already linked)
- **AI search latency**: <2 second response time for natural language queries

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace existing leads dashboard entirely | Old dashboard tracked domain health/email capacity — completely different purpose | ✓ Good |
| Anthropic API via Next.js API routes | ANTHROPIC_API_KEY already configured, SDK already installed | ✓ Good |
| Supabase schema from PRD | PRD defines 11 tables + views + functions — use as-is | ✓ Good |
| Tremor for data tables, shadcn for UI | Matches existing dashboard patterns | ✓ Good |
| Claude Haiku for search, Sonnet for summaries | Fast parsing + quality summaries, cost-effective split | ✓ Good |
| @dnd-kit for kanban drag-and-drop | Lightweight, accessible, optimistic updates | ✓ Good |
| Enrichment merge: fill-blanks-only with conflict detection | Preserves existing data, surfaces conflicts for review | ✓ Good |

---
*Last updated: 2026-01-27 after v1.0 milestone completion*
