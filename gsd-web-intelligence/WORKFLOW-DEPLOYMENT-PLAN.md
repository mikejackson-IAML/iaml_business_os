# Web Intelligence Workflow Deployment Plan

**Created:** 2026-01-25
**Purpose:** Systematic approach to configure, test, and activate all Web Intel workflows with n8n-brain learning

---

## Executive Summary

43 workflows exist in n8n (3 were deleted as broken). This plan ensures efficient, systematic deployment with:
- All configuration values documented upfront
- Standard error handling pattern applied
- n8n-brain updated after every fix/success
- Minimal testing overhead through patterns

---

## Configuration Reference

### Credentials (Hardcode These)

| Service | n8n Credential ID | Credential Name |
|---------|-------------------|-----------------|
| **GA4** | `rKHgaeyPMzwy9EqL` | Google account (for dashboard) |
| **GSC** | `Flisb4hCtP22FPeR` | Google Search Console (Web Intel) |
| **DataForSEO** | `N5IZDJlcXNhJSNRP` | DataForSEO API |
| **Supabase** | `EgmvZHbvINHsh6PR` | Supabase Postgres |
| **Slack** | Direct webhook URL | See below |

### Static Values (Replace All $env References)

| Variable | Value | Used In |
|----------|-------|---------|
| `GA4_PROPERTY_ID` | `521283124` | All TRF workflows |
| `SLACK_WEB_INTEL_WEBHOOK` | `https://hooks.slack.com/services/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` | All alert workflows |
| `GSC_SITE_URL` | `https://www.iaml.com` | All GSC workflows |
| `SUPABASE_SCHEMA` | `web_intel` | All Postgres nodes |

### Error Handler Webhook

| Setting | Value |
|---------|-------|
| URL | `https://n8n.realtyamp.ai/webhook/web-intel-error` |
| Workflow ID | `3aUQ6BQkiS5HphxA` |

---

## Standard Patterns

### 1. Error Handling Pattern (Apply to ALL Workflows)

Every workflow MUST have:

```
1. In Settings → Error Workflow: Select "Web Intel - Error Handler"
2. In "On Error" for critical nodes: "Stop Workflow"
3. Log Success node at end writes to web_intel.collection_log
```

**Error Handler Webhook Call (when needed inline):**
```javascript
// POST to error handler
{
  "workflow_id": "{{$workflow.id}}",
  "workflow_name": "{{$workflow.name}}",
  "error_message": "{{$json.error.message}}",
  "node_name": "{{$node.name}}",
  "execution_id": "{{$execution.id}}"
}
```

### 2. Postgres Node Pattern

Every Postgres node MUST have:
- `alwaysOutputData: true` in Settings
- Schema explicitly set: `web_intel`
- Credential: `EgmvZHbvINHsh6PR`

### 3. Success Logging Pattern

Final node before end:
```sql
INSERT INTO web_intel.collection_log
(workflow_id, workflow_name, status, records_processed, completed_at)
VALUES ('{{$workflow.id}}', '{{$workflow.name}}', 'success', {{$json.count}}, NOW())
```

### 4. GA4 API Call Pattern

```javascript
// HTTP Request node configuration
URL: https://analyticsdata.googleapis.com/v1beta/properties/521283124:runReport
Method: POST
Authentication: Predefined Credential Type
Credential Type: Google OAuth2 API
Credential: rKHgaeyPMzwy9EqL
```

### 5. GSC API Call Pattern

```javascript
// HTTP Request node configuration
URL: https://www.googleapis.com/webmasters/v3/sites/https%3A%2F%2Fwww.iaml.com/...
Method: GET/POST
Authentication: Predefined Credential Type
Credential Type: Google OAuth2 API
Credential: Flisb4hCtP22FPeR
```

### 6. DataForSEO API Call Pattern

```javascript
// HTTP Request node configuration
URL: https://api.dataforseo.com/v3/serp/google/organic/live/regular
Method: POST
Authentication: Predefined Credential Type
Credential Type: HTTP Basic Auth
Credential: N5IZDJlcXNhJSNRP
```

---

## Deployment Waves

### Wave 1: Foundation (Test Core Infrastructure)

**Goal:** Verify credentials work and basic data flows

| Priority | Workflow ID | Name | Tests |
|----------|-------------|------|-------|
| 1 | `3aUQ6BQkiS5HphxA` | Error Handler | Webhook receives errors |
| 2 | `IJss2eV5Jg9C1Xyr` | GSC - Search Performance | ✅ Already verified |
| 3 | `RS5KDyZFlbybFkWy` | GSC - Core Web Vitals | ✅ Already fixed |

