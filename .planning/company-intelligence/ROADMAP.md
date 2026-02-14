# Roadmap: IAML Company Intelligence Engine

## Overview

This roadmap builds an automated company intelligence pipeline in 7 phases, progressing from database schema through ingestion, enrichment, scoring, delivery, review processing, and feedback. Each phase delivers a complete, testable capability: Phase 1 establishes the Supabase schema, Phases 2-4 build the data pipeline (ingest, enrich, score), Phase 5 delivers the weekly Top 40 dossier, Phase 6 closes the loop with outreach automation, and Phase 7 adds the self-improving feedback loop.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Database Foundation** - Supabase schema, tables, views, and indexes for the entire pipeline
- [ ] **Phase 2: Company Ingestion** - Monthly Apollo.io import workflow with dedup, logging, and error handling
- [ ] **Phase 3: Enrichment Pipeline** - Multi-source enrichment sub-workflows (Crunchbase, EEOC, PACER, job postings, SAM.gov, alumni)
- [ ] **Phase 4: Scoring Engine** - Deterministic 13-signal scoring with weighted tiers and Claude AI analysis
- [ ] **Phase 5: Weekly Delivery** - Monday Top 40 selection, Google Sheet dossier, and email delivery
- [ ] **Phase 6: Review Processing & Outreach** - Decision capture from Google Sheet and approved contact push to SmartLead, Expandi, GHL
- [ ] **Phase 7: Scoring Feedback Loop** - Monthly rejection analysis, model health reporting, and versioned weight management

## Phase Details

### Phase 1: Database Foundation
**Goal**: All persistent data structures exist in Supabase so every subsequent workflow can read and write without schema changes
**Depends on**: Nothing (first phase)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, DB-09
**Success Criteria** (what must be TRUE):
  1. All 6 tables (companies, company_scores, contacts, weekly_batches, batch_companies, ingestion_log) exist in Supabase and accept inserts
  2. The eligible_companies view returns scored companies not delivered in the past 12 months, ordered by score descending
  3. The rejection_patterns view aggregates rejection data by category with counts
  4. Queries filtering by industry, employee_count, state, and total_score use indexes (confirmed via EXPLAIN)
**Plans**: TBD

Plans:
- [ ] 01-01: TBD

### Phase 2: Company Ingestion
**Goal**: Mike can trigger a monthly run that pulls up to 10,000 US companies from Apollo.io into Supabase with full auditability
**Depends on**: Phase 1
**Requirements**: ING-01, ING-02, ING-03, ING-04, ING-05, ING-06, ING-07
**Success Criteria** (what must be TRUE):
  1. Running the ingestion workflow populates the companies table with Apollo firmographic data for US companies with 250+ employees
  2. Re-running the workflow does not create duplicate records -- existing companies (matched by apollo_id or domain) are updated, not duplicated
  3. Every ingestion run produces an ingestion_log record showing start time, completion time, records processed, and any errors
  4. If fewer than 8,000 companies are ingested, Mike receives an alert email
  5. A CSV file can be manually uploaded as a fallback that upserts companies into the same table
**Plans**: TBD

Plans:
- [ ] 02-01: TBD

### Phase 3: Enrichment Pipeline
**Goal**: Companies in Supabase are automatically enriched from 6 independent data sources, with each source failing gracefully without blocking others
**Depends on**: Phase 2
**Requirements**: ENR-01, ENR-02, ENR-03, ENR-04, ENR-05, ENR-06, ENR-07, ENR-08, ENR-09, ENR-10
**Success Criteria** (what must be TRUE):
  1. After enrichment runs, companies have Crunchbase funding data, EEOC complaint history, PACER litigation records, active job postings, SAM.gov contractor status, and alumni cross-reference counts populated where available
  2. Enrichment triggers both after ingestion completes and on a daily 3 AM CT schedule for un-enriched backlog
  3. If one enrichment source (e.g., Crunchbase) fails or times out, the other 5 sources still complete successfully
  4. Every enriched company has an updated last_enriched_at timestamp and a data_quality_score reflecting field completeness
  5. Companies not found on Crunchbase are marked as not_found and skipped on subsequent runs
**Plans**: TBD

Plans:
- [ ] 03-01: TBD

