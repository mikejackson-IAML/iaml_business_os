# Workflow Audit - Business OS

> **Purpose:** Complete inventory of n8n workflows for dashboard monitoring. Review each workflow, confirm the description, and mark for inclusion.

> **Instructions:**
> 1. Review each workflow below
> 2. Mark `[x]` to include in Business OS dashboard
> 3. Adjust descriptions if needed
> 4. Add any missing context about how it's used

---

## Summary

| Category | Count | Status |
|----------|-------|--------|
| Site Monitoring (iaml.com) | 22 | Active |
| Marketing & Campaigns | 12 | Active |
| Programs & Operations | 12 | Active |
| Lead Intelligence | 6 | Active |
| Digital Infrastructure | 5 | Active |
| Content & Research | 4 | Mixed |
| **Total Production** | **61** | |
| Test/Deprecated | ~39 | Inactive |

---

## Site Monitoring (iaml.com)

These workflows monitor iaml.com health, performance, SEO, and compliance.

### Core Performance

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `QBS1n2E0IFDyhR7y` | Uptime Monitor - iaml.com | Pings iaml.com every 5 minutes and alerts via Slack/email if the site goes down. | Critical | Every 5 min |
| [x] | `H2H172J1WS9poTfl` | Page Speed Monitor - iaml.com | Measures page load times daily and tracks performance trends to catch slowdowns early. | High | Daily |
| [x] | `RvHwQeupCo1e3N9c` | Lighthouse Auditor - iaml.com | Runs Google Lighthouse audits weekly to score performance, accessibility, and SEO. | Medium | Weekly |
| [x] | `7tKjCpQEjJLHji1t` | Core Web Vitals Monitor - iaml.com | Tracks Google's Core Web Vitals (LCP, FID, CLS) to ensure good search rankings. | High | Daily |
| [x] | `eR0cVQUtFopWafzg` | TTFB Monitor - iaml.com | Measures Time To First Byte to detect server performance issues before users notice. | Medium | Daily |
| [x] | `KK7RbZJ4SOz5brCj` | Mobile Friendliness Checker - iaml.com | Verifies mobile responsiveness to ensure good experience on phones and tablets. | Medium | Weekly |
| [x] | `XTMQb4VizrYtz3tn` | Compression Checker - iaml.com | Ensures Gzip/Brotli compression is working to keep page sizes small and fast. | Low | Weekly |
| [x] | `09f0Tp7T3c2uhplj` | Image Optimization Checker - iaml.com | Scans for unoptimized images that could slow down page loads. | Low | Weekly |
| [x] | `DSSJIHWl7XeeCyAu` | Resource Hints Checker - iaml.com | Validates preload/prefetch hints are correctly implemented for faster navigation. | Low | Weekly |
| [x] | `3ynFk0HYxFwFA5LS` | Weekly Speed Audit - iaml.com | Runs comprehensive PageSpeed Insights audits on key pages weekly to track performance trends and catch regressions. | Medium | Weekly (Manual) |

### SEO & Indexing

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `7dlwbR7yQGnTOYcn` | Meta Tag Auditor - iaml.com | Checks all pages have proper title tags and meta descriptions for search visibility. | High | Daily |
| [x] | `AqUWODfMaJOhS6fb` | Schema Validator - iaml.com | Verifies structured data markup is correct so Google can display rich snippets. | Medium | Weekly |
| [x] | `bGgsBjTfjCV6mv72` | Indexability Checker - iaml.com | Ensures pages aren't accidentally blocked from search engine indexing. | High | Daily |
| [x] | `dCkv7FsgxwKOXlc7` | Robots.txt Monitor - iaml.com | Watches for changes to robots.txt that could block search crawlers. | Medium | Daily |
| [x] | `eStzcArnHJIQamGN` | Social Tags Checker - iaml.com | Validates Open Graph and Twitter card tags for proper social media sharing. | Low | Weekly |
| [x] | `92ur6UI4RpaPM262` | HTML Lang Checker - iaml.com | Verifies language attributes are set correctly for international SEO. | Low | Weekly |
| [x] | `OEAWLUXCcU3lViqt` | Favicon Checker - iaml.com | Ensures favicons are present and properly configured across all sizes. | Low | Weekly |