### Wave 2: Traffic Collection (GA4)

**Goal:** Get traffic data flowing into Supabase

| Priority | Workflow ID | Name | Dependencies |
|----------|-------------|------|--------------|
| 1 | `UbnzS6cyOmeIAQg0` | Traffic - Daily Collector | GA4 credential |
| 2 | `DtCML41ZGWAR2Srf` | Traffic - Source Breakdown | ✅ Already configured |
| 3 | `wctl4o3mDeduPV4s` | Traffic - Page Performance | GA4 credential |
| 4 | `znOkuszsG8O8qX6O` | Traffic - Geographic | GA4 credential |
| 5 | `ETVro3ICNtAtbAEq` | Traffic - Anomaly Detector | Needs traffic data |
| 6 | `rF5rVvu53oHYNcVe` | Traffic - Alert Notifier | Needs anomaly data |

### Wave 3: Rankings (DataForSEO)

**Goal:** Track keyword rankings

| Priority | Workflow ID | Name | Dependencies |
|----------|-------------|------|--------------|
| 1 | `9B0tw9jWKw6hC1oK` | Rankings - Daily Tracker | DataForSEO credential |
| 2 | `4ghDn661GG2k46HG` | Rankings - SERP Features | DataForSEO credential |
| 3 | `vr0oVa8P2EdCubo8` | Rankings - Volume Updater | DataForSEO credential |
| 4 | `wQ0U9uUSHnIX0sdL` | Rankings - Change Detector | Needs ranking data |
| 5 | `UTwZ1v1EffRRT2dv` | Rankings - Alert Notifier | Needs change events |
| 6 | `JwrnYD17LOSZUmra` | Rankings - Opportunity Finder | Needs ranking data |
| 7 | `BceiAVXcEoJTo4cQ` | Rankings - Keyword Discovery | DataForSEO credential |

### Wave 4: GSC & Content

**Goal:** Technical SEO and content health

| Priority | Workflow ID | Name | Dependencies |
|----------|-------------|------|--------------|
| 1 | `g6W58UpTlKmxi4k3` | GSC - Sitemap Status | GSC credential |
| 2 | `c7unJvBZ20ukIdVm` | GSC - Index Error Alerter | GSC credential |
| 3 | `z7TURDap2iKQrCCt` | Content Inventory Sync | Supabase only |
| 4 | `Wm63f2pD3KCTWKWL` | Content Decay Detector | Needs traffic data |
| 5 | `XoXOoOpQMiTU9woK` | Content Decay Alerter | Needs decay data |
| 6 | `4zTsVh8uhGCwWgl4` | Thin Content Identifier | Needs content data |
| 7 | `kRWCqNso4OGWlJwO` | Content Gap Analyzer | Needs content data |
| 8 | `mUNKkdaPIPxfhhvJ` | Internal Link Analyzer | Needs content data |

### Wave 5: Competitors & Backlinks

**Goal:** Competitive intelligence

| Priority | Workflow ID | Name | Dependencies |
|----------|-------------|------|--------------|
| 1 | `zLfG2Cf9pUBYqPNG` | Competitor Rank Tracker | DataForSEO |
| 2 | `OIm5d77XTAGHDB47` | Competitor Content Monitor | Supabase |
| 3 | `NY29HsSSmqFvvZQ0` | Competitor Traffic Estimator | DataForSEO |
| 4 | `LIpMv9IzJDE6UnIx` | SERP Share Calculator | Needs ranking data |
| 5 | `72QZmkSRZm35twAu` | Competitive Gap Finder | Needs competitor data |
| 6 | `4GRjkhilT4d47rx4` | Backlink Profile Sync | DataForSEO |
| 7 | `heGC1O1wf9IZTSqW` | New/Lost Backlink Detector | Needs backlink data |
| 8 | `mrAB875zmaatetdg` | Backlink Quality Scorer | Needs backlink data |
| 9 | `YXMBiO2dNQMpLI7d` | Link Opportunity Finder | DataForSEO |
| 10 | `haagoO93MxLXY48o` | Toxic Link Alerter | Needs backlink data |

### Wave 6: AI & Reports

**Goal:** Intelligence and reporting layer