### Phase 4: Scoring Engine
**Goal**: Every enriched company receives a deterministic composite score (0-100) based on 13 weighted signals, and the top 200 receive AI-generated analysis
**Depends on**: Phase 3
**Requirements**: SCR-01, SCR-02, SCR-03, SCR-04, SCR-05, SCR-06, SCR-07
**Success Criteria** (what must be TRUE):
  1. Running the scoring workflow produces 13 individual component scores (0-100) and a weighted composite score for every enriched company, stored in company_scores with a batch_id and model version
  2. The composite score correctly applies tier weights: Tier 1 at 55%, Tier 2 at 30%, Tier 3 at 15%
  3. The top 200 companies by composite score have Claude-generated AI reasoning, recommended IAML programs, and suggested outreach angles stored alongside their scores
  4. Companies with missing enrichment data score 0 on those components, but their data_quality_score transparently shows which fields are incomplete
  5. Monthly re-scoring (15th at 4 AM CT) updates scores and flags any company whose score changed by more than 10 points
**Plans**: TBD

Plans:
- [ ] 04-01: TBD

### Phase 5: Weekly Delivery
**Goal**: Every Monday at 7 AM CT, Mike receives an email with a Google Sheet containing the 40 highest-scoring eligible companies as a decision-ready dossier
**Depends on**: Phase 4
**Requirements**: DEL-01, DEL-02, DEL-03, DEL-04, DEL-05, DEL-06, DEL-07, DEL-08
**Success Criteria** (what must be TRUE):
  1. The workflow selects the top 40 companies from the eligible_companies view (excluding any sent within the past 12 months) and creates a weekly_batches record
  2. The generated Google Sheet has 3 tabs: Company Dossiers (26 columns with conditional formatting), Score Breakdown (13 sub-scores), and Batch Summary
  3. The Dossiers tab has working data-validation dropdowns for Approved/Rejected decisions and 7 rejection categories
  4. Mike receives an email with summary stats (database size, average score, top 5 preview), a link to the Google Sheet, and an .xlsx backup attachment
  5. All 40 companies are recorded in batch_companies with decision = 'pending' and their contacts are discovered via Apollo People API
**Plans**: TBD

Plans:
- [ ] 05-01: TBD

### Phase 6: Review Processing & Outreach
**Goal**: Mike's approve/reject decisions in the Google Sheet automatically flow back to Supabase and approved contacts are pushed to SmartLead, Expandi, and GHL for outreach
**Depends on**: Phase 5
**Requirements**: REV-01, REV-02, REV-03, REV-04, REV-05, REV-06, REV-07, REV-08
**Success Criteria** (what must be TRUE):
  1. When Mike marks companies as Approved or Rejected in the Google Sheet, the decisions are detected (via polling at 6 PM CT daily or webhook) and batch_companies records are updated with the decision, timestamp, and rejection details
  2. For approved companies, all associated contacts are set to outreach_status = 'queued' and pushed to SmartLead (with campaign assignment based on AI-recommended programs), Expandi (with LinkedIn URL and sequence), and GHL (with intelligence_engine tags)
  3. Rejected companies' feedback (rejection category and reason) is stored in batch_companies for scoring model analysis, and their contacts are retained but not pushed to outreach
  4. After review processing, weekly_batches stats (companies_approved, companies_rejected) are updated accurately
**Plans**: TBD

Plans:
- [ ] 06-01: TBD

### Phase 7: Scoring Feedback Loop
**Goal**: The scoring model improves over time through monthly rejection pattern analysis, with weight changes only applied after Mike's explicit approval
**Depends on**: Phase 6
**Requirements**: FBK-01, FBK-02, FBK-03, FBK-04, FBK-05
**Success Criteria** (what must be TRUE):
  1. On the 1st of each month at 5 AM CT, rejection data is aggregated from batch_companies and analyzed by Claude API for patterns across rejection categories with 10+ occurrences
  2. Mike receives a monthly "Scoring Model Health" email with rejection rates by category, proposed weight adjustments, approval ratio trend over time, and a list of high-scoring companies that were rejected
  3. Weight changes are only applied after Mike confirms (no auto-tuning), and each change creates a new model version tracked in company_scores.scoring_model_version
**Plans**: TBD

Plans:
- [ ] 07-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Foundation | 0/TBD | Not started | - |
| 2. Company Ingestion | 0/TBD | Not started | - |
| 3. Enrichment Pipeline | 0/TBD | Not started | - |
| 4. Scoring Engine | 0/TBD | Not started | - |
| 5. Weekly Delivery | 0/TBD | Not started | - |
| 6. Review Processing & Outreach | 0/TBD | Not started | - |
| 7. Scoring Feedback Loop | 0/TBD | Not started | - |
