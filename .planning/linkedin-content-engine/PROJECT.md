# LinkedIn Content Engine

> **CEO Summary:** A LinkedIn content automation engine that handles research, topic scoring, content generation, publishing, engagement, and analytics — producing 3-4 high-quality posts per week positioning Mike as "The HR Technologist," integrated into the Business OS dashboard.

## Project Type

Brownfield — extends existing Business OS dashboard and n8n workflow infrastructure.

## Core Value

Produce 3-4 high-quality LinkedIn posts per week with minimal manual effort, positioning Mike Van Horn (IAML CEO) as "The HR Technologist" — someone who doesn't just teach the rules but builds the tools that enforce them.

## Target Audience

- **Primary:** HR Directors, VP of HR, CHRO, HR Managers at 500+ employee companies
- **Secondary:** Employment law attorneys, HR consultants, HR tech vendors
- **Tertiary:** AI-curious business leaders watching the HR+AI intersection

## Architecture

- **8 n8n workflows** — RSS research, deep research, topic scoring, content generation, publishing, engagement, monitoring, analytics
- **10 Supabase tables** — `linkedin_engine` schema (research_signals, topic_recommendations, posts, post_analytics, hooks, engagement_network, comment_activity, content_calendar, weekly_analytics, workflow_runs)
- **Dashboard page** — `/dashboard/marketing/linkedin-content` with 5 tabs (This Week, Drafts, Content Calendar, Analytics, Engagement)
- **Content strategy** — 4 series (Tue-Fri) x 3 pillars (Legacy & Future, Building in Public, Partnered Authority)

## Key Decisions (from HANDOFF.md)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Shield App | Rejected | No public API, dashboard-only |
| LinkedIn publishing | n8n native LinkedIn node (OAuth2) | Buffer rejected (no public API since 2019), zero cost |
| Slack role | Notification layer only | All approvals happen in dashboard |
| Database schema | Dedicated `linkedin_engine` in Supabase | Clean separation from other Business OS data |
| Engagement workflows | Pre-Post Warming + Strategic Commenting merged | Single "Engagement Engine" workflow (8 total, not 9) |
| Research cadence | Daily RSS micro-monitor + Weekly deep research | Reddit + LinkedIn via Apify |
| Post format | Text-only for Phases 1-9 | Carousels deferred to Phase 10 |
| Error handling | Canary pattern from n8n-brain | POST to workflow_errors table on error |
| AI generation | Claude Sonnet | Cost-effective for volume ($2-3/mo) |
| Scraping | Apify ($57-79/mo) | Reddit, LinkedIn, analytics |

## Validated (Phase 1 Complete)

- [x] Database schema deployed (`linkedin_engine` in Supabase) — 10 tables + indexes
- [x] Dashboard page scaffolded at `/dashboard/marketing/linkedin-content` — 5 tabs
- [x] Content calendar seeded for 4 weeks with series/pillar rotation
- [x] HR Agentic Pivot integration (3-pillar content framing, AEO terms)

## Monthly Cost

| Service | Cost | Notes |
|---------|------|-------|
| Apify (Starter + actors) | $57-79 | Reddit, LinkedIn scraping, analytics |
| Claude API (Sonnet) | $2-3 | Generation, scoring, comments |
| Supabase Pro | $0 incremental | Already paying |
| LinkedIn publishing | $0 | n8n native LinkedIn node (OAuth2) |
| Slack | $0 | Free tier, webhooks only |
| **Total** | **$59-82/mo** | |
| **Incremental** | **~$21-43/mo** | On top of existing services |

## Constraints

- n8n for orchestration (HTTP Request + Supabase REST API, NOT native Postgres/Supabase nodes)
- Claude Sonnet for generation (cost-effective for volume)
- Follow existing dashboard patterns (page.tsx → data-loader → content.tsx + skeleton.tsx)
- Follow IAML Business OS documentation standards (CEO summary at top)
- Register all workflows in n8n-brain after building
- Use canary error handling pattern in all workflows

## Key Files

| File | Purpose |
|------|---------|
| `.planning/linkedin-content-engine/HANDOFF.md` | Source of truth for decisions, costs, architecture |
| `.planning/linkedin-content-engine/PROMPT.md` | Detailed build prompt with schema, algorithms, templates |
| `dashboard/src/app/dashboard/marketing/linkedin-content/` | Dashboard page (5 tabs) |
| `dashboard/src/lib/api/linkedin-content-queries.ts` | Supabase query functions |
| `supabase/migrations/20260208_create_linkedin_engine_schema.sql` | Schema migration |
| `supabase/migrations/20260208001_seed_linkedin_calendar.sql` | Calendar seed data |
| `supabase/migrations/20260213_linkedin_engine_pivot_updates.sql` | Pivot columns migration |