### Security & Compliance

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `4i92X3Rm27Z1WdTT` | DNS Record Monitor - iaml.com | Monitors DNS records for unexpected changes that could indicate security issues. | High | Daily |
| [x] | `FfKkT1SHgkZ2EjFD` | DKIM Checker - iaml.com | Verifies email authentication records are configured for deliverability. | High | Daily |
| [x] | `8T88WjyL0WOCYcZM` | Security Headers Checker - iaml.com | Audits HTTP security headers to protect against common web vulnerabilities. | High | Weekly |
| [x] | `TfdyBwoJJ05MOFDz` | Mixed Content Checker - iaml.com | Finds insecure HTTP resources on HTTPS pages that trigger browser warnings. | Medium | Weekly |
| [x] | `9TpLXE5PwM5GkJyq` | Cookie Compliance Checker - iaml.com | Verifies cookie consent banners and GDPR/CCPA compliance. | Medium | Weekly |
| [x] | `CLPZDdyckhcLWgN4` | Accessibility Checker - iaml.com | Scans for WCAG accessibility issues to ensure site is usable by everyone. | Medium | Weekly |

---

## Marketing & Campaigns

Workflows for email campaigns, LinkedIn outreach, and lead engagement.

### Email Infrastructure

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `HnZQopXL7xjZnX3O` | Domain Health Sync - Daily | Monitors email domain reputation and alerts before deliverability problems hurt campaigns. | Critical | Daily 6am |
| [x] | `8IBiLLAIHgSt2xWs` | Smartlead Inbox Sync | Syncs email campaign metrics from Smartlead to track opens, clicks, and replies. | High | Every 15 min |
| [x] | `b2XTKw8oy1lNKIDj` | Smartlead Inbox Ramp-Up | Manages gradual sending volume increases for new email domains to build reputation. | High | Daily |
| [x] | `PAyKdjpKLHfH5L89` | Email Validator - NeverBounce | Validates email addresses before campaigns to reduce bounces and protect sender reputation. | High | On-demand |
| [x] | `XGpk3RnAtgky0Svk` | Domain Capacity Tracker | Tracks how many emails each domain can safely send per day. | Medium | Daily |
| [x] | `XQyMCuoLyimoIqkm` | Sending Capacity Calculator | Calculates total available email sending capacity across all domains. | Medium | Daily |

### Campaign Activity

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `3KqJGyOOHSSaC7pU` | Smartlead Activity Receiver | Captures email opens, clicks, and replies from Smartlead campaigns in real-time. | High | Webhook |
| [x] | `G8d0Jyyf7OHSgr99` | HeyReach Activity Receiver | Captures LinkedIn connection requests, messages, and replies from HeyReach. | High | Webhook |
| [x] | `IshJyOdRDNHy7wfz` | GHL Activity Receiver | Captures CRM activity from GoHighLevel for unified contact tracking. | High | Webhook |
| [x] | `7xEGFk7fgkp3egBj` | Campaign Analyst - Performance | Aggregates campaign metrics to identify top-performing sequences and messages. | Medium | Daily |
| [x] | `R9AgG9ZK4m8vXqNT` | Branch C Scheduler | Manages the "no contact" follow-up branch for contacts who haven't responded. | Medium | Scheduled |

### Contact Management

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `6PdgkfipCXPU0FHL` | Lifecycle Manager - Stale Contacts | Identifies and updates lifecycle stages for contacts who haven't engaged recently. | Medium | Daily |
| [x] | `HNZPMaeWce2qsICS` | Deduplication Manager | Finds and merges duplicate contact records to maintain clean data. | Medium | Weekly |

---

## Programs & Operations

Workflows supporting program delivery, faculty, and venue operations.

### Registration & Sales

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `2HAORwXKt7UffvxG` | Airtable Registrations Sync + GHL | Syncs program registrations from Airtable to GHL so sales can follow up quickly. | Critical | Hourly + Webhook |
| [x] | `VbSCZR47nzwYUYns` | Registration Page Monitor - iaml.com | Monitors registration pages for errors that could prevent sign-ups. | Critical | Every 15 min |
| [x] | `AzelTCjRxj8fGi2d` | Enrollment Alert Monitor | Alerts when enrollment thresholds are hit (e.g., 80% full, sold out). | High | Hourly |

### Inventory & Shipping

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `0A8OBSOYaqSCJUPm` | Inventory Manager | Tracks program materials inventory and alerts when stock is low. | Medium | Daily |
| [x] | `UKhLyZQsrkqTwZ0F` | Shipping Monitor | Tracks participant materials shipments and flags delivery issues. | Medium | Daily |

