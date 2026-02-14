# Requirements: IAML Company Intelligence Engine

**Defined:** 2026-02-13
**Core Value:** Consistently surface the 40 highest-probability company targets each week so IAML can systematically pursue corporate training opportunities.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Database Schema

- [ ] **DB-01**: Supabase `companies` table stores master company records with firmographics, location, growth signals, enrichment fields, and IAML relationship data
- [ ] **DB-02**: Supabase `company_scores` table stores scoring history with all 13 component scores, AI reasoning, recommended programs, and outreach angles
- [ ] **DB-03**: Supabase `contacts` table stores HR/legal contacts with role classification, outreach status, and IAML alumni flags
- [ ] **DB-04**: Supabase `weekly_batches` table tracks each weekly Top 40 delivery with review stats and Google Sheet URL
- [ ] **DB-05**: Supabase `batch_companies` table tracks individual company decisions (approved/rejected) with rejection categories and downstream push status
- [ ] **DB-06**: Supabase `ingestion_log` table tracks monthly ingestion runs with record counts and error logs
- [ ] **DB-07**: `eligible_companies` view returns scored companies not sent in past 12 months, ordered by score
- [ ] **DB-08**: `rejection_patterns` view aggregates rejection data by category for scoring model feedback
- [ ] **DB-09**: All tables have appropriate indexes for query performance (industry, employee count, state, score, etc.)

### Company Ingestion

- [ ] **ING-01**: n8n workflow queries Apollo.io API monthly for US companies with 250+ employees, paginated up to 10,000 per run
- [ ] **ING-02**: Ingestion deduplicates against existing Supabase records by apollo_id and domain before inserting
- [ ] **ING-03**: New companies are batch-upserted to `companies` table with all available Apollo firmographic fields
- [ ] **ING-04**: Ingestion creates `ingestion_log` record with start/completion timestamps, record counts, and error details
- [ ] **ING-05**: If Apollo API is rate-limited, workflow uses exponential backoff and resumes from last page
- [ ] **ING-06**: If total ingested < 8,000 in a run, system sends alert email to Mike
- [ ] **ING-07**: Manual CSV import workflow accepts company data file and upserts to `companies` table as fallback

### Enrichment Pipeline

- [ ] **ENR-01**: Enrichment runs after ingestion completes (webhook trigger) and daily at 3 AM CT for un-enriched backlog
- [ ] **ENR-02**: Crunchbase enrichment via Apify scraper updates funding, M&A history, tags, and tech stack for up to 500 companies per batch
- [ ] **ENR-03**: Companies not found on Crunchbase are marked `crunchbase_slug = 'not_found'` and not retried
- [ ] **ENR-04**: EEOC lookup queries public records by company name and stores complaint count, types, and dates for past 3 years
- [ ] **ENR-05**: PACER lookup searches federal court records for employment-related cases with budget cap of $50/month
- [ ] **ENR-06**: Job posting enrichment via Apify scraper finds active HR/legal postings for up to 300 companies, classified by seniority
- [ ] **ENR-07**: SAM.gov API lookup determines government contractor status; defense/aerospace companies without SAM match flagged as "likely"
- [ ] **ENR-08**: Alumni cross-reference matches company domains and names against IAML alumni data in GHL, storing count and details
- [ ] **ENR-09**: After enrichment, `last_enriched_at` is updated and `data_quality_score` is calculated (filled_fields / total_scoreable_fields)
- [ ] **ENR-10**: Each enrichment sub-workflow handles failures independently — one source failing does not block others

### Scoring Algorithm

- [ ] **SCR-01**: Deterministic scoring computes all 13 component scores (0-100 each) using lookup tables from the Employment Law Opportunity Model v1.0
- [ ] **SCR-02**: Total score is weighted composite: Tier 1 (55% — industry risk 15%, multi-state 12%, litigation 12%, growth 8%, gov contractor 8%), Tier 2 (30% — company size 8%, HR leadership 7%, M&A 5%, hiring signals 6%, turnover 4%), Tier 3 (15% — geographic 5%, alumni 5%, financial 5%)
- [ ] **SCR-03**: AI analysis via Claude API processes top 200 companies with reasoning, recommended IAML programs, and suggested outreach angle
- [ ] **SCR-04**: Scores are stored in `company_scores` with scoring_batch_id and model version (starting at v1.0)
- [ ] **SCR-05**: Monthly re-scoring runs on the 15th at 4 AM CT for all companies with updated enrichment data
- [ ] **SCR-06**: Score changes > 10 points between runs are flagged in the scoring log
- [ ] **SCR-07**: Companies with incomplete data score 0 on missing components but `data_quality_score` shows completeness for transparency

