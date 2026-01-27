# Lead Intelligence System

## What This Is

A comprehensive CRM module within the IAML Business OS dashboard that replaces the existing domain health/email capacity dashboard with a full contact intelligence system. It provides a filterable contact database with AI-powered natural language search, individual contact profiles with engagement history, company profiles, an opportunities pipeline for both in-house training deals and individual program inquiries, and integrations with SmartLead, Apollo, PhantomBuster, and the Business OS Action Center.

## Core Value

Users can find any contact, understand their full relationship with IAML, and take immediate action — all from one interface.

## Requirements

### Validated

- ✓ Next.js 16 dashboard with Tailwind + Tremor + shadcn/Radix — existing
- ✓ Supabase PostgreSQL backend with server client — existing
- ✓ Anthropic SDK installed in dashboard — existing
- ✓ Department page pattern (Suspense + skeleton + content + server data loader) — existing
- ✓ Dashboard-kit types system for department configs — existing
- ✓ Action Center task system — existing

### Active

- [ ] Contacts database with search, filtering, and AI natural language queries
- [ ] Individual contact profiles with full engagement history across tabs
- [ ] Company profiles aggregating contacts and enabling account-based workflows
- [ ] Opportunities pipeline (in-house training + individual program stages)
- [ ] AI-generated contact intelligence summaries via Anthropic API
- [ ] Data health metrics dashboard (email validity, freshness, completeness)
- [ ] SmartLead campaign integration (add to campaign, sync email activity)
- [ ] Enrichment integration (Apollo, Clearbit, PhantomBuster)
- [ ] Find Colleagues workflow via n8n
- [ ] Bulk actions (add to campaign, enrich, set follow-up)
- [ ] Follow-up task creation integrated with Action Center
- [ ] Complete replacement of existing leads dashboard

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

- **Existing code to replace:** `dashboard/src/app/dashboard/leads/` (domain health dashboard), `dashboard/src/dashboard-kit/types/departments/lead-intelligence.ts`, `dashboard/src/lib/api/lead-intelligence-queries.ts`, `supabase/migrations/2026011400_create_lead_intelligence_schema.sql`
- **PRD:** `/Users/mikejackson/Downloads/lead-intelligence-prd.md` — comprehensive spec with wireframes, SQL schemas, API endpoints, component specs
- **Dashboard pattern:** Next.js App Router, server components with Suspense, `getServerClient()` for Supabase, Tremor for data tables/metrics, shadcn for UI primitives
- **Route:** `/dashboard/lead-intelligence` (main), `/dashboard/lead-intelligence/contacts/[id]`, `/dashboard/lead-intelligence/companies/[id]`, `/dashboard/lead-intelligence/opportunities`
- **AI backend:** Anthropic API called from Next.js API routes using `ANTHROPIC_API_KEY` env var
- **External integrations:** SmartLead, Apollo, PhantomBuster, Clearbit APIs — credentials already configured
- **n8n:** Find Colleagues workflow triggered via webhook

## Constraints

- **Tech stack**: Next.js 16, React 19, Tailwind, Tremor, shadcn/Radix, Supabase, Anthropic SDK — must match existing dashboard
- **Replace, not extend**: Existing leads dashboard code is entirely replaced — no backward compatibility needed
- **Single operator**: No multi-user auth or RLS required for v1
- **Supabase migrations**: Run via `supabase db push` CLI (project already linked)
- **AI search latency**: <2 second response time for natural language queries

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Replace existing leads dashboard entirely | Old dashboard tracked domain health/email capacity — completely different purpose | — Pending |
| Anthropic API via Next.js API routes | ANTHROPIC_API_KEY already configured, SDK already installed | — Pending |
| Supabase schema from PRD | PRD defines 11 tables + views + functions — use as-is | — Pending |
| Tremor for data tables, shadcn for UI | Matches existing dashboard patterns | — Pending |

---
*Last updated: 2026-01-27 after initialization*