| Priority | Workflow ID | Name | Dependencies |
|----------|-------------|------|--------------|
| 1 | `F0IqIHxzMsVbQpET` | Recommendation Generator | Needs all data |
| 2 | `epBJOsp9Nco2aa93` | Trend Spotter | Needs historical data |
| 3 | `UprzbWx4V1PZo6yD` | AI Content Analyzer | Anthropic API |
| 4 | `mO9fbehGJFBPGIDU` | Weekly Digest | Needs all data |
| 5 | `uB4E9jYgyk7IWivz` | Monthly Report | Needs all data |
| 6 | `9EsPgSZcHqyZfaZJ` | Dashboard Metrics Computer | Needs all data |

### Wave 7: System Workflows

**Goal:** Monitoring and maintenance

| Priority | Workflow ID | Name | Dependencies |
|----------|-------------|------|--------------|
| 1 | `VgUaqjEadB5uRTqW` | Health Checker | All workflows active |
| 2 | `WOMC0v0PDa8Wd3ie` | Credential Validator | All credentials |
| 3 | `ZPnv8S51kJEWLncb` | Data Cleanup | Needs historical data |

---

## Per-Workflow Testing Protocol

### Before Testing Each Workflow:

1. **Read the workflow JSON** to understand what it does
2. **Check n8n-brain for similar patterns**: `find_similar_patterns()`
3. **Calculate confidence**: `calculate_confidence()`

### Configuration Checklist:

- [ ] Replace `{{SUPABASE_CREDENTIAL_ID}}` with `EgmvZHbvINHsh6PR`
- [ ] Replace `$env.SLACK_WEB_INTEL_WEBHOOK` with actual webhook URL
- [ ] Replace `$env.GA4_PROPERTY_ID` with `521283124`
- [ ] Set Error Workflow to `3aUQ6BQkiS5HphxA`
- [ ] Set `alwaysOutputData: true` on all Postgres nodes
- [ ] Verify credential references are correct

### Test Execution:

1. **Manual trigger** the workflow in n8n
2. **Check execution log** for errors
3. **Verify data in Supabase** tables

### After Successful Test:

```javascript
// 1. Store pattern if new
mcp__n8n-brain__store_pattern({
  name: "[Workflow Name]",
  description: "[What it does]",
  workflow_json: {/* exported workflow */},
  services: ["ga4", "supabase"],
  node_types: ["scheduleTrigger", "httpRequest", "postgres"]
})

// 2. Mark tested in registry
mcp__n8n-brain__mark_workflow_tested("[workflow_id]", "verified")

// 3. Record confidence outcome
mcp__n8n-brain__record_action({
  task_description: "Configure and test [workflow name]",
  action_taken: "configured_and_activated",
  outcome: "success",
  services_involved: ["ga4", "supabase"]
})
```

### After Failed Test:

```javascript
// 1. Look up error fix
mcp__n8n-brain__lookup_error_fix({
  error_message: "[error message]",
  node_type: "[node type]"
})

// 2. If fix found, apply and test again

// 3. If fix works, store it
mcp__n8n-brain__store_error_fix({
  error_message: "[error message]",
  node_type: "[node type]",
  fix_description: "[what fixed it]",
  fix_example: {/* correct config */}
})

// 4. Report fix result
mcp__n8n-brain__report_fix_result({
  error_fix_id: "[fix id]",
  worked: true
})
```

---

## Questions to Answer Before Starting

### GA4 Questions

1. Has GA4 been collecting data? (Installed 2026-01-23, should have data by now)
2. What date range should we query first? (Start with yesterday)

### DataForSEO Questions

1. What keywords are seeded in `web_intel.tracked_keywords`?
2. What is the daily API quota?
3. What competitors are tracked in `web_intel.competitors`?

### Content Questions

1. Is `web_intel.content_inventory` populated?
2. What URLs should be in the content inventory?

### Verification Questions

1. Can we query `web_intel` schema from dashboard?
2. Is the Slack webhook working?

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Workflows tested | 43/43 |
| Workflows verified | 43/43 |
| Patterns stored | 10+ |
| Error fixes documented | All encountered |
| Confidence score | 80+ after completion |

---

## Next Steps

1. **Verify prerequisites** - Answer questions above
2. **Start Wave 1** - Test error handler and verified workflows
3. **Progress through waves** - One wave at a time
4. **Store learnings** - Update n8n-brain after each workflow
5. **Activate schedules** - Only after all tests pass

---

*Plan created: 2026-01-25*
*n8n-brain confidence at start: 32/100*
*Target confidence after completion: 80+/100*