### Weekly Delivery

- [ ] **DEL-01**: n8n workflow runs every Monday at 7 AM CT, creating a new `weekly_batches` record
- [ ] **DEL-02**: Top 40 companies selected from `eligible_companies` view (scored, not sent in past 12 months, ordered by total_score DESC)
- [ ] **DEL-03**: Deep enrichment refresh runs for selected 40 companies (job posting scan, litigation check, employee count verification)
- [ ] **DEL-04**: Contact discovery via Apollo People API finds all HR/legal contacts per company (no cap), classified as hr_leadership, hr_staff, or legal_counsel
- [ ] **DEL-05**: Google Sheet generated via API with Company Dossiers tab (26 columns with conditional formatting), Score Breakdown tab (13 sub-scores), and Batch Summary tab
- [ ] **DEL-06**: Decision column (V) uses data validation dropdown (Approved/Rejected); Rejection Category column (X) uses dropdown with 7 categories
- [ ] **DEL-07**: Email sent to Mike with summary stats (database size, avg score, top 5 preview), Google Sheet link, and .xlsx backup attachment
- [ ] **DEL-08**: All 40 companies recorded in `batch_companies` with `decision = 'pending'`

### Review Processing & Outreach

- [ ] **REV-01**: n8n workflow detects decisions in Google Sheet via polling (daily at 6 PM CT) or webhook
- [ ] **REV-02**: Approved/rejected decisions update `batch_companies` with decision, rejection_reason, rejection_category, and timestamp
- [ ] **REV-03**: For approved companies, all associated contacts are set to `outreach_status = 'queued'`
- [ ] **REV-04**: Approved contacts pushed to SmartLead with name, email, company, title, assigned to campaign based on AI-recommended programs
- [ ] **REV-05**: Approved contacts pushed to Expandi with LinkedIn URL, company, title, assigned to sequence
- [ ] **REV-06**: Approved company + contacts pushed to GHL with tags (intelligence_engine, approved_week_N, industry)
- [ ] **REV-07**: Rejected companies' feedback stored for scoring model refinement; contacts retained in Supabase but not pushed to outreach
- [ ] **REV-08**: Batch stats (companies_approved, companies_rejected) updated in `weekly_batches` after review processing

### Scoring Feedback Loop

- [ ] **FBK-01**: Monthly n8n workflow (1st of month, 5 AM CT) aggregates rejection data from `batch_companies`
- [ ] **FBK-02**: Claude API analyzes rejection patterns and proposes weight adjustments if supported by >10 rejections in a category
- [ ] **FBK-03**: Monthly "Scoring Model Health" email sent to Mike with rejection rates, proposed adjustments, approval ratio trend, and high-scoring rejected companies
- [ ] **FBK-04**: Weight changes are only applied after Mike confirms via reply or manual update
- [ ] **FBK-05**: Each weight change creates a new model version for tracking in `company_scores.scoring_model_version`

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### New Company Monitoring
- **MON-01**: Monthly check for new companies crossing 250-employee threshold
- **MON-02**: Detect companies created/updated since last ingestion run
- **MON-03**: Expected 200-500 new qualifying companies per month post-full-ingestion

### Real-Time Triggers
- **TRG-01**: Alert on major EEOC filing or M&A announcement for scored companies
- **TRG-02**: Mid-cycle score bump for companies with trigger events

### Advanced Analytics
- **ADV-01**: Lookalike modeling after 50+ conversions
- **ADV-02**: Seasonal scoring adjustments (Q1 budgets, Q4 use-it-or-lose-it)
- **ADV-03**: Website visitor matching via Leadfeeder against company database
- **ADV-04**: Retool/Supabase dashboard for pipeline health and conversion funnel

### Outreach Optimization
- **OUT-01**: Colleague expansion when one contact converts
- **OUT-02**: Automated weight tuning via A/B testing of scoring models

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Android/mobile app | Intelligence Engine is backend pipeline + Google Sheet, no mobile UI needed |
| Custom web dashboard | Google Sheet is v1 review interface; dashboard deferred to v2+ |
| Automated weight tuning | Risk of scoring drift; manual approval only until data proves reliable |
| International companies | US-only focus per business strategy |
| Companies < 250 employees | Below threshold for corporate training purchases |
| Real-time notifications | Weekly cadence is sufficient for v1; real-time deferred |
| Multiple reviewers | Solo operator (Mike) only |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| — | — | — |

**Coverage:**
- v1 requirements: 48 total
- Mapped to phases: 0
- Unmapped: 48

---
*Requirements defined: 2026-02-13*
*Last updated: 2026-02-13 after initial definition*