### Faculty Management

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `GOiy6L7XYjevYDSA` | Faculty Availability Tracker | Tracks faculty availability and scheduling preferences for program planning. | Medium | Weekly |
| [x] | `c4xNLJMC29NkFk06` | Faculty Gap Alert | Alerts when programs lack assigned faculty within required lead time. | High | Daily |
| [x] | `dyLqARBmoR2mu4j2` | Faculty Performance Monitor | Aggregates faculty evaluation scores to track teaching quality over time. | Medium | After programs |

### Scheduling & Venues

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `Ew97MGec45jBDdVq` | Schedule Optimizer - Conflict Detector | Finds scheduling conflicts between programs, faculty, or venues. | High | Daily |
| [x] | `OSA3j9nLLGRd8o0j` | Capacity Tracker - Hourly | Monitors venue and session capacity utilization in real-time. | High | Hourly |
| [x] | `ABCZiTL4CyT6eOAl` | Room Block Monitor | Tracks hotel room block pickups and alerts when blocks are at risk. | Medium | Daily |
| [x] | `d9mvXgCOZ3IlvNML` | Attendance Tracker | Records and reports on program attendance for compliance and follow-up. | Medium | During programs |
| [x] | `8TBH2O0GuYghWTaZ` | CLE Approval Monitor | Tracks CLE credit approval status and alerts on pending submissions. | Medium | Weekly |

---

## Lead Intelligence

Workflows for lead scoring, enrichment, and intelligence.

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [ ] | TBD | Lead Scoring Engine | Calculates lead scores based on engagement signals across channels. | High | Real-time |
| [ ] | TBD | Company Enrichment | Enriches company data from external sources for better targeting. | Medium | On-demand |
| [ ] | TBD | Contact Enrichment | Enriches contact data with job title, LinkedIn, and email verification. | Medium | On-demand |

*Note: These may be in development or use different names. Please confirm.*

---

## Digital Infrastructure

System health and cross-cutting concerns.

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `LaUJMP9pSbE9dw3N` | Daily Accomplishment Email | Sends daily summary of logged accomplishments to keep team aligned. | Low | Daily 5pm |
| [x] | `YLyx0mAJMqCZYTQ5` | Database Manager - Health Check | Monitors database connection health and query performance. | High | Hourly |

---

## Content & Research (Mixed Status)

| Include | n8n ID | Workflow Name | CEO Summary | Criticality | Schedule |
|---------|--------|---------------|-------------|-------------|----------|
| [x] | `I2bJHnz22liOr6Cu` | Research Process Step 1 | Initiates research requests and routes to appropriate team members. | Low | On-demand |
| [x] | `EnHsPN3uADvaa2mZ` | Research Approval Step 2 | Handles research approval workflow and notifications. | Low | On-demand |
| [x] | `Pg2F5pKAJSJjUnTp` | Content Creation Step 4 | Manages content creation workflow from research to publication. | Low | On-demand |
| [x] | `6IIqACrQwm5CZ51H` | Content Approval Step 5 | Routes content through approval chain with stakeholder notifications. | Low | On-demand |

---

## Excluded / Deprecated Workflows

These workflows should NOT be included in monitoring (test, old, or inactive):

