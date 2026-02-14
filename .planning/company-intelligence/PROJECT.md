# IAML Company Intelligence Engine

## What This Is

An automated company intelligence pipeline that discovers, scores, enriches, and surfaces the best U.S. company targets for IAML's employment law training programs. The system ingests 10,000 companies per month via Apollo.io, scores them against a proprietary Employment Law Opportunity Model (13 weighted signals across 3 tiers), and delivers a weekly "Top 40" dossier to Mike via email with an attached Google Sheet. Approved companies' HR and legal contacts are automatically queued for outreach via SmartLead and Expandi.

## Core Value

Consistently surface the 40 highest-probability company targets each week so IAML can systematically pursue corporate training opportunities instead of relying on ad-hoc prospecting.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Monthly ingestion of 10,000 US companies (250+ employees) from Apollo.io into Supabase
- [ ] Multi-source enrichment pipeline (Crunchbase, EEOC/PACER, job postings, SAM.gov, alumni cross-reference)
- [ ] Proprietary scoring algorithm (13 signals, 3 tiers, 0-100 composite score)
- [ ] AI analysis layer (Claude API) for top-scoring companies
- [ ] Weekly Top 40 selection with 12-month cooldown
- [ ] Google Sheet dossier generation with conditional formatting and dropdowns
- [ ] Weekly email delivery with summary stats and sheet link
- [ ] Review processing (approved/rejected from Google Sheet back to Supabase)
- [ ] Approved contacts auto-pushed to SmartLead, Expandi, and GHL
- [ ] Monthly scoring model feedback loop based on rejection patterns
- [ ] New company monitoring (post-full-ingestion)

### Out of Scope

- Real-time trigger alerts for EEOC filings/M&A — deferred to post-MVP
- Lookalike modeling — needs 50+ conversions first
- Seasonal scoring adjustments — needs historical data
- Website visitor matching (Leadfeeder) — separate integration
- Retool/Supabase dashboard — Google Sheet is v1 UI
- Automated weight tuning / A/B testing — manual approval in v1

## Context

**Business context:** IAML has 45 years of expertise and 7,000+ alumni but lacks a systematic B2B pipeline. The total addressable market is ~30,000-50,000 US companies with 250+ employees. Current prospecting is ad-hoc.

**Target companies:** US companies with 250+ employees, across all industries but weighted toward high-regulation sectors (healthcare, financial services, government contractors, manufacturing).

**IAML programs:** Employment Law Certificate, Benefits Law Certificate, HR Management Certificate, Workplace Investigations Certificate, individual seminars. Price range $2K-$35K.

**IAML cities (for geographic scoring):** Newport Beach CA, Austin TX, Chicago IL, Atlanta GA, Washington DC, Las Vegas NV, New York NY, San Francisco CA, Dallas TX.

**Existing systems:** n8n (workflow automation), Supabase (PostgreSQL), GHL (CRM), SmartLead (email outreach), Expandi (LinkedIn outreach), HeyReach (LinkedIn automation).

**Alumni data:** Available in GHL — format TBD (CSV export or direct API).

## Constraints

- **Orchestration:** n8n only — no custom backend services
- **Database:** Supabase PostgreSQL — all persistent state lives here
- **Budget:** ~$100-130/mo total (Apollo $49, Apify $30-50, Claude API $10-20, Supabase $0-25)
- **Apollo rate limits:** 50 requests/min on Starter plan — must queue with 1.5s delays
- **PACER costs:** $0.10/page — budget cap $50/month for litigation lookups
- **Scoring model changes:** Manual approval only — no auto-tuning in v1
- **Solo operator:** Mike is the only reviewer; system must be low-maintenance

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Apollo.io as primary data source | Best company + contact data API for the price; starter plan sufficient for 10K/mo | — Pending |
| Google Sheet for weekly dossier (not dashboard) | Low-friction review UX Mike already knows; conditional formatting + dropdowns for decisions | — Pending |
| 12-month cooldown between batch appearances | Prevents re-surfacing companies too soon; long enough for circumstances to change | — Pending |
| AI scoring on top 200 only (not all) | Claude API cost optimization — deterministic scoring handles bulk, AI adds nuance to top tier | — Pending |
| Separate enrichment sub-workflows | Each data source has different rate limits, costs, and failure modes — isolate them | — Pending |
| Manual weight change approval | Prevents scoring model drift until enough data validates changes | — Pending |
| No cap on contacts per company | Mike wants all HR/legal contacts discovered, not a subset | — Pending |

## Open Questions

1. **Apollo plan:** Starter ($49) vs Basic ($99) — depends on actual credit consumption
2. **EEOC data access:** Current state of EEOC public API/scraping feasibility; may start with news-based litigation proxy
3. **Alumni data format:** CSV export from GHL vs direct GHL API
4. **Crunchbase URL construction:** Need mapping from Apollo company names/domains to Crunchbase slugs
5. **Google Sheet webhook reliability:** May need polling backup for review processing
6. **SmartLead/Expandi campaign assignment:** Which campaigns for approved contacts, or new per batch?

---
*Last updated: 2026-02-13 after initialization*
