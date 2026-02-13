# LinkedIn Content Engine — Build Handoff

> **CEO Summary:** Complete context handoff for building a LinkedIn content automation system that handles research, topic scoring, content generation, publishing, engagement, and analytics — integrated into the IAML Business OS dashboard.

## How to Use This Document

Paste the prompt at the bottom of this document into a fresh Claude Code session. It contains all decisions, architecture, cost analysis, and build sequence from the discovery session.

---

## Key Files to Reference

| File | Purpose |
|------|---------|
| `WEB-INTEL-WORKFLOWS-REFERENCE.md` | Reference of existing Web Intel workflows (pattern reference) |
| `business-os/knowledge/CHANNEL_PLAYBOOKS/LINKEDIN_ORGANIC.md` | Existing LinkedIn organic playbook (will be superseded by this engine) |
| `dashboard/src/app/dashboard/marketing/marketing-content.tsx` | Existing marketing dashboard page (integration point) |
| `dashboard/package.json` | Dashboard tech stack reference |
| `.planning/linkedin-content-engine/HANDOFF.md` | This file |

---

## Decisions Made

1. **Shield App rejected** — No public API, dashboard-only. Replaced by Apify scraping + Buffer API for analytics.
2. **LinkedIn publishing** — Use Buffer ($5/mo) for automated publishing to personal profile. Phase 1 fallback: manual copy/paste from dashboard queue.
3. **Slack role** — Notification layer only (alerts). All approvals happen in the dashboard.
4. **Schema** — Dedicated `linkedin_engine` schema in Supabase.
5. **Workflows consolidated** — Pre-Post Warming + Strategic Commenting merged into one "Engagement Engine" workflow (8 total workflows, not 9).
6. **Research split** — Daily RSS micro-monitor + Weekly deep research (Reddit + LinkedIn scraping). X/Twitter and Google Trends deferred to Phase 5+.
7. **Carousels deferred** — Text-only posts for Phases 1-4. Carousel generator in Phase 5+.
8. **Error handling** — All workflows use the existing canary error handling pattern from n8n-brain.
9. **Dashboard integration** — New page at `/dashboard/marketing/linkedin-content` with tabs: This Week, Drafts, Content Calendar, Analytics, Engagement.
10. **HR Agentic Pivot (Feb 2026)** — Positioning updated from "AI Translator for HR Professionals" to "The HR Technologist." 3-pillar content framing layer added on top of existing 4 series. See details below.

---

## HR Agentic Pivot Integration (Feb 2026)

### What Changed

The LinkedIn content engine now incorporates a strategic repositioning to establish Mike as "The HR Technologist" — someone who doesn't just teach the rules but builds the tools that enforce them.

### Positioning Update

- **Old:** "The AI Translator for HR Professionals"
- **New:** "The HR Technologist" — bridges expert HR instruction (IAML faculty) and AI-driven operational efficiency (Claude Code)
- **Hook:** "I don't just teach the rules; I build the tools that enforce them."

### 3-Pillar Content Framing

Each post now has both a **series** (topic: what you talk about) and a **pillar** (frame: how you talk about it):

| Pillar | Code | Focus |
|--------|------|-------|
| Legacy & Future | `legacy_future` | Contrast IAML's 45+ years (est. 1979) with Agentic AI capabilities |
| Building in Public | `building_in_public` | Code snippets, terminal screenshots, workflow logic from Claude Code |
| Partnered Authority | `partnered_authority` | IAML instructor/attorney expertise translated into AI rules |

**Important:** "Legacy" references are about IAML's institutional/business legacy only — not personal or family history.

### AEO (AI Engine Optimization)

Posts should naturally incorporate these terms where relevant for AI search engine indexing:
- "Agentic RAG"
- "Compliance Guardrails"
- "Multi-Agent Orchestration"
- "HR Agentic Systems"

### Database Changes

Migration `20260212_linkedin_engine_pivot_updates.sql` adds:
- `pillar` column to `posts` table
- `pillar` column to `content_calendar` table
- Default pillar assignments to existing calendar entries
- New topic categories: `legacy_pivot`, `build_in_public`

### Impact on Workflows

No workflow architecture changes needed. The pillar is a content-layer concern that affects:
- **Workflow 3 (Topic Scoring):** AEO bonus (+3 points) in positioning alignment scoring
- **Workflow 4 (Content Generation):** Prompt template now includes `{pillar}` and `{current_product_phase}` variables
- All other workflows unchanged

## Monthly Cost (Final)

| Service | Cost | Notes |
|---------|------|-------|
| Apify (Starter + actors) | $57-79 | Reddit, LinkedIn scraping, analytics |
| Claude API (Sonnet) | $2-3 | Generation, scoring, comments |
| Supabase Pro | $0 incremental | Already paying |
| Buffer Essentials | $5 | Publishing + basic analytics API |
| Slack | $0 | Free tier, webhooks only |
| **Total** | **$64-87/mo** | |
| **Incremental** | **~$26-48/mo** | On top of existing services |

---

## Prompt for Fresh Session

Copy everything below the line and paste into a new Claude Code chat:

---