| n8n ID | Workflow Name | Reason |
|--------|---------------|--------|
| `T7ZRsdJ5ECMTjA1U` | My workflow 2 | Test workflow |
| `WYomJCm8tOMgEF3I` | My workflow 3 | Test workflow |
| `24a0cvsS7qZFCUML` | 1. Database Population - ULTRA BUDGET | Deprecated - multiple versions |
| `DR3GbPpqOOtnXRA3` | 1. Database Population - SELF-HOSTED | Deprecated |
| `I40AZKbJ3E0SPEz2` | 1. Database Population - ULTRA BUDGET ($37-38/month) | Deprecated |
| `a1hfODsjFdHuPsLS` | 1. Database Population - FIXED | Deprecated |
| `bbVppPRenvJG5e9s` | 1. Company Database Population | Deprecated |
| `bhjkqoD1KkoYG1Bf` | 1. Database Population - PAID APIFY | Deprecated |
| `cvZlsPIUG96VWqJ0` | 1. Database Population - ULTRA BUDGET | Deprecated |
| `GRMfqYBRz4cfUWf5` | 1. Database Population - COST OPTIMIZED | Deprecated |
| `Xfc9GIGccXC0F2bu` | 1. Database Population - ARRAY FORMAT FIXED | Deprecated |
| `5YNFuW65oukDsCUv` | Vapi IAML Assistant (Master Program Catalog) | Old Vapi experiment |
| `dpck9ORndZHFm8fY` | Vapi IAML Assistant (Program Sessions) | Old Vapi experiment |
| `GbrILFzMyKx01xvN` | Vapi IAML Assistant (Pricing Matrix) | Old Vapi experiment |
| `Syw4gc1gfMmkMN5q` | Vapi IAML Assistant (Program Content) | Old Vapi experiment |
| `TcM6UvBdeQm6Z0fw` | Vapi IAML Assistant (FAQ) | Old Vapi experiment |
| `UWNjKFodXyUwAdcx` | Veo3 Interactive Project Assistant | Old Veo3 experiment |
| `Uhj8cDc8hFLAp8y8` | YouTube Video Transcription for Veo3 | Old Veo3 experiment |
| `FM4cZvOcxqHAz25Z` | 2. Veo3 Knowledge Processor | Old Veo3 experiment |
| `FDwzYh6x1IMvkZmL` | 1. YouTube Transcript API - Complete | Old YouTube experiment |
| `KPpXoV3H733OnHfa` | Simple YouTube Test | Test workflow |
| `HZzEorLJGfFaoER9` | Main | Generic/test |
| `C5H06PO1rEBjrHgi` | Main Flow | Generic/test |
| `KkAo8Vkllac8QtEh` | Backend API | Old/unused |
| `KmlKb1kb5vMifahN` | Contact Verification Test | Test workflow |
| `IBAlxYi1fe2YxUdS` | Old Contact Enrichment | Deprecated |
| `WFBIFmN8Zb2GwKvG` | Apollo Company Email Recommendation Flow | Old/unused |
| `a6qr43Cj1aFoUnCR` | HR-Company Workflow | Old/unused |
| `cn85VfOo7zgSHl3T` | Sales Navigator ---> GHL | Old/unused |
| `3zOzKRLoczw5FMxP` | phantom ----> airtable | Old/informal |
| `6FtbwJ7g1ayCaeoB` | Filtering Companies | Old/unused |
| `MuQhBk5qIdhXqBrC` | HR FLOW | Old/unused |
| `GzzuMKhsScGcSuvE` | 3. Data Quality Maintenance | Old/unused |
| `8UVuLjCdaJhctUnV` | Strategic Planning - Sunday Research | Inactive |
| `PjTzCoDJd7cHzUBI` | Strategic Planning - Sunday Research | Duplicate/inactive |
| `HG71DCGndu8Oeuvz` | Research Approval Step 3 | Inactive |
| `DbaffqLHBr9dmCxo` | Content Approval Step 6 | Inactive |
| `NY9vGVg1nWhmGTCj` | Populating Database | Old/manual |
| `7md74Ypv38bxytaI` | GHL Stripe Invoice Creation | Old Stripe integration |

### Duplicate Activity Receivers (keep only one)

| n8n ID | Workflow Name | Status | Keep? |
|--------|---------------|--------|-------|
| `3KqJGyOOHSSaC7pU` | Smartlead Activity Receiver | Active | Yes |
| `JDDLOllBozWaW1AT` | Smartlead Activity Receiver | Active | No - duplicate |
| `Ro1NOdYxZieyDelS` | Smartlead Activity Receiver | Inactive | No |
| `G8d0Jyyf7OHSgr99` | HeyReach Activity Receiver | Active | Yes |
| `JnkjiIEG2ldKYD87` | HeyReach Activity Receiver | Inactive | No |
| `IshJyOdRDNHy7wfz` | GHL Activity Receiver | Active | Yes |
| `FZlfss8fCJLGwgiZ` | GHL Activity Receiver | Inactive | No |
| `CUndHzms0vQDKYj4` | Branch C Scheduler | Inactive | No |
| `R9AgG9ZK4m8vXqNT` | Branch C Scheduler | Active | Yes |

---

## Next Steps

1. **Review this document** - Confirm/adjust descriptions and inclusions
2. **Tag in n8n** - Add `business-os` tag to all included workflows
3. **Run migration** - I'll generate the Supabase seed with all confirmed workflows
4. **Build sync workflow** - Auto-sync tagged workflows going forward

---

## Approval

- [ ] Reviewed all workflow descriptions
- [ ] Confirmed inclusion/exclusion decisions
- [ ] Identified any missing workflows
- [ ] Ready to proceed with Supabase migration

**Reviewed by:** _________________ **Date:** _________________
